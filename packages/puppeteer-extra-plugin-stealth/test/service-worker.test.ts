import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, expect, test } from 'vitest';
import Plugin from '../dist/index.js';
import { addExtra, getDefaultLaunchArgs, vanillaPuppeteer } from './util.js';

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

  return `http://127.0.0.1:${server.address().port}/`;
};

let browser, page, worker;

beforeAll(async () => {
  const address = await httpServer();
  console.log(`Server is running on port ${address}`);

  browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true, args: getDefaultLaunchArgs() });
  page = await browser.newPage();

  worker = new Promise(resolve => {
    browser.on('targetcreated', async target => {
      if (target.type() === 'service_worker') {
        resolve(target.worker());
      }
    });
  });

  await page.goto(address);
  worker = await worker;
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
  const results = {};

  const props = [
    'userAgent',
    'language',
    'hardwareConcurrency',
    'deviceMemory',
    'languages',
    'platform',
  ];
  props.forEach(el => {
    results[el] = navigator[el].toString();
  });

  const canvasOffscreenWebgl = new OffscreenCanvas(256, 256);
  const contextWebgl = canvasOffscreenWebgl.getContext('webgl');
  const rendererInfo = contextWebgl.getExtension('WEBGL_debug_renderer_info');
  results.webglVendor = contextWebgl.getParameter(
    rendererInfo.UNMASKED_VENDOR_WEBGL
  );
  results.webglRenderer = contextWebgl.getParameter(
    rendererInfo.UNMASKED_RENDERER_WEBGL
  );

  results.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return results;
}
