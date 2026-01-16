import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { Page } from '@zorilla/puppeteer-extra-plugin/dist/puppeteer';

interface PageWithClient extends Page {
  _client?: (() => CDPSession | undefined) | CDPSession;
}

interface CDPSession {
  send<T = unknown>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<T>;
}

/**
 * Strip sourceURL from scripts injected by puppeteer.
 * It can be used to identify the presence of pptr via stacktraces.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/sourceurl';
  }

  override async onPageCreated(page: Page): Promise<void> {
    const pageWithClient = page as PageWithClient;
    const client =
      pageWithClient && typeof pageWithClient._client === 'function'
        ? pageWithClient._client()
        : pageWithClient._client;
    if (!client) {
      this.debug('Warning, missing properties to intercept CDP.', { page });
      return;
    }

    // Intercept CDP commands and strip identifying and unnecessary sourceURL
    // https://github.com/puppeteer/puppeteer/blob/9b3005c105995cd267fdc7fb95b78aceab82cf0e/new-docs/puppeteer.cdpsession.md
    const debug = this.debug.bind(this);
    const cdpSession = client as CDPSession;
    const originalSend = cdpSession.send.bind(cdpSession);

    cdpSession.send = async function <T = unknown>(
      this: CDPSession,
      method: string,
      paramArgs?: Record<string, unknown>
    ): Promise<T> {
      const next = async (): Promise<T> => {
        try {
          return await originalSend<T>(method, paramArgs);
        } catch (error) {
          // This seems to happen sometimes when redirects cause other outstanding requests to be cut short
          if (
            error instanceof Error &&
            error.message.includes(
              `Protocol error (Network.getResponseBody): No resource with given identifier found`
            )
          ) {
            debug(
              `Caught and ignored an error about a missing network resource.`,
              { error }
            );
            return undefined as T;
          } else {
            throw error;
          }
        }
      };

      if (!method || !paramArgs) {
        return next();
      }

      // To find the methods/props in question check `_evaluateInternal` at:
      // https://github.com/puppeteer/puppeteer/blob/main/src/common/ExecutionContext.ts#L186
      const methodsToPatch: Record<string, string> = {
        'Runtime.evaluate': 'expression',
        'Runtime.callFunctionOn': 'functionDeclaration',
      };
      const SOURCE_URL_SUFFIX = '//# sourceURL=__puppeteer_evaluation_script__';

      if (!methodsToPatch[method] || !paramArgs[methodsToPatch[method]]) {
        return next();
      }

      debug('Stripping sourceURL', { method });
      const propName = methodsToPatch[method];
      if (typeof paramArgs[propName] === 'string') {
        paramArgs[propName] = (paramArgs[propName] as string).replace(
          SOURCE_URL_SUFFIX,
          ''
        );
      }

      return next();
    };
  }
}

export default function (pluginConfig?: Record<string, unknown>): Plugin {
  return new Plugin(pluginConfig);
}
