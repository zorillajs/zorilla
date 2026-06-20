import { appendFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const exportExecutablePath = executablePath => {
  console.log(executablePath);

  if (process.env.GITHUB_ENV) {
    appendFileSync(
      process.env.GITHUB_ENV,
      `PUPPETEER_EXECUTABLE_PATH=${executablePath}\n`
    );
  }
};

const getInstallTimeoutMs = () => {
  const timeoutMs = Number.parseInt(
    process.env.PUPPETEER_BROWSER_INSTALL_TIMEOUT_MS ?? '240000',
    10
  );

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(
      `Invalid PUPPETEER_BROWSER_INSTALL_TIMEOUT_MS value: ${process.env.PUPPETEER_BROWSER_INSTALL_TIMEOUT_MS}`
    );
  }

  return timeoutMs;
};

const withTimeout = async (promise, timeoutMs, onTimeout) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      onTimeout();
      reject(
        new Error(`Timed out installing Puppeteer browser after ${timeoutMs}ms`)
      );
    }, timeoutMs);
    timeoutId.unref?.();
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const main = async () => {
  const require = createRequire(join(process.cwd(), 'package.json'));
  const puppeteerRequire = createRequire(
    require.resolve('puppeteer/package.json')
  );
  const { Browser, detectBrowserPlatform, install } = await import(
    pathToFileURL(puppeteerRequire.resolve('@puppeteer/browsers'))
  );
  const puppeteer = await import(pathToFileURL(require.resolve('puppeteer')));
  const puppeteerApi = puppeteer.default.default ?? puppeteer.default;

  const cacheDir =
    process.env.PUPPETEER_CACHE_DIR ??
    puppeteerApi.configuration.cacheDirectory;
  const platform = detectBrowserPlatform();

  if (!platform) {
    throw new Error('Unable to detect browser platform');
  }

  const buildId = puppeteerApi.defaultBrowserRevision;
  console.log(`Installing Puppeteer-pinned Chrome ${buildId}`);
  const abortController = new AbortController();

  const installedBrowser = await withTimeout(
    install({
      browser: Browser.CHROME,
      buildId,
      cacheDir,
      platform,
      signal: abortController.signal,
    }),
    getInstallTimeoutMs(),
    () => abortController.abort()
  );

  if (
    !installedBrowser.executablePath ||
    !existsSync(installedBrowser.executablePath)
  ) {
    throw new Error(
      `Chrome was not installed at ${installedBrowser.executablePath ?? '<unknown>'}`
    );
  }

  exportExecutablePath(installedBrowser.executablePath);
};

// Keep Node 24+ from exiting while Puppeteer's browser install promise is
// temporarily unsettled between async phases.
const keepAlive = setInterval(() => {}, 1000);

let failed = false;

try {
  await main();
} catch (error) {
  failed = true;
  console.error(error);
} finally {
  clearInterval(keepAlive);
}

if (failed) {
  process.exit(1);
}
