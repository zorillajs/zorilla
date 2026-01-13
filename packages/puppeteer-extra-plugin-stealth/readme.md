# puppeteer-extra-plugin-stealth [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/zorillajs/zorilla/test.yml?branch=master&event=push) [![Discord](https://img.shields.io/discord/737009125862408274)](https://extra.community) [![npm](https://img.shields.io/npm/v/puppeteer-extra-plugin-stealth.svg)](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth)

> A plugin for [`puppeteer-extra`](https://github.com/zorillajs/zorilla/tree/master/packages/puppeteer-extra) and [`playwright-extra`](https://github.com/zorillajs/zorilla/tree/master/packages/playwright-extra) to prevent detection.

<p align="center"><img src="https://i.imgur.com/q2xBjqH.png" /></p>

## Install

```bash
npm install @zorilla/puppeteer-extra-plugin-stealth
```

If this is your first [`puppeteer-extra`](https://github.com/zorillajs/zorilla) plugin here's everything you need:

```bash
npm install puppeteer @zorilla/puppeteer-extra @zorilla/puppeteer-extra-plugin-stealth
```

## Usage

```js
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
import puppeteer from '@zorilla/puppeteer-extra'

// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {
  console.log('Running tests..')
  const page = await browser.newPage()
  await page.goto('https://bot.sannysoft.com')
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'testresult.png', fullPage: true })
  await browser.close()
  console.log(`All done, check the screenshot. ✨`)
})
```

<details>
 <summary><strong>TypeScript usage</strong></summary><br/>

> `puppeteer-extra` and most plugins are written in TS,
> so you get perfect type support out of the box. :)

```ts
import puppeteer from '@zorilla/puppeteer-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

puppeteer
  .use(StealthPlugin())
  .launch({ headless: true })
  .then(async browser => {
    const page = await browser.newPage()
    await page.goto('https://bot.sannysoft.com')
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'stealth.png', fullPage: true })
    await browser.close()
  })
```

> Please check this [wiki](https://github.com/zorillajs/zorilla/wiki/TypeScript-usage) entry in case you have TypeScript related import issues.

</details><br>

> Please check out the [puppeteer-extra package](https://github.com/zorillajs/zorilla/tree/master/packages/puppeteer-extra) to learn more about `puppeteer-extra` (Firefox usage, other Plugins, etc).

## Status

- ✅ **`puppeteer-extra` with stealth passes all public bot tests.**

Please note: I consider this a friendly competition in a rather interesting cat and mouse game. If the other team (👋) wants to detect headless chromium there are still ways to do that (at least I noticed a few, which I'll tackle in future updates).

It's probably impossible to prevent all ways to detect headless chromium, but it should be possible to make it so difficult that it becomes cost-prohibitive or triggers too many false-positives to be feasible.

If something new comes up or you experience a problem, please do your homework and create a PR in a respectful way (this is Github, not reddit) or I might not be motivated to help. :)

## Test results (red is bad)

#### Vanilla puppeteer <strong>without stealth 😢</strong>

<table class="image">
<tr>

  <td><figure class="image"><a href="./stealthtests/_results/headless-chromium-vanilla.js.png"><img src="./stealthtests/_results/_thumbs/headless-chromium-vanilla.js.png"></a><figcaption>Chromium + headless</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headful-chromium-vanilla.js.png"><img src="./stealthtests/_results/_thumbs/headful-chromium-vanilla.js.png"></a><figcaption>Chromium + headful</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headless-chrome-vanilla.js.png"><img src="./stealthtests/_results/_thumbs/headless-chrome-vanilla.js.png"></a><figcaption>Chrome + headless</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headful-chrome-vanilla.js.png"><img src="./stealthtests/_results/_thumbs/headful-chrome-vanilla.js.png"></a><figcaption>Chrome + headful</figcaption></figure></td>

</tr>
</table>

#### Puppeteer <strong>with stealth plugin 💯</strong>

<table class="image">
<tr>

  <td><figure class="image"><a href="./stealthtests/_results/headless-chromium-stealth.js.png"><img src="./stealthtests/_results/_thumbs/headless-chromium-stealth.js.png"></a><figcaption>Chromium + headless</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headful-chromium-stealth.js.png"><img src="./stealthtests/_results/_thumbs/headful-chromium-stealth.js.png"></a><figcaption>Chromium + headful</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headless-chrome-stealth.js.png"><img src="./stealthtests/_results/_thumbs/headless-chrome-stealth.js.png"></a><figcaption>Chrome + headless</figcaption></figure></td>
  <td><figure class="image"><a href="./stealthtests/_results/headful-chrome-stealth.js.png"><img src="./stealthtests/_results/_thumbs/headful-chrome-stealth.js.png"></a><figcaption>Chrome + headful</figcaption></figure></td>

</tr>
</table>

> Note: The `MQ_SCREEN` test is broken on their page (will fail in regular Chrome as well).

Tests have been done using [this test site](https://bot.sannysoft.com/) and [these scripts](./stealthtests/).

#### Improved reCAPTCHA v3 scores

Using stealth also seems to help with maintaining a normal [reCAPTCHA v3 score](https://developers.google.com/recaptcha/docs/v3#score).

<table class="image">
<tr>

  <td><figure class="image"><figcaption><code>Regular Puppeteer</code></figcaption><br/><img src="https://i.imgur.com/rHEH69b.png"></figure></td>
  <td><figure class="image"><figcaption><code>Stealth Puppeteer</code></figcaption><br/><img src="https://i.imgur.com/2if496Z.png"></figure></td>

</tr>
</table>

Note: The [official test](https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php) is to be taken with a grain of salt, as the score is calculated individually per site and multiple other factors (past behaviour, IP address, etc). Based on anecdotal observations it still seems to work as a rough indicator.

_**Tip:** Have a look at the [recaptcha plugin](https://github.com/zorillajs/zorilla/tree/master/packages/puppeteer-extra-plugin-recaptcha) if you have issues with reCAPTCHAs._

## API


#### Table of Contents

- [puppeteer-extra-plugin-stealth \[ ](#puppeteer-extra-plugin-stealth---)
  - [Install](#install)
  - [Usage](#usage)
  - [Status](#status)
  - [Changelog](#changelog)
    - [`v2.4.7`](#v247)
    - [`v2.4.2` / `v2.4.1`](#v242--v241)
    - [`v2.4.0`](#v240)
  - [Test results (red is bad)](#test-results-red-is-bad)
    - [Vanilla puppeteer without stealth 😢](#vanilla-puppeteer-without-stealth-)
    - [Puppeteer with stealth plugin 💯](#puppeteer-with-stealth-plugin-)
    - [Improved reCAPTCHA v3 scores](#improved-recaptcha-v3-scores)
  - [API](#api)
    - [Table of Contents](#table-of-contents)
    - [class: StealthPlugin](#class-stealthplugin)
      - [Purpose](#purpose)
      - [Modularity](#modularity)
      - [Contributing](#contributing)
      - [Kudos](#kudos)
      - [.availableEvasions](#availableevasions)
      - [.enabledEvasions](#enabledevasions)
    - [defaultExport(opts?)](#defaultexportopts)
  - [License](#license)

### class: [StealthPlugin](https://github.com/zorillajs/zorilla/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/index.js#L72-L162)

- `opts` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** Options (optional, default `{}`)
  - `opts.enabledEvasions` **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>?** Specify which evasions to use (by default all)

**Extends: PuppeteerExtraPlugin**

Stealth mode: Applies various techniques to make detection of headless puppeteer harder. 💯

#### Purpose

There are a couple of ways the use of puppeteer can easily be detected by a target website.
The addition of `HeadlessChrome` to the user-agent being only the most obvious one.

The goal of this plugin is to be the definite companion to puppeteer to avoid
detection, applying new techniques as they surface.

As this cat & mouse game is in it's infancy and fast-paced the plugin
is kept as flexibile as possible, to support quick testing and iterations.

#### Modularity

This plugin uses `puppeteer-extra`'s dependency system to only require
code mods for evasions that have been enabled, to keep things modular and efficient.

The `stealth` plugin is a convenience wrapper that requires multiple [evasion techniques](./evasions/)
automatically and comes with defaults. You could also bypass the main module and require
specific evasion plugins yourself, if you whish to do so (as they're standalone `puppeteer-extra` plugins):

```js
// bypass main module and import a specific stealth plugin directly:
import ConsoleDebug from '@zorilla/puppeteer-extra-plugin-stealth/evasions/console.debug'
puppeteer.use(ConsoleDebug())
```

#### Contributing

PRs are welcome, if you want to add a new evasion technique I suggest you
look at the [template](./evasions/_template) to kickstart things.

#### Kudos

Thanks to [Evan Sangaline](https://intoli.com/blog/not-possible-to-block-chrome-headless/) and [Paul Irish](https://github.com/paulirish/headless-cat-n-mouse) for kickstarting the discussion!

---

Example:

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

// Enable stealth plugin with all evasions
puppeteer.use(StealthPlugin())
;(async () => {
  // Launch the browser in headless mode and set up a page.
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: true
  })
  const page = await browser.newPage()

  // Navigate to the page that will perform the tests.
  const testUrl =
    'https://intoli.com/blog/' +
    'not-possible-to-block-chrome-headless/chrome-headless-test.html'
  await page.goto(testUrl)

  // Save a screenshot of the results.
  const screenshotPath = '/tmp/headless-test-result.png'
  await page.screenshot({ path: screenshotPath })
  console.log('have a look at the screenshot:', screenshotPath)

  await browser.close()
})()
```

---

#### .[availableEvasions](https://github.com/zorillajs/zorilla/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/index.js#L128-L130)

Type: **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**

Get all available evasions.

Please look into the [evasions directory](./evasions/) for an up to date list.

Example:

```javascript
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

const pluginStealth = StealthPlugin()
console.log(pluginStealth.availableEvasions) // => Set { 'user-agent', 'console.debug' }
puppeteer.use(pluginStealth)
```

---

#### .[enabledEvasions](https://github.com/zorillajs/zorilla/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/index.js#L145-L147)

Type: **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**

Get all enabled evasions.

Enabled evasions can be configured either through `opts` or by modifying this property.

Example:

```javascript
// Remove specific evasion from enabled ones dynamically
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

const pluginStealth = StealthPlugin()
pluginStealth.enabledEvasions.delete('console.debug')
puppeteer.use(pluginStealth)
```

---

### [defaultExport(opts?)](https://github.com/zorillajs/zorilla/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/index.js#L170-L170)

- `opts` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** Options
  - `opts.enabledEvasions` **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>?** Specify which evasions to use (by default all)

Default export, PuppeteerExtraStealthPlugin

---

## License

[MIT](./LICENSE)
