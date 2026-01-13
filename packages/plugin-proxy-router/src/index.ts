import {
  ExtraPluginProxyRouter,
  type ExtraPluginProxyRouterOptions,
} from './plugin.js';

export * from './plugin.js';
export * from './router.js';
export * from './stats.js';

/** Default export, ExtraPluginProxyRouter  */
const defaultExport = (options?: Partial<ExtraPluginProxyRouterOptions>) => {
  return new ExtraPluginProxyRouter(options || {});
};

export default defaultExport;
