/* global MimeType MimeTypeArray */

import type utils from '../_utils/index.js';

interface MimeTypeData {
  type: string;
  [key: string]: unknown;
}

interface Fns {
  generateMagicArray: typeof import('./magicArray.js').generateMagicArray;
  generateFunctionMocks: ReturnType<
    typeof import('./functionMocks.js').generateFunctionMocks
  >;
}

/**
 * Generate a convincing and functional MimeTypeArray (with mime types) from scratch.
 *
 * Note: This is meant to be run in the context of the page.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/mimeTypes
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MimeTypeArray
 */
export const generateMimeTypeArray =
  (utils: typeof import('../_utils/index.js').default, fns: Fns) =>
  (mimeTypesData: MimeTypeData[]) => {
    return fns.generateMagicArray!(utils, fns)(
      mimeTypesData,
      MimeTypeArray.prototype,
      MimeType.prototype,
      'type'
    );
  };
