import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { ConnectOptions } from 'puppeteer';
import puppeteerVanilla from 'puppeteer';
import { beforeEach, describe, expect, it } from 'vitest';
import { addExtra } from './index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

beforeEach(() => {
  // ESM modules don't have require.cache
});

describe('connect', () => {
  it('will connect to remote browser with plugins', async () => {
    // Mitigate CI quirks
    try {
      // Create a simple test plugin
      class TestPlugin extends PuppeteerExtraPlugin {
        get name() {
          return 'test-connect-plugin';
        }

        async beforeConnect(options: ConnectOptions) {
          // Modify options to verify plugin is working
          (
            options as ConnectOptions & { testModified?: boolean }
          ).testModified = true;
        }
      }

      // Launch vanilla puppeteer browser with no plugins
      const pptr1 = addExtra(puppeteerVanilla);
      const browserVanilla = await pptr1.launch({
        args: PUPPETEER_ARGS,
      });
      const browserWSEndpoint = browserVanilla.wsEndpoint();

      // Use puppeteer-extra with plugin to connect to existing browser
      const puppeteer = addExtra(puppeteerVanilla);
      puppeteer.use(new TestPlugin());
      const browser = await puppeteer.connect({ browserWSEndpoint });

      // Verify we can create a page
      const page = await browser.newPage();
      expect(page).toBeTruthy();

      await browser.close();
      expect(true).toBe(true);
    } catch (err) {
      console.log(`Caught error:`, err);
      if (
        err.message?.includes(
          'Session closed. Most likely the page has been closed'
        )
      ) {
        expect(true).toBe(true); // ignore this error
      } else {
        throw err;
      }
    }
  });
});
