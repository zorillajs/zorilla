import 'puppeteer';

declare global {
  const fpCollect: {
    generateFingerprint<
      TFingerprint extends Record<string, unknown>,
    >(): TFingerprint;
  };

  const chrome: Record<string, unknown>;

  interface Navigator {
    __proto__?: unknown;
    languages: string[];
    userAgentData?: {
      getHighEntropyValues(hints: string[]): Promise<Record<string, unknown>>;
      [key: string]: unknown;
    };
  }

  interface Window {
    chrome?: Record<string, unknown>;
    hcaptcha?: {
      render(...args: unknown[]): unknown;
      execute(...args: unknown[]): unknown;
    };
    HTMLMediaElement: typeof HTMLMediaElement;
    Function: FunctionConstructor;
  }

  interface MimeType {
    __proto__?: any;
    enabledPlugins?: unknown;
    length?: number;
  }

  interface MimeTypeArray {
    __proto__?: any;
    [key: string]: any;
    item(index: number | string | null): any;
    namedItem(name: string): any;
  }

  interface Plugin {
    __proto__?: any;
  }

  interface PluginArray {
    __proto__?: any;
    [key: string]: any;
    item(index: number | string | null): any;
    namedItem(name: string): any;
  }

  interface Element {
    innerText: string;
  }

  interface RenderingContext {
    getExtension(name: string): any;
    getParameter(parameter?: any): any;
  }
}

declare module 'puppeteer' {
  interface Page {
    _client?:
      | (() => {
          send(
            method: string,
            params?: Record<string, unknown>
          ): Promise<unknown>;
        })
      | {
          send(
            method: string,
            params?: Record<string, unknown>
          ): Promise<unknown>;
        };
    waitFor?(ms: number): Promise<void>;
    waitForTimeout?(ms: number): Promise<void>;
  }
}

export {};
