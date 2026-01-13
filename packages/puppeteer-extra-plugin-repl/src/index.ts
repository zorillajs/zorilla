import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { Page } from 'puppeteer';
import REPLSession from './lib/REPLSession.js';

interface PluginOptions {
  addToPuppeteerClass?: boolean;
  [key: string]: unknown;
}

/**
 * Interrupt your puppeteer code with an interactive REPL.
 *
 * Features tab auto-completion for the given object properties and a colorized prompt.
 *
 * Works with arbitrary objects ands class instances, though `Page` & `Browser` make the most sense. :-)
 *
 * **opts**
 * @param {Object} opts - Options
 * @param {boolean} [opts.addToPuppeteerClass] - If a `.repl()` method should be attached to Puppeteer `Page` and `Browser` instances (default: true).
 *
 * @todo enumerate instance members differently, so e.g. clickAndWaitForNavigation shows up.
 *
 * @example
 * // In this example we don't extend the native puppeteer classes
 *
 * import puppeteer from '@zorilla/puppeteer-extra'
 * import replPlugin from '@zorilla/puppeteer-extra-plugin-repl'
 * const repl = replPlugin({ addToPuppeteerClass: false })
 * puppeteer.use(repl)
 *
 * puppeteer.launch({ headless: true }).then(async browser => {
 *   const page = await browser.newPage()
 *   await page.goto('https://example.com')
 *
 *   // Start an interactive REPL here with the `page` instance.
 *   await repl.repl(page)
 *   // Afterwards start REPL with the `repl` instance itself. 🐴
 *   await repl.repl(repl)
 *
 *   await browser.close()
 * })
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: PluginOptions = {}) {
    super(opts);
  }

  override get name(): string {
    return 'repl';
  }

  override get defaults(): PluginOptions {
    return { addToPuppeteerClass: true };
  }

  /**
   * Run last so other plugins can extend e.g. Page :-)
   *
   * @ignore
   */
  override get requirements() {
    return new Set<'runLast'>(['runLast']);
  }

  /**
   * Create an interactive REPL for the provided object.
   *
   * Uses an extended (colorized) readline interface under the hood.
   * Will resolve the returned Promise when the readline interface is closed.
   *
   * If `opts.addToPuppeteerClass` is true (default) then `page.repl()`/`browser.repl()`
   * will point to this method, for convenience.
   *
   * Can be used standalone as well, to inspect an arbitrary class instance or object.
   *
   * @param  {Object} obj - An object or class instance to use in the repl (e.g. `page`, `browser`)
   * @return {Promise}
   *
   * @example
   * import replPlugin from '@zorilla/puppeteer-extra-plugin-repl'
   * const repl = replPlugin()
   * await repl.repl(<object or class instance to inspect>)
   */
  // biome-ignore lint/suspicious/noExplicitAny: REPL needs to accept any object type
  async repl(obj: any): Promise<void> {
    return new REPLSession({ obj }).start();
  }

  /**
   * Conditionally add a .repl() method to `page` and `browser` instances.
   *
   * @ignore
   */
  override async onPageCreated(page: Page): Promise<void> {
    if (!this.opts.addToPuppeteerClass) {
      return;
    }
    // biome-ignore lint/suspicious/noExplicitAny: Adding method to Puppeteer class
    (page as any).repl = () => this.repl(page);
    const browser = page.browser();
    // biome-ignore lint/suspicious/noExplicitAny: Adding method to Puppeteer class
    (browser as any).repl = () => this.repl(browser);
  }
}

export default (pluginConfig?: PluginOptions): Plugin =>
  new Plugin(pluginConfig);
