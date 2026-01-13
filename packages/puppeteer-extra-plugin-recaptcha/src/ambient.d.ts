export {};

// https://github.com/sindresorhus/type-fest/issues/19
declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }

  // Workaround for https://github.com/esbuild-kit/tsx/issues/113
  var __name: ((target: object, value: string) => void) | undefined;
  var __defProp: typeof Object.defineProperty | undefined;
}
