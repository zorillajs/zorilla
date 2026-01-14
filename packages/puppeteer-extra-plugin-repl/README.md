# @zorilla/puppeteer-extra-plugin-repl

> A plugin for [`puppeteer-extra`](https://github.com/zorillajs/zorilla).

## Installation

```bash
npm install @zorilla/puppeteer-extra-plugin-repl
```

## Purpose

**Make quick puppeteer debugging and exploration fun with an interactive REPL.**

-   Can interrupt your code at anytime to start an interactive [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) in your console.
-   Adds convenience `.repl()` methods to `Page` and `Browser` instances.
-   Supports inspecting arbitrary objects and instances.
-   Features tab auto-completion for the available object properties and a colorized prompt.

#### Kudos

-   Inspired by [puppeteer-debug](https://github.com/nswbmw/puppeteer-debug) from [nswbmw](https://github.com/nswbmw), thanks!

## REPL

![repl](https://i.imgur.com/xeP7hEc.gif)

## Quickstart

```javascript
import puppeteer from '@zorilla/puppeteer-extra';
import replPlugin from '@zorilla/puppeteer-extra-plugin-repl';

puppeteer.use(replPlugin());

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://example.com');

// Start an interactive REPL here with the `page` instance.
await page.repl();
// Afterwards start REPL with the `browser` instance.
await browser.repl();

await browser.close();
```

Or with ESM:

```javascript
import puppeteer from '@zorilla/puppeteer-extra';
import replPlugin from '@zorilla/puppeteer-extra-plugin-repl';

puppeteer.use(replPlugin());

puppeteer.launch({ headless: true }).then(async browser => {
  const page = await browser.newPage();
  await page.goto('https://example.com');

  // Start an interactive REPL here with the `page` instance.
  await page.repl();
  // Afterwards start REPL with the `browser` instance.
  await browser.repl();

  await browser.close();
});
```

In the REPL session (hit `tab` two times to see all available properties):

```es6
> page.url()
// => https://example.com
> page.click('a')
> page.url()
// => https://www.iana.org/domains/reserved
> page.content()
// => <!DOCTYPE html><html><head> ...
> page.goto('https://google.com')
> page.type('input', 'what is the answer to life the universe and everything')
> page.click('input[type=submit]')
> page.url()
// => https://www.google.com/search?source=hp&ei=u9oXW5HpO8a ...
> page.evaluate(() => document.querySelector('h3 a').textContent)
// => Question 42 (The Impossible Quiz) - The Impossible Quiz Wiki - Fandom
```

-   Type `inspect` to return the current object.
-   Type `exit` (or hit ctrl+c) to leave the repl.

## API

### Plugin

**Extends: PuppeteerExtraPlugin**

Interrupt your puppeteer code with an interactive REPL.

Features tab auto-completion for the given object properties and a colorized prompt.

Works with arbitrary objects and class instances, though `Page` & `Browser` make the most sense. :-)

#### Options

-   `opts` **Object** Options (optional, default `{}`)
    -   `opts.addToPuppeteerClass` **boolean** If a `.repl()` method should be attached to Puppeteer `Page` and `Browser` instances (default: `true`)

#### Example: Using without extending Puppeteer classes

```javascript
import puppeteer from '@zorilla/puppeteer-extra';
import replPlugin from '@zorilla/puppeteer-extra-plugin-repl';

const repl = replPlugin({ addToPuppeteerClass: false });
puppeteer.use(repl);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://example.com');

// Start an interactive REPL here with the `page` instance.
await repl.repl(page);
// Afterwards start REPL with the `repl` instance itself. 🐴
await repl.repl(repl);

await browser.close();
```

### repl(obj)

Create an interactive REPL for the provided object.

Uses an extended (colorized) readline interface under the hood.
Will resolve the returned Promise when the readline interface is closed.

If `opts.addToPuppeteerClass` is true (default) then `page.repl()`/`browser.repl()`
will point to this method, for convenience.

Can be used standalone as well, to inspect an arbitrary class instance or object.

**Parameters:**

-   `obj` **Object** An object or class instance to use in the repl (e.g. `page`, `browser`)

**Returns:** `Promise<void>`

**Example:**

```javascript
import replPlugin from '@zorilla/puppeteer-extra-plugin-repl';

const repl = replPlugin();
await repl.repl(page); // or any object/class instance
```

## Features

- 🎨 **Colorized prompt** - Easy-to-read, color-coded interface
- ⌨️ **Tab completion** - Auto-complete object properties and methods
- 🔍 **Inspect command** - Return the current object for detailed inspection
- 🚪 **Exit command** - Cleanly exit the REPL session
- 🎯 **Works with any object** - Not limited to Puppeteer instances

## Requirements

- Node.js 20+
- Puppeteer or Puppeteer-Core

## License

[MIT](LICENSE)
