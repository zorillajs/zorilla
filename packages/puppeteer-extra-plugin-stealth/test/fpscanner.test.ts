import fpscanner from 'fpscanner';
import { expect, test } from 'vitest';
import Plugin from '../dist/index.js';
import {
  compareLooseVersionStrings,
  getStealthFingerPrint,
  getVanillaFingerPrint,
} from './util.js';

// Fix CI issues with old versions
const isOldPuppeteerVersion = () => {
  const version = process.env.PUPPETEER_VERSION;
  if (!version) {
    return false;
  }
  if (version === '1.9.0' || version === '1.6.2') {
    return true;
  }
  return false;
};

test.skip('vanilla: will fail multiple fpscanner tests (requires fpcollect build)', async () => {
  const fingerPrint = await getVanillaFingerPrint();
  const testedFingerPrints = fpscanner.analyseFingerprint(fingerPrint);
  const failedChecks = Object.values(testedFingerPrints).filter(
    val => val.consistent < 3
  );

  if (isOldPuppeteerVersion()) {
    expect(failedChecks.length).toBe(8);
  } else {
    expect(failedChecks.length).toBe(7);
  }
});

test.skip('stealth: will not fail a single fpscanner test (requires fpcollect build)', async () => {
  const fingerPrint = await getStealthFingerPrint(Plugin);
  const testedFingerPrints = fpscanner.analyseFingerprint(fingerPrint);
  const failedChecks = Object.values(testedFingerPrints).filter(
    val => val.consistent < 3
  );

  if (failedChecks.length) {
    console.warn('The following fingerprints failed:', failedChecks);
  }

  if (compareLooseVersionStrings(fingerPrint.userAgent, '89.0.4339.0') >= 0) {
    // Updated navigator.webdriver behavior breaks the fpscanner tests.
    expect(failedChecks.length).toBe(1);
    expect(failedChecks[0].name).toBe('WEBDRIVER');
  } else {
    expect(failedChecks.length).toBe(0);
  }
});
