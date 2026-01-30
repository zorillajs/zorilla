/// <reference path="../src/puppeteer-mods.d.ts" />

import { addExtra } from '@zorilla/puppeteer-extra';
import { expect, test } from 'vitest';
import RecaptchaPlugin from '../src/index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

test('will solve reCAPTCHAs', async () => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    expect('foo').toBeTruthy();
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.');
    return;
  }

  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN,
    },
  });
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const url = 'https://www.google.com/recaptcha/api2/demo';
  await page.goto(url, { waitUntil: 'networkidle0' });

  const result = await page.solveRecaptchas();

  const { captchas, solutions, solved, error } = result;
  expect(error).toBeFalsy();

  expect(captchas.length).toBe(1);
  expect(solutions.length).toBe(1);
  expect(solved.length).toBe(1);
  expect(solved[0]._vendor).toBe('recaptcha');
  expect(solved[0].isSolved).toBe(true);

  await browser.close();
});

test('will solve hCAPTCHAs', async () => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    expect('foo').toBeTruthy();
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.');
    return;
  }

  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN,
    },
  });
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const urls = [
    'https://accounts.hcaptcha.com/demo',
    'http://democaptcha.com/demo-form-eng/hcaptcha.html',
  ];

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle0' });

    const result = await page.solveRecaptchas();
    const { captchas, solutions, solved, error } = result;
    expect(error).toBeFalsy();

    expect(captchas.length).toBe(1);
    expect(solutions.length).toBe(1);
    expect(solved.length).toBe(1);
    expect(solved[0]._vendor).toBe('hcaptcha');
    expect(solved[0].isSolved).toBe(true);
  }

  await browser.close();
});

test('will solve reCAPTCHA enterprise', async () => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    expect('foo').toBeTruthy();
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.');
    return;
  }

  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN,
      opts: {
        useEnterpriseFlag: false, // Not sure but using the enterprise flag makes it worse
      },
    },
  });
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const url =
    'https://berstend.github.io/static/recaptcha/enterprise-checkbox-explicit.html';
  await page.goto(url, { waitUntil: 'networkidle0' });

  const result = await page.solveRecaptchas();

  const { captchas, solutions, solved, error } = result;
  expect(error).toBeFalsy();

  expect(captchas.length).toBe(1);
  expect(solutions.length).toBe(1);
  expect(solved.length).toBe(1);
  expect(solved[0]._vendor).toBe('recaptcha');
  expect(solved[0].isSolved).toBe(true);

  await browser.close();
});

test('will solve multiple reCAPTCHAs', async () => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    expect('foo').toBeTruthy();
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.');
    return;
  }

  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN,
      opts: {
        useEnterpriseFlag: false, // Not sure but using the enterprise flag makes it worse
      },
    },
  });
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const url =
    'https://berstend.github.io/static/recaptcha/v2-checkbox-explicit-multi.html';
  await page.goto(url, { waitUntil: 'networkidle0' });

  page.on('dialog', async dialog => {
    dialog.dismiss(); // the test page has blocking `alert`s
  });

  const result = await page.solveRecaptchas();

  const { captchas, solutions, solved, error } = result;
  expect(error).toBeFalsy();

  expect(captchas.length).toBe(3);
  expect(solutions.length).toBe(3);
  expect(solved.length).toBe(3);
  expect(solved[0]._vendor).toBe('recaptcha');
  expect(solved[0].isSolved).toBe(true);

  await browser.close();
});

test('will not solve inactive invisible reCAPTCHAs by default', async () => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    expect('foo').toBeTruthy();
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.');
    return;
  }

  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN,
    },
  });
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const url =
    'https://berstend.github.io/static/recaptcha/v2-invisible-auto.html';
  await page.goto(url, { waitUntil: 'networkidle0' });

  const result = await page.solveRecaptchas();

  const { captchas, solutions, solved, error } = result;
  expect(error).toBeFalsy();

  expect(captchas.length).toBe(0);
  expect(solutions.length).toBe(0);
  expect(solved.length).toBe(0);

  await browser.close();
});

test('will not solve score based reCAPTCHAs by default', async () => {
  if (!process.env.TWOCAPTCHA_TOKEN) {
    expect('foo').toBeTruthy();
    console.log('TWOCAPTCHA_TOKEN not set, skipping test.');
    return;
  }

  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN,
    },
  });
  puppeteer.use(recaptchaPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });
  const page = await browser.newPage();

  const url =
    'https://berstend.github.io/static/recaptcha/v3-programmatic.html';

  await page.goto(url, { waitUntil: 'networkidle0' });

  const result = await page.solveRecaptchas();

  const { captchas, solutions, solved, error } = result;
  expect(error).toBeFalsy();

  expect(captchas.length).toBe(0);
  expect(solutions.length).toBe(0);
  expect(solved.length).toBe(0);

  await browser.close();
});
