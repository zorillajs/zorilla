export const PROVIDER_ID = '2captcha';

import Debug from 'debug';
import type * as types from '../types.js';

const debug = Debug(`puppeteer-extra-plugin:recaptcha:${PROVIDER_ID}`);

// const solver = require('./2captcha-api')
import * as solver from './2captcha-api.js';

const secondsBetweenDates = (before: Date, after: Date) =>
  (after.getTime() - before.getTime()) / 1000;

export interface DecodeRecaptchaAsyncResult {
  err?: Error | string | null | undefined;
  result?: { text?: string; id?: string };
  invalid?: (error?: string | Error) => void;
}

export interface TwoCaptchaProviderOpts {
  useEnterpriseFlag?: boolean;
  useActionValue?: boolean;
}

const providerOptsDefaults: TwoCaptchaProviderOpts = {
  useEnterpriseFlag: false, // Seems to make solving chance worse?
  useActionValue: true,
};

async function decodeRecaptchaAsync(
  token: string,
  vendor: types.CaptchaVendor,
  sitekey: string,
  url: string,
  extraData: Record<string, string | number>,
  opts = { pollingInterval: 2000 }
): Promise<DecodeRecaptchaAsyncResult> {
  return new Promise(resolve => {
    const cb = (
      err: Error | string | null | undefined,
      result?: { text?: string; id?: string },
      invalid?: (error?: string | Error) => void
    ) => resolve({ err, result, invalid });
    try {
      solver.setApiKey(token);

      let method = 'userrecaptcha';
      if (vendor === 'hcaptcha') {
        method = 'hcaptcha';
      }
      solver.decodeReCaptcha(method, sitekey, url, extraData, opts, cb);
    } catch (error) {
      return resolve({
        err: error instanceof Error ? error : String(error),
      });
    }
  });
}

export async function getSolutions(
  captchas: types.CaptchaInfo[] = [],
  token: string = '',
  opts: TwoCaptchaProviderOpts = {}
): Promise<types.GetSolutionsResult> {
  opts = { ...providerOptsDefaults, ...opts };
  const solutions = await Promise.all(
    captchas.map(c => getSolution(c, token, opts))
  );
  const errorSolution = solutions.find(s => !!s.error);
  return { solutions, error: errorSolution?.error ?? null };
}

async function getSolution(
  captcha: types.CaptchaInfo,
  token: string,
  opts: TwoCaptchaProviderOpts
): Promise<types.CaptchaSolution> {
  const solution: types.CaptchaSolution = {
    _vendor: captcha._vendor,
    provider: PROVIDER_ID,
  };
  try {
    if (!captcha || !captcha.sitekey || !captcha.url || !captcha.id) {
      throw new Error('Missing data in captcha');
    }
    solution.id = captcha.id;
    solution.requestAt = new Date();
    debug('Requesting solution..', solution);
    const extraData: Record<string, string | number> = {};
    if (captcha.s) {
      extraData['data-s'] = captcha.s; // google site specific property
    }
    if (opts.useActionValue && captcha.action) {
      extraData.action = captcha.action; // Optional v3/enterprise action
    }
    if (opts.useEnterpriseFlag && captcha.isEnterprise) {
      extraData.enterprise = 1;
    }

    if (
      process.env['2CAPTCHA_PROXY_TYPE'] &&
      process.env['2CAPTCHA_PROXY_ADDRESS']
    ) {
      extraData.proxytype = process.env['2CAPTCHA_PROXY_TYPE'].toUpperCase();
      extraData.proxy = process.env['2CAPTCHA_PROXY_ADDRESS'];
    }

    const { err, result, invalid } = await decodeRecaptchaAsync(
      token,
      captcha._vendor,
      captcha.sitekey,
      captcha.url,
      extraData
    );
    debug('Got response', { err, result, invalid });
    if (err) throw new Error(`${PROVIDER_ID} error: ${err}`);
    if (!result || !result.text || !result.id) {
      throw new Error(`${PROVIDER_ID} error: Missing response data: ${result}`);
    }
    solution.providerCaptchaId = result.id;
    solution.text = result.text;
    solution.responseAt = new Date();
    solution.hasSolution = !!solution.text;
    solution.duration = secondsBetweenDates(
      solution.requestAt,
      solution.responseAt
    );
  } catch (error) {
    debug('Error', error);
    solution.error = error instanceof Error ? error.message : String(error);
  }
  return solution;
}
