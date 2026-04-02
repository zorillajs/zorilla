import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/user-agent-override/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  vanillaPuppeteer,
} from '../../util';

// Fixed since 2.1.1?
// test('vanilla: Accept-Language header is missing', async () => {
//   const browser = await vanillaPuppeteer.launch({ headless: true, args: getDefaultLaunchArgs() })
//   const page = await browser.newPage()
//   await page.goto('http://httpbin.org/headers')
//
//   const content = await page.content()
//   expect(content.includes(`"User-Agent"`)).toBe(true)
//   expect(content.includes(`"Accept-Language"`)).toBe(false)
// })

test.skip('vanilla: User-Agent header contains HeadlessChrome', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('http://httpbin.org/headers');

  const content = await page.content();
  expect(content.includes(`"User-Agent"`)).toBe(true);
  expect(content.includes(`HeadlessChrome`)).toBe(true);
});

test.skip('vanilla: navigator.languages is always en-US', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  const lang = await page.evaluate(() => navigator.languages);
  expect(lang.length === 1 && lang[0] === 'en-US').toBe(true);
});

test.skip('vanilla: navigator.platform set to host platform', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const platform = await page.evaluate(() => navigator.platform);
  switch (process.platform) {
    case 'linux':
      expect(platform.includes('Linux')).toBe(true); // TravisCI
      break;
    case 'darwin':
      expect(platform === 'MacIntel').toBe(true);
      break;
    case 'win32':
      expect(platform === 'Win32').toBe(true);
      break;
    default:
      expect(platform === process.platform).toBe(true);
  }
});

test.skip('stealth: Accept-Language header with default locale', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('http://httpbin.org/headers');

  const content = await page.content();
  expect(content.includes(`"User-Agent"`)).toBe(true);
  expect(content.includes(`"Accept-Language": "en-US,en;q=0.9"`)).toBe(true);
});

test.skip('stealth: Accept-Language header with optional locale', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ locale: 'de-DE,de' })
  );
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('http://httpbin.org/headers');

  const content = await page.content();
  expect(content.includes(`"User-Agent"`)).toBe(true);
  expect(content.includes(`"Accept-Language": "de-DE,de;q=0.9"`)).toBe(true);
});

test.skip('stealth: User-Agent header does not contain HeadlessChrome', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('http://httpbin.org/headers');

  const content = await page.content();
  expect(content.includes(`"User-Agent"`)).toBe(true);
  expect(content.includes(`HeadlessChrome`)).toBe(false);
});

test.skip('stealth: User-Agent header with custom userAgent', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ userAgent: 'MyFunkyUA/1.0' })
  );
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  await page.goto('http://httpbin.org/headers');

  const content = await page.content();
  expect(content.includes(`"User-Agent": "MyFunkyUA/1.0"`)).toBe(true);
});

test.skip('stealth: navigator.languages with default locale', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const lang = await page.evaluate(() => navigator.languages);
  expect(lang.length === 2 && lang[0] === 'en-US' && lang[1] === 'en').toBe(
    true
  );
});

test.skip('stealth: navigator.languages with custom locale', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ locale: 'de-DE,de' })
  );
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const langs = await page.evaluate(() => navigator.languages);
  expect(langs).toEqual(['de-DE', 'de']);
  const lang = await page.evaluate(() => navigator.language);
  expect(lang).toEqual('de-DE');
});

test.skip('stealth: navigator.platform with maskLinux true (default)', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      userAgent:
        'Mozilla/5.0 (X11; Ubuntu; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.9.9999.99 Safari/537.36',
    })
  );
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const platform = await page.evaluate(() => navigator.platform);
  expect(platform === 'Win32').toBe(true);
});

test.skip('stealth: navigator.platform with maskLinux false', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      userAgent:
        'Mozilla/5.0 (X11; Ubuntu; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.9.9999.99 Safari/537.36',
      maskLinux: false,
    })
  );
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const platform = await page.evaluate(() => navigator.platform);
  expect(platform === 'Linux').toBe(true);
});

const _testUAHint = async (userAgent, locale) => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ userAgent, locale })
  );

  const browser = await puppeteer.launch({
    headless: false, // only works on headful
    args: ['--enable-features=UserAgentClientHint'],
  });

  const majorVersion = parseInt(
    (await browser.version()).match(/\/([^.]+)/)[1],
    10
  );
  if (majorVersion < 88) {
    return null; // Skip test on browsers that don't support UA hints
  }

  const page = await browser.newPage();

  await page.goto('https://headers.cf/headers/?format=raw');

  return page;
};

test.skip('stealth: test if UA hints are correctly set - Windows 10', async () => {
  const page = await _testUAHint(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
    'en-AU'
  );
  if (!page) {
    expect(true).toBe(true); // skip
    return;
  }
  const firstLoad = await page.content();
  expect(
    firstLoad.includes(
      `sec-ch-ua: "Google Chrome";v="99", " Not;A Brand";v="99", "Chromium";v="99"`
    )
  ).toBe(true);
  expect(firstLoad.includes(`Accept-Language: en-AU`)).toBe(true);

  await page.reload();
  const secondLoad = await page.content();
  if (secondLoad.includes('sec-ch-ua-full-version')) {
    expect(secondLoad.includes('sec-ch-ua-mobile: ?0')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-full-version: "99.0.9999.99"')).toBe(
      true
    );
    expect(secondLoad.includes('sec-ch-ua-arch: "x86"')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-platform: "Windows"')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-platform-version: "10.0"')).toBe(
      true
    );
    expect(secondLoad.includes('sec-ch-ua-model: ""')).toBe(true);
  }
});

test.skip('stealth: test if UA hints are correctly set - macOS 11', async () => {
  const page = await _testUAHint(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
    'de-DE'
  );
  if (!page) {
    expect(true).toBe(true); // skip
    return;
  }
  const firstLoad = await page.content();
  expect(
    firstLoad.includes(
      `sec-ch-ua: "Google Chrome";v="99", " Not;A Brand";v="99", "Chromium";v="99"`
    )
  ).toBe(true);
  expect(firstLoad.includes(`Accept-Language: de-DE`)).toBe(true);

  await page.reload();
  const secondLoad = await page.content();
  if (secondLoad.includes('sec-ch-ua-full-version')) {
    expect(secondLoad.includes('sec-ch-ua-mobile: ?0')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-full-version: "99.0.9999.99"')).toBe(
      true
    );
    expect(secondLoad.includes('sec-ch-ua-arch: "x86"')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-platform: "Mac OS X"')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-platform-version: "11_1_0"')).toBe(
      true
    );
    expect(secondLoad.includes('sec-ch-ua-model: ""')).toBe(true);
  }
});

test.skip('stealth: test if UA hints are correctly set - Android 10', async () => {
  const page = await _testUAHint(
    'Mozilla/5.0 (Linux; Android 10; SM-P205) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36',
    'nl-NL'
  );
  if (!page) {
    expect(true).toBe(true); // skip
    return;
  }
  const firstLoad = await page.content();
  expect(
    firstLoad.includes(
      `sec-ch-ua: "Google Chrome";v="99", " Not;A Brand";v="99", "Chromium";v="99"`
    )
  ).toBe(true);
  expect(firstLoad.includes(`Accept-Language: nl-NL`)).toBe(true);

  await page.reload();
  const secondLoad = await page.content();

  if (secondLoad.includes('sec-ch-ua-full-version')) {
    expect(secondLoad.includes('sec-ch-ua-mobile: ?1')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-full-version: "99.0.9999.99"')).toBe(
      true
    );
    expect(secondLoad.includes('sec-ch-ua-arch: ""')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-platform: "Android"')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-platform-version: "10"')).toBe(true);
    expect(secondLoad.includes('sec-ch-ua-model: "SM-P205"')).toBe(true);
  }
});

async function userAgentData() {
  if (!('userAgentData' in navigator)) {
    return undefined;
  }

  // https://wicg.github.io/ua-client-hints/#getHighEntropyValues
  const UADataProps = ['brands', 'mobile'];
  const UADataValues = [
    'architecture', // "arm"
    'bitness', // "64"
    'model', // "X644GTM"
    'platform', // "PhoneOS"
    'platformVersion', // "10A"
    'uaFullVersion', // "73.32.AGX.5"
  ];

  const highEntropy =
    await navigator.userAgentData.getHighEntropyValues(UADataValues);

  const result = {
    ...highEntropy,
    ...Object.fromEntries(
      UADataProps.map(k => [k, navigator.userAgentData[k]])
    ),
  };
  return result;
}

test.skip('stealth: test if UA hints are correctly set - Windows 10 Generic', async () => {
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36';
  const locale = 'en-AU';

  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      userAgent,
      locale,
    })
  );
  const browser = await puppeteer.launch({
    headless: true,
  });

  const majorVersion = parseInt(
    (await browser.version()).match(/\/([^.]+)/)[1],
    10
  );
  if (majorVersion < 90) {
    expect('foo').toBeTruthy();
    console.log('Skipping test, browser version too old', majorVersion);
    return;
  }
  const page = await browser.newPage();
  await page.goto('https://example.com'); // secure context

  const results = await page.evaluate(userAgentData);
  expect(results.platform).toBe('Windows');
  expect(results.platformVersion).toBe('10.0');
  expect(results.uaFullVersion).toBe('99.0.9999.99');

  const language = await page.evaluate(() => navigator.language);
  expect(language).toBe(locale);
});
