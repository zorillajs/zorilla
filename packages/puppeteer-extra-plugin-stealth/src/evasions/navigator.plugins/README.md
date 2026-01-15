# navigator.plugins

## Detection Technique

The `navigator.plugins` and `navigator.mimeTypes` properties are powerful indicators used to detect headless browsers. In real Chrome, these arrays contain information about installed browser plugins (PDF viewer, Flash, etc.), but in headless mode they're completely empty.

**What Servers/Clients Check:**
- `navigator.plugins.length === 0` - Empty array indicates headless mode
- `navigator.mimeTypes.length === 0` - Empty MIME types array
- Plugin-specific checks: Absence of expected plugins like PDF viewer
- Cross-reference validation: Each plugin should list its supported MIME types
- Reverse cross-reference: Each MIME type should reference its `enabledPlugin`
- Array-like behavior: PluginArray and MimeTypeArray should support bracket notation and iteration

**Browser Behavior:**
- **Real Chrome:**
  - `navigator.plugins` contains 3-5 plugins (PDF Viewer, Chrome PDF Viewer, Native Client)
  - `navigator.mimeTypes` contains 10+ MIME types for each plugin
  - Proper cross-references between plugins and MIME types
- **Headless Chrome:**
  - Both arrays are empty (`length === 0`)
  - This is one of the easiest ways to detect automation

**Why This Matters:**
This is a CRITICAL severity detection method. Empty plugin arrays are a dead giveaway of headless mode, as even minimal Chrome installations have the built-in PDF viewer plugin. This check is used by almost all bot detection systems.

## How This Evasion Works

This evasion generates fully functional mock `PluginArray` and `MimeTypeArray` objects with proper cross-references, mimicking a real Chrome browser's plugin configuration.

### Key Components

**1. Mock Plugin Data**
The evasion includes realistic plugin data:
- Chrome PDF Plugin
- Chrome PDF Viewer
- Native Client
- Chromium PDF Plugin (on Linux)

**2. Mock MIME Type Data**
Each plugin has associated MIME types:
- `application/pdf` - PDF documents
- `text/pdf` - Text-based PDFs
- `application/x-nacl` - Native Client applications
- `application/x-pnacl` - Portable Native Client

**3. Cross-Reference Structure**
```javascript
// Each plugin references its MIME types
plugin.mimeTypes[0] // MimeType object
plugin[0] // MimeType object (array notation)

// Each MIME type references its plugin
mimeType.enabledPlugin // Plugin object
```

**4. Array-Like Behavior**
Both arrays support:
- `.length` property
- Bracket notation: `plugins[0]`, `mimeTypes[0]`
- `.item(index)` method
- `.namedItem(name)` method
- `.refresh()` method (for plugins)
- Iteration via `for` loops and `Array.from()`

### Implementation Strategy

```javascript
// Generate mock arrays
const mimeTypesData = generateMimeTypeArray(fns, fns.mimeTypesData)
const pluginsData = generatePluginArray(fns, fns.pluginsData)

// Establish cross-references
pluginsData.forEach((plugin, i) => {
  plugin.mimeTypes = // Associated MIME types for this plugin
})

mimeTypesData.forEach((mimeType, i) => {
  mimeType.enabledPlugin = // Parent plugin for this MIME type
})

// Replace navigator properties
utils.replaceGetterWithProxy(
  Object.getPrototypeOf(navigator),
  'plugins',
  makeHandler().getterValue(pluginsData)
)

utils.replaceGetterWithProxy(
  Object.getPrototypeOf(navigator),
  'mimeTypes',
  makeHandler().getterValue(mimeTypesData)
)
```

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Injects mock plugin and MIME type arrays

**Helper Functions:**
- `generateMimeTypeArray()` - Creates array-like MimeTypeArray object
- `generatePluginArray()` - Creates array-like PluginArray object
- `generateMagicArray()` - Creates proxy object with array behavior (bracket notation, length, iteration)
- `generateFunctionMocks()` - Creates mock methods for plugins/MIME types

**Data Structure:**
```javascript
{
  mimeTypes: [
    {
      type: 'application/pdf',
      suffixes: 'pdf',
      description: 'Portable Document Format',
      __pluginName: 'Chrome PDF Viewer'
    },
    // ... more MIME types
  ],
  plugins: [
    {
      name: 'Chrome PDF Viewer',
      filename: 'internal-pdf-viewer',
      description: 'Portable Document Format',
      __mimeTypes: ['application/pdf', 'text/pdf']
    },
    // ... more plugins
  ]
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import NavigatorPlugins from '@zorilla/puppeteer-extra-plugin-stealth/evasions/navigator.plugins'

puppeteer.use(NavigatorPlugins())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Verify plugins are populated
const pluginCount = await page.evaluate(() => navigator.plugins.length)
console.log('Plugin count:', pluginCount) // 3-4 plugins

const mimeTypeCount = await page.evaluate(() => navigator.mimeTypes.length)
console.log('MIME type count:', mimeTypeCount) // 10+ MIME types

// Test cross-references
const crossRefWorks = await page.evaluate(() => {
  const plugin = navigator.plugins[0]
  const mimeType = plugin[0]
  return mimeType.enabledPlugin === plugin
})
console.log('Cross-references work:', crossRefWorks) // true

// Test array-like behavior
const arrayLikeWorks = await page.evaluate(() => {
  return (
    navigator.plugins.item(0) === navigator.plugins[0] &&
    navigator.mimeTypes.item(0) === navigator.mimeTypes[0]
  )
})
console.log('Array-like behavior works:', arrayLikeWorks) // true
```

## Testing

Test against detection services:
- https://bot.sannysoft.com - Should show plugins populated
- https://arh.antoinevastel.com/bots/areyouheadless - Should pass plugin checks
- Chrome DevTools: `navigator.plugins` should show 3-4 plugins
- Chrome DevTools: Each plugin should have proper `mimeTypes` array
- Chrome DevTools: Each MIME type should have `enabledPlugin` reference

## Compatibility Notes

**Plugin Data Varies by Platform:**
- **Windows/Mac:** Chrome PDF Plugin, Chrome PDF Viewer, Native Client
- **Linux:** Chromium PDF Plugin, Chromium PDF Viewer, Native Client

The evasion automatically adjusts based on the user agent platform to maintain consistency.

## References

- [MDN: Navigator.plugins](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/plugins)
- [MDN: Navigator.mimeTypes](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mimeTypes)
- [MDN: PluginArray](https://developer.mozilla.org/en-US/docs/Web/API/PluginArray)
- [MDN: MimeTypeArray](https://developer.mozilla.org/en-US/docs/Web/API/MimeTypeArray)
- [Chrome Plugin Detection](https://www.chromium.org/developers/design-documents/plugin-architecture/)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

In headless mode `navigator.mimeTypes` and `navigator.plugins` are empty.
This plugin emulates both of these with functional mocks to match regular headful Chrome.

Note: mimeTypes and plugins cross-reference each other, so it makes sense to do them at the same time.

**Options:**
- `opts` (optional, default `{}`)
