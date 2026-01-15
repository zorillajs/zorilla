/// <reference path="./puppeteer-legacy.d.ts" />

import { createRequire } from 'node:module';
import Debug from 'debug';
import type { Browser, Page, PuppeteerNode } from 'puppeteer';

const debug = Debug('puppeteer-extra');

import merge from 'deepmerge';

const require = createRequire(import.meta.url);

/**
 * Original Puppeteer API
 * @private
 */
export interface VanillaPuppeteer
  extends Pick<
    PuppeteerNode,
    | 'connect'
    | 'defaultArgs'
    | 'executablePath'
    | 'launch'
    | 'createBrowserFetcher'
  > {}

/**
 * Minimal plugin interface
 * @private
 */
export interface PuppeteerExtraPlugin {
  _isPuppeteerExtraPlugin: boolean;
  name?: string;
  requirements?: Set<string>;
  data?: unknown;
  _register?: (prototype: object) => void;
  _getMissingDependencies?: (plugins: PuppeteerExtraPlugin[]) => Set<string>;
  [propName: string]: unknown;
}

/**
 * We need to hook into non-public APIs in rare occasions to fix puppeteer bugs. :(
 * @private
 */
interface BrowserInternals extends Browser {
  _createPageInContext(contextId?: string): Promise<Page>;
}

/**
 * Options passed to plugins during browser lifecycle events
 * @private
 */
interface BrowserLaunchContext {
  context?: 'launch' | 'connect';
  options?:
    | Parameters<VanillaPuppeteer['launch']>[0]
    | Parameters<VanillaPuppeteer['connect']>[0];
  defaultArgs?:
    | string[]
    | ReturnType<VanillaPuppeteer['defaultArgs']>
    | ((options?: Parameters<VanillaPuppeteer['defaultArgs']>[0]) => string[]);
}

/**
 * Modular plugin framework to teach `puppeteer` new tricks.
 *
 * This module acts as a drop-in replacement for `puppeteer`.
 *
 * Allows PuppeteerExtraPlugin's to register themselves and
 * to extend puppeteer with additional functionality.
 *
 * @class PuppeteerExtra
 * @implements {VanillaPuppeteer}
 *
 * @example
 * const puppeteer = require('@zorilla/puppeteer-extra')
 * puppeteer.use(require('@zorilla/puppeteer-extra-plugin-anonymize-ua')())
 * puppeteer.use(require('@zorilla/puppeteer-extra-plugin-font-size')({defaultFontSize: 18}))
 *
 * ;(async () => {
 *   const browser = await puppeteer.launch({headless: false})
 *   const page = await browser.newPage()
 *   await page.goto('http://example.com', {waitUntil: 'domcontentloaded'})
 *   await browser.close()
 * })()
 */
export class PuppeteerExtra implements VanillaPuppeteer {
  private _plugins: PuppeteerExtraPlugin[] = [];

  constructor(
    private _pptr?: VanillaPuppeteer,
    private _requireError?: Error
  ) {}

  /**
   * The **main interface** to register `puppeteer-extra` plugins.
   *
   * @example
   * puppeteer.use(plugin1).use(plugin2)
   *
   * @see [PuppeteerExtraPlugin]
   *
   * @return The same `PuppeteerExtra` instance (for optional chaining)
   */
  use(plugin: PuppeteerExtraPlugin): this {
    if (typeof plugin !== 'object' || !plugin._isPuppeteerExtraPlugin) {
      console.error(
        `Warning: Plugin is not derived from PuppeteerExtraPlugin, ignoring.`,
        plugin
      );
      return this;
    }
    if (!plugin.name) {
      console.error(
        `Warning: Plugin with no name registering, ignoring.`,
        plugin
      );
      return this;
    }
    if (plugin.requirements?.has('dataFromPlugins')) {
      plugin.getDataFromPlugins = this.getPluginData.bind(this);
    }
    plugin._register?.(Object.getPrototypeOf(plugin));
    this._plugins.push(plugin);
    debug('plugin registered', plugin.name);
    return this;
  }

  /**
   * To stay backwards compatible with puppeteer's (and our) default export after adding `addExtra`
   * we need to defer the check if we have a puppeteer instance to work with.
   * Otherwise we would throw even if the user intends to use their non-standard puppeteer implementation.
   *
   * @private
   */
  get pptr(): VanillaPuppeteer {
    if (this._pptr) {
      return this._pptr;
    }

    // Whoopsie
    console.warn(`
    Puppeteer is missing. :-)

    Note: puppeteer is a peer dependency of puppeteer-extra,
    which means you can install your own preferred version.

    - To get the latest stable version run: 'npm i puppeteer'

    Alternatively:
    - To get puppeteer without the bundled Chromium browser install 'puppeteer-core'
    `);
    throw this._requireError || new Error('No puppeteer instance provided.');
  }

  /**
   * The method launches a browser instance with given arguments. The browser will be closed when the parent node.js process is closed.
   *
   * Augments the original `puppeteer.launch` method with plugin lifecycle methods.
   *
   * All registered plugins that have a `beforeLaunch` method will be called
   * in sequence to potentially update the `options` Object before launching the browser.
   *
   * @example
   * const browser = await puppeteer.launch({
   *   headless: false,
   *   defaultViewport: null
   * })
   *
   * @param options - See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions).
   */
  async launch(
    options?: Parameters<VanillaPuppeteer['launch']>[0]
  ): ReturnType<VanillaPuppeteer['launch']> {
    // Ensure there are certain properties (e.g. the `options.args` array)
    const defaultLaunchOptions = { args: [] };
    options = merge(defaultLaunchOptions, options || {}) as Parameters<
      VanillaPuppeteer['launch']
    >[0];
    await this.resolvePluginDependencies();
    this.orderPlugins();

    // Give plugins the chance to modify the options before launch
    options = (await this.callPluginsWithValue(
      'beforeLaunch',
      options
    )) as Parameters<VanillaPuppeteer['launch']>[0];

    const opts: BrowserLaunchContext = {
      context: 'launch' as const,
      options,
      defaultArgs: this.defaultArgs,
    };

    // Let's check requirements after plugin had the chance to modify the options
    this.checkPluginRequirements(opts);

    const browser = await this.pptr.launch(options);
    this._patchPageCreationMethods(browser as BrowserInternals);

    await this.callPlugins('_bindBrowserEvents', browser, opts);
    return browser;
  }

  /**
   * Attach Puppeteer to an existing Chromium instance.
   *
   * Augments the original `puppeteer.connect` method with plugin lifecycle methods.
   *
   * All registered plugins that have a `beforeConnect` method will be called
   * in sequence to potentially update the `options` Object before launching the browser.
   *
   * @param options - See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerconnectoptions).
   */
  async connect(
    options: Parameters<VanillaPuppeteer['connect']>[0]
  ): ReturnType<VanillaPuppeteer['connect']> {
    await this.resolvePluginDependencies();
    this.orderPlugins();

    // Give plugins the chance to modify the options before connect
    options = (await this.callPluginsWithValue(
      'beforeConnect',
      options
    )) as Parameters<VanillaPuppeteer['connect']>[0];

    const opts: BrowserLaunchContext = {
      context: 'connect' as const,
      options,
    };

    // Let's check requirements after plugin had the chance to modify the options
    this.checkPluginRequirements(opts);

    const browser = await this.pptr.connect(options);
    this._patchPageCreationMethods(browser as BrowserInternals);

    await this.callPlugins('_bindBrowserEvents', browser, opts);
    return browser;
  }

  /**
   * The default flags that Chromium will be launched with.
   *
   * @param options - See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteerdefaultargsoptions).
   */
  defaultArgs(
    options?: Parameters<VanillaPuppeteer['defaultArgs']>[0]
  ): ReturnType<VanillaPuppeteer['defaultArgs']> {
    return this.pptr.defaultArgs(options);
  }

  /** Path where Puppeteer expects to find bundled Chromium. */
  executablePath(): string {
    return this.pptr.executablePath();
  }

  /**
   * This methods attaches Puppeteer to an existing Chromium instance.
   *
   * @param options - See [puppeteer docs](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteercreatebrowserfetcheroptions).
   */
  createBrowserFetcher(
    options: Parameters<VanillaPuppeteer['createBrowserFetcher']>[0]
  ): ReturnType<VanillaPuppeteer['createBrowserFetcher']> {
    return this.pptr.createBrowserFetcher(options);
  }

  /**
   * Patch page creation methods (both regular and incognito contexts).
   *
   * Unfortunately it's possible that the `targetcreated` events are not triggered
   * early enough for listeners (e.g. plugins using `onPageCreated`) to be able to
   * modify the page instance (e.g. user-agent) before the browser request occurs.
   *
   * This only affects the first request of a newly created page target.
   *
   * As a workaround I've noticed that navigating to `about:blank` (again),
   * right after a page has been created reliably fixes this issue and adds
   * no noticable delay or side-effects.
   *
   * This problem is not specific to `puppeteer-extra` but default Puppeteer behaviour.
   *
   * Note: This patch only fixes explicitly created pages, implicitly created ones
   * (e.g. through `window.open`) are still subject to this issue. I didn't find a
   * reliable mitigation for implicitly created pages yet.
   *
   * Puppeteer issues:
   * https://github.com/GoogleChrome/puppeteer/issues/2669
   * https://github.com/puppeteer/puppeteer/issues/3667
   * https://github.com/GoogleChrome/puppeteer/issues/386#issuecomment-343059315
   * https://github.com/GoogleChrome/puppeteer/issues/1378#issue-273733905
   *
   * @private
   */
  private _patchPageCreationMethods(browser: BrowserInternals) {
    if (!browser._createPageInContext) {
      debug(
        'warning: _patchPageCreationMethods failed (no browser._createPageInContext)'
      );
      return;
    }
    browser._createPageInContext = (
      (originalMethod, context) => async (contextId?: string) => {
        const page = await originalMethod.call(context, contextId);
        await page.goto('about:blank');
        return page;
      }
    )(browser._createPageInContext, browser);
  }

  /**
   * Get a list of all registered plugins.
   *
   * @member {Array<PuppeteerExtraPlugin>}
   */
  get plugins() {
    return this._plugins;
  }

  /**
   * Get the names of all registered plugins.
   *
   * @member {Array<string>}
   * @private
   */
  get pluginNames() {
    return this._plugins.map(p => p.name);
  }

  /**
   * Collects the exposed `data` property of all registered plugins.
   * Will be reduced/flattened to a single array.
   *
   * Can be accessed by plugins that listed the `dataFromPlugins` requirement.
   *
   * Implemented mainly for plugins that need data from other plugins (e.g. `user-preferences`).
   *
   * @see [PuppeteerExtraPlugin]/data
   * @param name - Filter data by optional plugin name
   *
   * @private
   */
  public getPluginData(name?: string) {
    const data = this._plugins
      .map(p => (Array.isArray(p.data) ? p.data : [p.data]))
      .reduce((acc, arr) => acc.concat(arr), []);
    return name ? data.filter((d: { name?: string }) => d.name === name) : data;
  }

  /**
   * Get all plugins that feature a given property/class method.
   *
   * @private
   */
  private getPluginsByProp(prop: string): PuppeteerExtraPlugin[] {
    return this._plugins.filter(plugin => prop in plugin);
  }

  /**
   * Lightweight plugin dependency management to require plugins and code mods on demand.
   *
   * This uses the `dependencies` stanza (a `Set`) exposed by `puppeteer-extra` plugins.
   *
   * @todo Allow objects as depdencies that contains opts for the requested plugin.
   *
   * @private
   */
  private async resolvePluginDependencies() {
    // Request missing dependencies from all plugins and flatten to a single Set
    const missingPlugins = this._plugins
      .map(p => p._getMissingDependencies?.(this._plugins) || new Set<string>())
      .reduce((combined, list) => {
        for (const item of list) {
          combined.add(item);
        }
        return combined;
      }, new Set<string>());
    if (!missingPlugins.size) {
      debug('no dependencies are missing');
      return;
    }
    debug('dependencies missing', missingPlugins);
    // Loop through all dependencies declared missing by plugins
    for (let name of [...missingPlugins]) {
      // Check if the dependency hasn't been registered as plugin already.
      // This might happen when multiple plugins have nested dependencies.
      if (this.pluginNames.includes(name)) {
        debug(
          `ignoring dependency '${name}', which has been required already.`
        );
        continue;
      }
      // We follow a plugin naming convention, but let's rather enforce it <3
      // Handle both scoped (@scope/puppeteer-extra-plugin-*) and unscoped (puppeteer-extra-plugin-*) packages
      const hasPluginPrefix = name.includes('puppeteer-extra-plugin');
      if (!hasPluginPrefix) {
        name = `@zorilla/puppeteer-extra-plugin-${name}`;
      }
      // In case a module sub resource is requested print out the main package name
      // e.g. puppeteer-extra-plugin-stealth/evasions/console.debug => puppeteer-extra-plugin-stealth
      // For scoped packages: @zorilla/puppeteer-extra-plugin-foo/bar => @zorilla/puppeteer-extra-plugin-foo
      const parts = name.split('/');
      const packageName = name.startsWith('@')
        ? `${parts[0]}/${parts[1]}`
        : parts[0];
      let dep = null;
      try {
        // Use dynamic import to load the plugin
        const module = await import(name);
        dep = (module.default || module)();
        // Register it with `puppeteer-extra` as plugin
        this.use(dep);
      } catch (err) {
        console.warn(`
          A plugin listed '${name}' as dependency,
          which is currently missing. Please install it:

          npm install ${packageName}

          Note: You don't need to require the plugin yourself,
          unless you want to modify it's default settings.
          `);
        throw err;
      }
      // Handle nested dependencies :D
      if (dep.dependencies.size) {
        await this.resolvePluginDependencies();
      }
    }
  }

  /**
   * Order plugins that have expressed a special placement requirement.
   *
   * This is useful/necessary for e.g. plugins that depend on the data from other plugins.
   *
   * @todo Support more than 'runLast'.
   * @todo If there are multiple plugins defining 'runLast', sort them depending on who depends on whom. :D
   *
   * @private
   */
  private orderPlugins() {
    debug('orderPlugins:before', this.pluginNames);
    const runLast = this._plugins
      .filter(p => p.requirements?.has('runLast'))
      .map(p => p.name);
    for (const name of runLast) {
      const index = this._plugins.findIndex(p => p.name === name);
      if (index !== -1) {
        const plugin = this._plugins.splice(index, 1)[0];
        if (plugin) {
          this._plugins.push(plugin);
        }
      }
    }
    debug('orderPlugins:after', this.pluginNames);
  }

  /**
   * Lightweight plugin requirement checking.
   *
   * The main intent is to notify the user when a plugin won't work as expected.
   *
   * @todo This could be improved, e.g. be evaluated by the plugin base class.
   *
   * @private
   */
  private checkPluginRequirements(opts: BrowserLaunchContext = {}) {
    for (const plugin of this._plugins) {
      if (!plugin.requirements) continue;
      for (const requirement of plugin.requirements) {
        if (
          opts.context === 'launch' &&
          requirement === 'headful' &&
          opts.options &&
          'headless' in opts.options &&
          opts.options.headless
        ) {
          console.warn(
            `Warning: Plugin '${plugin.name}' is not supported in headless mode.`
          );
        }
        if (opts.context === 'connect' && requirement === 'launch') {
          console.warn(
            `Warning: Plugin '${plugin.name}' doesn't support puppeteer.connect().`
          );
        }
      }
    }
  }

  /**
   * Call plugins sequentially with the same values.
   * Plugins that expose the supplied property will be called.
   *
   * @param prop - The plugin property to call
   * @param values - Any number of values
   * @private
   */
  private async callPlugins(prop: string, ...values: unknown[]) {
    for (const plugin of this.getPluginsByProp(prop)) {
      const method = plugin[prop];
      if (typeof method === 'function') {
        await method.apply(plugin, values);
      }
    }
  }

  /**
   * Call plugins sequentially and pass on a value (waterfall style).
   * Plugins that expose the supplied property will be called.
   *
   * The plugins can either modify the value or return an updated one.
   * Will return the latest, updated value which ran through all plugins.
   *
   * @param prop - The plugin property to call
   * @param value - Any value
   * @return The new updated value
   * @private
   */
  private async callPluginsWithValue(prop: string, value: unknown) {
    for (const plugin of this.getPluginsByProp(prop)) {
      const method = plugin[prop];
      if (typeof method === 'function') {
        const newValue = await method.call(plugin, value);
        if (newValue) {
          value = newValue;
        }
      }
    }
    return value;
  }
}

/**
 * The **default export** will behave exactly the same as the regular puppeteer
 * (just with extra plugin functionality) and can be used as a drop-in replacement.
 *
 * Behind the scenes it will try to require either `puppeteer`
 * or [`puppeteer-core`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#puppeteer-vs-puppeteer-core)
 * from the installed dependencies.
 *
 * @example
 * // javascript import
 * const puppeteer = require('@zorilla/puppeteer-extra')
 *
 * // typescript/es6 module import
 * import puppeteer from '@zorilla/puppeteer-extra'
 *
 * // Add plugins
 * puppeteer.use(...)
 */
const defaultExport: PuppeteerExtra = (() => {
  return new PuppeteerExtra(...requireVanillaPuppeteer());
})();

export default defaultExport;

/**
 * An **alternative way** to use `puppeteer-extra`: Augments the provided puppeteer with extra plugin functionality.
 *
 * This is useful in case you need multiple puppeteer instances with different plugins or to add plugins to a non-standard puppeteer package.
 *
 * @example
 * // js import
 * const { addExtra } = require('@zorilla/puppeteer-extra')
 *
 * // ts/es6 import
 * import { addExtra } from '@zorilla/puppeteer-extra'
 *
 * // Patch e.g. puppeteer-firefox and add plugins
 * const puppeteer = addExtra(require('puppeteer-firefox'))
 * puppeteer.use(...)
 *
 * @param puppeteer Any puppeteer API-compatible puppeteer implementation or version.
 * @return A fresh PuppeteerExtra instance using the provided puppeteer
 */
export const addExtra = (puppeteer: VanillaPuppeteer): PuppeteerExtra =>
  new PuppeteerExtra(puppeteer);

/**
 * Attempt to require puppeteer or puppeteer-core from dependencies.
 * To stay backwards compatible with the existing default export we have to do some gymnastics here.
 *
 * @return Either a Puppeteer instance or an Error, which we'll throw later if need be.
 * @private
 */
function requireVanillaPuppeteer(): [VanillaPuppeteer?, Error?] {
  try {
    return [require('puppeteer'), undefined];
  } catch (_) {
    // noop
  }
  try {
    return [require('puppeteer-core'), undefined];
  } catch (err) {
    return [undefined, err as Error];
  }
}
