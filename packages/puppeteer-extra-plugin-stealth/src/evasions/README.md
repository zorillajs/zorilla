# puppeteer-extra-plugin-stealth/evasions

Various detection evasion plugins for `puppeteer-extra-plugin-stealth`.

You can bypass the main module and import specific evasion plugins yourself, if you wish to do so:

```js
import NavigatorWebdriver from '@zorilla/puppeteer-extra-plugin-stealth/evasions/navigator.webdriver'
puppeteer.use(NavigatorWebdriver())
```

If you want to add a new evasion technique I suggest you look at the [template](./_template/README.md) to kickstart things.
