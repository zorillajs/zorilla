import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/chrome.app/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  vanillaPuppeteer,
} from '../../util';

/* global chrome */

test('stealth: will add convincing chrome.app object', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin({}));
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const results = await page.evaluate(() => {
    type ChromeApp = {
      getDetails: () => null;
      getIsInstalled: () => boolean;
      runningState: () => string;
      InstallState: Record<string, string>;
      RunningState: Record<string, string>;
      toString: () => string;
    };
    type ErrorResult = {
      name: string;
      message: string;
      stack: string;
    };
    const chromeApp = (window.chrome as { app: ChromeApp }).app;

    const catchErr = (
      fn: (...args: unknown[]) => unknown,
      ...args: unknown[]
    ): ErrorResult => {
      try {
        fn(...args);
        return { name: '', message: '', stack: '' };
      } catch ({ name, message, stack }) {
        return {
          name: String(name),
          message: String(message),
          stack: String(stack),
        };
      }
    };

    return {
      app: {
        exists: window.chrome && 'app' in window.chrome,
        toString: chromeApp.toString(),
        deepToString: chromeApp.getDetails.toString(),
      },
      data: {
        getIsInstalled: chromeApp.getIsInstalled(),
        runningState: chromeApp.runningState(),
        getDetails: chromeApp.getDetails(),
        InstallState: chromeApp.InstallState,
        RunningState: chromeApp.RunningState,
      },
      errors: {
        getIsInstalled: catchErr(chromeApp.getIsInstalled, 'foo').message,
        stackOK: !catchErr(chromeApp.getIsInstalled, 'foo').stack.includes(
          'at getIsInstalled'
        ),
      },
    };
  });

  expect(results).toEqual({
    app: {
      exists: true,
      toString: '[object Object]',
      deepToString: 'function getDetails() { [native code] }',
    },
    data: {
      InstallState: {
        DISABLED: 'disabled',
        INSTALLED: 'installed',
        NOT_INSTALLED: 'not_installed',
      },
      RunningState: {
        CANNOT_RUN: 'cannot_run',
        READY_TO_RUN: 'ready_to_run',
        RUNNING: 'running',
      },
      getDetails: null,
      getIsInstalled: false,
      runningState: 'cannot_run',
    },
    errors: {
      getIsInstalled: 'Error in invocation of app.getIsInstalled(): ',
      stackOK: true,
    },
  });
});
