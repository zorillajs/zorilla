# iframe.contentWindow

## Detection Technique

In headless Chrome, there's a bug where iframes created with `srcdoc` attribute don't properly inherit the `chrome` object in their `contentWindow`. This creates a detectable inconsistency known as the HEADCHR_IFRAME detection.

**What Servers/Clients Check:**
- `iframe.contentWindow.chrome` existence - Missing in headless Chrome with srcdoc iframes
- `iframe.contentWindow.self === window.top` - Should be false
- `iframe.contentWindow.frameElement === iframe` - Should be true
- Proper iframe window isolation and properties

**Browser Behavior:**
- **Real Chrome:**
  - All iframes have proper `contentWindow` with `chrome` object
  - `srcdoc` iframes work correctly
  - `contentWindow.self` refers to iframe's window
  - `contentWindow.frameElement` refers to iframe element
- **Headless Chrome (Without Evasion):**
  - `srcdoc` iframes missing `chrome` object in `contentWindow`
  - This is a Chromium bug specific to headless mode
  - Easy to detect with simple iframe + srcdoc test

**Why This Matters:**
This is a MEDIUM severity detection method. The srcdoc iframe bug is a well-known headless Chrome issue. Bot detection systems specifically test for this by creating srcdoc iframes and checking if `contentWindow.chrome` exists. It's one of the more reliable headless indicators.

## How This Evasion Works

This evasion intercepts iframe creation and adds a proxy to the `contentWindow` property for `srcdoc` iframes, ensuring proper behavior that matches real Chrome.

### Implementation Strategy

**1. Intercept `document.createElement('iframe')`:**
```javascript
const createElementHandler = {
  apply: (target, thisArg, args) => {
    const isIframe = args?.length && `${args[0]}`.toLowerCase() === 'iframe'
    if (!isIframe) {
      return target.apply(thisArg, args) // Normal element
    } else {
      return handleIframeCreation(target, thisArg, args) // Special handling
    }
  }
}

utils.replaceWithProxy(document, 'createElement', createElementHandler)
```

**2. Hook `srcdoc` Property Setter:**
When `srcdoc` is set on an iframe, add the contentWindow proxy:
```javascript
Object.defineProperty(iframe, 'srcdoc', {
  configurable: true,
  get: () => _srcdoc,
  set: function (newValue) {
    addContentWindowProxy(this) // Add proxy before setting srcdoc
    // Reset property after use
    Object.defineProperty(iframe, 'srcdoc', {
      configurable: false,
      writable: false,
      value: _srcdoc
    })
    _iframe.srcdoc = newValue
  }
})
```

**3. ContentWindow Proxy:**
The proxy ensures correct iframe window behavior:
```javascript
const contentWindowProxy = {
  get(target, key) {
    // Redirect .self to proxy itself (not parent window)
    if (key === 'self') {
      return this
    }
    // Return iframe element for .frameElement
    if (key === 'frameElement') {
      return iframe
    }
    // Hide proxy's own properties
    if (key === '0') {
      return undefined
    }
    return Reflect.get(target, key)
  }
}

const proxy = new Proxy(window, contentWindowProxy)
Object.defineProperty(iframe, 'contentWindow', {
  get() {
    return proxy
  },
  set(newValue) {
    return newValue // contentWindow is immutable
  },
  enumerable: true,
  configurable: false
})
```

### Key Behaviors Fixed

1. **`iframe.contentWindow.chrome` exists** - Proxy allows accessing parent window's chrome object
2. **`iframe.contentWindow.self === iframe.contentWindow`** - Proxy returns itself for self
3. **`iframe.contentWindow.frameElement === iframe`** - Proxy returns iframe element
4. **`iframe.contentWindow !== window`** - Proxy is distinct from parent window

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Injects iframe creation interceptor

**Requirements:**
- `runLast` - Runs after `chrome.runtime` to ensure `window.chrome` exists

**Key Implementation:**
```javascript
async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument((utils, _opts) => {
    const addContentWindowProxy = iframe => {
      const contentWindowProxy = {
        get(target, key) {
          if (key === 'self') return this
          if (key === 'frameElement') return iframe
          if (key === '0') return undefined
          return Reflect.get(target, key)
        }
      }

      if (!iframe.contentWindow) {
        const proxy = new Proxy(window, contentWindowProxy)
        Object.defineProperty(iframe, 'contentWindow', {
          get() { return proxy },
          set(newValue) { return newValue },
          enumerable: true,
          configurable: false
        })
      }
    }

    const handleIframeCreation = (target, thisArg, args) => {
      const iframe = target.apply(thisArg, args)
      const _iframe = iframe
      const _srcdoc = _iframe.srcdoc

      // Hook srcdoc setter
      Object.defineProperty(iframe, 'srcdoc', {
        configurable: true,
        get: () => _srcdoc,
        set: function (newValue) {
          addContentWindowProxy(this)
          Object.defineProperty(iframe, 'srcdoc', {
            configurable: false,
            writable: false,
            value: _srcdoc
          })
          _iframe.srcdoc = newValue
        }
      })
      return iframe
    }

    const createElementHandler = {
      get(target, key) {
        return Reflect.get(target, key)
      },
      apply: (target, thisArg, args) => {
        const isIframe = args?.length && `${args[0]}`.toLowerCase() === 'iframe'
        if (!isIframe) {
          return target.apply(thisArg, args)
        } else {
          return handleIframeCreation(target, thisArg, args)
        }
      }
    }

    utils.replaceWithProxy(document, 'createElement', createElementHandler)
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import IframeContentWindow from '@zorilla/puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow'

puppeteer.use(IframeContentWindow())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

await page.goto('https://example.com')

// Test srcdoc iframe
const iframeTest = await page.evaluate(() => {
  const iframe = document.createElement('iframe')
  iframe.srcdoc = '<html><body>Hello from iframe</body></html>'
  document.body.appendChild(iframe)

  // Wait for iframe to load
  return new Promise(resolve => {
    iframe.onload = () => {
      const results = {
        hasChromeInContentWindow: 'chrome' in iframe.contentWindow,
        selfIsCorrect: iframe.contentWindow.self === iframe.contentWindow,
        selfIsNotTop: iframe.contentWindow.self !== window.top,
        frameElementIsCorrect: iframe.contentWindow.frameElement === iframe,
        contentWindowIsNotParent: iframe.contentWindow !== window
      }
      resolve(results)
    }
  })
})

console.log('Iframe tests:', iframeTest)
// All should be true
```

## Testing

**Manual Test in DevTools:**
```javascript
// Create srcdoc iframe
const iframe = document.createElement('iframe')
iframe.srcdoc = '<html><body>Test</body></html>'
document.body.appendChild(iframe)

iframe.onload = () => {
  // Test 1: chrome object exists in iframe
  console.log('chrome' in iframe.contentWindow) // true (with evasion)

  // Test 2: self refers to iframe's window
  console.log(iframe.contentWindow.self === iframe.contentWindow) // true

  // Test 3: self is not parent window
  console.log(iframe.contentWindow.self !== window) // true

  // Test 4: frameElement points to iframe
  console.log(iframe.contentWindow.frameElement === iframe) // true

  // Test 5: Can access chrome.runtime from iframe
  console.log(iframe.contentWindow.chrome?.runtime) // exists (with evasion)
}
```

**Headless Detection Test:**
```javascript
// This is the actual HEADCHR_IFRAME test used by bot detectors
function detectHeadlessIframe() {
  const iframe = document.createElement('iframe')
  iframe.srcdoc = 'test'
  document.body.appendChild(iframe)

  return new Promise(resolve => {
    iframe.onload = () => {
      const hasChrome = 'chrome' in iframe.contentWindow
      resolve(!hasChrome) // Returns true if headless (missing chrome)
    }
  })
}

// With evasion: returns false (not detected as headless)
// Without evasion: returns true (detected as headless)
```

## Chromium Bug Context

**The Bug:**
- Chromium Issue: https://github.com/puppeteer/puppeteer/issues/1106
- Only affects headless mode
- Specific to `srcdoc` attribute (not `src` attribute)
- `chrome` object doesn't get properly inherited in iframe's contentWindow

**Why It Happens:**
In headless mode, the `chrome` object creation happens differently, and srcdoc iframes don't get the object injected properly due to timing/lifecycle issues in Chromium's headless implementation.

**Detection Name:**
This is commonly called the "HEADCHR_IFRAME" detection test.

## References

- [Puppeteer Issue #1106: chrome object missing in iframe](https://github.com/puppeteer/puppeteer/issues/1106)
- [MDN: HTMLIFrameElement.contentWindow](https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/contentWindow)
- [MDN: HTMLIFrameElement.srcdoc](https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/srcdoc)
- [MDN: Window.frameElement](https://developer.mozilla.org/en-US/docs/Web/API/Window/frameElement)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Fix for the HEADCHR_IFRAME detection (iframe.contentWindow.chrome), hopefully this time without breaking iframes.
Note: Only `srcdoc` powered iframes cause issues due to a chromium bug.

**Options:**
- `opts` (optional, default `{}`)

**Requirements:**
- `runLast` - Ensures `chrome.runtime` has run first to define `window.chrome`
