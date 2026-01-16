/* global Plugin PluginArray */

import type utils from '../_utils/index.js';

interface PluginData {
  name: string;
  [key: string]: unknown;
}

interface Fns {
  generateMagicArray: typeof import('./magicArray.js').generateMagicArray;
  generateFunctionMocks: ReturnType<
    typeof import('./functionMocks.js').generateFunctionMocks
  >;
}

/**
 * Generate a convincing and functional PluginArray (with plugins) from scratch.
 *
 * Note: This is meant to be run in the context of the page.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/plugins
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PluginArray
 */
export const generatePluginArray =
  (utils: typeof import('../_utils/index.js').default, fns: Fns) =>
  (pluginsData: PluginData[]) => {
    return fns.generateMagicArray!(utils, fns)(
      pluginsData,
      PluginArray.prototype,
      Plugin.prototype,
      'name'
    );
  };
