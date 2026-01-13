# puppeteer-extra-plugin-stealth/evasions

Various detection evasion plugins for `puppeteer-extra-plugin-stealth`.

You can bypass the main module and import specific evasion plugins yourself, if you wish to do so:

```js
import ConsoleDebug from '@zorilla/puppeteer-extra-plugin-stealth/evasions/console.debug'
puppeteer.use(ConsoleDebug())
```

If you want to add a new evasion technique I suggest you look at the [template](./_template/) to kickstart things.
