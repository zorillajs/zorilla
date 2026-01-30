// https://github.com/bochkarev-artem/2captcha/blob/master/index.js
// TODO: Create our own API wrapper

import https from 'node:https';
import querystring from 'node:querystring';
import url from 'node:url';

let apiKey: string;
const apiInUrl = 'https://2captcha.com/in.php';
const apiResUrl = 'https://2captcha.com/res.php';
const apiMethod = 'base64';
const SOFT_ID = '2589';

interface CaptchaOptions {
  pollingInterval?: number;
  retries?: number;
}

interface CaptchaResult {
  id: string;
  text: string;
  challenge?: string;
}

type CaptchaCallback = (
  error: string | Error | null | undefined,
  result?: CaptchaResult,
  invalid?: (error?: string | Error) => void
) => void;

const defaultOptions: CaptchaOptions = {
  pollingInterval: 2000,
  retries: 3,
};

function pollCaptcha(
  captchaId: string,
  options: CaptchaOptions,
  invalid: (error?: string | Error) => void,
  callback: CaptchaCallback
) {
  invalid = invalid.bind({ options: options, captchaId: captchaId });
  const intervalId = setInterval(() => {
    const httpsRequestOptions = url.parse(
      apiResUrl +
        '?action=get&soft_id=' +
        SOFT_ID +
        '&key=' +
        apiKey +
        '&id=' +
        captchaId
    );
    const request = https.request(
      httpsRequestOptions,
      (response: import('http').IncomingMessage) => {
        let body = '';

        response.on('data', (chunk: string | Buffer) => {
          body += chunk;
        });

        response.on('end', () => {
          if (body === 'CAPCHA_NOT_READY') {
            return;
          }

          clearInterval(intervalId);

          const result = body.split('|');
          if (result[0] !== 'OK') {
            callback(result[0]); //error
          } else {
            callback(
              null,
              {
                id: captchaId,
                text: result[1] || '',
              },
              invalid
            );
          }
          callback = () => {}; // prevent the callback from being called more than once, if multiple https requests are open at the same time.
        });
      }
    );
    request.on('error', (e: Error) => {
      request.destroy();
      callback(e);
    });
    request.end();
  }, options.pollingInterval || defaultOptions.pollingInterval);
}

export const setApiKey = (key: string) => {
  apiKey = key;
};

export const decode = (
  base64: string,
  options: CaptchaOptions | CaptchaCallback,
  callback?: CaptchaCallback
) => {
  if (!callback) {
    callback = options as CaptchaCallback;
    options = defaultOptions;
  }
  const opts = options as CaptchaOptions;
  const cb = callback as CaptchaCallback;

  const httpsRequestOptions = { ...url.parse(apiInUrl), method: 'POST' };

  const postData: Record<string, string | number> = {
    method: apiMethod,
    key: apiKey,
    soft_id: SOFT_ID,
    body: base64,
  };

  const postDataString = querystring.stringify(postData);

  const request = https.request(
    httpsRequestOptions,
    (response: import('http').IncomingMessage) => {
      let body = '';

      response.on('data', (chunk: string | Buffer) => {
        body += chunk;
      });

      response.on('end', () => {
        const result = body.split('|');
        if (result[0] !== 'OK') {
          return cb(result[0]);
        }

        pollCaptcha(
          result[1] || '',
          opts,
          function (
            this: { options: CaptchaOptions; captchaId: string },
            error?: string | Error
          ) {
            const callbackToInitialCallback = cb;

            report(this.captchaId);

            if (error) {
              return callbackToInitialCallback('CAPTCHA_FAILED');
            }

            if (!this.options.retries) {
              this.options.retries = defaultOptions.retries;
            }
            if (this.options.retries && this.options.retries > 1) {
              this.options.retries = this.options.retries - 1;
              decode(base64, this.options, cb);
            } else {
              callbackToInitialCallback('CAPTCHA_FAILED_TOO_MANY_TIMES');
            }
          },
          cb
        );
      });
    }
  );
  request.on('error', (e: Error) => {
    request.destroy();
    cb(e);
  });

  request.write(postDataString);
  request.end();
};

export const decodeReCaptcha = (
  captchaMethod: string,
  captcha: string,
  pageUrl: string,
  extraData: Record<string, string | number>,
  options: CaptchaOptions | CaptchaCallback,
  callback?: CaptchaCallback
) => {
  if (!callback) {
    callback = options as CaptchaCallback;
    options = defaultOptions;
  }
  const opts = options as CaptchaOptions;
  const cb = callback as CaptchaCallback;

  const httpsRequestOptions = { ...url.parse(apiInUrl), method: 'POST' };

  const postData: Record<string, string | number> = {
    method: captchaMethod,
    key: apiKey,
    soft_id: SOFT_ID,
    // googlekey: captcha,
    pageurl: pageUrl,
    ...extraData,
  };
  if (captchaMethod === 'userrecaptcha') {
    postData.googlekey = captcha;
  }
  if (captchaMethod === 'hcaptcha') {
    postData.sitekey = captcha;
  }

  const postDataString2 = querystring.stringify(postData);

  const request = https.request(
    httpsRequestOptions,
    (response: import('http').IncomingMessage) => {
      let body = '';

      response.on('data', (chunk: string | Buffer) => {
        body += chunk;
      });

      response.on('end', () => {
        const result = body.split('|');
        if (result[0] !== 'OK') {
          return cb(result[0]);
        }

        pollCaptcha(
          result[1] || '',
          opts,
          function (
            this: { options: CaptchaOptions; captchaId: string },
            error?: string | Error
          ) {
            const callbackToInitialCallback = cb;

            report(this.captchaId);

            if (error) {
              return callbackToInitialCallback('CAPTCHA_FAILED');
            }

            if (!this.options.retries) {
              this.options.retries = defaultOptions.retries;
            }
            if (this.options.retries && this.options.retries > 1) {
              this.options.retries = this.options.retries - 1;
              decodeReCaptcha(
                captchaMethod,
                captcha,
                pageUrl,
                extraData,
                this.options,
                cb
              );
            } else {
              callbackToInitialCallback('CAPTCHA_FAILED_TOO_MANY_TIMES');
            }
          },
          cb
        );
      });
    }
  );
  request.on('error', (e: Error) => {
    request.destroy();
    cb(e);
  });
  request.write(postDataString2);
  request.end();
};

export const decodeUrl = (
  uri: string,
  options: CaptchaOptions | CaptchaCallback,
  callback?: CaptchaCallback
) => {
  if (!callback) {
    callback = options as CaptchaCallback;
    options = defaultOptions;
  }
  const opts = options as CaptchaOptions;
  const cb = callback as CaptchaCallback;

  const requestOptions = url.parse(uri);

  const request = https.request(
    requestOptions,
    (response: import('http').IncomingMessage) => {
      let body = '';
      response.setEncoding('base64');

      response.on('data', (chunk: string | Buffer) => {
        body += chunk;
      });

      response.on('end', () => {
        decode(body, opts, cb);
      });
    }
  );
  request.on('error', (e: Error) => {
    request.destroy();
    cb(e);
  });
  request.end();
};

export const solveRecaptchaFromHtml = (
  html: string,
  options: CaptchaOptions | CaptchaCallback,
  callback?: CaptchaCallback
) => {
  let finalCallback: CaptchaCallback;
  let finalOptions: CaptchaOptions;

  if (!callback) {
    finalCallback = options as CaptchaCallback;
    finalOptions = defaultOptions;
  } else {
    finalCallback = callback;
    finalOptions = options as CaptchaOptions;
  }

  const googleUrlParts = html.split('/challenge?k=');
  if (googleUrlParts.length < 2 || !googleUrlParts[1])
    return finalCallback('No captcha found in html');
  let googleUrl = googleUrlParts[1];
  const quoteSplit = googleUrl.split('"')[0];
  if (!quoteSplit) return finalCallback('No captcha found in html');
  const apostropheSplit = quoteSplit.split("'")[0];
  if (!apostropheSplit) return finalCallback('No captcha found in html');
  googleUrl =
    'https://www.google.com/recaptcha/api/challenge?k=' + apostropheSplit;

  const httpsRequestOptions = url.parse(googleUrl);

  const request = https.request(
    httpsRequestOptions,
    (response: import('http').IncomingMessage) => {
      let body = '';
      response.on('data', (chunk: Buffer | string) => {
        body += chunk;
      });

      response.on('end', () => {
        const challengeArr = body.split("'");
        if (!challengeArr[1]) return finalCallback('Parsing captcha failed');
        const challenge = challengeArr[1];
        if (challenge.length === 0)
          return finalCallback('Parsing captcha failed');

        decodeUrl(
          'https://www.google.com/recaptcha/api/image?c=' + challenge,
          finalOptions,
          (error, result, invalid) => {
            if (result) {
              result.challenge = challenge;
            }
            finalCallback(error, result, invalid);
          }
        );
      });
    }
  );
  request.end();
};

export const report = (captchaId: string) => {
  const reportUrl =
    apiResUrl +
    '?action=reportbad&soft_id=' +
    SOFT_ID +
    '&key=' +
    apiKey +
    '&id=' +
    captchaId;
  const options = url.parse(reportUrl);

  const request = https.request(
    options,
    (_response: import('http').IncomingMessage) => {
      // var body = ''
      // response.on('data', function(chunk) {
      //   body += chunk
      // })
      // response.on('end', function() {})
    }
  );
  request.end();
};
