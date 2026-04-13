# media.codecs

## Detection Technique

Chromium (the open-source base of Chrome) doesn't include proprietary media codecs like H.264/AAC due to licensing restrictions. Real Chrome includes these codecs, so the difference in codec support can be used to detect headless Chromium browsers.

**What Servers/Clients Check:**
- `HTMLMediaElement.canPlayType('video/mp4; codecs="avc1.42E01E"')` - Should return `"probably"` in Chrome
- `HTMLMediaElement.canPlayType('audio/x-m4a')` - Should return `"maybe"` in Chrome
- `HTMLMediaElement.canPlayType('audio/aac')` - Should return `"probably"` in Chrome
- Different return values indicate Chromium vs Chrome

**Browser Behavior:**
- **Real Chrome:**
  - `canPlayType('video/mp4; codecs="avc1.42E01E"')` returns `"probably"`
  - `canPlayType('audio/x-m4a')` returns `"maybe"`
  - `canPlayType('audio/aac')` returns `"probably"`
  - Supports H.264 video and AAC audio (proprietary codecs)
- **Chromium/Headless (Without Evasion):**
  - Returns empty string `""` for proprietary codecs
  - Only supports open codecs (WebM/VP8/VP9/Vorbis/Opus)
  - Easy to detect codec support differences

**Why This Matters:**
This is a LOW to MEDIUM severity detection method. While not as critical as other evasions, codec support differences are a known Chromium vs Chrome identifier. Bot detection systems use this as part of a broader fingerprint. The test is simple and reliable, making it valuable for detection scripts.

## How This Evasion Works

This evasion intercepts `HTMLMediaElement.canPlayType()` calls and returns appropriate values for proprietary codecs that Chromium doesn't natively support, making it appear like real Chrome.

### Implementation Strategy

Proxy the `canPlayType` method on both `<video>` and `<audio>` elements:

```javascript
const canPlayType = {
  apply: (target, ctx, args) => {
    if (!args || !args.length) {
      return target.apply(ctx, args)
    }

    const { mime, codecs } = parseInput(args[0])

    // H.264 video codec (proprietary)
    if (mime === 'video/mp4' && codecs.includes('avc1.42E01E')) {
      return 'probably'
    }

    // M4A audio format (no codecs specified)
    if (mime === 'audio/x-m4a' && !codecs.length) {
      return 'maybe'
    }

    // AAC audio codec (no codecs specified)
    if (mime === 'audio/aac' && !codecs.length) {
      return 'probably'
    }

    // Everything else: use original behavior
    return target.apply(ctx, args)
  }
}

utils.replaceWithProxy(
  HTMLMediaElement.prototype,
  'canPlayType',
  canPlayType
)
```

### Codec Support Fixes

**1. H.264 Video (avc1.42E01E)**
- **MIME Type:** `video/mp4; codecs="avc1.42E01E"`
- **Real Chrome:** Returns `"probably"`
- **Chromium:** Returns `""` (empty - not supported)
- **Fix:** Intercept and return `"probably"`

**2. M4A Audio**
- **MIME Type:** `audio/x-m4a` (no codecs parameter)
- **Real Chrome:** Returns `"maybe"`
- **Chromium:** Returns `""`
- **Fix:** Intercept and return `"maybe"`

**3. AAC Audio**
- **MIME Type:** `audio/aac` (no codecs parameter)
- **Real Chrome:** Returns `"probably"`
- **Chromium:** Returns `""`
- **Fix:** Intercept and return `"probably"`

### Input Parsing

The evasion includes a parser to normalize MIME type strings:

```javascript
const parseInput = arg => {
  const [mime, codecStr] = arg.trim().split(';')
  let codecs = []

  if (codecStr?.includes('codecs="')) {
    codecs = codecStr
      .trim()
      .replace(`codecs="`, '')
      .replace(/"$/u, '')
      .trim()
      .split(',')
      .filter(x => !!x)
      .map(x => x.trim())
  }

  return { mime, codecStr, codecs }
}
```

**Example Inputs:**
- `"video/mp4; codecs=\"avc1.42E01E\""` → `{ mime: "video/mp4", codecs: ["avc1.42E01E"] }`
- `"audio/x-m4a"` → `{ mime: "audio/x-m4a", codecs: [] }`
- `"video/webm; codecs=\"vp8, vorbis\""` → `{ mime: "video/webm", codecs: ["vp8", "vorbis"] }`

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Proxies `HTMLMediaElement.prototype.canPlayType`

**Helper Functions:**
- `parseInput(arg)` - Parses MIME type string into mime and codecs array

**Key Implementation:**
```javascript
async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument(utils => {
    const parseInput = arg => {
      const [mime, codecStr] = arg.trim().split(';')
      let codecs = []
      if (codecStr?.includes('codecs="')) {
        codecs = codecStr
          .trim()
          .replace(`codecs="`, '')
          .replace(/"$/u, '')
          .trim()
          .split(',')
          .filter(x => !!x)
          .map(x => x.trim())
      }
      return { mime, codecStr, codecs }
    }

    const canPlayType = {
      apply: (target, ctx, args) => {
        if (!args || !args.length) {
          return target.apply(ctx, args)
        }

        const { mime, codecs } = parseInput(args[0])

        // Fix proprietary codec support
        if (mime === 'video/mp4' && codecs.includes('avc1.42E01E')) {
          return 'probably'
        }
        if (mime === 'audio/x-m4a' && !codecs.length) {
          return 'maybe'
        }
        if (mime === 'audio/aac' && !codecs.length) {
          return 'probably'
        }

        return target.apply(ctx, args)
      }
    }

    utils.replaceWithProxy(
      HTMLMediaElement.prototype,
      'canPlayType',
      canPlayType
    )
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import MediaCodecs from '@zorilla/puppeteer-extra-plugin-stealth/evasions/media.codecs'

puppeteer.use(MediaCodecs())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Test codec support
const codecSupport = await page.evaluate(() => {
  const video = document.createElement('video')
  const audio = document.createElement('audio')

  return {
    // Proprietary codecs (fixed by evasion)
    h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
    m4a: audio.canPlayType('audio/x-m4a'),
    aac: audio.canPlayType('audio/aac'),

    // Open codecs (native support)
    webm: video.canPlayType('video/webm; codecs="vp8, vorbis"'),
    ogg: audio.canPlayType('audio/ogg; codecs="vorbis"')
  }
})

console.log('Codec support:')
console.log('  H.264 (MP4):', codecSupport.h264) // "probably" (with evasion)
console.log('  M4A Audio:', codecSupport.m4a) // "maybe" (with evasion)
console.log('  AAC Audio:', codecSupport.aac) // "probably" (with evasion)
console.log('  WebM:', codecSupport.webm) // Native support
console.log('  Ogg Vorbis:', codecSupport.ogg) // Native support
```

## Testing

**Manual Test in DevTools:**
```javascript
// Create video and audio elements
const video = document.createElement('video')
const audio = document.createElement('audio')

// Test proprietary codecs (should work with evasion)
console.log('H.264 (avc1.42E01E):', video.canPlayType('video/mp4; codecs="avc1.42E01E"'))
// "probably" (with evasion), "" (without)

console.log('M4A:', audio.canPlayType('audio/x-m4a'))
// "maybe" (with evasion), "" (without)

console.log('AAC:', audio.canPlayType('audio/aac'))
// "probably" (with evasion), "" (without)

// Test open codecs (native support, unchanged)
console.log('WebM VP8:', video.canPlayType('video/webm; codecs="vp8, vorbis"'))
// "probably" (both with and without evasion)

console.log('Ogg Vorbis:', audio.canPlayType('audio/ogg; codecs="vorbis"'))
// "probably" (both with and without evasion)
```

## Codec Background

**canPlayType() Return Values:**
- `""` (empty string) - Browser cannot play this format
- `"maybe"` - Browser might be able to play (can't determine without trying)
- `"probably"` - Browser can most likely play this format

**H.264/AVC (avc1.42E01E):**
- Proprietary video codec owned by MPEG LA
- Requires licensing fees for distribution
- Included in Chrome but not Chromium
- `avc1.42E01E` is baseline profile, level 3.0

**AAC (Advanced Audio Coding):**
- Proprietary audio codec
- Successor to MP3
- Used in MP4, M4A files
- Requires licensing

**Why Chromium Lacks These:**
Chromium is open-source and can't include proprietary codecs. Chrome (the commercial product) licenses these codecs and includes them.

## References

- [MDN: HTMLMediaElement.canPlayType()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType)
- [MDN: Media container formats (file types)](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers)
- [Chromium Codec Support](https://www.chromium.org/audio-video/)
- [H.264 Codec Parameters](https://wiki.whatwg.org/wiki/Video_type_parameters#MPEG-4)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Fix Chromium not reporting "probably" to codecs like `videoEl.canPlayType('video/mp4; codecs="avc1.42E01E"')`.
(Chromium doesn't support proprietary codecs, only Chrome does)

**Options:**
- `opts` (optional, default `{}`)

### parseInput(arg)

Input might look funky, we need to normalize it so e.g. whitespace isn't an issue for our spoofing.

Example:
```javascript
video/webm; codecs="vp8, vorbis"
video/mp4; codecs="avc1.42E01E"
audio/x-m4a;
audio/ogg; codecs="vorbis"
```

**Parameters:**
- `arg` (String) - MIME type string with optional codecs parameter

**Returns:**
- Object with `mime` (string), `codecStr` (string), and `codecs` (array) properties
