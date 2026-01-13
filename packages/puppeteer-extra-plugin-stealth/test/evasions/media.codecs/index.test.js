import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/media.codecs/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  getStealthFingerPrint,
  getVanillaFingerPrint,
  vanillaPuppeteer,
} from '../../util.js';

test.skip('vanilla: doesnt support proprietary codecs (requires fpcollect)', async () => {
  const { videoCodecs, audioCodecs } = await getVanillaFingerPrint();
  expect(videoCodecs).toEqual({ ogg: 'probably', h264: '', webm: 'probably' });
  expect(audioCodecs).toEqual({
    ogg: 'probably',
    mp3: 'probably',
    wav: 'probably',
    m4a: '',
    aac: '',
  });
});

test('vanilla: will not have modifications', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  // https://datadome.co/bot-detection/client-side-detection-is-essential-for-bot-protection/
  const test1 = await page.evaluate(() => {
    const audioElt = document.createElement('audio');
    return audioElt.canPlayType.toString();
  });
  expect(test1).toBe('function canPlayType() { [native code] }');

  const test2 = await page.evaluate(() => {
    const audioElt = document.createElement('audio');
    return audioElt.canPlayType.name;
  });
  expect(test2).toBe('canPlayType');
});

test.skip('stealth: supports proprietary codecs (requires fpcollect)', async () => {
  const { videoCodecs, audioCodecs } = await getStealthFingerPrint(Plugin);
  expect(videoCodecs).toEqual({
    ogg: 'probably',
    h264: 'probably',
    webm: 'probably',
  });
  expect(audioCodecs).toEqual({
    ogg: 'probably',
    mp3: 'probably',
    wav: 'probably',
    m4a: 'maybe',
    aac: 'probably',
  });
});

test('stealth: will not leak modifications', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  // https://datadome.co/bot-detection/client-side-detection-is-essential-for-bot-protection/
  const test1 = await page.evaluate(() => {
    const audioElt = document.createElement('audio');
    return audioElt.canPlayType.toString();
  });
  expect(test1).toBe('function canPlayType() { [native code] }');

  const test2 = await page.evaluate(() => {
    const audioElt = document.createElement('audio');
    return audioElt.canPlayType.name;
  });
  expect(test2).toBe('canPlayType');

  // Double check the plugin is active and spoofing e.g. the aac codec results
  const isWorkingTest = await page.evaluate(() => {
    const audioElt = document.createElement('audio');
    return audioElt.canPlayType('audio/aac') === 'probably'; // empty in Chromium without stealth plugin
  });
  expect(isWorkingTest).toBe(true);
});

test('vanilla: normal toString stuff', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const test1 = await page.evaluate(() => {
    const audioElt = document.createElement('audio');
    return audioElt.canPlayType.toString + '';
  });
  expect(test1).toBe('function toString() { [native code] }');
});

test('stealth: will not leak toString stuff', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const test1 = await page.evaluate(() => {
    const audioElt = document.createElement('audio');
    return audioElt.canPlayType.toString + '';
  });
  expect(test1).toBe('function toString() { [native code] }'); // returns function () { [native code] }
});
