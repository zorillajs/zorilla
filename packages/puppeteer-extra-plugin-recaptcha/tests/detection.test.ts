/// <reference path="../src/puppeteer-mods.d.ts" />

import { addExtra } from '@zorilla/puppeteer-extra';
import { expect, test } from 'vitest';
import RecaptchaPlugin from '../src/index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

const getBrowser = async (url = '', opts = {}) => {
  const puppeteer = addExtra(require('puppeteer'));
  const recaptchaPlugin = RecaptchaPlugin(opts);
  puppeteer.use(recaptchaPlugin);
  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  return { browser, page };
};

test('will correctly detect v2-checkbox-auto.html', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-checkbox-auto.html';
  const { browser, page } = await getBrowser(url);
  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);

  const c = captchas[0];
  expect(c._vendor).toBe('recaptcha');
  expect(c._type).toBe('checkbox');
  expect(c.url).toBe(url);

  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.widgetId).toBe(0);
  expect(c.display).not.toBe(undefined);
  expect(c.callback).toBe(undefined);

  expect(c.hasResponseElement).toBe(true);
  expect(c.isEnterprise).toBe(false);
  expect(c.isInViewport).toBe(true);
  expect(c.isInvisible).toBe(false);

  await browser.close();
});

test('will correctly detect v2-checkbox-auto-nowww.html', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-checkbox-auto-nowww.html';
  const { browser, page } = await getBrowser(url);
  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);

  const c = captchas[0];
  expect(c._vendor).toBe('recaptcha');
  expect(c.callback).toBe(undefined);
  expect(c.hasResponseElement).toBe(true);
  expect(c.url).toBe(url);
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.widgetId).toBe(0);
  expect(c.display).not.toBe(undefined);

  await browser.close();
});

test('will correctly detect v2-checkbox-auto-recaptchadotnet.html', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-checkbox-auto-recaptchadotnet.html';
  const { browser, page } = await getBrowser(url);
  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);

  const c = captchas[0];
  expect(c._vendor).toBe('recaptcha');
  expect(c.callback).toBe(undefined);
  expect(c.hasResponseElement).toBe(true);
  expect(c.url).toBe(url);
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.widgetId).toBe(0);
  expect(c.display).not.toBe(undefined);

  await browser.close();
});

test('will correctly detect enterprise-checkbox-auto.html', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/enterprise-checkbox-auto.html';
  const { browser, page } = await getBrowser(url);
  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);

  const c = captchas[0];
  expect(c._vendor).toBe('recaptcha');
  expect(c.callback).toBe(undefined);
  expect(c.isEnterprise).toBe(true);
  expect(c.hasResponseElement).toBe(true);
  expect(c.url).toBe(url);
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.widgetId).toBe(0);
  expect(c.display).not.toBe(undefined);

  await browser.close();
});

test('will correctly detect enterprise-checkbox-auto-recaptchadotnet.html', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/enterprise-checkbox-auto-recaptchadotnet.html';
  const { browser, page } = await getBrowser(url);
  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);

  const c = captchas[0];
  expect(c._vendor).toBe('recaptcha');
  expect(c.callback).toBe(undefined);
  expect(c.isEnterprise).toBe(true);
  expect(c.hasResponseElement).toBe(true);
  expect(c.url).toBe(url);
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.widgetId).toBe(0);
  expect(c.display).not.toBe(undefined);

  await browser.close();
});

test('will correctly detect enterprise-checkbox-explicit.html', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/enterprise-checkbox-explicit.html';
  const { browser, page } = await getBrowser(url);
  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);

  const c = captchas[0];
  expect(c._vendor).toBe('recaptcha');
  expect(c.callback).toBe(undefined);
  expect(c.action).toBe('homepage'); // NOTE
  expect(c.isEnterprise).toBe(true);
  expect(c.hasResponseElement).toBe(true);
  expect(c.url).toBe(url);
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.widgetId).toBe(0);
  expect(c.display).not.toBe(undefined);

  await browser.close();
});

test('will correctly detect v2-invisible-explicit-isolated.html', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-invisible-explicit-isolated.html';
  const { browser, page } = await getBrowser(url, {
    solveInactiveChallenges: true,
  });
  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);

  const c = captchas[0];
  expect(c.url).toBe(url);
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.display).not.toBe(undefined);
  expect(c.id).not.toBe(undefined);

  delete c.url;
  delete c.sitekey;
  delete c.display;
  delete c.id;

  expect(c).toEqual({
    callback: 'onSubmit',
    _vendor: 'recaptcha',
    s: null,
    widgetId: 100000,
    hasResponseElement: true,
    isEnterprise: false,
    isInViewport: true,
    isInvisible: true,
    _type: 'invisible',
    filtered: false,
    filteredReason: 'solveInViewportOnly',
    hasActiveChallengePopup: true,
    hasChallengeFrame: true,
  });

  await browser.close();
});

test.skip('will correctly detect v2-invisible-auto.html - active challenge', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/v2-invisible-explicit.html';
  const { browser, page } = await getBrowser('about:blank');
  await page.setUserAgent('BOT'); // we want to trigger the invisible recaptcha challenge window
  await page.goto(url, { waitUntil: 'networkidle2' });

  await new Promise(resolve => setTimeout(resolve, 1000));

  await page.click('#submit');

  await new Promise(resolve => setTimeout(resolve, 1000));

  if (page.url() !== url) {
    // we didn't get a challenge
    expect('foo').toBeTruthy();
    return;
  }

  const { captchas, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);

  const c = captchas[0];
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.display).not.toBe(undefined);
  expect(c.id).not.toBe(undefined);

  delete c.url;
  delete c.sitekey;
  delete c.display;
  delete c.id;

  expect(c).toEqual({
    callback: 'onSubmit',
    _vendor: 'recaptcha',
    s: null,
    widgetId: 0,
    hasResponseElement: true,
    isEnterprise: false,
    isInViewport: true,
    isInvisible: true,
    _type: 'invisible',
    hasActiveChallengePopup: true, // the important bit
    hasChallengeFrame: true,
  });

  await browser.close();
});

test('will correctly detect v3-programmatic.html with solveScoreBased:false and filter captcha', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/v3-programmatic.html';
  const { browser, page } = await getBrowser(url, {
    solveScoreBased: false,
  });
  const { captchas, filtered, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(0);
  expect(filtered.length).toBe(1);

  const c = filtered[0];
  expect(c.url).toBe(url);
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.display).not.toBe(undefined);
  expect(c.id).not.toBe(undefined);

  delete c.url;
  delete c.sitekey;
  delete c.display;
  delete c.id;

  expect(c).toEqual({
    _vendor: 'recaptcha',
    s: null,
    widgetId: 100000,
    hasResponseElement: true,
    isEnterprise: false,
    isInViewport: true,
    isInvisible: true,
    _type: 'score',
    hasActiveChallengePopup: false,
    hasChallengeFrame: false, // important
    filtered: true, // important
    filteredReason: 'solveScoreBased', // important
  });

  await browser.close();
});

test('will correctly detect v3-programmatic.html with solveScoreBased:true', async () => {
  const url =
    'https://berstend.github.io/static/recaptcha/v3-programmatic.html';
  const { browser, page } = await getBrowser(url, {
    solveScoreBased: true,
  });
  const { captchas, filtered, error } = await page.findRecaptchas();
  expect(error).toBe(null);
  expect(captchas.length).toBe(1);
  expect(filtered.length).toBe(0);

  const c = captchas[0];
  expect(c.url).toBe(url);
  expect(c.sitekey && c.sitekey.length > 5).toBe(true);
  expect(c.display).not.toBe(undefined);
  expect(c.id).not.toBe(undefined);

  delete c.url;
  delete c.sitekey;
  delete c.display;
  delete c.id;

  expect(c).toEqual({
    _vendor: 'recaptcha',
    s: null,
    widgetId: 100000,
    hasResponseElement: true,
    isEnterprise: false,
    isInViewport: true,
    isInvisible: true,
    _type: 'score',
    filtered: false,
    filteredReason: 'solveInViewportOnly',
    hasActiveChallengePopup: false,
    hasChallengeFrame: false, // important
  });

  await browser.close();
});
