import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';

export class DummyPlugin extends PuppeteerExtraPlugin {
  public pluginEventList: string[] = [];
  public pluginEventMap: Map<string, unknown> = new Map();

  constructor(opts = {}) {
    super(opts);
  }
  override get name() {
    return 'dummy';
  }

  override async onPluginRegistered(..._args: unknown[]) {
    this.pluginEventList.push('onPluginRegistered');
  }
  override async beforeLaunch(..._args: unknown[]) {
    this.pluginEventList.push('beforeLaunch');
  }
  override async afterLaunch(..._args: unknown[]) {
    this.pluginEventList.push('afterLaunch');
  }
  override async beforeConnect(..._args: unknown[]) {
    this.pluginEventList.push('beforeConnect');
  }
  override async afterConnect(..._args: unknown[]) {
    this.pluginEventList.push('afterConnect');
  }
  override async onBrowser(..._args: unknown[]) {
    this.pluginEventList.push('onBrowser');
  }
  override async onTargetCreated(..._args: unknown[]) {
    this.pluginEventList.push('onTargetCreated');
  }
  override async onPageCreated(..._args: unknown[]) {
    this.pluginEventList.push('onPageCreated');
  }
  override async onTargetChanged(..._args: unknown[]) {
    this.pluginEventList.push('onTargetChanged');
  }
  override async onTargetDestroyed(..._args: unknown[]) {
    this.pluginEventList.push('onTargetDestroyed');
  }
  override async onDisconnected(..._args: unknown[]) {
    this.pluginEventList.push('onDisconnected');
  }
  override async onClose(..._args: unknown[]) {
    this.pluginEventList.push('onClose');
  }

  // playwright only at the moment
  override async beforeContext(..._args: unknown[]) {
    this.pluginEventList.push('beforeContext');
  }
  override async onContextCreated(..._args: unknown[]) {
    this.pluginEventList.push('onContextCreated');
  }
}
