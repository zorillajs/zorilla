import { appendFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(join(process.cwd(), 'package.json'));
const puppeteerRequire = createRequire(
  require.resolve('puppeteer/package.json')
);
const { Browser, BrowserTag, detectBrowserPlatform, install, resolveBuildId } =
  await import(pathToFileURL(puppeteerRequire.resolve('@puppeteer/browsers')));
const puppeteer = await import(pathToFileURL(require.resolve('puppeteer')));

const cacheDir =
  process.env.PUPPETEER_CACHE_DIR ?? join(process.cwd(), '.cache', 'puppeteer');
const platform = detectBrowserPlatform();

if (!platform) {
  throw new Error('Unable to detect browser platform');
}

const installChrome = async (buildId, label) => {
  console.log(`Installing ${label} Chrome ${buildId}`);
  const installedBrowser = await install({
    browser: Browser.CHROME,
    buildId,
    cacheDir,
    platform,
    downloadProgressCallback: 'default',
  });

  return installedBrowser.executablePath;
};

const exportExecutablePath = executablePath => {
  console.log(executablePath);

  if (process.env.GITHUB_ENV) {
    appendFileSync(
      process.env.GITHUB_ENV,
      `PUPPETEER_EXECUTABLE_PATH=${executablePath}\n`
    );
  }
};

const systemChromeCandidates = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  join(
    process.env.ProgramFiles ?? 'C:\\Program Files',
    'Google\\Chrome\\Application\\chrome.exe'
  ),
  join(
    process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)',
    'Google\\Chrome\\Application\\chrome.exe'
  ),
  join(
    process.env.LocalAppData ?? '',
    'Google\\Chrome\\Application\\chrome.exe'
  ),
];

const defaultPath = puppeteer.default.executablePath();
if (existsSync(defaultPath)) {
  exportExecutablePath(defaultPath);
  process.exit(0);
}

const systemChromePath = systemChromeCandidates.find(candidate =>
  existsSync(candidate)
);
if (systemChromePath) {
  exportExecutablePath(systemChromePath);
  process.exit(0);
}

try {
  await installChrome(
    puppeteer.default.defaultBrowserRevision,
    'Puppeteer pinned'
  );
} catch (error) {
  console.warn(error);
}

if (existsSync(defaultPath)) {
  exportExecutablePath(defaultPath);
  process.exit(0);
}

console.warn(
  `Puppeteer's pinned Chrome was not installed at ${defaultPath}; installing Chrome stable instead.`
);
const stableBuildId = await resolveBuildId(
  Browser.CHROME,
  platform,
  BrowserTag.STABLE
);
const stablePath = await installChrome(stableBuildId, 'stable');
if (!stablePath || !existsSync(stablePath)) {
  throw new Error(
    `Chrome stable was not installed at ${stablePath ?? '<unknown>'}`
  );
}

exportExecutablePath(stablePath);
