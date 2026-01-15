# window.outerdimensions

## Detection Technique

In headless Chrome, `window.outerWidth` and `window.outerHeight` are missing or return `0`, whereas in real Chrome these properties reflect the browser window's actual dimensions including frame/chrome. This is an easy-to-detect indicator of headless mode.

**What Servers/Clients Check:**
- `window.outerWidth` existence and value
- `window.outerHeight` existence and value
- Relationship between `outerWidth/outerHeight` and `innerWidth/innerHeight`
- Difference should account for window frame/chrome

**Browser Behavior:**
- **Real Chrome:**
  - `outerWidth` = viewport width + vertical scrollbar (if any)
  - `outerHeight` = viewport height + browser chrome (address bar, tabs, etc.)
  - Typically `outerHeight` ≈ `innerHeight` + 85-100px (frame)
- **Headless Chrome (Without Evasion):**
  - `outerWidth` and `outerHeight` return `undefined` or `0`
  - Easy to detect with simple existence check
  - Missing properties are highly suspicious

**Why This Matters:**
This is a MEDIUM severity detection method. While not as critical as `navigator.webdriver`, the missing or zero outer dimensions are a clear headless indicator. Real browsers always have window chrome (title bar, address bar, tabs), so outer dimensions should always be larger than inner dimensions.

## How This Evasion Works

This evasion sets `window.outerWidth` and `window.outerHeight` to realistic values and ensures the viewport size matches the window size for a consistent experience.

### Implementation Strategy

**1. Set Outer Dimensions:**
```javascript
try {
  if (window.outerWidth && window.outerHeight) {
    return // Already set (headful mode)
  }

  const windowFrame = 85 // Browser chrome height (OS/WM dependent)

  window.outerWidth = window.innerWidth
  window.outerHeight = window.innerHeight + windowFrame
} catch (_err) {}
```

**2. Set Default Viewport:**
```javascript
async beforeLaunch(options) {
  // Have viewport match window size, unless specified by user
  if (!('defaultViewport' in options)) {
    options.defaultViewport = null
  }
  return options
}
```

Setting `defaultViewport: null` makes the viewport match the window size, preventing viewport/window dimension mismatches.

### Window Frame Size

The `windowFrame` constant (85px) represents the approximate height of browser chrome:
- **Components:** Title bar, tabs, address bar, bookmarks bar (if visible)
- **Typical Range:** 75-100px depending on OS, window manager, and Chrome settings
- **Default:** 85px is a safe middle-ground value

**Why Not Dynamic?**
The actual frame size depends on:
- Operating system (Windows, macOS, Linux)
- Window manager (GNOME, KDE, etc.)
- Chrome UI settings (bookmarks visible, compact mode, etc.)
- Display scaling/DPI

Using a fixed value is simpler and works for most cases.

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Sets outer dimensions
- `beforeLaunch(options)` - Configures default viewport

**Constants:**
- `windowFrame = 85` - Approximate browser chrome height in pixels

**Key Implementation:**
```javascript
async onPageCreated(page) {
  await page.evaluateOnNewDocument(() => {
    try {
      if (window.outerWidth && window.outerHeight) {
        return // Nothing to do, already set
      }

      const windowFrame = 85 // OS and WM dependent

      window.outerWidth = window.innerWidth
      window.outerHeight = window.innerHeight + windowFrame
    } catch (_err) {}
  })
}

async beforeLaunch(options) {
  // Have viewport match window size, unless specified by user
  // https://github.com/GoogleChrome/puppeteer/issues/3688
  if (!('defaultViewport' in options)) {
    options.defaultViewport = null
  }
  return options
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import WindowOuterDimensions from '@zorilla/puppeteer-extra-plugin-stealth/evasions/window.outerdimensions'

puppeteer.use(WindowOuterDimensions())

const browser = await puppeteer.launch({
  headless: true
  // defaultViewport: null is set automatically by plugin
})

const page = await browser.newPage()

// Verify dimensions are set
const dimensions = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  outerWidth: window.outerWidth,
  outerHeight: window.outerHeight,
  widthDiff: window.outerWidth - window.innerWidth,
  heightDiff: window.outerHeight - window.innerHeight
}))

console.log('Inner size:', dimensions.innerWidth, 'x', dimensions.innerHeight)
console.log('Outer size:', dimensions.outerWidth, 'x', dimensions.outerHeight)
console.log('Width diff:', dimensions.widthDiff) // Usually 0 (no scrollbar)
console.log('Height diff:', dimensions.heightDiff) // ~85px (browser chrome)
```

### Custom Viewport

If you need a specific viewport size:

```javascript
const browser = await puppeteer.launch({
  headless: true,
  defaultViewport: {
    width: 1280,
    height: 720
  }
})

// Window outer dimensions will be:
// outerWidth: 1280
// outerHeight: 720 + 85 = 805
```

## Testing

**Manual Test:**
```javascript
// Check outer dimensions exist
console.log('Outer width:', window.outerWidth) // Should be > 0
console.log('Outer height:', window.outerHeight) // Should be > 0

// Check relationship with inner dimensions
console.log('Inner width:', window.innerWidth)
console.log('Inner height:', window.innerHeight)

// Outer should be >= Inner
console.log('Width OK:', window.outerWidth >= window.innerWidth) // true
console.log('Height OK:', window.outerHeight >= window.innerHeight) // true

// Height difference should be reasonable (browser chrome)
const heightDiff = window.outerHeight - window.innerHeight
console.log('Height diff:', heightDiff) // ~75-100px
console.log('Reasonable:', heightDiff > 50 && heightDiff < 150) // true
```

## Window Dimensions Context

**Inner vs Outer Dimensions:**

**`innerWidth/innerHeight`:**
- Viewport dimensions (content area)
- What CSS pixels measure against
- What `@media` queries use
- Excludes browser chrome and scrollbars

**`outerWidth/outerHeight`:**
- Complete browser window dimensions
- Includes browser chrome (title bar, tabs, address bar)
- Includes OS window frame
- What users see as "window size"

**Typical Relationship:**
```
outerWidth ≈ innerWidth (+ scrollbar if present)
outerHeight ≈ innerHeight + 85 (browser chrome)
```

## Viewport vs Window

**Setting `defaultViewport: null`:**
- Makes viewport automatically match browser window size
- Prevents viewport/window size mismatches
- Common pattern for stealth mode
- Allows window resizing to work naturally

**With Default Viewport (800x600):**
```
innerWidth: 800
innerHeight: 600
outerWidth: 800 (set by evasion)
outerHeight: 685 (600 + 85, set by evasion)
```

**With `defaultViewport: null`:**
```
innerWidth: Matches window
innerHeight: Matches window
outerWidth: Matches window (set by evasion)
outerHeight: Matches window + 85 (set by evasion)
```

## Known Issues

**Window Frame Size Variability:**
The 85px frame size is an approximation. Actual size varies by:
- **Windows:** ~85-95px (depends on DPI scaling)
- **macOS:** ~75-85px (depends on toolbar visibility)
- **Linux:** ~70-100px (varies greatly by window manager)

This is acceptable because:
1. Users can't precisely measure frame size without special tools
2. Real frame sizes vary even on the same OS (toolbar visibility, extensions)
3. Detection systems use broader ranges or simple existence checks

## References

- [MDN: Window.outerWidth](https://developer.mozilla.org/en-US/docs/Web/API/Window/outerWidth)
- [MDN: Window.outerHeight](https://developer.mozilla.org/en-US/docs/Web/API/Window/outerHeight)
- [MDN: Window.innerWidth](https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth)
- [MDN: Window.innerHeight](https://developer.mozilla.org/en-US/docs/Web/API/Window/innerHeight)
- [Puppeteer Issue #3688: Viewport size](https://github.com/GoogleChrome/puppeteer/issues/3688)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Fix missing window.outerWidth/window.outerHeight in headless mode.
Will also set the viewport to match window size, unless specified by user.

**Options:**
- `opts` (optional, default `{}`)

**Behavior:**
- Sets `window.outerWidth = window.innerWidth`
- Sets `window.outerHeight = window.innerHeight + 85`
- Configures `defaultViewport: null` if not already set (viewport matches window)
