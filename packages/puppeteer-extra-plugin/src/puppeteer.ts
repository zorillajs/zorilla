// A wildcard import would result in a `require("puppeteer")` statement
// at the top of the transpiled js file, not what we want. :-/
// Using "export type" to satisfy TypeScript isolatedModules requirement

export type {
  Browser,
  ConnectOptions,
  LaunchOptions,
  Page,
  Target,
} from 'puppeteer';
