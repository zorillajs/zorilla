import { RecaptchaPluginPageAdditions } from './types';

declare module 'playwright-core' {
  interface Page extends RecaptchaPluginPageAdditions {}
  interface Frame extends RecaptchaPluginPageAdditions {}
}
