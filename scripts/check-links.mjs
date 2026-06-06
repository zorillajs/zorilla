import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const skippedDirectories = new Set([
  '.changeset',
  '.git',
  'coverage',
  'dist',
  'node_modules',
]);
const skippedSchemes = /^(?:about|chrome|data|file|javascript|mailto):/i;
const concurrency = 25;

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      yield fullPath;
    }
  }
}

function stripCodeBlocks(markdown) {
  return markdown
    .replaceAll(/```[\s\S]*?```/g, '')
    .replaceAll(/~~~[\s\S]*?~~~/g, '');
}

function collectLinks(markdown) {
  const links = new Set();
  const text = stripCodeBlocks(markdown);

  for (const match of text.matchAll(
    /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  )) {
    links.add(match[1]);
  }

  for (const match of text.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    links.add(match[1]);
  }

  return [...links];
}

function normalizeLocalLink(link) {
  const [target] = link.split('#');
  const [withoutQuery] = target.split('?');
  return decodeURIComponent(withoutQuery);
}

async function localTargetExists(markdownFile, link) {
  const target = normalizeLocalLink(link);
  if (!target) {
    return true;
  }

  const resolved = target.startsWith('/')
    ? path.join(root, target)
    : path.resolve(path.dirname(markdownFile), target);

  try {
    await fs.access(resolved);
    return true;
  } catch {
    return false;
  }
}

const failures = [];
const checks = [];
let checked = 0;
let skippedExternal = 0;

for await (const markdownFile of walk(root)) {
  const markdown = await fs.readFile(markdownFile, 'utf8');
  for (const link of collectLinks(markdown)) {
    if (link.startsWith('#') || skippedSchemes.test(link)) {
      continue;
    }

    checked += 1;
    checks.push(async () => {
      if (/^https?:\/\//i.test(link)) {
        skippedExternal += 1;
        return;
      }

      const ok = await localTargetExists(markdownFile, link);

      if (!ok) {
        failures.push(`${path.relative(root, markdownFile)} -> ${link}`);
      }
    });
  }
}

for (let index = 0; index < checks.length; index += concurrency) {
  await Promise.all(
    checks.slice(index, index + concurrency).map(check => check())
  );
}

if (failures.length > 0) {
  console.error(`Detected ${failures.length} broken links:`);
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Checked ${checked - skippedExternal} local markdown links. Skipped ${skippedExternal} external links.`
);
