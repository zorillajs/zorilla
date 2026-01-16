import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { Page } from '@zorilla/puppeteer-extra-plugin/dist/puppeteer';
import withUtils from '../_utils/withUtils.js';

/**
 * Pass the Languages Test. Allows setting custom languages.
 *
 * @param {Object} [opts] - Options
 * @param {Array<string>} [opts.languages] - The languages to use (default: `['en-US', 'en']`)
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/navigator.languages';
  }

  override get defaults(): Record<string, unknown> {
    return {
      languages: [], // Empty default, otherwise this would be merged with user defined array override
    };
  }

  override async onPageCreated(page: Page): Promise<void> {
    await withUtils(page).evaluateOnNewDocument(
      (utils, { opts }) => {
        const languages = (opts.languages as string[]).length
          ? (opts.languages as string[])
          : ['en-US', 'en'];
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'languages',
          utils
            .makeHandler()
            .getterValue(Object.freeze([...(languages as string[])]))
        );
      },
      {
        opts: this.opts,
      }
    );
  }
}

export default function (pluginConfig?: Record<string, unknown>): Plugin {
  return new Plugin(pluginConfig);
}
