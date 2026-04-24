import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Browser } from 'puppeteer';
import { expect, test } from 'vitest';
import Plugin from '../dist/index.js';
import {
  addExtra,
  dummyHTMLPath,
  getDefaultLaunchArgs,
  vanillaPuppeteer,
} from './util';

const require = createRequire(import.meta.url);

// fpscanner v1.0.0 is a browser-side library — no longer a Node.js analyser.
// We inject the ES bundle into the page and expose the class as a window global,
// then call collectFingerprint() in the browser context to both collect and analyse.
const getFpScannerBrowserCode = (): string => {
  const fpScannerPath = require.resolve(
    'fpscanner/dist/fpScanner.es.js'
  ) as string;
  const code = readFileSync(fpScannerPath, 'utf8');
  // Replace `export { <name> as default };` with a window global assignment so
  // the bundle can be injected as a regular (non-module) script tag.
  return code.replace(/export \{([^}]+)\};?\s*$/, (_match, inner: string) => {
    const name = inner.match(/(\w+)\s+as\s+default/)?.[1];
    if (!name)
      throw new Error('Could not find default export name in fpscanner bundle');
    return `window.FingerprintScanner = ${name};`;
  });
};

const fpScannerCode = getFpScannerBrowserCode();
// GitHub's Windows runners can take over a minute to launch Chromium, inject
// fpscanner, and finish the vanilla baseline collection.
const fpscannerTestTimeout = process.platform === 'win32' ? 90000 : 30000;

type FastBotDetectionDetails = Record<
  string,
  { detected: boolean; severity: string }
>;

interface FpScannerResult {
  fastBotDetection: boolean;
  fastBotDetectionDetails: FastBotDetectionDetails;
}

interface LaunchablePuppeteer {
  launch(options?: { headless?: boolean; args?: string[] }): Promise<Browser>;
}

const getFpScannerResult = async (
  puppeteer: LaunchablePuppeteer
): Promise<FpScannerResult> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${dummyHTMLPath}`);
    await page.addScriptTag({ content: fpScannerCode });
    const result = await page.evaluate(async () => {
      // FingerprintScanner is injected as a browser global via addScriptTag above
      const FP = (window as Record<string, unknown>)
        .FingerprintScanner as new () => {
        collectFingerprint(opts: { encrypt: boolean }): Promise<unknown>;
      };
      const scanner = new FP();
      return scanner.collectFingerprint({ encrypt: false });
    });
    return result as FpScannerResult;
  } finally {
    await browser.close();
  }
};

test(
  'vanilla: will fail multiple fpscanner bot detection checks',
  async () => {
    const result = await getFpScannerResult(vanillaPuppeteer);
    const failedChecks = Object.entries(result.fastBotDetectionDetails)
      .filter(([_name, val]) => val.detected)
      .map(([name]) => name);

    console.log('Vanilla failed checks:', failedChecks);
    expect(result.fastBotDetection).toBe(true);
    expect(failedChecks.length).toBeGreaterThan(0);
  },
  fpscannerTestTimeout
);

test(
  'stealth: will pass core fpscanner automation checks',
  async () => {
    // PuppeteerExtra has a compatible launch() interface — assertion is safe
    const stealthPuppeteer = addExtra(vanillaPuppeteer).use(
      Plugin()
    ) as unknown as LaunchablePuppeteer;
    const result = await getFpScannerResult(stealthPuppeteer);
    const failedChecks = Object.entries(result.fastBotDetectionDetails)
      .filter(([_name, val]) => val.detected)
      .map(([name]) => name);

    if (failedChecks.length) {
      console.warn('The following checks failed:', failedChecks);
    }

    // These are the automation signals that the stealth plugin explicitly addresses.
    // Stealth overrides navigator.webdriver → hasWebdriver should not fire.
    expect(result.fastBotDetectionDetails.hasWebdriver.detected).toBe(false);
    // Stealth injects chrome.* objects → hasMissingChromeObject should not fire.
    expect(result.fastBotDetectionDetails.hasMissingChromeObject.detected).toBe(
      false
    );
    // Neither Selenium nor Playwright markers are present in a Puppeteer session.
    expect(result.fastBotDetectionDetails.hasSeleniumProperty.detected).toBe(
      false
    );
    expect(result.fastBotDetectionDetails.hasPlaywright.detected).toBe(false);
  },
  fpscannerTestTimeout
);
