import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Browser, Page, Target, WebWorker } from 'puppeteer';
import { afterAll, beforeAll, expect, test } from 'vitest';
import Plugin from '../dist/index.js';
import { addExtra, getDefaultLaunchArgs, vanillaPuppeteer } from './util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple HTTP server. Service Workers cannot be served from file:// URIs
const httpServer = async () => {
  const server = await http
    .createServer((req, res) => {
      let contents, type;

      if (req.url === '/sw.js') {
        contents = fs.readFileSync(path.join(__dirname, './fixtures/sw.js'));
        type = 'application/javascript';
      } else {
        contents = fs.readFileSync(
          path.join(__dirname, './fixtures/dummy-with-service-worker.html')
        );
        type = 'text/html';
      }

      res.setHeader('Content-Type', type);
      res.writeHead(200);
      res.end(contents);
    })
    .listen(0); // random free port

  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}/`;
};

let browser: Browser;
let page: Page;
let worker: WebWorker;

beforeAll(async () => {
  const address = await httpServer();
  console.log(`Server is running on port ${address}`);

  browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true, args: getDefaultLaunchArgs() });
  page = await browser.newPage();

  const workerPromise = new Promise<WebWorker>((resolve, reject) => {
    browser.on('targetcreated', async (target: Target) => {
      if (target.type() === 'service_worker') {
        const serviceWorker = await target.worker();
        if (serviceWorker) {
          resolve(serviceWorker);
        } else {
          reject(new Error('Target did not expose a service worker'));
        }
      }
    });
  });

  await page.goto(address);
  worker = await workerPromise;
});

afterAll(async () => {
  await browser.close();
});

test.skip('stealth: inconsistencies between page and worker', async () => {
  const pageFP = await page.evaluate(detectFingerprint);
  const workerFP = await worker.evaluate(detectFingerprint);

  expect(pageFP).toEqual(workerFP);
});

test.skip('stealth: creepjs has good trust score', async () => {
  page.goto('https://abrahamjuliot.github.io/creepjs/');

  const score = await (
    await (
      await page.waitForSelector('#fingerprint-data .unblurred')
    ).getProperty('textContent')
  ).jsonValue();

  expect(parseInt(score, 10) > 80).toBe(true);
});

/* global OffscreenCanvas */
function detectFingerprint() {
  const results: Record<string, string> = {};

  const props: Array<
    | 'userAgent'
    | 'language'
    | 'hardwareConcurrency'
    | 'deviceMemory'
    | 'languages'
    | 'platform'
  > = [
    'userAgent',
    'language',
    'hardwareConcurrency',
    'deviceMemory',
    'languages',
    'platform',
  ];
  props.forEach(prop => {
    results[prop] = String(navigator[prop]);
  });

  const canvasOffscreenWebgl = new OffscreenCanvas(256, 256);
  const contextWebgl = canvasOffscreenWebgl.getContext('webgl');
  if (contextWebgl) {
    const rendererInfo = contextWebgl.getExtension(
      'WEBGL_debug_renderer_info'
    );
    if (rendererInfo) {
      results.webglVendor = String(
        contextWebgl.getParameter(rendererInfo.UNMASKED_VENDOR_WEBGL)
      );
      results.webglRenderer = String(
        contextWebgl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL)
      );
    }
  }

  results.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return results;
}
