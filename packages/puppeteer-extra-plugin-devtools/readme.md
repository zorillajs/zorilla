# @zorilla/puppeteer-extra-plugin-devtools

> A plugin for [puppeteer-extra](https://github.com/zorillajs/zorilla) and [playwright-extra](https://github.com/zorillajs/zorilla).

## Installation

```bash
npm install @zorilla/puppeteer-extra-plugin-devtools
```

## Purpose

**Make puppeteer browser debugging possible from anywhere.**

- Creates a secure tunnel to make the devtools frontend (**incl. screencasting**) accessible from the public internet
- Works for both headless and headful puppeteer instances, as well as within docker containers
- Uses the already existing DevTools Protocol websocket connection from puppeteer
- Features some convenience functions for using the devtools frontend locally
- Compatible with both Puppeteer and Playwright through puppeteer-extra and playwright-extra

## Magic

![screenshot](https://i.imgur.com/dYvsKfJ.png)

## Quickstart

### ESM (recommended)

```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import devtoolsPlugin from '@zorilla/puppeteer-extra-plugin-devtools';

const devtools = devtoolsPlugin();
puppeteer.use(devtools);

const browser = await puppeteer.launch({ headless: true });
const tunnel = await devtools.createTunnel(browser);
console.log('DevTools URL:', tunnel.url);

const page = await browser.newPage();
await page.goto('https://example.com');
console.log('All setup. Access DevTools at:', tunnel.url);
```

### ESM

```javascript
import puppeteer from '@zorilla/puppeteer-extra';
import devtoolsPlugin from '@zorilla/puppeteer-extra-plugin-devtools';

const devtools = devtoolsPlugin();
puppeteer.use(devtools);

puppeteer.launch({ headless: true }).then(async (browser) => {
  const tunnel = await devtools.createTunnel(browser);
  console.log('DevTools URL:', tunnel.url);

  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log('All setup. Access DevTools at:', tunnel.url);
});
```

## TypeScript Support

This plugin is written in TypeScript and includes full type definitions. No additional `@types` package is needed.

```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import devtoolsPlugin from '@zorilla/puppeteer-extra-plugin-devtools';
import type { Browser } from 'puppeteer';

const devtools = devtoolsPlugin({
  auth: { user: 'admin', pass: 'secret123' },
  prefix: 'my-devtools',
});

puppeteer.use(devtools);

const browser: Browser = await puppeteer.launch();
const tunnel = await devtools.createTunnel(browser);
```

## API

### Plugin

**Extends: PuppeteerExtraPlugin**

As the tunnel page is public, the plugin requires basic auth.

You can set your own credentials using `opts` or `setAuthCredentials()`.

If you don't specify basic auth credentials, the plugin will generate a password and print it to STDOUT.

#### Options

```typescript
interface PluginOptions {
  auth?: {
    user: string;
    pass: string;
  };
  prefix?: string;
  localtunnel?: object;
}
```

- `auth.user` - Username for basic auth (default: `'user'`)
- `auth.pass` - Password for basic auth (will be generated if not provided)
- `prefix` - The prefix to use for the localtunnel.me subdomain (default: `'devtools-tunnel'`)
- `localtunnel` - Advanced options to pass to [localtunnel](https://github.com/localtunnel/localtunnel#options)

**Example:**

```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import devtoolsPlugin from '@zorilla/puppeteer-extra-plugin-devtools';

const devtools = devtoolsPlugin({
  auth: { user: 'francis', pass: 'president' },
});
puppeteer.use(devtools);

const browser = await puppeteer.launch();
console.log('Tunnel URL:', (await devtools.createTunnel(browser)).url);
// => Tunnel URL: https://devtools-tunnel-n9aogqwx3d.localtunnel.me
```

---

### createTunnel(browser)

Create a new public tunnel.

Supports multiple browser instances (will create a new tunnel for each).

**Parameters:**
- `browser` - The browser instance to create the tunnel for

**Returns:** `Promise<Tunnel>` - The Tunnel instance

**Example:**

```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import devtoolsPlugin from '@zorilla/puppeteer-extra-plugin-devtools';

const devtools = devtoolsPlugin();
devtools.setAuthCredentials('bob', 'swordfish');
puppeteer.use(devtools);

const browserFleet = await Promise.all(
  [...Array(3)].map(() => puppeteer.launch())
);

for (const [index, browser] of browserFleet.entries()) {
  const { url } = await devtools.createTunnel(browser);
  console.info(`Browser ${index}'s devtools: ${url}`);
}
// =>
// Browser 0's devtools: https://devtools-tunnel-fzenb4zuav.localtunnel.me
// Browser 1's devtools: https://devtools-tunnel-qe2t5rghme.localtunnel.me
// Browser 2's devtools: https://devtools-tunnel-pp83sdi4jo.localtunnel.me
```

---

### setAuthCredentials(user, pass)

Set the basic auth credentials for the public tunnel page.

Alternatively, the credentials can be defined when instantiating the plugin.

**Parameters:**
- `user` - Username
- `pass` - Password

**Returns:** `this` - For method chaining

**Example:**

```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import devtoolsPlugin from '@zorilla/puppeteer-extra-plugin-devtools';

const devtools = devtoolsPlugin();
puppeteer.use(devtools);

const browser = await puppeteer.launch();
devtools.setAuthCredentials('bob', 'swordfish');
const tunnel = await devtools.createTunnel(browser);
```

---

### getLocalDevToolsUrl(browser)

Convenience function to get the local devtools frontend URL.

**Parameters:**
- `browser` - The browser instance

**Returns:** `string` - The local DevTools URL

**Example:**

```typescript
import puppeteer from '@zorilla/puppeteer-extra';
import devtoolsPlugin from '@zorilla/puppeteer-extra-plugin-devtools';

const devtools = devtoolsPlugin();
puppeteer.use(devtools);

const browser = await puppeteer.launch();
console.log(devtools.getLocalDevToolsUrl(browser));
// => http://localhost:55952
```

---

## Tunnel

**Extends: RemoteDevTools.DevToolsTunnel**

The devtools tunnel for a browser instance.

### tunnel.url

Get the public devtools frontend URL.

**Type:** `string`

**Example:**

```typescript
const tunnel = await devtools.createTunnel(browser);
console.log(tunnel.url);
// => https://devtools-tunnel-sdoqqj95vg.localtunnel.me
```

---

### tunnel.getUrlForPage(page)

Get the devtools frontend deep link for a specific page.

**Parameters:**
- `page` - The page instance

**Returns:** `string` - The DevTools URL for the specific page

**Example:**

```typescript
const page = await browser.newPage();
const tunnel = await devtools.createTunnel(browser);
console.log(tunnel.getUrlForPage(page));
// => https://devtools-tunnel-bmkjg26zmr.localtunnel.me/devtools/inspector.html?ws=...
```

---

### tunnel.close()

Close the tunnel.

The tunnel will automatically stop when your script exits.

**Returns:** `this` - For method chaining

**Example:**

```typescript
const tunnel = await devtools.createTunnel(browser);
// ... do work ...
tunnel.close();
```

---

## Security Considerations

- The tunnel creates a publicly accessible endpoint protected by basic auth
- Generated passwords are 40 characters long and cryptographically random
- Always use HTTPS for the tunnel connection (handled automatically by localtunnel)
- Consider using custom credentials for production use
- The tunnel exposes your browser's DevTools Protocol - only use in trusted environments

## Troubleshooting

### Tunnel Connection Issues

If you're having trouble connecting to the tunnel:

1. Check that port forwarding is working correctly
2. Verify basic auth credentials
3. Ensure localtunnel service is operational
4. Check firewall settings

### Local DevTools

For local development, you can use `getLocalDevToolsUrl()` instead of creating a tunnel:

```typescript
const localUrl = devtools.getLocalDevToolsUrl(browser);
console.log('Local DevTools:', localUrl);
// Open this URL in your browser to debug locally
```

## License

MIT

## Contributing

See the main [zorilla](https://github.com/zorillajs/zorilla) repository for contribution guidelines.
