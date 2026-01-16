import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { Page } from '@zorilla/puppeteer-extra-plugin/dist/puppeteer';
import withUtils from '../_utils/withUtils.js';

/**
 * Set the hardwareConcurrency to 4 (optionally configurable with `hardwareConcurrency`)
 *
 * @see https://arh.antoinevastel.com/reports/stats/osName_hardwareConcurrency_report.html
 *
 * @param {Object} [opts] - Options
 * @param {number} [opts.hardwareConcurrency] - The value to use in `navigator.hardwareConcurrency` (default: `4`)
 */

class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/navigator.hardwareConcurrency';
  }

  override get defaults(): Record<string, unknown> {
    return {
      hardwareConcurrency: 4,
    };
  }

  override async onPageCreated(page: Page): Promise<void> {
    await withUtils(page).evaluateOnNewDocument(
      (utils, { opts }) => {
        utils.replaceGetterWithProxy(
          Object.getPrototypeOf(navigator),
          'hardwareConcurrency',
          utils.makeHandler().getterValue(opts.hardwareConcurrency)
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
