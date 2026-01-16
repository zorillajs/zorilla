import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { LaunchOptions } from 'puppeteer';

const argsToIgnore = [
  '--disable-extensions',
  '--disable-default-apps',
  '--disable-component-extensions-with-background-pages',
];

/**
 * A CDP driver like puppeteer can make use of various browser launch arguments that are
 * adversarial to mimicking a regular browser and need to be stripped when launching the browser.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/defaultArgs';
  }

  override get requirements(): Set<'runLast'> {
    return new Set(['runLast']); // So other plugins can modify launch options before
  }

  override async beforeLaunch(options: LaunchOptions = {}): Promise<void> {
    const ignoreDefaultArgs = options.ignoreDefaultArgs;

    if (ignoreDefaultArgs === true) {
      // that means the user explicitly wants to disable all default arguments
      return;
    }

    if (!ignoreDefaultArgs) {
      options.ignoreDefaultArgs = [];
    } else if (!Array.isArray(ignoreDefaultArgs)) {
      return;
    }

    argsToIgnore.forEach(arg => {
      if ((options.ignoreDefaultArgs as string[]).includes(arg)) {
        return;
      }
      (options.ignoreDefaultArgs as string[]).push(arg);
    });
  }
}

export default function (pluginConfig?: Record<string, unknown>): Plugin {
  return new Plugin(pluginConfig);
}

export { argsToIgnore };
