# navigator.vendor

## Detection Technique

The `navigator.vendor` property identifies the browser vendor. In Puppeteer, this value is fixed and may not match what detection systems expect, creating an inconsistency.

**What Servers/Clients Check:**
- `navigator.vendor` value - Should be `"Google Inc."` for Chrome
- Consistency with user agent string
- Expected values for different browsers

**Browser Behavior:**
- **Real Chrome:** `navigator.vendor` returns `"Google Inc."`
- **Puppeteer (Default):** Usually correct but fixed, not customizable
- **Firefox:** Returns `""`
- **Safari:** Returns `"Apple Computer, Inc."`

**Why This Matters:**
This is a LOW severity detection method. While `navigator.vendor` is usually correct by default, having the ability to customize it is important for specific use cases (like mimicking different browsers) or when combined with custom user agents.

## How This Evasion Works

This evasion allows customization of `navigator.vendor` to match different browsers or specific configurations.

### Implementation Strategy

```javascript
utils.replaceGetterWithProxy(
  Object.getPrototypeOf(navigator),
  'vendor',
  utils.makeHandler().getterValue(opts.vendor)
)
```

Simple property replacement using a proxy to intercept getter calls.

### Default Value

**Default: `"Google Inc."`**
- Standard Chrome vendor string
- Matches real Chrome behavior
- Use default unless mimicking another browser

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Replaces `navigator.vendor` getter

**Options:**
- `vendor` (string) - Vendor string to use (default: `"Google Inc."`)

**Key Implementation:**
```javascript
get defaults() {
  return {
    vendor: 'Google Inc.'
  }
}

async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument((utils, { opts }) => {
    utils.replaceGetterWithProxy(
      Object.getPrototypeOf(navigator),
      'vendor',
      utils.makeHandler().getterValue(opts.vendor)
    )
  }, {
    opts: this.opts
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'
import NavigatorVendorPlugin from '@zorilla/puppeteer-extra-plugin-stealth/evasions/navigator.vendor'

// Default Chrome vendor
puppeteer.use(NavigatorVendorPlugin())

// Or customize for different browsers
const stealth = StealthPlugin()
// Remove default navigator.vendor from stealth plugin
stealth.enabledEvasions.delete('navigator.vendor')
puppeteer.use(stealth)

// Add custom vendor (e.g., for Safari)
const nvp = NavigatorVendorPlugin({ vendor: 'Apple Computer, Inc.' })
puppeteer.use(nvp)

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

const vendor = await page.evaluate(() => navigator.vendor)
console.log('Vendor:', vendor)
```

### Common Vendor Strings

```javascript
// Chrome
{ vendor: 'Google Inc.' }

// Safari
{ vendor: 'Apple Computer, Inc.' }

// Firefox (empty string)
{ vendor: '' }

// Opera
{ vendor: 'Google Inc.' } // Opera is Chromium-based

// Edge (Chromium-based)
{ vendor: 'Google Inc.' }
```

## Testing

**Manual Test:**
```javascript
// Check vendor string
console.log('Vendor:', navigator.vendor)

// Verify consistency with user agent
console.log('User Agent:', navigator.userAgent)

// Chrome should have "Google Inc."
// Safari should have "Apple Computer, Inc."
// Firefox should have empty string ""
```

## Vendor String Context

**Browser Vendors:**
- **Google Inc.** - Chrome, Chromium, Edge (modern), Opera (modern)
- **Apple Computer, Inc.** - Safari (both desktop and iOS)
- **"" (empty)** - Firefox
- **Microsoft Corporation** - Old Edge (pre-Chromium)

**Why Customize?**
1. **Mimicking specific browsers** - Match Safari or Firefox fingerprint
2. **Consistency** - Ensure vendor matches custom user agent
3. **Testing** - Verify site behavior with different browsers

## Coordinating with User Agent

When customizing `navigator.vendor`, also customize other properties for consistency:

```javascript
import UserAgentOverride from '@zorilla/puppeteer-extra-plugin-stealth/evasions/user-agent-override'
import NavigatorVendor from '@zorilla/puppeteer-extra-plugin-stealth/evasions/navigator.vendor'

// Mimic Safari
puppeteer.use(UserAgentOverride({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15'
}))

puppeteer.use(NavigatorVendor({
  vendor: 'Apple Computer, Inc.'
}))
```

## References

- [MDN: Navigator.vendor](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vendor)
- [Browser Vendor Strings](https://developer.mozilla.org/en-US/docs/Web/API/Navigator)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

By default puppeteer will have a fixed `navigator.vendor` property.
This plugin makes it possible to change this property.

**Options:**
- `opts` (Object, optional, default `{}`)
  - `opts.vendor` (string) - The vendor to use in `navigator.vendor` (default: `"Google Inc."`)

**Example:**
```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'
import NavigatorVendorPlugin from '@zorilla/puppeteer-extra-plugin-stealth/evasions/navigator.vendor'

const stealth = StealthPlugin()
// Remove this specific stealth plugin from the default set
stealth.enabledEvasions.delete('navigator.vendor')
puppeteer.use(stealth)

// Stealth plugins are just regular `puppeteer-extra` plugins and can be added as such
const nvp = NavigatorVendorPlugin({ vendor: 'Apple Computer, Inc.' }) // Custom vendor
puppeteer.use(nvp)
```
