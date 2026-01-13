/// <reference path="./puppeteer-mods.d.ts" />

import { expect, test } from 'vitest';
import RecaptchaPlugin from './index.js';
// import * as types from './types'

// import { Puppeteer } from './puppeteer-mods'

import { addExtra } from 'puppeteer-extra';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

test('will detect reCAPTCHAs', async () => {
  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin();
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const url = 'https://www.google.com/recaptcha/api2/demo';
  await page.goto(url, { waitUntil: 'networkidle0' });

  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);

  const c = captchas[0];
  expect(c._vendor).toBe('recaptcha');
  expect(c.callback).toBe('onSuccess');
  expect(c.hasResponseElement).toBe(true);
  expect(c.url).toBe(url);
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);

  await browser.close();
});

test.skip('will detect hCAPTCHAs', async () => {
  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin();
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const urls = [
    'https://accounts.hcaptcha.com/demo',
    'https://democaptcha.com/demo-form-eng/hcaptcha.html',
  ];

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle0' });

    const { captchas, error } = await page.findRecaptchas();
    expect(error).toBe(null);
    expect(captchas.length).toBe(1);

    const c = captchas[0];
    expect(c._vendor).toBe('hcaptcha');
    expect(c.url).toBe(url);
    expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  }

  await browser.close();
});

test.skip('will detect active hCAPTCHA challenges', async () => {
  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin();
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const urls = [
    'https://accounts.hcaptcha.com/demo',
    'https://democaptcha.com/demo-form-eng/hcaptcha.html',
  ];

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => window.hcaptcha?.execute()); // trigger challenge popup
    await new Promise(resolve => setTimeout(resolve, 2 * 1000));
    await page.evaluate(() =>
      document
        .querySelector(`[data-hcaptcha-widget-id]:not([src*='invisible'])`)
        .remove()
    ); // remove regular checkbox so we definitely test against the popup

    const { captchas, error } = await page.findRecaptchas();
    expect(error).toBe(null);
    expect(captchas.length).toBe(1);

    const c = captchas[0];
    expect(c._vendor).toBe('hcaptcha');
    expect(c.url).toBe(url);
    expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  }

  await browser.close();
});

test('will not throw when no captchas are found', async () => {
  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin();
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const url = 'https://www.example.com';
  await page.goto(url, { waitUntil: 'networkidle0' });

  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(0);

  await browser.close();
});

// TODO: test/mock the rest
