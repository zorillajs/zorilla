# puppeteer-extra-plugin-click-and-wait

> A plugin for [`puppeteer-extra`](https://github.com/zorillajs/zorilla).

### Install

```bash
npm install puppeteer-extra-plugin-click-and-wait
```

## API


#### Table of Contents

-   [Plugin](#plugin)

### [Plugin](https://github.com/zorillajs/zorilla/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra-plugin-click-and-wait/index.js#L24-L39)

**Extends: PuppeteerExtraPlugin**

Convenience function to wait for navigation to complete after clicking on an element.

Adds a new `page.clickAndWaitForNavigation(selector, clickOptions, waitOptions)` method.

See this issue for more context: <https://github.com/GoogleChrome/puppeteer/issues/1421>

> Note: Be wary of ajax powered pages where the navigation event is not triggered.

Type: `function (opts)`

-   `opts`   (optional, default `{}`)

Example:

```javascript
await page.clickAndWaitForNavigation('input#submitData')

// as opposed to:

await Promise.all([
  page.waitForNavigation(waitOptions),
  page.click('input#submitData', clickOptions),
])
```

* * *

## License

[MIT](LICENSE)
