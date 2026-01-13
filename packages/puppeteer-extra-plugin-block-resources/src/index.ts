import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { HTTPRequest } from 'puppeteer';

// Extended request type for checking Cooperative Intercept Mode features
// We use a separate type rather than extending to avoid type conflicts
type HTTPRequestWithCooperativeMode = HTTPRequest & {
  abortErrorReason?: unknown;
  continueRequestOverrides?: () => unknown;
};

// Minimal Page interface that works across puppeteer versions
interface MinimalPage {
  setRequestInterception(value: boolean): Promise<void>;
  // biome-ignore lint/suspicious/noExplicitAny: Required for cross-version compatibility with puppeteer types
  on(event: string, handler: (...args: any[]) => void): void;
}

type ResourceType =
  | 'document'
  | 'stylesheet'
  | 'image'
  | 'media'
  | 'font'
  | 'script'
  | 'texttrack'
  | 'xhr'
  | 'fetch'
  | 'eventsource'
  | 'websocket'
  | 'manifest'
  | 'other';

interface PluginOptions {
  availableTypes?: Set<ResourceType>;
  blockedTypes?: Set<ResourceType>;
  interceptResolutionPriority?: number;
  [key: string]: unknown;
}

/**
 * Block resources (images, media, css, etc.) in puppeteer.
 *
 * Supports all resource types, blocking can be toggled dynamically.
 *
 * @param {Object} opts - Options
 * @param {Set<string>} [opts.blockedTypes] - Specify which resourceTypes to block (by default none)
 *
 * @example
 * import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer'
 * import blockResourcesPlugin from '@zorilla/puppeteer-extra-plugin-block-resources'
 * puppeteer.use(blockResourcesPlugin({
 *   blockedTypes: new Set(['image', 'stylesheet']),
 *   // Optionally enable Cooperative Mode for several request interceptors
 *   interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
 * }))
 *
 * //
 * // and/or dynamically:
 * //
 *
 * const plugin = blockResourcesPlugin()
 * puppeteer.use(plugin)
 *
 * const browser = await puppeteer.launch({ headless: false })
 * const page = await browser.newPage()
 *
 * plugin.blockedTypes.add('image')
 * await page.goto('http://www.msn.com/', {waitUntil: 'domcontentloaded'})
 *
 * plugin.blockedTypes.add('stylesheet')
 * plugin.blockedTypes.add('other') // e.g. favicon
 * await page.goto('http://news.ycombinator.com', {waitUntil: 'domcontentloaded'})
 *
 * plugin.blockedTypes.delete('stylesheet')
 * plugin.blockedTypes.delete('other')
 * plugin.blockedTypes.add('media')
 * plugin.blockedTypes.add('script')
 * await page.goto('http://www.youtube.com', {waitUntil: 'domcontentloaded'})
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: PluginOptions = {}) {
    super(opts);
  }

  override get name(): string {
    return 'block-resources';
  }

  override get defaults(): Required<
    Omit<PluginOptions, 'interceptResolutionPriority'>
  > &
    Pick<PluginOptions, 'interceptResolutionPriority'> {
    return {
      availableTypes: new Set<ResourceType>([
        'document',
        'stylesheet',
        'image',
        'media',
        'font',
        'script',
        'texttrack',
        'xhr',
        'fetch',
        'eventsource',
        'websocket',
        'manifest',
        'other',
      ]),
      // Block nothing by default
      blockedTypes: new Set<ResourceType>([]),
      interceptResolutionPriority: undefined,
    };
  }

  /**
   * Get all available resource types.
   *
   * Resource type will be one of the following: `document`, `stylesheet`, `image`, `media`, `font`, `script`, `texttrack`, `xhr`, `fetch`, `eventsource`, `websocket`, `manifest`, `other`.
   *
   * @type {Set<string>} - A Set of all available resource types.
   */
  get availableTypes(): Set<ResourceType> {
    const defaults = this.defaults as Required<
      Omit<PluginOptions, 'interceptResolutionPriority'>
    > &
      Pick<PluginOptions, 'interceptResolutionPriority'>;
    return defaults.availableTypes as Set<ResourceType>;
  }

  /**
   * Get all blocked resource types.
   *
   * Blocked resource types can be configured either through `opts` or by modifying this property.
   *
   * @type {Set<string>} - A Set of all blocked resource types.
   */
  get blockedTypes(): Set<ResourceType> {
    return (this.opts as PluginOptions).blockedTypes!;
  }

  /**
   * Get the request interception resolution priority.
   *
   * Priority for Cooperative Intercept Mode can be configured either through `opts` or by modifying this property.
   *
   * @type {number} - A number for the request interception resolution priority.
   */
  get interceptResolutionPriority(): number | undefined {
    return (this.opts as PluginOptions).interceptResolutionPriority;
  }

  /**
   * @private
   */
  onRequest(request: HTTPRequest): void | Promise<void> {
    const type = request.resourceType() as ResourceType;
    const shouldBlock = this.blockedTypes.has(type);

    // In Cooperative Intercept Mode, check if request is already handled
    // In non-Cooperative mode, isInterceptResolutionHandled won't exist
    const alreadyHandled = request.isInterceptResolutionHandled
      ? request.isInterceptResolutionHandled()
      : false;

    this.debug('onRequest', {
      type,
      shouldBlock,
      alreadyHandled,
    });

    if (alreadyHandled) return;

    const requestWithCoopMode = request as HTTPRequestWithCooperativeMode;

    if (shouldBlock) {
      // Use Cooperative Intercept Mode if available
      if (
        requestWithCoopMode.abortErrorReason !== undefined &&
        this.interceptResolutionPriority !== undefined
      ) {
        return request.abort(
          'blockedbyclient',
          this.interceptResolutionPriority
        );
      }
      return request.abort();
    }

    // Use Cooperative Intercept Mode if available
    if (
      requestWithCoopMode.continueRequestOverrides &&
      this.interceptResolutionPriority !== undefined
    ) {
      const overrides = requestWithCoopMode.continueRequestOverrides();
      return request.continue(overrides, this.interceptResolutionPriority);
    }
    return request.continue();
  }

  /**
   * @private
   */
  override async onPageCreated(page: MinimalPage): Promise<void> {
    this.debug('onPageCreated', { blockedTypes: this.blockedTypes });
    await page.setRequestInterception(true);
    page.on('request', this.onRequest.bind(this));
  }
}

export default function (pluginConfig?: PluginOptions): Plugin {
  return new Plugin(pluginConfig);
}
