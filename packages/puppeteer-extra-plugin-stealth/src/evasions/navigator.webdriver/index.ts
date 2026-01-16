import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type {
  LaunchOptions,
  Page,
} from 'puppeteer';

/**
 * Pass the Webdriver Test.
 * Will delete `navigator.webdriver` property.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/navigator.webdriver';
  }

  override async onPageCreated(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      const nav = navigator as Navigator & { webdriver?: boolean };
      if (nav.webdriver === false) {
        // Post Chrome 89.0.4339.0 and already good
      } else if (nav.webdriver === undefined) {
        // Pre Chrome 89.0.4339.0 and already good
      } else {
        // Pre Chrome 88.0.4291.0 and needs patching
        delete (Object.getPrototypeOf(nav) as Record<string, unknown>)
          .webdriver;
      }
    });
  }

  // Post Chrome 88.0.4291.0
  // Note: this will add an infobar to Chrome with a warning that an unsupported flag is set
  // To remove this bar on Linux, run: mkdir -p /etc/opt/chrome/policies/managed && echo '{ "CommandLineFlagSecurityWarningsEnabled": false }' > /etc/opt/chrome/policies/managed/managed_policies.json
  override async beforeLaunch(options: LaunchOptions): Promise<void> {
    if (!options.args) {
      options.args = [];
    }

    // If disable-blink-features is already passed, append the AutomationControlled switch
    const idx = options.args.findIndex(
      arg =>
        typeof arg === 'string' && arg.startsWith('--disable-blink-features=')
    );
    if (idx !== -1) {
      const arg = options.args[idx];
      options.args[idx] = `${arg},AutomationControlled`;
    } else {
      options.args.push('--disable-blink-features=AutomationControlled');
    }
  }
}

export default function (pluginConfig?: Record<string, unknown>): Plugin {
  return new Plugin(pluginConfig);
}
