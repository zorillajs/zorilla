import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(import.meta.url), '../..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'zorilla-pnpm-consumer-'));
const tarballDirectory = join(temporaryRoot, 'tarballs');
const consumerDirectory = join(temporaryRoot, 'consumer');
const puppeteerVersion = process.env.PUPPETEER_VERSION || '^25.0.0';

const packageNames = [
  '@zorilla/puppeteer-extra-plugin',
  '@zorilla/puppeteer-extra-plugin-user-data-dir',
  '@zorilla/puppeteer-extra-plugin-user-preferences',
  '@zorilla/puppeteer-extra-plugin-stealth',
  '@zorilla/puppeteer-extra',
];

function run(command, args, cwd = repositoryRoot) {
  execFileSync(command, args, {
    cwd,
    env: {
      ...process.env,
      PUPPETEER_SKIP_DOWNLOAD: 'true',
    },
    stdio: 'inherit',
  });
}

function capture(command, args, cwd = repositoryRoot) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      PUPPETEER_SKIP_DOWNLOAD: 'true',
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
}

function containsPackage(value, packageName) {
  if (Array.isArray(value)) {
    return value.some(entry => containsPackage(entry, packageName));
  }
  if (value && typeof value === 'object') {
    if (value.name === packageName) return true;
    return Object.values(value).some(entry =>
      containsPackage(entry, packageName)
    );
  }
  return false;
}

function findTarball(packageName) {
  const filenamePrefix = packageName.replace('@', '').replaceAll('/', '-');
  const filename = readdirSync(tarballDirectory).find(
    entry => entry.startsWith(`${filenamePrefix}-`) && entry.endsWith('.tgz')
  );
  if (!filename) {
    throw new Error(`Packed tarball not found for ${packageName}`);
  }
  return join(tarballDirectory, filename);
}

try {
  for (const packageName of packageNames) {
    run('pnpm', [
      '--filter',
      packageName,
      'pack',
      '--pack-destination',
      tarballDirectory,
    ]);
  }

  mkdirSync(consumerDirectory);

  const tarballs = Object.fromEntries(
    packageNames.map(packageName => [packageName, findTarball(packageName)])
  );

  writeFileSync(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'zorilla-pnpm-consumer-smoke-test',
        private: true,
        type: 'module',
        dependencies: {
          '@zorilla/puppeteer-extra': `file:${tarballs['@zorilla/puppeteer-extra']}`,
          '@zorilla/puppeteer-extra-plugin-stealth': `file:${tarballs['@zorilla/puppeteer-extra-plugin-stealth']}`,
          puppeteer: puppeteerVersion,
        },
        devDependencies: {
          '@types/node': JSON.parse(
            readFileSync(
              join(
                repositoryRoot,
                'packages/puppeteer-extra/node_modules/@types/node/package.json'
              ),
              'utf8'
            )
          ).version,
          typescript: JSON.parse(
            readFileSync(
              join(repositoryRoot, 'node_modules/typescript/package.json'),
              'utf8'
            )
          ).version,
        },
      },
      null,
      2
    )}\n`
  );

  writeFileSync(
    join(consumerDirectory, 'pnpm-workspace.yaml'),
    `overrides:\n${packageNames
      .filter(
        packageName =>
          packageName !== '@zorilla/puppeteer-extra-plugin-stealth' &&
          packageName !== '@zorilla/puppeteer-extra'
      )
      .map(packageName => `  '${packageName}': file:${tarballs[packageName]}`)
      .join('\n')}\n`
  );

  writeFileSync(
    join(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          skipLibCheck: false,
          strict: true,
          target: 'ES2022',
          types: ['node'],
        },
        include: ['typecheck.ts'],
      },
      null,
      2
    )}\n`
  );

  writeFileSync(
    join(consumerDirectory, 'typecheck.ts'),
    `import vanillaPuppeteer from 'puppeteer';\nimport puppeteer, { addExtra } from '@zorilla/puppeteer-extra';\nimport StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth';\n\naddExtra(vanillaPuppeteer);\npuppeteer.use(StealthPlugin());\n`
  );

  writeFileSync(
    join(consumerDirectory, 'runtime.mjs'),
    `import { existsSync } from 'node:fs';\nimport { fileURLToPath } from 'node:url';\nimport { addExtra } from '@zorilla/puppeteer-extra';\nimport StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth';\n\nconst extraUrl = import.meta.resolve('@zorilla/puppeteer-extra');\nconst oldResolution = new URL('../../puppeteer-extra-plugin-stealth/dist/evasions/chrome.app/index.js', extraUrl);\nif (existsSync(fileURLToPath(oldResolution))) throw new Error('Fixture is not using a strict pnpm dependency layout');\n\nconst unused = async () => { throw new Error('Browser methods are not used'); };\nconst puppeteer = addExtra({ connect: unused, createBrowserFetcher: unused, defaultArgs: () => [], executablePath: () => '', launch: unused });\npuppeteer.use(StealthPlugin({ enabledEvasions: new Set(['chrome.app', 'user-agent-override']) }));\nawait puppeteer.resolvePluginDependencies();\nconst expected = ['stealth', 'stealth/evasions/chrome.app', 'stealth/evasions/user-agent-override', 'user-preferences', 'user-data-dir'];\nfor (const name of expected) {\n  if (!puppeteer.pluginNames.includes(name)) throw new Error(\`Missing resolved plugin: \${name}\`);\n}\nconsole.log('Resolved plugins:', puppeteer.pluginNames.join(', '));\n`
  );

  run('pnpm', ['install', '--ignore-scripts'], consumerDirectory);
  const upstreamWhy = JSON.parse(
    capture('pnpm', ['why', 'puppeteer-extra', '--json'], consumerDirectory)
  );
  if (containsPackage(upstreamWhy, 'puppeteer-extra')) {
    throw new Error('The upstream puppeteer-extra package was installed');
  }
  run('pnpm', ['exec', 'tsc', '--noEmit'], consumerDirectory);
  run('node', ['runtime.mjs'], consumerDirectory);
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
