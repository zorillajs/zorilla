// Extend Puppeteer interfaces transparently to the end user.

// Note, we need to manually copy this file into the build dir (yarn ambient-dts): https://stackoverflow.com/questions/56018167
// Note2: It's not sufficient to just copy over this d.ts file, it needs to be referenced by another .ts file!
// Note3: To make it even more urgh the TS compiler will change the reference import path, hence we need to fix that in the end as well

import { RecaptchaPluginPageAdditions } from './types';

declare module 'puppeteer' {
  interface Page extends RecaptchaPluginPageAdditions {}
  interface Frame extends RecaptchaPluginPageAdditions {}
}

declare module 'puppeteer-core' {
  interface Page extends RecaptchaPluginPageAdditions {}
  interface Frame extends RecaptchaPluginPageAdditions {}
}
