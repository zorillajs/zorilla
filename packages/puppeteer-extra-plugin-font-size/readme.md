# puppeteer-extra-plugin-font-size

> A plugin for [`puppeteer-extra`](https://github.com/zorillajs/zorilla).

### Install

```bash
npm install puppeteer-extra-plugin-font-size
```

## API


#### Table of Contents

-   [Plugin](#plugin)

### [Plugin](https://github.com/zorillajs/zorilla/blob/db57ea66cf10d407cf63af387892492e495a84f2/packages/puppeteer-extra-plugin-font-size/index.js#L18-L44)

**Extends: PuppeteerExtraPlugin**

Modify/increase the default font size in puppeteer.

Type: `function (opts)`

-   `opts` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Options (optional, default `{}`)
    -   `opts.defaultFontSize` **[Number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** Default browser font size (optional, default `20`)

Example:

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import fontSizePlugin from '@zorilla/puppeteer-extra-plugin-font-size'
puppeteer.use(fontSizePlugin())
// or
puppeteer.use(fontSizePlugin({defaultFontSize: 18}))
const browser = await puppeteer.launch()
```

* * *

## License

[MIT](./LICENSE)
