import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type {
  LaunchOptions,
  Page,
} from '@zorilla/puppeteer-extra-plugin/dist/puppeteer';

/**
 * Fix missing window.outerWidth/window.outerHeight in headless mode
 * Will also set the viewport to match window size, unless specified by user
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/window.outerdimensions';
  }

  override async onPageCreated(page: Page): Promise<void> {
    // Chrome returns undefined, Firefox false
    await page.evaluateOnNewDocument(() => {
      try {
        if (window.outerWidth && window.outerHeight) {
          return; // nothing to do here
        }
        const windowFrame = 85; // probably OS and WM dependent
        window.outerWidth = window.innerWidth;
        window.outerHeight = window.innerHeight + windowFrame;
      } catch (_err) {}
    });
  }

  override async beforeLaunch(options: LaunchOptions): Promise<void> {
    // Have viewport match window size, unless specified by user
    // https://github.com/GoogleChrome/puppeteer/issues/3688
    if (!('defaultViewport' in options)) {
      options.defaultViewport = null;
    }
  }
}

export default function (pluginConfig?: Record<string, unknown>): Plugin {
  return new Plugin(pluginConfig);
}
