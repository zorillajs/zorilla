import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/webgl.vendor/index.js';
import {
  addExtra,
  getStealthFingerPrint,
  getVanillaFingerPrint,
  vanillaPuppeteer,
} from '../../util.js';

// FIXME: This changed in more recent chrome versions
// test('vanilla: videoCard is Google Inc', async () => {
//   const pageFn = async page => await page.evaluate(() => window.chrome) // eslint-disable-line
//   const { videoCard } = await getVanillaFingerPrint(pageFn)
//   expect(videoCard).toEqual(['Google Inc.', 'Google SwiftShader'])
// })

test.skip('stealth: videoCard is Intel Inc (requires fpcollect)', async () => {
  const pageFn = async page => await page.evaluate(() => window.chrome); // eslint-disable-line
  const { videoCard } = await getStealthFingerPrint(Plugin, pageFn);
  expect(videoCard).toEqual(['Intel Inc.', 'Intel Iris OpenGL Engine']);
});

test.skip('stealth: customized values (requires fpcollect)', async () => {
  const pageFn = async page => await page.evaluate(() => window.chrome); // eslint-disable-line
  const { videoCard } = await getStealthFingerPrint(Plugin, pageFn, {
    vendor: 'foo',
    renderer: 'bar',
  });
  expect(videoCard).toEqual(['foo', 'bar']);
});

/* global WebGLRenderingContext */
async function extendedTests() {
  const results = {};

  async function test(name, fn) {
    const detectionPassed = await fn();
    if (detectionPassed) console.log(`Chrome headless detected via ${name}`);
    results[name] = detectionPassed;
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl');

  await test('descriptorsOK', _ => {
    const descriptors = Object.getOwnPropertyDescriptors(
      WebGLRenderingContext.prototype
    );
    const str = descriptors.getParameter.toString();
    return str === `[object Object]`;
  });

  await test('toStringOK', _ => {
    const str = context.getParameter.toString();
    return str === `function getParameter() { [native code] }`;
  });

  await test('toStringOK2', _ => {
    const str = WebGLRenderingContext.prototype.getParameter.toString();
    return str === `function getParameter() { [native code] }`;
  });

  // Make sure we not reveal our proxy through errors
  await test('errorOK', _ => {
    try {
      return context.getParameter();
    } catch (err) {
      return !err.stack.includes(`at Object.apply`);
    }
  });

  // Should not throw (that was old stealth behavior)
  await test('elementOK', _ => {
    try {
      return context.getParameter(123) === null;
    } catch (_) {
      return false;
    }
  });

  return results;
}

test.skip('vanilla: webgl is native (requires fpcollect)', async () => {
  const pageFn = async page => {
    // page.on('console', msg => {
    //   console.log('Page console: ', msg.text())
    // })
    return await page.evaluate(extendedTests); // eslint-disable-line
  };
  const { pageFnResult: result } = await getVanillaFingerPrint(pageFn);

  const wasHeadlessDetected = Object.values(result).some(e => e === false);
  if (wasHeadlessDetected) {
    console.log(result);
  }
  expect(wasHeadlessDetected).toBe(false);
});

test.skip('stealth: webgl is native (requires fpcollect)', async () => {
  const pageFn = async page => await page.evaluate(extendedTests); // eslint-disable-line
  const { pageFnResult: result } = await getStealthFingerPrint(Plugin, pageFn);

  const wasHeadlessDetected = Object.values(result).some(e => e === false);
  if (wasHeadlessDetected) {
    console.log(result);
  }
  expect(wasHeadlessDetected).toBe(false);
});

/**
 * A very simple method to retrieve the name of the default videocard of the system
 * using webgl.
 *
 * Example (Apple Retina MBP 13): {vendor: "Intel Inc.", renderer: "Intel(R) Iris(TM) Graphics 6100"}
 *
 * @see https://stackoverflow.com/questions/49267764/how-to-get-the-video-card-driver-name-using-javascript-browser-side
 * @returns {Object}
 */
function getVideoCardInfo(context = 'webgl') {
  const gl = document.createElement('canvas').getContext(context);
  if (!gl) {
    return {
      error: 'no webgl',
    };
  }
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    };
  }
  return {
    error: 'no WEBGL_debug_renderer_info',
  };
}

test('stealth: handles WebGLRenderingContext', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const videoCardInfo = await page.evaluate(getVideoCardInfo, 'webgl');
  expect(videoCardInfo.error).toBe(undefined);
  expect(videoCardInfo.vendor).toBe('Intel Inc.');
  expect(videoCardInfo.renderer).toBe('Intel Iris OpenGL Engine');
});

test('stealth: handles WebGL2RenderingContext', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const videoCardInfo = await page.evaluate(getVideoCardInfo, 'webgl2');
  expect(videoCardInfo.error).toBe(undefined);
  expect(videoCardInfo.vendor).toBe('Intel Inc.');
  expect(videoCardInfo.renderer).toBe('Intel Iris OpenGL Engine');
});

test('vanilla: normal toString stuff', async () => {
  const browser = await vanillaPuppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const test1 = await page.evaluate(() => {
    return WebGLRenderingContext.prototype.getParameter.toString + '';
  });
  expect(test1).toBe('function toString() { [native code] }');

  const test2 = await page.evaluate(() => {
    return WebGLRenderingContext.prototype.getParameter.toString();
  });
  expect(test2).toBe('function getParameter() { [native code] }');
});

test('stealth: will not leak toString stuff', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const test1 = await page.evaluate(() => {
    return WebGLRenderingContext.prototype.getParameter.toString + '';
  });
  expect(test1).toBe('function toString() { [native code] }'); // returns function () { [native code] }

  const test2 = await page.evaluate(() => {
    return WebGLRenderingContext.prototype.getParameter.toString();
  });
  expect(test2).toBe('function getParameter() { [native code] }');
});

test('stealth: sets user opts correctly', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ vendor: 'alice', renderer: 'bob' })
  );
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const videoCardInfo = await page.evaluate(getVideoCardInfo, 'webgl');
  expect(videoCardInfo.error).toBe(undefined);
  expect(videoCardInfo.vendor).toBe('alice');
  expect(videoCardInfo.renderer).toBe('bob');
});

test('stealth: does not affect protoype', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ vendor: 'alice', renderer: 'bob' })
  );
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const result = await page.evaluate(() => {
    try {
      return WebGLRenderingContext.prototype.getParameter(37445);
    } catch (err) {
      return err.message;
    }
  });
  expect(result).toBe('Illegal invocation');
});
