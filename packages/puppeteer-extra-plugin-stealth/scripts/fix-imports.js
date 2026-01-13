#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function replaceInFile(filePath) {
  const content = await readFile(filePath, 'utf8');
  const newContent = content.replace(
    /'puppeteer-extra-plugin'/g,
    "'@zorilla/puppeteer-extra-plugin'"
  );
  if (content !== newContent) {
    await writeFile(filePath, newContent, 'utf8');
    console.log(`Fixed imports in: ${filePath}`);
  }
}

async function processDirectory(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      await replaceInFile(fullPath);
    }
  }
}

// Copy evasions directory
const srcEvasions = join(process.cwd(), 'src/evasions');
const distEvasions = join(process.cwd(), 'dist/evasions');
console.log('Copying evasions directory...');
await mkdir(join(process.cwd(), 'dist'), { recursive: true });
await cp(srcEvasions, distEvasions, { recursive: true });

// Fix imports in copied files
console.log('Fixing imports...');
await processDirectory(distEvasions);
console.log('Build post-processing complete!');
