import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const exportExecutablePath = executablePath => {
  console.log(executablePath);

  if (process.env.GITHUB_ENV) {
    appendFileSync(
      process.env.GITHUB_ENV,
      `PUPPETEER_EXECUTABLE_PATH=${executablePath}\n`
    );
  }
};

const main = () => {
  const require = createRequire(join(process.cwd(), 'package.json'));
  const puppeteerRequire = createRequire(
    require.resolve('puppeteer/package.json')
  );
  const cliPath = puppeteerRequire.resolve(
    'puppeteer/lib/cjs/puppeteer/node/cli.js'
  );
  const executablePath = execFileSync(
    process.execPath,
    [cliPath, 'browsers', 'install', 'chrome', '--format', '{{path}}'],
    {
      encoding: 'utf8',
      env: process.env,
      stdio: ['ignore', 'pipe', 'inherit'],
    }
  ).trim();

  if (!executablePath || !existsSync(executablePath)) {
    throw new Error(
      `Chrome was not installed at ${executablePath || '<none>'}`
    );
  }

  exportExecutablePath(executablePath);
};

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
