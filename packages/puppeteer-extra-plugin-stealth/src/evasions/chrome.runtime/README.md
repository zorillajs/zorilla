## API


#### Table of Contents

- [class: Plugin](#class-plugin)
- [sendMessageHandler()](#sendmessagehandler)
- [connectHandler()](#connecthandler)

### class: [Plugin](https://github.com/zorillajs/zorilla/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/evasions/chrome.runtime/index.js#L13-L251)

- `opts` (optional, default `{}`)

**Extends: PuppeteerExtraPlugin**

Mock the `chrome.runtime` object if not available (e.g. when running headless) and on a secure site.

---

### [sendMessageHandler()](https://github.com/zorillajs/zorilla/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/evasions/chrome.runtime/index.js#L80-L123)

Mock `chrome.runtime.sendMessage`

---

### [connectHandler()](https://github.com/zorillajs/zorilla/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/evasions/chrome.runtime/index.js#L136-L210)

Mock `chrome.runtime.connect`

- **See: <https://developer.chrome.com/apps/runtime#method-connect>**

---
