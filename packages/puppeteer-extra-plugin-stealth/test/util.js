import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try to resolve fpcollect path, fallback to null if not found
let fpCollectPath = null;
try {
  fpCollectPath = require.resolve('fpcollect/dist/fpCollect.min.js');
} catch (_err) {
  // fpcollect dist not built, fingerprinting tests will be skipped
  console.warn('Warning: fpcollect dist not found, some tests may be skipped');
}

const getFingerPrintFromPage = async page => {
  return page.evaluate(() => fpCollect.generateFingerprint()); // eslint-disable-line
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

const getFingerPrint = async (puppeteer, pageFn) => {
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
  const fingerPrint = await getFingerPrintFromPage(page);

  let pageFnResult = null;
  if (pageFn) {
    pageFnResult = await pageFn(page);
  }

  await browser.close();
  return { ...fingerPrint, pageFnResult };
};

const getVanillaFingerPrint = async pageFn =>
  getFingerPrint(vanillaPuppeteer, pageFn);
const getStealthFingerPrint = async (Plugin, pageFn, pluginOptions = null) =>
  getFingerPrint(addExtra(vanillaPuppeteer).use(Plugin(pluginOptions)), pageFn);

// Expecting the input string to be in one of these formats:
// - The UA string
// - The shorter version string from Puppeteers browser.version()
// - The shortest four-integer string
const parseLooseVersionString = looseVersionString =>
  looseVersionString
    .match(/(\d+\.){3}\d+/)[0]
    .split('.')
    .map(x => parseInt(x, 10));

const compareLooseVersionStrings = (version0, version1) => {
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
