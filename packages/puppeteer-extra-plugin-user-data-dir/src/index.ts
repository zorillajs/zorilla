import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import util from 'node:util';
import type { PluginRequirements } from '@zorilla/puppeteer-extra-plugin';
import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import debugLib from 'debug';
import type { LaunchOptions } from 'puppeteer';

const debug = debugLib('puppeteer-extra-plugin:user-data-dir');
const mkdtempAsync = util.promisify(fs.mkdtemp);
const mkdirAsync = util.promisify(fs.mkdir);
const writeFileAsync = util.promisify(fs.writeFile);

interface FileToWrite {
  target: string;
  file: string;
  contents: string;
}

interface PluginOptions {
  deleteTemporary?: boolean;
  deleteExisting?: boolean;
  files?: FileToWrite[];
  folderPath?: string;
  folderPrefix?: string;
  [key: string]: unknown;
}

/**
 *
 * Further reading:
 * https://source.chromium.org/chromium/chromium/src/+/main:docs/user_data_dir.md
 */
class Plugin extends PuppeteerExtraPlugin {
  private _userDataDir: string | undefined;
  private _isTemporary = false;

  constructor(opts: PluginOptions = {}) {
    super(opts);
    debug('initialized', this.opts);
  }

  override get name(): string {
    return 'user-data-dir';
  }

  override get defaults(): Required<PluginOptions> {
    return {
      deleteTemporary: true,
      deleteExisting: false,
      files: [],
      // Follow Puppeteers temporary user data dir naming convention by default
      folderPath: os.tmpdir(),
      folderPrefix: 'puppeteer_dev_profile-',
    };
  }

  override get requirements(): PluginRequirements {
    return new Set(['runLast', 'dataFromPlugins']);
  }

  get shouldDeleteDirectory(): boolean {
    const opts = this.opts as Required<PluginOptions>;
    if (this._isTemporary && opts.deleteTemporary) {
      return true;
    }
    return opts.deleteExisting;
  }

  get temporaryDirectoryPath(): string {
    const opts = this.opts as Required<PluginOptions>;
    return path.join(opts.folderPath, opts.folderPrefix);
  }

  get defaultProfilePath(): string {
    return path.join(this._userDataDir!, 'Default');
  }

  async makeTemporaryDirectory(): Promise<void> {
    this._userDataDir = await mkdtempAsync(this.temporaryDirectoryPath);
    this._isTemporary = true;
  }

  deleteUserDataDir(): void {
    debug('removeUserDataDir', this._userDataDir);

    if (!this._userDataDir) {
      debug('No userDataDir, not running rm');
      return;
    }

    // We're using fs.rm with retry logic here to handle busy resources
    // If resources busy or locked by chrome try again 4 times, then give up
    fs.rm(
      this._userDataDir,
      {
        recursive: true,
        force: true,
        maxRetries: 4,
        retryDelay: 100,
      },
      err => {
        debug(err);
      }
    );
  }

  async writeFilesToProfile(): Promise<void> {
    const opts = this.opts as Required<PluginOptions>;
    const isFileToWrite = (f: unknown): f is FileToWrite =>
      typeof f === 'object' &&
      f !== null &&
      'target' in f &&
      'file' in f &&
      'contents' in f &&
      typeof (f as { target: unknown }).target === 'string' &&
      typeof (f as { file: unknown }).file === 'string' &&
      typeof (f as { contents: unknown }).contents === 'string';

    const filesFromPlugins: FileToWrite[] = this.getDataFromPlugins(
      'userDataDirFile'
    )
      .map(d => d.value)
      .filter(isFileToWrite);
    const files: FileToWrite[] = [...filesFromPlugins, ...(opts.files || [])];
    if (!files.length) {
      return;
    }
    for (const file of files) {
      if (file.target !== 'Profile') {
        console.warn(`Warning: Ignoring file with invalid target`, file);
        continue;
      }
      const filePath = path.join(this.defaultProfilePath, file.file);
      try {
        // Create directory structure if it doesn't exist
        const dirPath = path.dirname(filePath);
        await mkdirAsync(dirPath, { recursive: true });
        await writeFileAsync(filePath, file.contents);
        debug(`Wrote file`, filePath);
      } catch (err) {
        console.warn('Warning: Failure writing file', filePath, file, err);
      }
    }
  }

  override async beforeLaunch(options: LaunchOptions): Promise<void> {
    this._userDataDir = options.userDataDir;
    if (!this._userDataDir) {
      await this.makeTemporaryDirectory();
      options.userDataDir = this._userDataDir;
      debug('created custom dir', options.userDataDir);
    }
    await this.writeFilesToProfile();
  }

  override async onDisconnected(): Promise<void> {
    debug('onDisconnected');
    if (this.shouldDeleteDirectory) {
      this.deleteUserDataDir();
    }
  }
}

export default function (pluginConfig?: PluginOptions): Plugin {
  return new Plugin(pluginConfig);
}
