import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/navigator.plugins/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  vanillaPuppeteer,
} from '../../util';

test('stealth: will have convincing plugins', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const results = await page.evaluate(() => {
    // We need to help serializing the error or it won't survive being sent back from `page.evaluate`
    const catchErr = function (fn, ...args) {
      try {
        return fn.apply(this, args);
      } catch ({ name, message, stack }) {
        return { name, message, stack, str: stack.split('\n')[0] };
      }
    };

    return {
      plugins: {
        exists: 'plugins' in navigator,
        isArray: Array.isArray(navigator.plugins),
        length: navigator.plugins.length,
        // value: navigator.plugins,
        toString: navigator.plugins.toString(),
        toStringProto: navigator.plugins.__proto__.toString(), // eslint-disable-line no-proto
        protoSymbol: navigator.plugins.__proto__[Symbol.toStringTag], // eslint-disable-line no-proto
        // valueOf: navigator.plugins.valueOf(),
        valueOfSame: navigator.plugins.valueOf() === navigator.plugins,
        json: JSON.stringify(navigator.plugins),
        hasPropPush: 'push' in navigator.plugins,
        hasPropLength: 'length' in navigator.plugins,
        hasLengthDescriptor: !!Object.getOwnPropertyDescriptor(
          navigator.plugins,
          'length'
        ),
        propertyNames: JSON.stringify(
          Object.getOwnPropertyNames(navigator.plugins)
        ),
        lengthInProps: Object.getOwnPropertyNames(navigator.plugins).includes(
          'length'
        ),
        keys: JSON.stringify(Object.keys(navigator.plugins)),
        loopResult: [...navigator.plugins].map(p => p.name).join(','),
      },
      namedItem: {
        exists: 'namedItem' in navigator.plugins,
        toString: navigator.plugins.namedItem.toString(),
        resultNotFound: navigator.plugins.namedItem('foo'),
        resultFound: navigator.plugins // eslint-disable-line no-proto
          .namedItem('Chrome PDF Viewer')
          .__proto__.toString(),
        errors: {
          // For whatever weird reason the normal context doesn't suffice, we need to bind this to `navigator.plugins`
          noArgs: catchErr.bind(navigator.plugins)(navigator.plugins.namedItem)
            .str,
          noStackLeaks: !catchErr
            .bind(navigator.plugins)(navigator.plugins.namedItem)
            .stack.includes(`.apply`),
          protoCall: catchErr.bind(navigator.plugins)(
            navigator.plugins.__proto__.namedItem // eslint-disable-line no-proto
          ).str,
        },
      },
      item: {
        exists: 'item' in navigator.plugins,
        toString: navigator.plugins.item.toString(),
        resultNotFound: navigator.plugins.item('madness').name,
        resultNotFoundNumberString: navigator.plugins.item('777'),
        resultEmptyString: navigator.plugins.item('').name,
        resultByNumberString: navigator.plugins.item('2').name,
        resultByNumberStringZero: navigator.plugins.item('0').name,
        resultByNumber: navigator.plugins.item(2).name,
        resultNull: navigator.plugins.item(null).name,
        resultFound: navigator.plugins.item('application/x-nacl').name,
        errors: {
          // For whatever weird reason the normal context doesn't suffice, we need to bind this to `navigator.plugins`
          noArgs: catchErr.bind(navigator.plugins)(navigator.plugins.item).str,
          noStackLeaks: !catchErr
            .bind(navigator.plugins)(navigator.plugins.item)
            .stack.includes(`.apply`),
          protoCall: catchErr.bind(navigator.plugins)(
            navigator.plugins.__proto__.item // eslint-disable-line no-proto
          ).str,
        },
      },
    };
  });

  expect(results.plugins).toEqual({
    exists: true,
    hasPropLength: true,
    hasLengthDescriptor: false,
    hasPropPush: false,
    isArray: false,
    json: `{"0":{"0":{},"1":{}},"1":{"0":{},"1":{}},"2":{"0":{},"1":{}},"3":{"0":{},"1":{}},"4":{"0":{},"1":{}}}`,
    keys: `["0","1","2","3","4"]`,
    length: 5,
    lengthInProps: false,
    loopResult:
      'PDF Viewer,Chrome PDF Viewer,Chromium PDF Viewer,Microsoft Edge PDF Viewer,WebKit built-in PDF',
    propertyNames: `["0","1","2","3","4","PDF Viewer","Chrome PDF Viewer","Chromium PDF Viewer","Microsoft Edge PDF Viewer","WebKit built-in PDF"]`,
    protoSymbol: 'PluginArray',
    toString: '[object PluginArray]',
    toStringProto: '[object PluginArray]',
    valueOfSame: true,
  });

  expect(results.namedItem).toEqual({
    exists: true,
    toString: 'function namedItem() { [native code] }',
    resultFound: '[object Plugin]',
    resultNotFound: null,

    errors: {
      noArgs: 'TypeError: 1 argument required, but only 0 present.',
      noStackLeaks: true,
      protoCall: 'TypeError: 1 argument required, but only 0 present.',
    },
  });

  expect(results.item).toEqual({
    exists: true,
    resultByNumber: 'Chromium PDF Viewer',
    resultByNumberString: 'Chromium PDF Viewer',
    resultByNumberStringZero: 'PDF Viewer',
    resultEmptyString: 'PDF Viewer',
    resultFound: 'PDF Viewer',
    resultNotFound: 'PDF Viewer',
    resultNotFoundNumberString: null,
    resultNull: 'PDF Viewer',
    toString: 'function item() { [native code] }',
    errors: {
      noArgs: 'TypeError: 1 argument required, but only 0 present.',
      noStackLeaks: true,
      protoCall: 'TypeError: 1 argument required, but only 0 present.',
    },
  });
});

test('stealth: will have convincing plugin entry', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const results = await page.evaluate(() => ({
    plugins: {
      exists: !!navigator.plugins[0],
      toString: navigator.plugins[0].toString(),
      toStringProto: navigator.plugins[0].__proto__.toString(), // eslint-disable-line no-proto
      protoSymbol: navigator.plugins[0].__proto__[Symbol.toStringTag], // eslint-disable-line no-proto
      length: navigator.plugins[0].length, // should not throw and return mimeTypes length
      lengthDescriptor: Object.getOwnPropertyDescriptor(
        navigator.plugins[0],
        'length'
      ),
    },
    plugin: {
      mtIndex: !!navigator.plugins[0][0], // mimeType should be accessible through index
      mtNamed: !!navigator.plugins[0]['application/pdf'], // mimeType should be accessible through name
      json: JSON.stringify(navigator.plugins[0]),
      propertyNames: JSON.stringify(
        Object.getOwnPropertyNames(navigator.plugins[0])
      ),
    },
  }));
  expect(results.plugins).toEqual({
    exists: true,
    protoSymbol: 'Plugin',
    toString: '[object Plugin]',
    toStringProto: '[object Plugin]',
    length: 2,
  });
  expect(results.plugin).toEqual({
    mtIndex: true,
    mtNamed: true,
    json: '{"0":{},"1":{}}',
    propertyNames: '["0","1","application/pdf","text/pdf"]',
  });
});
