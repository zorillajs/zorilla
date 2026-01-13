// Type declarations for packages without @types

declare module 'http-proxy-response-rewrite' {
  function modifyResponse(
    res: any,
    contentEncoding: string | undefined,
    modifier: (body: string) => string | undefined
  ): void;
  export = modifyResponse;
}

declare module 'localtunnel' {
  interface Tunnel {
    url: string;
    close(): void;
    on(event: 'close' | 'error', callback: (err?: Error) => void): void;
  }

  interface LocaltunnelOptions {
    local_host?: string;
    port: number;
    subdomain?: string;
    host?: string;
    [key: string]: any;
  }

  function localtunnel(options: LocaltunnelOptions): Promise<Tunnel>;
  export = localtunnel;
}
