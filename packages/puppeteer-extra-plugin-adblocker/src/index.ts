import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { PuppeteerBlocker } from '@ghostery/adblocker-puppeteer';
import {
  type Puppeteer,
  PuppeteerExtraPlugin,
} from '@zorilla/puppeteer-extra-plugin';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
// Replace '/' with '-' to avoid invalid filesystem paths when package name has a scope
const engineCacheFilename = `${pkg.name.replace(/\//g, '-')}-${pkg.version}-engine.bin`;
const defaultCacheRoot = (() => {
  if (process.platform === 'win32') {
    return process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'zorilla')
      : path.join(os.homedir(), 'AppData', 'Local', 'zorilla');
  }

  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches', 'zorilla');
  }

  return path.join(
    process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache'),
    'zorilla'
  );
})();

/** Available plugin options */
export interface PluginOptions {
  /** Whether or not to block trackers (in addition to ads). Default: false */
  blockTrackers: boolean;
  /** Whether or not to block trackers and other annoyances, including cookie
      notices. Default: false */
  blockTrackersAndAnnoyances: boolean;
  /** Persist adblocker engine cache to disk for speedup. Default: true */
  useCache: boolean;
  /** Optional custom directory for adblocker cache files. Default: undefined */
  cacheDir?: string;
  /** Optional custom priority for interception resolution. Default: undefined */
  interceptResolutionPriority?: number;
  /** Optional custom filters for the adblocker. Default: undefined */
  filters?: string | string[];
  /** Whether or not to merge custom filters with prebuilt ones. Default: false */
  merge?: boolean;
  [key: string]: unknown;
}

/**
 * A puppeteer-extra plugin to automatically block ads and trackers.
 */
export class PuppeteerExtraPluginAdblocker extends PuppeteerExtraPlugin {
  private blocker: PuppeteerBlocker | undefined;

  constructor(opts: Partial<PluginOptions>) {
    super(opts);
    this.debug('Initialized', this.opts);
  }

  override get name() {
    return 'adblocker';
  }

  override get defaults(): PluginOptions {
    return {
      blockTrackers: false,
      blockTrackersAndAnnoyances: false,
      useCache: true,
      cacheDir: undefined,
      interceptResolutionPriority: undefined,
      filters: undefined,
      merge: false,
    };
  }

  get engineCacheFile() {
    const cacheDir = (this.opts as PluginOptions).cacheDir ?? defaultCacheRoot;
    return path.join(cacheDir, engineCacheFilename);
  }

  /**
   * Cache an instance of `PuppeteerBlocker` to disk if 'cacheDir' option was
   * specified for the plugin. It can then be used the next time this plugin is
   * used to load the adblocker faster.
   */
  private async persistToCache(blocker: PuppeteerBlocker): Promise<void> {
    if (!this.opts.useCache) {
      return;
    }
    this.debug('persist to cache', this.engineCacheFile);
    await fs.mkdir(path.dirname(this.engineCacheFile), {
      recursive: true,
      mode: 0o700,
    });
    await fs.writeFile(this.engineCacheFile, blocker.serialize());
  }

  /**
   * Initialize instance of `PuppeteerBlocker` from cache if possible.
   * Otherwise, it throws and we will try to initialize it from remote instead.
   */
  private async loadFromCache(): Promise<PuppeteerBlocker> {
    if (!this.opts.useCache) {
      throw new Error('caching disabled');
    }
    this.debug('load from cache', this.engineCacheFile);
    return PuppeteerBlocker.deserialize(
      new Uint8Array(await fs.readFile(this.engineCacheFile))
    );
  }

  /**
   * Initialize instance of `PuppeteerBlocker` from remote (either by fetching
   * a serialized version of the engine when available, or by downloading raw
   * lists for filters such as EasyList then parsing them to initialize
   * blocker).
   */
  private async loadFromRemote(): Promise<PuppeteerBlocker> {
    this.debug('load from remote', {
      blockTrackers: this.opts.blockTrackers,
      blockTrackersAndAnnoyances: this.opts.blockTrackersAndAnnoyances,
      filters: this.opts.filters,
      merge: this.opts.merge,
    });
    
    let blocker: PuppeteerBlocker;
    if (this.opts.blockTrackersAndAnnoyances === true) {
      blocker = await PuppeteerBlocker.fromPrebuiltFull(fetch);
    } else if (this.opts.blockTrackers === true) {
      blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
    } else {
      blocker = await PuppeteerBlocker.fromPrebuiltAdsOnly(fetch);
    }

    if (this.opts.filters) {
      const filters = Array.isArray(this.opts.filters) ? this.opts.filters.join('\n') : this.opts.filters;
      const customBlocker = PuppeteerBlocker.parse(filters);
      if (this.opts.merge === true) {
        blocker = PuppeteerBlocker.merge([blocker, customBlocker]);
      } else {
        blocker = customBlocker;
      }
    }

    return blocker;
  }

  /**
   * Return instance of `PuppeteerBlocker`. It will take care of initializing
   * it if necessary (first time it is called), or return the existing instance
   * if it already exists.
   */
  async getBlocker(): Promise<PuppeteerBlocker> {
    this.debug('getBlocker', { hasBlocker: !!this.blocker });
    if (this.blocker === undefined) {
      try {
        this.blocker = await this.loadFromCache();
        this.setRequestInterceptionPriority();
      } catch (_ex) {
        this.blocker = await this.loadFromRemote();
        this.setRequestInterceptionPriority();
        await this.persistToCache(this.blocker);
      }
    }
    return this.blocker;
  }

  /**
   * Sets the request interception priority on the `PuppeteerBlocker` instance.
   */
  private setRequestInterceptionPriority(): void {
    this.blocker?.setRequestInterceptionPriority(
      (this.opts as PluginOptions).interceptResolutionPriority
    );
  }

  /**
   * Hook into this blocking event to make sure the cache is initialized before navigation.
   */
  override async beforeLaunch() {
    this.debug('beforeLaunch');
    await this.getBlocker();
  }

  /**
   * Hook into this blocking event to make sure the cache is initialized before navigation.
   */
  override async beforeConnect() {
    this.debug('beforeConnect');
    await this.getBlocker();
  }

  /**
   * Enable adblocking in `page`.
   */
  override async onPageCreated(page: Puppeteer.Page) {
    this.debug('onPageCreated');
    (await this.getBlocker()).enableBlockingInPage(page);
  }
}

export default (options: Partial<PluginOptions> = {}) => {
  return new PuppeteerExtraPluginAdblocker(options);
};
