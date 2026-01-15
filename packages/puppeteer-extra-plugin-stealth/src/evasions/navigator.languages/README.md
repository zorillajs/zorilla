# navigator.languages

## Detection Technique

The `navigator.languages` property returns an array of the user's preferred languages. In headless Chrome, this array can be empty or contain unexpected values that don't match the `Accept-Language` header or `navigator.language`, creating inconsistencies that reveal automation.

**What Servers/Clients Check:**
- `navigator.languages` empty array - Unusual for real browsers
- Mismatch with `Accept-Language` HTTP header
- Mismatch with `navigator.language` property
- Inconsistency indicates automation or misconfiguration

**Browser Behavior:**
- **Real Chrome:**
  - `navigator.languages` returns array of user's language preferences
  - Example: `['en-US', 'en', 'es']`
  - Matches `Accept-Language` header sent in HTTP requests
  - Consistent with `navigator.language` (first element)
- **Headless Chrome (Without Evasion):**
  - May return empty array or inconsistent values
  - Doesn't match Accept-Language header
  - Easy to detect with cross-reference checks

**Why This Matters:**
This is a LOW severity detection method. While not a strong indicator alone, language inconsistencies combined with other signals can contribute to bot detection. Most real users have language preferences configured, so an empty array is suspicious.

## How This Evasion Works

This evasion replaces `navigator.languages` with a properly configured language array (default: `['en-US', 'en']`) that creates a consistent language fingerprint.

### Implementation Strategy

```javascript
const languages = opts.languages.length ? opts.languages : ['en-US', 'en']

utils.replaceGetterWithProxy(
  Object.getPrototypeOf(navigator),
  'languages',
  utils.makeHandler().getterValue(Object.freeze([...languages]))
)
```

The array is frozen to prevent modification, matching real browser behavior.

### Default Value

**Default: `['en-US', 'en']`**
- Most common language configuration
- US English with fallback to generic English
- Matches majority of web traffic

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Replaces `navigator.languages` getter

**Options:**
- `languages` (Array<string>) - Array of language codes (default: `['en-US', 'en']`)

**Key Implementation:**
```javascript
get defaults() {
  return {
    languages: [] // Empty default to avoid merging with user-provided array
  }
}

async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument((utils, { opts }) => {
    const languages = opts.languages.length ? opts.languages : ['en-US', 'en']

    utils.replaceGetterWithProxy(
      Object.getPrototypeOf(navigator),
      'languages',
      utils.makeHandler().getterValue(Object.freeze([...languages]))
    )
  }, {
    opts: this.opts
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import NavigatorLanguages from '@zorilla/puppeteer-extra-plugin-stealth/evasions/navigator.languages'

// Use default languages (en-US, en)
puppeteer.use(NavigatorLanguages())

// Or customize languages
puppeteer.use(NavigatorLanguages({
  languages: ['de-DE', 'de', 'en-US', 'en']
}))

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Verify languages
const langs = await page.evaluate(() => navigator.languages)
console.log('Languages:', langs) // ['en-US', 'en']

// Verify array is frozen (immutable)
const isFrozen = await page.evaluate(() => Object.isFrozen(navigator.languages))
console.log('Array frozen:', isFrozen) // true
```

### Common Language Configurations

```javascript
// English (US)
{ languages: ['en-US', 'en'] }

// English (UK)
{ languages: ['en-GB', 'en'] }

// Spanish
{ languages: ['es-ES', 'es', 'en'] }

// German
{ languages: ['de-DE', 'de', 'en'] }

// French
{ languages: ['fr-FR', 'fr', 'en'] }

// Multilingual user
{ languages: ['en-US', 'es', 'fr', 'en'] }
```

## Testing

**Manual Test:**
```javascript
// Check languages array
console.log('Languages:', navigator.languages)
// ['en-US', 'en']

// Verify first element matches navigator.language
console.log('Primary language:', navigator.language)
// 'en-US'

// Verify array is frozen
try {
  navigator.languages.push('fr')
  console.log('Array is mutable') // Won't reach here
} catch (err) {
  console.log('Array is frozen (correct)')
}

// Test consistency
console.log('Consistent:', navigator.languages[0] === navigator.language)
// true (if navigator.language evasion also used)
```

## Language Format

**Language Codes:**
- Format: `language-REGION` or just `language`
- Examples: `en-US`, `en-GB`, `es`, `fr-FR`
- Must be valid BCP 47 language tags

**Order Matters:**
- First element is primary/preferred language
- Should match `navigator.language`
- Subsequent elements are fallback languages
- Order indicates user preference priority

## Integration with Accept-Language

This evasion should be used together with language-related settings:

**Related Configurations:**
1. **navigator.language** - Single language string (usually same as `languages[0]`)
2. **Accept-Language header** - HTTP header sent with requests
3. **User preferences** - Browser profile language settings

The `user-agent-override` evasion handles `Accept-Language` header to ensure consistency.

## References

- [MDN: Navigator.languages](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages)
- [MDN: Navigator.language](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language)
- [BCP 47 Language Tags](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)
- [Accept-Language Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Pass the Languages Test. Allows setting custom languages.

**Options:**
- `opts` (Object, optional, default `{}`)
  - `opts.languages` (Array<string>) - The languages to use (default: `['en-US', 'en']`)
