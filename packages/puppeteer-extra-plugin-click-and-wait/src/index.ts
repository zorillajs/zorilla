import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type {
  ClickOptions,
  HTTPResponse,
  Page,
  WaitForOptions,
} from 'puppeteer';

/**
 * Convenience function to wait for navigation to complete after clicking on an element.
 *
 * Adds a new `page.clickAndWaitForNavigation(selector, clickOptions, waitOptions)` method.
 *
 * See this issue for more context: https://github.com/GoogleChrome/puppeteer/issues/1421
 *
 * > Note: Be wary of ajax powered pages where the navigation event is not triggered.
 *
 * @example
 * await page.clickAndWaitForNavigation('input#submitData')
 *
 * // as opposed to:
 *
 * await Promise.all([
 *   page.waitForNavigation(waitOptions),
 *   page.click('input#submitData', clickOptions),
 * ])
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts);
  }

  override get name(): string {
    return 'click-and-wait';
  }

  async clickAndWaitForNavigation(
    this: Page,
    selector: string,
    clickOptions?: ClickOptions,
    waitOptions?: WaitForOptions
  ): Promise<HTTPResponse | null> {
    return Promise.all([
      this.waitForNavigation(waitOptions),
      this.click(selector, clickOptions),
    ]).then(values => {
      return values[0];
    });
  }

  override async onPageCreated(page: Page): Promise<void> {
    (page as Page & Record<string, unknown>).clickAndWaitForNavigation =
      this.clickAndWaitForNavigation.bind(page);
  }
}

export default function (pluginConfig?: Record<string, unknown>): Plugin {
  return new Plugin(pluginConfig);
}
