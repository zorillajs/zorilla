import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addExtra } from '@zorilla/puppeteer-extra';
import type { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { Page } from 'puppeteer';
import vanillaPuppeteer from 'puppeteer';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try to resolve fpcollect path, fallback to null if not found
let fpCollectPath: string | null = null;
try {
  fpCollectPath = require.resolve('fpcollect/dist/fpCollect.min.js');
} catch (_err) {
  // fpcollect dist not built, fingerprinting tests will be skipped
  console.warn('Warning: fpcollect dist not found, some tests may be skipped');
}

const getFingerPrintFromPage = async <
  TFingerprint extends Record<string, unknown>,
>(
  page: Page
): Promise<TFingerprint> => {
  return page.evaluate(() => fpCollect.generateFingerprint<TFingerprint>()); // eslint-disable-line
};

const dummyHTMLPath = path.join(__dirname, './fixtures/dummy.html');

// Get default launch args for tests (includes CI-specific flags)
const getDefaultLaunchArgs = () => {
  const args = [];
  // Add --no-sandbox in CI environments where Chrome needs it
  if (process.env.CI) {
    args.push('--no-sandbox', '--disable-setuid-sandbox');
  }
  return args;
};

type Launchable = {
  launch: typeof vanillaPuppeteer.launch;
};

const getFingerPrint = async <
  TFingerprint extends Record<string, unknown> = Record<string, unknown>,
  TPageFnResult = unknown,
>(
  puppeteer: Launchable,
  pageFn?: ((page: Page) => Promise<TPageFnResult> | TPageFnResult) | null
): Promise<TFingerprint & { pageFnResult: TPageFnResult | null }> => {
  if (!fpCollectPath) {
    throw new Error('fpcollect not available - dist needs to be built');
  }
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('file://' + dummyHTMLPath);
  await page.addScriptTag({ path: fpCollectPath });
  const fingerPrint = await getFingerPrintFromPage<TFingerprint>(page);

  let pageFnResult: TPageFnResult | null = null;
  if (pageFn) {
    pageFnResult = await pageFn(page);
  }

  await browser.close();
  return { ...fingerPrint, pageFnResult };
};

const getVanillaFingerPrint = async <
  TFingerprint extends Record<string, unknown> = Record<string, unknown>,
  TPageFnResult = unknown,
>(
  pageFn?: ((page: Page) => Promise<TPageFnResult> | TPageFnResult) | null
) => getFingerPrint<TFingerprint, TPageFnResult>(vanillaPuppeteer, pageFn);
const getStealthFingerPrint = async <
  TFingerprint extends Record<string, unknown> = Record<string, unknown>,
  TPageFnResult = unknown,
>(
  Plugin: (opts?: unknown) => PuppeteerExtraPlugin,
  pageFn?: ((page: Page) => Promise<TPageFnResult> | TPageFnResult) | null,
  pluginOptions: unknown = null
) =>
  getFingerPrint<TFingerprint, TPageFnResult>(
    addExtra(vanillaPuppeteer).use(Plugin(pluginOptions)),
    pageFn
  );

// Expecting the input string to be in one of these formats:
// - The UA string
// - The shorter version string from Puppeteers browser.version()
// - The shortest four-integer string
const parseLooseVersionString = (looseVersionString: string) =>
  looseVersionString
    .match(/(\d+\.){3}\d+/)?.[0]
    ?.split('.')
    .map(x => parseInt(x, 10)) ?? [];

const compareLooseVersionStrings = (version0: string, version1: string) => {
  const parsed0 = parseLooseVersionString(version0);
  const parsed1 = parseLooseVersionString(version1);
  assert(parsed0.length === 4);
  assert(parsed1.length === 4);
  for (let i = 0; i < parsed0.length; i++) {
    if (parsed0[i] < parsed1[i]) {
      return -1;
    } else if (parsed0[i] > parsed1[i]) {
      return 1;
    }
  }
  return 0;
};

export {
  getVanillaFingerPrint,
  getStealthFingerPrint,
  dummyHTMLPath,
  vanillaPuppeteer,
  addExtra,
  compareLooseVersionStrings,
  getDefaultLaunchArgs,
};
