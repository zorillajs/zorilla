import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { Page } from '@zorilla/puppeteer-extra-plugin/dist/puppeteer';
import withUtils from '../_utils/withUtils.js';

/**
 * Mock the `chrome.app` object if not available (e.g. when running headless).
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/chrome.app';
  }

  override async onPageCreated(page: Page): Promise<void> {
    await withUtils(page).evaluateOnNewDocument(utils => {
      if (!window.chrome) {
        // Use the exact property descriptor found in headful Chrome
        // fetch it via `Object.getOwnPropertyDescriptor(window, 'chrome')`
        Object.defineProperty(window, 'chrome', {
          writable: true,
          enumerable: true,
          configurable: false, // note!
          value: {}, // We'll extend that later
        });
      }

      // That means we're running headful and don't need to mock anything
      if ('app' in window.chrome!) {
        return; // Nothing to do here
      }

      const makeError = {
        ErrorInInvocation: (fn: string) => {
          const err = new TypeError(`Error in invocation of app.${fn}()`);
          return utils.stripErrorWithAnchor(
            err,
            `at ${fn} (eval at <anonymous>`
          );
        },
      };

      // There's a some static data in that property which doesn't seem to change,
      // we should periodically check for updates: `JSON.stringify(window.app, null, 2)`
      const STATIC_DATA = JSON.parse(
        `
{
  "isInstalled": false,
  "InstallState": {
    "DISABLED": "disabled",
    "INSTALLED": "installed",
    "NOT_INSTALLED": "not_installed"
  },
  "RunningState": {
    "CANNOT_RUN": "cannot_run",
    "READY_TO_RUN": "ready_to_run",
    "RUNNING": "running"
  }
}
        `.trim()
      );

      window.chrome!.app = {
        ...STATIC_DATA,

        get isInstalled() {
          return false;
        },

        getDetails: function getDetails() {
          if (arguments.length) {
            throw makeError.ErrorInInvocation(`getDetails`);
          }
          return null;
        },
        getIsInstalled: function getIsInstalled() {
          if (arguments.length) {
            throw makeError.ErrorInInvocation(`getIsInstalled`);
          }
          return false;
        },
        runningState: function runningState() {
          if (arguments.length) {
            throw makeError.ErrorInInvocation(`runningState`);
          }
          return 'cannot_run';
        },
      };
      utils.patchToStringNested(window.chrome!.app as object);
    });
  }
}

export default function (pluginConfig?: Record<string, unknown>): Plugin {
  return new Plugin(pluginConfig);
}
