import { expect, test } from 'vitest';
import utils from '../../../src/evasions/_utils/index.js';
import withUtils from '../../../src/evasions/_utils/withUtils.js';
import { getDefaultLaunchArgs, vanillaPuppeteer } from '../../util.js';

/* global HTMLMediaElement WebGLRenderingContext */

test('splitObjPath: will do what it says', async () => {
  const { objName, propName } = utils.splitObjPath(
    'HTMLMediaElement.prototype.canPlayType'
  );
  expect(objName).toBe('HTMLMediaElement.prototype');
  expect(propName).toBe('canPlayType');
});

test('makeNativeString: will do what it says', async () => {
  utils.init();
  expect(utils.makeNativeString('bob')).toBe(
    'function bob() { [native code] }'
  );
  expect(utils.makeNativeString('toString')).toBe(
    'function toString() { [native code] }'
  );
  expect(utils.makeNativeString()).toBe('function () { [native code] }');
});

test('replaceWithProxy: will work correctly', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const test1 = await withUtils(page).evaluate(utils => {
    const dummyProxyHandler = {
      get(_target, param) {
        if (param && param === 'ping') {
          return 'pong';
        }
        return utils.cache.Reflect.get(...(arguments || []));
      },
      apply() {
        return utils.cache.Reflect.apply(...arguments);
      },
    };
    utils.replaceWithProxy(
      HTMLMediaElement.prototype,
      'canPlayType',
      dummyProxyHandler
    );
    return {
      toString: HTMLMediaElement.prototype.canPlayType.toString(),
      ping: HTMLMediaElement.prototype.canPlayType.ping,
    };
  });
  expect(test1).toEqual({
    toString: 'function canPlayType() { [native code] }',
    ping: 'pong',
  });
});

test('replaceObjPathWithProxy: will work correctly', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const test1 = await withUtils(page).evaluate(utils => {
    const dummyProxyHandler = {
      get(_target, param) {
        if (param && param === 'ping') {
          return 'pong';
        }
        return utils.cache.Reflect.get(...(arguments || []));
      },
      apply() {
        return utils.cache.Reflect.apply(...arguments);
      },
    };
    utils.replaceObjPathWithProxy(
      'HTMLMediaElement.prototype.canPlayType',
      dummyProxyHandler
    );
    return {
      toString: HTMLMediaElement.prototype.canPlayType.toString(),
      ping: HTMLMediaElement.prototype.canPlayType.ping,
    };
  });
  expect(test1).toEqual({
    toString: 'function canPlayType() { [native code] }',
    ping: 'pong',
  });
});

test('redirectToString: is battle hardened', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  // Patch all documents including iframes
  await withUtils(page).evaluateOnNewDocument(utils => {
    // We redirect toString calls targeted at `canPlayType` to `getParameter`,
    // so if everything works correctly we expect `getParameter` as response.
    const proxyObj = HTMLMediaElement.prototype.canPlayType;
    const originalObj = WebGLRenderingContext.prototype.getParameter;

    utils.redirectToString(proxyObj, originalObj);
  });
  await page.goto('about:blank');

  const result = await withUtils(page).evaluate(_utils => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    return {
      target: {
        raw: HTMLMediaElement.prototype.canPlayType + '',
        rawiframe:
          iframe.contentWindow.HTMLMediaElement.prototype.canPlayType + '',
        raw2: HTMLMediaElement.prototype.canPlayType.toString(),
        rawiframe2:
          iframe.contentWindow.HTMLMediaElement.prototype.canPlayType.toString(),
        direct: Function.prototype.toString.call(
          HTMLMediaElement.prototype.canPlayType
        ),
        directWithiframe: iframe.contentWindow.Function.prototype.toString.call(
          HTMLMediaElement.prototype.canPlayType
        ),
        iframeWithdirect: Function.prototype.toString.call(
          iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
        ),
        iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
          iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
        ),
      },
      toString: {
        obj: HTMLMediaElement.prototype.canPlayType.toString + '',
        objiframe:
          iframe.contentWindow.HTMLMediaElement.prototype.canPlayType.toString +
          '',
        raw: Function.prototype.toString + '',
        rawiframe: iframe.contentWindow.Function.prototype.toString + '',
        direct: Function.prototype.toString.call(Function.prototype.toString),
        directWithiframe: iframe.contentWindow.Function.prototype.toString.call(
          Function.prototype.toString
        ),
        iframeWithdirect: Function.prototype.toString.call(
          iframe.contentWindow.Function.prototype.toString
        ),
        iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
          iframe.contentWindow.Function.prototype.toString
        ),
      },
    };
  });
  expect(result).toEqual({
    target: {
      raw: 'function getParameter() { [native code] }',
      raw2: 'function getParameter() { [native code] }',
      rawiframe: 'function getParameter() { [native code] }',
      rawiframe2: 'function getParameter() { [native code] }',
      direct: 'function getParameter() { [native code] }',
      directWithiframe: 'function getParameter() { [native code] }',
      iframeWithdirect: 'function getParameter() { [native code] }',
      iframeWithiframe: 'function getParameter() { [native code] }',
    },
    toString: {
      obj: 'function toString() { [native code] }',
      objiframe: 'function toString() { [native code] }',
      raw: 'function toString() { [native code] }',
      rawiframe: 'function toString() { [native code] }',
      direct: 'function toString() { [native code] }',
      directWithiframe: 'function toString() { [native code] }',
      iframeWithdirect: 'function toString() { [native code] }',
      iframeWithiframe: 'function toString() { [native code] }',
    },
  });
});

test('redirectToString: has proper errors', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  // Patch all documents including iframes
  await withUtils(page).evaluateOnNewDocument(utils => {
    // We redirect toString calls targeted at `canPlayType` to `getParameter`,
    // so if everything works correctly we expect `getParameter` as response.
    const proxyObj = HTMLMediaElement.prototype.canPlayType;
    const originalObj = WebGLRenderingContext.prototype.getParameter;

    utils.redirectToString(proxyObj, originalObj);
  });
  await page.goto('about:blank');

  const result = await withUtils(page).evaluate(_utils => {
    const evalErr = (str = '') => {
      try {
        // eslint-disable-next-line no-eval
        return eval(str);
      } catch (err) {
        return err.toString();
      }
    };

    return {
      blank: evalErr(`Function.prototype.toString.apply()`),
      null: evalErr(`Function.prototype.toString.apply(null)`),
      undef: evalErr(`Function.prototype.toString.apply(undefined)`),
      emptyObject: evalErr(`Function.prototype.toString.apply({})`),
    };
  });
  expect(result).toEqual({
    blank:
      "TypeError: Function.prototype.toString requires that 'this' be a Function",
    null: "TypeError: Function.prototype.toString requires that 'this' be a Function",
    undef:
      "TypeError: Function.prototype.toString requires that 'this' be a Function",
    emptyObject:
      "TypeError: Function.prototype.toString requires that 'this' be a Function",
  });
});

test('patchToString: will work correctly', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  // Test verbatim string replacement
  const test1 = await withUtils(page).evaluate(utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType, 'bob');
    return HTMLMediaElement.prototype.canPlayType.toString();
  });
  expect(test1).toBe('bob');

  // Test automatic mode derived from `.name`
  const test2 = await withUtils(page).evaluate(utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType);
    return HTMLMediaElement.prototype.canPlayType.toString();
  });
  expect(test2).toBe('function canPlayType() { [native code] }');

  // Make sure automatic mode derived from `.name` works with proxies
  const test3 = await withUtils(page).evaluate(utils => {
    HTMLMediaElement.prototype.canPlayType = new Proxy(
      HTMLMediaElement.prototype.canPlayType,
      {}
    );
    utils.patchToString(HTMLMediaElement.prototype.canPlayType);
    return HTMLMediaElement.prototype.canPlayType.toString();
  });
  expect(test3).toBe('function canPlayType() { [native code] }');

  // Actually verify there's an issue when using vanilla Proxies
  const test4 = await withUtils(page).evaluate(_utils => {
    HTMLMediaElement.prototype.canPlayType = new Proxy(
      HTMLMediaElement.prototype.canPlayType,
      {}
    );
    return HTMLMediaElement.prototype.canPlayType.toString();
  });
  expect(test4).toBe('function () { [native code] }');
});

function toStringTest(obj) {
  obj = eval(obj); // eslint-disable-line no-eval
  return `
- obj.toString(): ${obj.toString()}
- obj.name: ${obj.name}
- obj.toString + "": ${obj.toString + ''}
- obj.toString.name: ${obj.toString.name}
- obj.valueOf + "": ${obj.valueOf + ''}
- obj.valueOf().name: ${obj.valueOf().name}
- Object.prototype.toString.apply(obj): ${Object.prototype.toString.apply(obj)}
- Function.prototype.toString.call(obj): ${Function.prototype.toString.call(
    obj
  )}
- Function.prototype.valueOf.call(obj) + "": ${
    Function.prototype.valueOf.call(obj) + ''
  }
- obj.toString === Function.prototype.toString: ${
    obj.toString === Function.prototype.toString
  }
`.trim();
}

test('patchToString: passes all toString tests', async () => {
  const toStringVanilla = await (async () => {
    const browser = await vanillaPuppeteer.launch({
      headless: true,
      args: getDefaultLaunchArgs(),
    });
    const page = await browser.newPage();
    return page.evaluate(
      toStringTest,
      'HTMLMediaElement.prototype.canPlayType'
    );
  })();
  const toStringStealth = await (async () => {
    const browser = await vanillaPuppeteer.launch({
      headless: true,
      args: getDefaultLaunchArgs(),
    });
    const page = await browser.newPage();
    await withUtils(page).evaluate(utils => {
      HTMLMediaElement.prototype.canPlayType = function canPlayType() {};
      utils.patchToString(HTMLMediaElement.prototype.canPlayType);
    });
    return page.evaluate(
      toStringTest,
      'HTMLMediaElement.prototype.canPlayType'
    );
  })();

  // Check that the unmodified results are as expected
  expect(toStringVanilla).toBe(
    `
- obj.toString(): function canPlayType() { [native code] }
- obj.name: canPlayType
- obj.toString + "": function toString() { [native code] }
- obj.toString.name: toString
- obj.valueOf + "": function valueOf() { [native code] }
- obj.valueOf().name: canPlayType
- Object.prototype.toString.apply(obj): [object Function]
- Function.prototype.toString.call(obj): function canPlayType() { [native code] }
- Function.prototype.valueOf.call(obj) + "": function canPlayType() { [native code] }
- obj.toString === Function.prototype.toString: true
`.trim()
  );

  // Make sure our customizations leave no trace
  expect(toStringVanilla).toBe(toStringStealth);
});

test('patchToString: passes stack trace tests', async () => {
  const toStringStackTrace = () => {
    try {
      Object.create(
        Object.getOwnPropertyDescriptor(Function.prototype, 'toString').get
      ).toString();
    } catch (err) {
      return err.stack.split('\n').slice(0, 2).join('|');
    }
    return 'error not thrown';
  };

  const toStringVanilla = await (async () => {
    const browser = await vanillaPuppeteer.launch({
      headless: true,
      args: getDefaultLaunchArgs(),
    });
    const page = await browser.newPage();
    return page.evaluate(toStringStackTrace);
  })();
  const toStringStealth = await (async () => {
    const browser = await vanillaPuppeteer.launch({
      headless: true,
      args: getDefaultLaunchArgs(),
    });
    const page = await browser.newPage();
    await withUtils(page).evaluate(utils => {
      HTMLMediaElement.prototype.canPlayType = function canPlayType() {};
      utils.patchToString(HTMLMediaElement.prototype.canPlayType);
    });
    return page.evaluate(toStringStackTrace);
  })();

  // Check that the unmodified results are as expected
  expect(toStringVanilla).toBe(
    `TypeError: Object prototype may only be an Object or null: undefined|    at Object.create (<anonymous>)`.trim()
  );

  // Make sure our customizations leave no trace
  expect(toStringVanilla).toBe(toStringStealth);
});

test('patchToString: vanilla has iframe issues', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  // Only patch the main window
  const result = await withUtils(page).evaluate(utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType, 'bob');

    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    return {
      direct: Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      directWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      iframeWithdirect: Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      ),
      iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      ),
    };
  });
  expect(result).toEqual({
    direct: 'bob',
    directWithiframe: 'function canPlayType() { [native code] }',
    iframeWithdirect: 'function canPlayType() { [native code] }',
    iframeWithiframe: 'function canPlayType() { [native code] }',
  });
});

test('patchToString: stealth has no iframe issues', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  // Patch all documents including iframes
  await withUtils(page).evaluateOnNewDocument(utils => {
    utils.patchToString(HTMLMediaElement.prototype.canPlayType, 'alice');
  });
  await page.goto('about:blank');

  const result = await withUtils(page).evaluate(_utils => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    return {
      direct: Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      directWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        HTMLMediaElement.prototype.canPlayType
      ),
      iframeWithdirect: Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      ),
      iframeWithiframe: iframe.contentWindow.Function.prototype.toString.call(
        iframe.contentWindow.HTMLMediaElement.prototype.canPlayType
      ),
    };
  });
  expect(result).toEqual({
    direct: 'alice',
    directWithiframe: 'alice',
    iframeWithdirect: 'alice',
    iframeWithiframe: 'alice',
  });
});

test('stripProxyFromErrors: will work correctly', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const results = await withUtils(page).evaluate(utils => {
    const getStack = prop => {
      try {
        prop.caller(); // Will throw (HTMLMediaElement.prototype.canPlayType.caller)
        return false;
      } catch (err) {
        return err.stack;
      }
    };
    /** We need traps to show up in the error stack */
    const dummyProxyHandler = {
      get() {
        return utils.cache.Reflect.get(...(arguments || []));
      },
      apply() {
        return utils.cache.Reflect.apply(...arguments);
      },
    };
    const vanillaProxy = new Proxy(
      HTMLMediaElement.prototype.canPlayType,
      dummyProxyHandler
    );
    const stealthProxy = new Proxy(
      HTMLMediaElement.prototype.canPlayType,
      utils.stripProxyFromErrors(dummyProxyHandler)
    );

    const stacks = {
      vanilla: getStack(HTMLMediaElement.prototype.canPlayType),
      vanillaProxy: getStack(vanillaProxy),
      stealthProxy: getStack(stealthProxy),
    };
    return stacks;
  });

  // Check that the untouched stuff behaves as expected
  expect(results.vanilla.includes(`TypeError: 'caller'`)).toBe(true);
  expect(results.vanilla.includes(`at Object.get`)).toBe(false);

  // Regression test: Make sure vanilla JS Proxies leak the stack trace
  expect(results.vanillaProxy.includes(`TypeError: 'caller'`)).toBe(true);
  expect(results.vanillaProxy.includes(`at Object.get`)).toBe(true);

  // Stealth tests
  expect(results.stealthProxy.includes(`TypeError: 'caller'`)).toBe(true);
  expect(results.stealthProxy.includes(`at Object.get`)).toBe(false);
});

test('replaceProperty: will work without traces', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const results = await withUtils(page).evaluate(utils => {
    utils.replaceProperty(Object.getPrototypeOf(navigator), 'languages', {
      get: () => ['de-DE'],
    });
    return {
      propNames: Object.getOwnPropertyNames(navigator),
    };
  });
  expect(results.propNames.includes('languages')).toBe(false);
});

test('cache: will prevent leaks through overriding methods', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const results = await withUtils(page).evaluate(utils => {
    const sniffResults = {
      vanilla: false,
      stealth: false,
    };

    const vanillaProxy = new Proxy(
      {},
      {
        get() {
          return Reflect.get(...arguments);
        },
      }
    );
    Reflect.get = () => (sniffResults.vanilla = true);
    // trigger get trap
    vanillaProxy.foo; // eslint-disable-line

    const stealthProxy = new Proxy(
      {},
      {
        get() {
          return utils.cache.Reflect.get(...arguments); // using cached copy
        },
      }
    );
    Reflect.get = () => (sniffResults.stealth = true);
    // trigger get trap
    stealthProxy.foo; // eslint-disable-line

    return sniffResults;
  });

  expect(results).toEqual({
    vanilla: true,
    stealth: false,
  });
});

test('replaceWithProxy: will throw prototype errors', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('about:blank');

  const result = await withUtils(page).evaluate(utils => {
    utils.replaceWithProxy(HTMLMediaElement.prototype, 'canPlayType', {});

    const evalErr = (str = '') => {
      try {
        // eslint-disable-next-line no-eval
        return eval(str);
      } catch (err) {
        return err.toString();
      }
    };

    return {
      same: evalErr(
        `Object.setPrototypeOf(HTMLMediaElement.prototype.canPlayType, HTMLMediaElement.prototype.canPlayType) + ""`
      ),
      sameString: evalErr(
        `Object.setPrototypeOf(Function.prototype.toString, Function.prototype.toString) + ""`
      ),
      null: evalErr(
        `Object.setPrototypeOf(Function.prototype.toString, null) + ""`
      ),
      undef: evalErr(
        `Object.setPrototypeOf(Function.prototype.toString, undefined) + ""`
      ),
      none: evalErr(`Object.setPrototypeOf(Function.prototype.toString) + ""`),
    };
  });
  expect(result).toEqual({
    same: 'TypeError: Cyclic __proto__ value',
    sameString: 'TypeError: Cyclic __proto__ value',
    null: 'TypeError: Cannot convert object to primitive value',
    undef:
      'TypeError: Object prototype may only be an Object or null: undefined',
    none: 'TypeError: Object prototype may only be an Object or null: undefined',
  });
});

test('replaceGetterSetter', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('about:blank');

  const results = await withUtils(page).evaluate(utils => {
    const getDetails = a => ({
      href: a.href,
      typeof: typeof a.href,
      in: 'href' in a,
      keys: Object.keys(a),
      // eslint-disable-next-line no-undef
      prototypeKeys: Object.keys(HTMLAnchorElement.prototype),
      getOwnPropertyNames: Object.getOwnPropertyNames(a),
      prototypeGetOwnPropertyNames: Object.getOwnPropertyNames(
        // eslint-disable-next-line no-undef
        HTMLAnchorElement.prototype
      ),
      ownPropertyDescriptor:
        undefined === Object.getOwnPropertyDescriptor(a, 'href'),
      prototypeOwnPropertyDescriptor: Object.getOwnPropertyDescriptor(
        // eslint-disable-next-line no-undef
        HTMLAnchorElement.prototype,
        'href'
      ),
      ownPropertyDescriptors: Object.getOwnPropertyDescriptors(a, 'href'),
      prototypeOwnPropertyDescriptors: Object.getOwnPropertyDescriptors(
        // eslint-disable-next-line no-undef
        HTMLAnchorElement.prototype,
        'href'
      ),
      getToString: Object.getOwnPropertyDescriptor(
        // eslint-disable-next-line no-undef
        HTMLAnchorElement.prototype,
        'href'
      ).get.toString(),
      setToString: Object.getOwnPropertyDescriptor(
        // eslint-disable-next-line no-undef
        HTMLAnchorElement.prototype,
        'href'
      ).set.toString(),
    });

    // Use native a.href.
    const a1 = document.createElement('a');
    a1.href = 'http://foo.com/';
    const details1 = getDetails(a1);

    // Override a.href.
    let href = '';
    // eslint-disable-next-line no-undef
    utils.replaceGetterSetter(HTMLAnchorElement.prototype, 'href', {
      get: () => href,
      set: newValue => {
        href = newValue;
      },
    });

    // Use overrided a.href.
    const a2 = document.createElement('a');
    a2.href = 'http://foo.com/';
    const details2 = getDetails(a2);

    return [details1, details2];
  });

  expect(results[1]).toEqual(results[0]);
});

test('arrayEquals', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('about:blank');

  const results = await withUtils(page).evaluate(utils => {
    const obj = { foo: 'bar' };
    return {
      a: utils.arrayEquals(['a', 'Alpha'], ['a', 'Alpha']),
      b: !utils.arrayEquals(['b', 'Beta'], ['b', 'Blue']),
      c: !utils.arrayEquals(['c', { foo: 'bar' }], ['c', { foo: 'bar' }]),
      d: utils.arrayEquals(['d', obj], ['d', obj]),
      e: utils.arrayEquals([null], [null]),
      f: utils.arrayEquals([undefined], [undefined]),
      g: utils.arrayEquals([false], [false]),
    };
  });

  expect(results).toEqual({
    a: true,
    b: true,
    c: true,
    d: true,
    e: true,
    f: true,
    g: true,
  });
});

test('memoize', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('about:blank');

  const results = await withUtils(page).evaluate(utils => {
    const objectify = utils.memoize((valueAdded, _valueIgnored) => {
      return { valueAdded };
    });

    const obj = { foo: 'bar' };
    /* eslint-disable no-self-compare */
    return {
      a: objectify('a', 'Alpha') === objectify('a', 'Alpha'),
      b: objectify('b', 'Beta') !== objectify('b', 'Blue'),
      c: objectify('c', { foo: 'bar' }) !== objectify('c', { foo: 'bar' }),
      d: objectify('d', obj) === objectify('d', obj),
      e: objectify(null) === objectify(null),
      f: objectify(undefined) === objectify(undefined),
      g: objectify(false) === objectify(false),
    };
    /* eslint-enable no-self-compare */
  });

  expect(results).toEqual({
    a: true,
    b: true,
    c: true,
    d: true,
    e: true,
    f: true,
    g: true,
  });
});
