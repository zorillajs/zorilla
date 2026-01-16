/**
 * `navigator.{plugins,mimeTypes}` share similar custom functions to look up properties
 *
 * Note: This is meant to be run in the context of the page.
 */
export const generateFunctionMocks =
  (utils: typeof import('../_utils/index.js').default) =>
  <T extends { [Symbol.toStringTag]: string }>(
    proto: T,
    itemMainProp: string,
    dataArray: Array<Record<string, unknown>>
  ) => ({
    /** Returns the MimeType object with the specified index. */
    item: utils.createProxy((proto as unknown as { item: Function }).item, {
      apply(_target, _ctx, args) {
        if (!args.length) {
          throw new TypeError(
            `Failed to execute 'item' on '${
              proto[Symbol.toStringTag]
            }': 1 argument required, but only 0 present.`
          );
        }
        // Special behavior alert:
        // - Vanilla tries to cast strings to Numbers (only integers!) and use them as property index lookup
        // - If anything else than an integer (including as string) is provided it will return the first entry
        const isInteger = args[0] && Number.isInteger(Number(args[0])); // Cast potential string to number first, then check for integer
        // Note: Vanilla never returns `undefined`
        return (isInteger ? dataArray[Number(args[0])] : dataArray[0]) || null;
      },
    }),
    /** Returns the MimeType object with the specified name. */
    namedItem: utils.createProxy(
      (proto as unknown as { namedItem: Function }).namedItem,
      {
        apply(_target, _ctx, args) {
          if (!args.length) {
            throw new TypeError(
              `Failed to execute 'namedItem' on '${
                proto[Symbol.toStringTag]
              }': 1 argument required, but only 0 present.`
            );
          }
          return dataArray.find(mt => mt[itemMainProp] === args[0]) || null; // Not `undefined`!
        },
      }
    ),
    /** Does nothing and shall return nothing */
    refresh: (proto as unknown as { refresh?: Function }).refresh
      ? utils.createProxy((proto as unknown as { refresh: Function }).refresh, {
          apply(_target, _ctx, _args) {
            return undefined;
          },
        })
      : undefined,
  });
