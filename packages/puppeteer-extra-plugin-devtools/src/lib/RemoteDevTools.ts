import crypto from 'node:crypto';
import http from 'node:http';
import debugLib from 'debug';
import getPort from 'get-port';
import httpAuth from 'http-auth';
import httpProxy from 'http-proxy';
import modifyResponse from 'http-proxy-response-rewrite';
import localtunnel from 'localtunnel';
import ow from 'ow';

const debug = debugLib('remote-devtools');

// Extract types from localtunnel function signature
type Tunnel = Awaited<ReturnType<typeof localtunnel>>;
type LocaltunnelOptions = Parameters<typeof localtunnel>[0];

interface DevToolsOptions {
  prefix?: string;
  subdomain?: string | null;
  auth?: { user: string | null; pass: string | null };
  localtunnel?: Partial<LocaltunnelOptions>;
  [key: string]: unknown;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${url}`);
  }
  return response.json();
}

/**
 * Base class handling common stuff
 *
 * @ignore
 */
class DevToolsCommon {
  opts: DevToolsOptions;
  wsUrl: string;
  wsHost: string;
  wsPort: string;

  constructor(webSocketDebuggerUrl: string, opts: DevToolsOptions = {}) {
    ow(webSocketDebuggerUrl, ow.string);
    ow(webSocketDebuggerUrl, ow.string.includes('ws://'));
    ow(opts, ow.object.plain);
    this.opts = opts;

    this.wsUrl = webSocketDebuggerUrl;
    const wsUrlParts = new URL(this.wsUrl);
    this.wsHost =
      wsUrlParts.hostname === '127.0.0.1' ? 'localhost' : wsUrlParts.hostname;
    this.wsPort = wsUrlParts.port;
  }

  async fetchVersion(): Promise<unknown> {
    return fetchJson(`http://${this.wsHost}:${this.wsPort}/json/version`);
  }

  async fetchList(): Promise<unknown> {
    return fetchJson(`http://${this.wsHost}:${this.wsPort}/json/list`);
  }
}

/**
 * Convenience functions for local remote debugging sessions.
 *
 * @ignore
 */
class DevToolsLocal extends DevToolsCommon {
  constructor(
    webSocketDebuggerUrl: string,
    opts: Record<string, unknown> = {}
  ) {
    super(webSocketDebuggerUrl, opts);
  }

  get url(): string {
    return `http://${this.wsHost}:${this.wsPort}`;
  }

  getUrlForPageId(pageId: string): string {
    return `${this.url}/devtools/inspector.html?ws=${this.wsHost}:${this.wsPort}/devtools/page/${pageId}`;
  }
}

/**
 * Create a proxy + tunnel to make a local devTools session accessible from the internet.
 *
 * - These devtools pages support screencasting the browser screen
 * - Proxy supports both http and websockets
 * - Proxy patches Host header to bypass devtools bug preventing non-localhost/ip access
 * - Proxy rewrites URLs, so links on the devtools index page will work
 * - Has a convenience function to return a deep link to a debug a specific page
 * - Supports basic auth ;-)
 *
 * @todo No idea how long-living a tunnel connection is yet, we might want to add keep-alive/reconnect capabilities
 *
 * @ignore
 */
class DevToolsTunnel extends DevToolsCommon {
  server: http.Server | null = null;
  tunnel: Tunnel | null = null;
  tunnelHost: string | null = null;
  // biome-ignore lint/suspicious/noExplicitAny: Third-party http-proxy Server type
  proxyServer: any = null;

  constructor(webSocketDebuggerUrl: string, opts: DevToolsOptions = {}) {
    super(webSocketDebuggerUrl, opts);
    this.opts = Object.assign(this.defaults, opts);
  }

  get defaults(): Required<DevToolsOptions> {
    return {
      prefix: 'devtools-tunnel',
      subdomain: null,
      auth: { user: null, pass: null },
      localtunnel: {},
    };
  }

  get url(): string {
    return this.tunnel?.url ?? '';
  }

  getUrlForPageId(pageId: string): string {
    return `https://${this.tunnelHost!}/devtools/inspector.html?wss=${this.tunnelHost!}/devtools/page/${pageId}`;
  }

  async create(): Promise<this> {
    const subdomain =
      this.opts.subdomain ??
      this._generateSubdomain(this.opts.prefix ?? 'devtools-tunnel');
    const basicAuth = this.opts.auth?.user
      ? this._createBasicAuth(this.opts.auth.user, this.opts.auth.pass!)
      : null;
    const serverPort = await getPort(); // only preference, will return an available one

    this.proxyServer = this._createProxyServer(this.wsHost, this.wsPort);
    this.server = await this._createServer(serverPort, basicAuth);
    this.tunnel = await this._createTunnel({
      local_host: this.wsHost,
      port: serverPort,
      subdomain,
      ...this.opts.localtunnel,
    });

    this.tunnelHost = new URL(this.tunnel.url).hostname;

    debug(
      'tunnel created.',
      `
      local:  http://${this.wsHost}:${this.wsPort}
      proxy:  http://localhost:${serverPort}
      tunnel: ${this.tunnel.url}
    `
    );
    return this;
  }

  close(): this {
    this.tunnel?.close();
    this.server?.close();
    this.proxyServer?.close();
    debug('all closed');
    return this;
  }

  _generateSubdomain(prefix: string): string {
    // Generate random string using Node's crypto module
    const rand = crypto
      .randomBytes(6)
      .toString('base64url')
      .toLowerCase()
      .slice(0, 10);
    return `${prefix}-${rand}`;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Third-party http-auth Basic type
  _createBasicAuth(user: string, pass: string): any {
    const basicAuth = httpAuth.basic(
      {},
      (
        username: string,
        password: string,
        callback: (valid: boolean) => void
      ) => {
        const isValid = username === user && password === pass;
        return callback(isValid);
      }
    );
    basicAuth.on('fail', (result: { user?: string }) => {
      debug(`User authentication failed: ${result.user}`);
    });
    basicAuth.on('error', (error: Error) => {
      debug(`Authentication error: ${error.message}`);
    });
    return basicAuth;
  }

  /**
   * `fetch` used by the index page doesn't include credentials by default.
   *
   *           LOVELY
   *           THANKS
   *             <3
   *
   * @ignore
   */
  _modifyFetchToIncludeCredentials(body: string): string | undefined {
    if (!body) {
      return;
    }
    body = body.replace(`fetch(url).`, `fetch(url, {credentials: 'include'}).`);

    // Fix for headless index pages that use weird client-side JS to modify the devtoolsFrontendUrl to something not working for us
    // https://github.com/berstend/puppeteer-extra/issues/566
    body = body.replace(
      'link.href = `https://chrome-devtools-frontend.appspot.com',
      'link.href = item.devtoolsFrontendUrl; // '
    );

    debug('fetch:after', body);
    return body;
  }

  _modifyJSONResponse(body: string): string | undefined {
    if (!body) {
      return;
    }
    debug('list body:before', body);
    body = body.replace(new RegExp(this.wsHost, 'g'), `${this.tunnelHost}`);
    body = body.replace(/ws=/g, 'wss=');
    body = body.replace(/ws:\/\//g, 'wss://');
    debug('list body:after', body);
    return body;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Third-party http-proxy Server type
  _createProxyServer(targetHost = 'localhost', targetPort: string): any {
    // biome-ignore lint/suspicious/noExplicitAny: Third-party http-proxy createProxyServer
    const proxyServer = new (httpProxy as any).createProxyServer({
      target: { host: targetHost, port: parseInt(targetPort, 10) },
    });
    proxyServer.on(
      'proxyReq',
      (
        proxyReq: http.ClientRequest,
        req: http.IncomingMessage,
        _res: http.ServerResponse,
        _options: Record<string, unknown>
      ) => {
        debug('proxyReq', req.url);
        // https://github.com/GoogleChrome/puppeteer/issues/2242
        proxyReq.setHeader('Host', 'localhost');
      }
    );
    proxyServer.on(
      'proxyRes',
      (
        proxyRes: http.IncomingMessage,
        req: http.IncomingMessage,
        res: http.ServerResponse,
        _options: Record<string, unknown>
      ) => {
        debug('proxyRes', req.url);
        if (req.url === '/') {
          delete proxyRes.headers['content-length'];
          const contentEncoding = Array.isArray(
            proxyRes.headers['content-encoding']
          )
            ? proxyRes.headers['content-encoding'][0]
            : proxyRes.headers['content-encoding'];
          modifyResponse(
            res,
            contentEncoding,
            this._modifyFetchToIncludeCredentials.bind(this)
          );
        }
        if (req.url && ['/json/list', '/json/version'].includes(req.url)) {
          delete proxyRes.headers['content-length'];
          const contentEncoding = Array.isArray(
            proxyRes.headers['content-encoding']
          )
            ? proxyRes.headers['content-encoding'][0]
            : proxyRes.headers['content-encoding'];
          modifyResponse(
            res,
            contentEncoding,
            this._modifyJSONResponse.bind(this)
          );
        }
      }
    );
    return proxyServer;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Third-party http-auth Basic type
  async _createServer(port: number, auth: any = null): Promise<http.Server> {
    const server = http.createServer(auth, (req, res) => {
      this.proxyServer.web(req, res);
    });
    server.on('upgrade', (req, socket, head) => {
      debug('upgrade request', req.url);
      this.proxyServer.ws(req, socket, head);
    });
    return await new Promise<http.Server>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, () => {
        server.off('error', reject);
        resolve(server);
      });
    });
  }

  async _createTunnel(options: LocaltunnelOptions): Promise<Tunnel> {
    const tunnel = await localtunnel(options);

    tunnel.on('close', () => {
      // todo: add keep-alive?
      debug('tunnel:close');
    });

    tunnel.on('error', (err?: Error) => {
      console.log('tunnel error', err);
    });

    debug('tunnel:created', tunnel.url);
    return tunnel;
  }
}

export { DevToolsCommon, DevToolsLocal, DevToolsTunnel };
