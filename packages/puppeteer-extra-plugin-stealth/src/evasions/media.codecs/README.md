## API


#### Table of Contents

- [class: Plugin](#class-plugin)
- [parseInput(arg)](#parseinputarg)

### class: [Plugin](https://github.com/zorillajs/zorilla/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/evasions/media.codecs/index.js#L12-L88)

- `opts` (optional, default `{}`)

**Extends: PuppeteerExtraPlugin**

Fix Chromium not reporting "probably" to codecs like `videoEl.canPlayType('video/mp4; codecs="avc1.42E01E"')`.
(Chromium doesn't support proprietary codecs, only Chrome does)

---

### [parseInput(arg)](https://github.com/zorillajs/zorilla/blob/e6133619b051febed630ada35241664eba59b9fa/packages/puppeteer-extra-plugin-stealth/evasions/media.codecs/index.js#L33-L51)

- `arg` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**

Input might look funky, we need to normalize it so e.g. whitespace isn't an issue for our spoofing.

Example:

```javascript
video / webm
codecs = 'vp8, vorbis'
video / mp4
codecs = 'avc1.42E01E'
audio / x - m4a
audio / ogg
codecs = 'vorbis'
```

---
