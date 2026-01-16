/* global MimeType MimeTypeArray Plugin PluginArray  */

interface ItemData {
  [key: string]: unknown;
  __mimeTypes?: string[];
}

interface Fns {
  generateFunctionMocks: ReturnType<
    typeof import('./functionMocks.js').generateFunctionMocks
  >;
}

/**
 * Generate a convincing and functional MimeType or Plugin array from scratch.
 * They're so similar that it makes sense to use a single generator here.
 *
 * Note: This is meant to be run in the context of the page.
 */
export const generateMagicArray =
  (utils: typeof import('../_utils/index.js').default, fns: Fns) =>
  <ProtoType extends object, ItemProtoType extends object>(
    dataArray: ItemData[] = [],
    proto: ProtoType = MimeTypeArray.prototype as unknown as ProtoType,
    itemProto: ItemProtoType = MimeType.prototype as unknown as ItemProtoType,
    itemMainProp = 'type'
  ) => {
    // Quick helper to set props with the same descriptors vanilla is using
    const defineProp = (
      obj: Record<string, unknown>,
      prop: string,
      value: unknown
    ) =>
      Object.defineProperty(obj, prop, {
        value,
        writable: false,
        enumerable: false, // Important for mimeTypes & plugins: `JSON.stringify(navigator.mimeTypes)`
        configurable: true,
      });

    // Loop over our fake data and construct items
    const makeItem = (data: ItemData) => {
      const item: Record<string, unknown> = {};
      for (const prop of Object.keys(data)) {
        if (prop.startsWith('__')) {
          continue;
        }
        defineProp(item, prop, data[prop]);
      }
      return patchItem(item, data);
    };

    const patchItem = (item: Record<string, unknown>, data: ItemData) => {
      let descriptor = Object.getOwnPropertyDescriptors(item);

      // Special case: Plugins have a magic length property which is not enumerable
      // e.g. `navigator.plugins[i].length` should always be the length of the assigned mimeTypes
      if (itemProto === Plugin.prototype) {
        descriptor = {
          ...descriptor,
          length: {
            value: data.__mimeTypes?.length || 0,
            writable: false,
            enumerable: false,
            configurable: true, // Important to be able to use the ownKeys trap in a Proxy to strip `length`
          },
        };
      }

      // We need to spoof a specific `MimeType` or `Plugin` object
      const obj = Object.create(itemProto, descriptor);

      // Virtually all property keys are not enumerable in vanilla
      const blacklist = [...Object.keys(data), 'length', 'enabledPlugin'];
      return new Proxy(obj, {
        ownKeys(target) {
          return Reflect.ownKeys(target).filter(
            k => !blacklist.includes(k as string)
          );
        },
        getOwnPropertyDescriptor(target, prop) {
          if (blacklist.includes(prop as string)) {
            return undefined;
          }
          return Reflect.getOwnPropertyDescriptor(target, prop);
        },
      });
    };

    const magicArray: unknown[] = [];

    // Loop through our fake data and use that to create convincing entities
    dataArray.forEach(data => {
      magicArray.push(makeItem(data));
    });

    // Add direct property access  based on types (e.g. `obj['application/pdf']`) afterwards
    magicArray.forEach(entry => {
      defineProp(
        magicArray as unknown as Record<string, unknown>,
        (entry as Record<string, unknown>)[itemMainProp] as string,
        entry
      );
    });

    // This is the best way to fake the type to make sure this is false: `Array.isArray(navigator.mimeTypes)`
    const magicArrayObj = Object.create(proto, {
      ...(Object.getOwnPropertyDescriptors(
        magicArray
      ) as unknown as PropertyDescriptorMap),

      // There's one ugly quirk we unfortunately need to take care of:
      // The `MimeTypeArray` prototype has an enumerable `length` property,
      // but headful Chrome will still skip it when running `Object.getOwnPropertyNames(navigator.mimeTypes)`.
      // To strip it we need to make it first `configurable` and can then overlay a Proxy with an `ownKeys` trap.
      length: {
        value: magicArray.length,
        writable: false,
        enumerable: false,
        configurable: true, // Important to be able to use the ownKeys trap in a Proxy to strip `length`
      },
    });

    // Generate our functional function mocks :-)
    const functionMocks = fns.generateFunctionMocks!(
      proto as ProtoType & { [Symbol.toStringTag]: string },
      itemMainProp,
      magicArray as Array<Record<string, unknown>>
    );

    // We need to overlay our custom object with a JS Proxy
    const magicArrayObjProxy = new Proxy(magicArrayObj, {
      get(_target, key: string | symbol = '') {
        // Redirect function calls to our custom proxied versions mocking the vanilla behavior
        if (key === 'item') {
          return functionMocks.item;
        }
        if (key === 'namedItem') {
          return functionMocks.namedItem;
        }
        if (proto === PluginArray.prototype && key === 'refresh') {
          return functionMocks.refresh;
        }
        // Everything else can pass through as normal
        return utils.cache!.Reflect.get(
          ...(arguments as unknown as Parameters<typeof Reflect.get>)
        );
      },
      ownKeys(_target) {
        // There are a couple of quirks where the original property demonstrates "magical" behavior that makes no sense
        // This can be witnessed when calling `Object.getOwnPropertyNames(navigator.mimeTypes)` and the absense of `length`
        // My guess is that it has to do with the recent change of not allowing data enumeration and this being implemented weirdly
        // For that reason we just completely fake the available property names based on our data to match what regular Chrome is doing
        // Specific issues when not patching this: `length` property is available, direct `types` props (e.g. `obj['application/pdf']`) are missing
        const keys: string[] = [];
        const typeProps = magicArray.map(
          mt => (mt as Record<string, unknown>)[itemMainProp]
        ) as string[];
        typeProps.forEach((_, i) => keys.push(`${i}`));
        typeProps.forEach(propName => keys.push(propName));
        return keys;
      },
      getOwnPropertyDescriptor(target, prop) {
        if (prop === 'length') {
          return undefined;
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });

    return magicArrayObjProxy;
  };
