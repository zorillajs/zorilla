import { expect, test } from 'vitest';
import Plugin, {
  argsToIgnore,
} from '../../../src/evasions/defaultArgs/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  vanillaPuppeteer,
} from '../../util.js';

test('vanilla: uses args to ignore', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  const client =
    typeof page._client === 'function' ? page._client() : page._client;
  const { arguments: launchArgs } = await client.send(
    'Browser.getBrowserCommandLine'
  );
  const ok = argsToIgnore.every(arg => launchArgs.includes(arg));
  if (!ok) {
    console.log({ argsToIgnore, launchArgs });
  }
  expect(ok).toBe(true);
});

test('stealth: does not use args to ignore', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  const client =
    typeof page._client === 'function' ? page._client() : page._client;
  const { arguments: launchArgs } = await client.send(
    'Browser.getBrowserCommandLine'
  );
  const ok = argsToIgnore.every(arg => !launchArgs.includes(arg));
  if (!ok) {
    console.log({ argsToIgnore, launchArgs });
  }
  expect(ok).toBe(true);
});
