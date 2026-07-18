import vanillaPuppeteer from 'puppeteer';
import {
  addExtra,
  type PuppeteerExtraPlugin,
  type VanillaPuppeteer,
} from '../src/index.js';

declare class ExternalPuppeteerExtraPlugin {
  private _debugBase;
  private _opts;
  private _childClassMembers;

  _isPuppeteerExtraPlugin: boolean;
  name: string;
  requirements: Set<string>;
  data: unknown;
  _register(prototype: object): void;
  _getMissingDependencies(plugins: ExternalPuppeteerExtraPlugin[]): Set<string>;
}

type AssertAssignable<T extends PuppeteerExtraPlugin> = T;
type ExternalPluginIsAccepted = AssertAssignable<ExternalPuppeteerExtraPlugin>;

const extra = addExtra(vanillaPuppeteer);
const vanilla: VanillaPuppeteer = vanillaPuppeteer;

export type PublicApiTypeAssertions = {
  externalPlugin: ExternalPluginIsAccepted;
  extra: typeof extra;
  vanilla: typeof vanilla;
};
