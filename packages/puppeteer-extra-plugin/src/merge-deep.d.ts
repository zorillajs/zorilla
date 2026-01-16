declare module 'merge-deep' {
  function merge<T = unknown>(...objects: Record<string, unknown>[]): T;
  export default merge;
}
