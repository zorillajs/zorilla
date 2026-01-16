import type { Page } from 'puppeteer';
import utils from './index.js';

type UtilsType = typeof import('./index.js').default;

interface WrappedPage {
  /**
   * Simple `page.evaluate` replacement to preload utils
   */
  evaluate: <R, Args extends unknown[]>(
    mainFunction: (utils: UtilsType, ...args: Args) => R | Promise<R>,
    ...args: Args
  ) => Promise<R>;
  /**
   * Simple `page.evaluateOnNewDocument` replacement to preload utils
   */
  evaluateOnNewDocument: <Args extends unknown[]>(
    mainFunction: (utils: UtilsType, ...args: Args) => void | Promise<void>,
    ...args: Args
  ) => Promise<unknown>;
}

/**
 * Wrap a page with utilities.
 *
 * @param {Page} page
 */
export default (page: Page): WrappedPage => ({
  /**
   * Simple `page.evaluate` replacement to preload utils
   */
  evaluate: async <R, Args extends unknown[]>(
    mainFunction: (utils: UtilsType, ...args: Args) => R | Promise<R>,
    ...args: Args
  ): Promise<R> =>
    page.evaluate(
      ({ _utilsFns, _mainFunction, _args }) => {
        // Add this point we cannot use our utililty functions as they're just strings, we need to materialize them first
        const utils = Object.fromEntries(
          // biome-ignore lint/security/noGlobalEval: Required to materialize utility functions in browser context
          Object.entries(_utilsFns).map(([key, value]) => [key, eval(value)])
        );
        utils.init();
        // biome-ignore lint/security/noGlobalEval: Required to execute main function in browser context
        return eval(_mainFunction)(utils, ..._args);
      },
      {
        _utilsFns: utils.stringifyFns(
          utils as unknown as Record<string, Function>
        ),
        _mainFunction: mainFunction.toString(),
        _args: args || [],
      }
    ),
  /**
   * Simple `page.evaluateOnNewDocument` replacement to preload utils
   */
  evaluateOnNewDocument: async <Args extends unknown[]>(
    mainFunction: (utils: UtilsType, ...args: Args) => void | Promise<void>,
    ...args: Args
  ) =>
    page.evaluateOnNewDocument(
      ({ _utilsFns, _mainFunction, _args }) => {
        // Add this point we cannot use our utililty functions as they're just strings, we need to materialize them first
        const utils = Object.fromEntries(
          // biome-ignore lint/security/noGlobalEval: Required to materialize utility functions in browser context
          Object.entries(_utilsFns).map(([key, value]) => [key, eval(value)])
        );
        utils.init();
        // biome-ignore lint/security/noGlobalEval: Required to execute main function in browser context
        return eval(_mainFunction)(utils, ..._args);
      },
      {
        _utilsFns: utils.stringifyFns(
          utils as unknown as Record<string, Function>
        ),
        _mainFunction: mainFunction.toString(),
        _args: args || [],
      }
    ),
});
