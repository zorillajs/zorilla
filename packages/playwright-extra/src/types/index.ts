import type * as pw from 'playwright-core';

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];
type PluginEnv = { framework: 'playwright' };

/** Strongly typed plugin lifecycle events for internal use */
export abstract class PluginLifecycleMethods {
  async onPluginRegistered(_env?: PluginEnv): Promise<void> {
    return;
  }
  async beforeLaunch(
    _options: pw.LaunchOptions
  ): Promise<pw.LaunchOptions | undefined> {
    return undefined;
  }
  async afterLaunch(_browserOrContext?: pw.Browser | pw.BrowserContext) {
    return;
  }
  async beforeConnect(
    _options: pw.ConnectOptions
  ): Promise<pw.ConnectOptions | undefined> {
    return undefined;
  }
  async afterConnect(_browser: pw.Browser) {
    return;
  }
  async onBrowser(_browser: pw.Browser) {
    return;
  }
  async onPageCreated(_page: pw.Page) {
    return;
  }
  async onPageClose(_page: pw.Page) {
    return;
  }
  async onDisconnected(_browser?: pw.Browser) {
    return;
  }
  // Playwright only at the moment
  async beforeContext(
    _options?: pw.BrowserContextOptions,
    _browser?: pw.Browser
  ): Promise<pw.BrowserContextOptions | undefined> {
    return undefined;
  }
  async onContextCreated(
    _context?: pw.BrowserContext,
    _options?: pw.BrowserContextOptions
  ) {
    return;
  }
}

/** A valid plugin method name */
export type PluginMethodName = keyof PluginLifecycleMethods;
/** A valid plugin method function */
export type PluginMethodFn<TName extends PluginMethodName> = PropType<
  PluginLifecycleMethods,
  TName
>;

type PluginRequirements = Set<
  'launch' | 'headful' | 'dataFromPlugins' | 'runLast'
>;

// PuppeteerExtraPlugin only supports Set, the others are future proofing
type PluginDependencies = Set<string> | Map<string, unknown> | string[];

interface PluginData {
  name:
    | string
    // below is compat with a previously incorrect typing
    | {
        [key: string]: unknown;
      };
  value: {
    [key: string]: unknown;
  };
}

export interface CompatiblePluginLifecycleMethods {
  onPluginRegistered(...args: unknown[]): Promise<unknown> | unknown;
  beforeLaunch(...args: unknown[]): Promise<unknown> | unknown;
  afterLaunch(...args: unknown[]): Promise<unknown> | unknown;
  beforeConnect(...args: unknown[]): Promise<unknown> | unknown;
  afterConnect(...args: unknown[]): Promise<unknown> | unknown;
  onBrowser(...args: unknown[]): Promise<unknown> | unknown;
  onPageCreated(...args: unknown[]): Promise<unknown> | unknown;
  onPageClose(...args: unknown[]): Promise<unknown> | unknown;
  onDisconnected(...args: unknown[]): Promise<unknown> | unknown;
  // Playwright only at the moment
  beforeContext(...args: unknown[]): Promise<unknown> | unknown;
  onContextCreated(...args: unknown[]): Promise<unknown> | unknown;
}

/**
 * PuppeteerExtraPlugin interface, strongly typed for internal use
 * @private
 */
export interface PuppeteerExtraPlugin extends Partial<PluginLifecycleMethods> {
  _isPuppeteerExtraPlugin: boolean;
  name: string;
  /** Disable the puppeteer compatibility shim for this plugin */
  noPuppeteerShim?: boolean;
  requirements?: PluginRequirements;
  dependencies?: PluginDependencies;
  data?: PluginData[];
  getDataFromPlugins?(name?: string): void;
  _registerChildClassMembers?(prototype: object): void;
  _childClassMembers?: string[];
  plugins?: CompatiblePlugin[];
}

/**
 * Minimal compatible PuppeteerExtraPlugin interface
 * @private
 */
export interface CompatiblePuppeteerPlugin
  extends Partial<CompatiblePluginLifecycleMethods> {
  _isPuppeteerExtraPlugin: boolean;
  name?: string;
}
// Future proofing
export interface CompatiblePlaywrightPlugin
  extends Partial<CompatiblePluginLifecycleMethods> {
  _isPlaywrightExtraPlugin: boolean;
  name?: string;
}
// Future proofing
export interface CompatibleExtraPlugin
  extends Partial<CompatiblePluginLifecycleMethods> {
  _isExtraPlugin: boolean;
  name?: string;
}

/**
 * A compatible plugin
 */
export type CompatiblePlugin =
  | CompatiblePuppeteerPlugin
  | CompatiblePlaywrightPlugin
  | CompatibleExtraPlugin;
export type CompatiblePluginModule = (...args: unknown[]) => CompatiblePlugin;

export type Plugin = PuppeteerExtraPlugin;
export type PluginModule = (...args: unknown[]) => Plugin;
