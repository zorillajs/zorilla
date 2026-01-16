import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { Page } from 'puppeteer';
import withUtils from '../_utils/withUtils.js';

/**
 * Fix `Notification.permission` behaving weirdly in headless mode
 *
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=1052332
 */

class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/navigator.permissions';
  }

  /* global Notification Permissions PermissionStatus */
  override async onPageCreated(page: Page): Promise<void> {
    await withUtils(page).evaluateOnNewDocument((utils, _opts) => {
      const isSecure = document.location.protocol.startsWith('https');

      // In headful on secure origins the permission should be "default", not "denied"
      if (isSecure) {
        utils.replaceGetterWithProxy(Notification, 'permission', {
          apply() {
            return 'default';
          },
        });
      }

      // Another weird behavior:
      // On insecure origins in headful the state is "denied",
      // whereas in headless it's "prompt"
      if (!isSecure) {
        const handler: ProxyHandler<typeof Permissions.prototype.query> = {
          apply(_target, _ctx, args) {
            const param = (args || [])[0] as { name?: string };

            const isNotifications =
              param?.name && param.name === 'notifications';
            if (!isNotifications) {
              return utils.cache!.Reflect.apply(
                // biome-ignore lint/complexity/noArguments: Required to forward all arguments to Reflect.apply
                ...(arguments as unknown as Parameters<typeof Reflect.apply>)
              );
            }

            return Promise.resolve(
              Object.setPrototypeOf(
                {
                  state: 'denied',
                  onchange: null,
                },
                PermissionStatus.prototype
              )
            );
          },
        };
        // Note: Don't use `Object.getPrototypeOf` here
        utils.replaceWithProxy(Permissions.prototype, 'query', handler);
      }
    }, this.opts);
  }
}

export default function (pluginConfig?: Record<string, unknown>): Plugin {
  return new Plugin(pluginConfig);
}
