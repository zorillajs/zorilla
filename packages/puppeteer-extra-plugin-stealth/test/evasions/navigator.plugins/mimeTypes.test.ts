import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/navigator.plugins/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  vanillaPuppeteer,
} from '../../util';

test('stealth: will have convincing mimeTypes', async () => {
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
      mimeTypes: {
        exists: 'mimeTypes' in navigator,
        isArray: Array.isArray(navigator.mimeTypes),
        length: navigator.mimeTypes.length,
        // value: navigator.mimeTypes,
        toString: navigator.mimeTypes.toString(),
        toStringProto: navigator.mimeTypes.__proto__.toString(), // eslint-disable-line no-proto
        protoSymbol: navigator.mimeTypes.__proto__[Symbol.toStringTag], // eslint-disable-line no-proto
        // valueOf: navigator.mimeTypes.valueOf(),
        valueOfSame: navigator.mimeTypes.valueOf() === navigator.mimeTypes,
        json: JSON.stringify(navigator.mimeTypes),
        hasPropPush: 'push' in navigator.mimeTypes,
        hasPropLength: 'length' in navigator.mimeTypes,
        hasLengthDescriptor: !!Object.getOwnPropertyDescriptor(
          navigator.mimeTypes,
          'length'
        ),
        propertyNames: JSON.stringify(
          Object.getOwnPropertyNames(navigator.mimeTypes)
        ),
        lengthInProps: Object.getOwnPropertyNames(navigator.mimeTypes).includes(
          'length'
        ),
        keys: JSON.stringify(Object.keys(navigator.mimeTypes)),
        namedPropsAuthentic: (() => {
          navigator.mimeTypes.alice = 'bob';
          return navigator.mimeTypes.namedItem('alice') === null; // true on chrome
        })(),
        loopResult: (() => {
          let res = '';
          for (let bK = 0; bK < window.navigator.mimeTypes.length; bK++)
            bK === window.navigator.mimeTypes.length - 1
              ? (res += window.navigator.mimeTypes[bK].type)
              : (res += window.navigator.mimeTypes[bK].type + ',');
          return res;
        })(),
      },
      namedItem: {
        exists: 'namedItem' in navigator.mimeTypes,
        toString: navigator.mimeTypes.namedItem.toString(),
        resultNotFound: navigator.mimeTypes.namedItem('foo'),
        resultFound: navigator.mimeTypes // eslint-disable-line no-proto
          .namedItem('application/pdf')
          .__proto__.toString(),
        errors: {
          // For whatever weird reason the normal context doesn't suffice, we need to bind this to `navigator.mimeTypes`
          noArgs: catchErr.bind(navigator.mimeTypes)(
            navigator.mimeTypes.namedItem
          ).str,
          noStackLeaks: !catchErr
            .bind(navigator.mimeTypes)(navigator.mimeTypes.namedItem)
            .stack.includes(`.apply`),
          protoCall: catchErr.bind(navigator.mimeTypes)(
            navigator.mimeTypes.__proto__.namedItem // eslint-disable-line no-proto
          ).str,
        },
      },
      item: {
        exists: 'item' in navigator.mimeTypes,
        toString: navigator.mimeTypes.item.toString(),
        resultNotFound:
          navigator.mimeTypes.item('madness') === null
            ? 'application/pdf'
            : navigator.mimeTypes.item('madness').type,
        resultNotFoundNumberString: navigator.mimeTypes.item('777'),
        resultEmptyString: navigator.mimeTypes.item('')
          ? navigator.mimeTypes.item('').type
          : null,
        resultByNumberString: navigator.mimeTypes.item('2')
          ? navigator.mimeTypes.item('2').type
          : null,
        resultByNumberStringZero: navigator.mimeTypes.item('0')
          ? navigator.mimeTypes.item('0').type
          : null,
        resultByNumber: navigator.mimeTypes.item(2)
          ? navigator.mimeTypes.item(2).type
          : null,
        resultNull: navigator.mimeTypes.item(null)
          ? navigator.mimeTypes.item(null).type
          : null,
        resultFound: navigator.mimeTypes.item('application/pdf')
          ? navigator.mimeTypes.item('application/pdf').type
          : null,
        resultBrackets: navigator.mimeTypes['text/pdf']
          ? navigator.mimeTypes['text/pdf'].type
          : null,
        errors: {
          // For whatever weird reason the normal context doesn't suffice, we need to bind this to `navigator.mimeTypes`
          noArgs: catchErr.bind(navigator.mimeTypes)(navigator.mimeTypes.item)
            .str,
          noStackLeaks: !catchErr
            .bind(navigator.mimeTypes)(navigator.mimeTypes.item)
            .stack.includes(`.apply`),
          protoCall: catchErr.bind(navigator.mimeTypes)(
            navigator.mimeTypes.__proto__.item // eslint-disable-line no-proto
          ).str,
        },
      },
    };
  });

  expect(results.mimeTypes).toEqual({
    exists: true,
    hasPropPush: false,
    hasPropLength: true,
    hasLengthDescriptor: false,
    isArray: false,
    json: `{"0":{},"1":{}}`,
    keys: `["0","1"]`,
    length: 2,
    lengthInProps: false,
    loopResult: 'application/pdf,text/pdf',
    namedPropsAuthentic: true,
    propertyNames: `["0","1","application/pdf","text/pdf"]`,
    protoSymbol: 'MimeTypeArray',
    toString: '[object MimeTypeArray]',
    toStringProto: '[object MimeTypeArray]',
    valueOfSame: true,
  });

  expect(results.namedItem).toEqual({
    exists: true,
    toString: 'function namedItem() { [native code] }',
    resultFound: '[object MimeType]',
    resultNotFound: null,

    errors: {
      noArgs: 'TypeError: 1 argument required, but only 0 present.',
      noStackLeaks: true,
      protoCall: 'TypeError: 1 argument required, but only 0 present.',
    },
  });

  expect(results.item).toEqual({
    exists: true,
    resultBrackets: 'text/pdf',
    resultByNumber: null,
    resultByNumberString: null,
    resultByNumberStringZero: 'application/pdf',
    resultEmptyString: 'application/pdf',
    resultFound: 'application/pdf',
    resultNotFound: 'application/pdf',
    resultNotFoundNumberString: null,
    resultNull: 'application/pdf',
    toString: 'function item() { [native code] }',
    errors: {
      noArgs: 'TypeError: 1 argument required, but only 0 present.',
      noStackLeaks: true,
      protoCall: 'TypeError: 1 argument required, but only 0 present.',
    },
  });
});

test('stealth: will have convincing mimeType entry', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const results = await page.evaluate(() => ({
    mimeType: {
      exists: !!navigator.mimeTypes[0],
      toString: navigator.mimeTypes[0].toString(),
      toStringProto: navigator.mimeTypes[0].__proto__.toString(), // eslint-disable-line no-proto
      protoSymbol: navigator.mimeTypes[0].__proto__[Symbol.toStringTag], // eslint-disable-line no-proto
      enabledPlugin: !!navigator.mimeTypes[0].enabledPlugin, // should not throw
      enabledPlugin2: !!navigator.mimeTypes['application/pdf'].enabledPlugin, // should not throw
      enabledPlugins: !!navigator.mimeTypes[0].enabledPlugins, // regression: should not exist (anymore)
      pdfPlugin: JSON.stringify(
        navigator.mimeTypes['application/pdf'].enabledPlugin
      ),
      length: !!navigator.mimeTypes[0].length, // should not throw and return mimeTypes length
      lengthDescriptor: !!Object.getOwnPropertyDescriptor(
        navigator.mimeTypes[0],
        'length'
      ),
      json: JSON.stringify(navigator.mimeTypes[0]),
      propertyNames: JSON.stringify(
        Object.getOwnPropertyNames(navigator.mimeTypes[0])
      ),
      nested:
        navigator.mimeTypes['application/pdf'].enabledPlugin[0].enabledPlugin[0]
          .enabledPlugin[0].enabledPlugin[0].enabledPlugin[0].suffixes,
    },
  }));
  expect(results.mimeType).toEqual({
    exists: true,
    protoSymbol: 'MimeType',
    toString: '[object MimeType]',
    toStringProto: '[object MimeType]',
    enabledPlugin: true,
    enabledPlugin2: true,
    enabledPlugins: false,
    pdfPlugin: '{"0":{},"1":{}}',
    length: false,
    lengthDescriptor: false,
    json: '{}',
    propertyNames: '[]',
    nested: 'pdf',
  });
});
