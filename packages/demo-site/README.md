# Zorilla Demo Site

A **hostile website** powered by Cloudflare Workers that actively detects and blocks automated browsers. Demonstrates the effectiveness of the `@zorilla/puppeteer-extra-plugin-stealth` plugin.

## What is this?

This is a bot-protected website that serves two purposes:

1. **Documentation**: Explains what bot protections are in place and how to bypass them
2. **Target**: The actual protected resource that demonstrates real-world bot detection

## Features

- 🛡️ **15 bot detection tests** - Client-side checks for automation indicators
- 🌐 **Server-side detection** - Request header analysis and fingerprinting
- 🎯 **Dual-layer protection** - Both server and client work together to block bots
- 📊 **Detailed scoring system** - 124 points total, 75-point threshold for access
- 🚫 **Automatic blocking** - Bots are redirected to a blocked page
- ✅ **Stealth demonstration** - Clear before/after comparison with the stealth plugin

## Detection Tests

The site implements 15 detection techniques based on real-world bot protection:

| Test | Severity | Points | What it Checks |
|------|----------|--------|----------------|
| navigator.webdriver | CRITICAL | 15 | Primary automation indicator |
| navigator.plugins | CRITICAL | 15 | Empty plugins array in headless |
| User-Agent | CRITICAL | 15 | "Headless" or "HeadlessChrome" strings |
| chrome.runtime | HIGH | 10 | Chrome extension API presence |
| chrome.app | HIGH | 10 | Chrome app API presence |
| WebGL Vendor | HIGH | 10 | GPU vendor fingerprinting |
| WebGL Renderer | HIGH | 10 | GPU renderer fingerprinting |
| navigator.mimeTypes | HIGH | 10 | MIME types array |
| chrome.csi | MEDIUM | 5 | Chrome timing API |
| chrome.loadTimes | MEDIUM | 5 | Chrome load timing API |
| navigator.languages | MEDIUM | 5 | Language preferences |
| Window Dimensions | MEDIUM | 5 | outerWidth/outerHeight properties |
| Notification Permission | MEDIUM | 5 | Permission state on HTTPS |
| Media Codecs | LOW | 2 | Proprietary codec support |
| iframe ContentWindow | LOW | 2 | Chromium iframe bug |

**Total**: 124 points | **Threshold**: 75 points

## Local Development

### Prerequisites

- Node.js 18+
- pnpm (installed in the monorepo root)
- Cloudflare account (for deployment, optional for local dev)

### Installation

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Navigate to demo-site package
cd packages/demo-site
```

### Running the Worker Locally

```bash
# Start wrangler dev server
pnpm dev
```

The site will be available at `http://localhost:8787`:
- `/` - Landing page with documentation
- `/api/secret` - Protected resource (THE TARGET)
- `/blocked` - Bot detected page

## Running Demo Scripts

### Quick Test (All 4 Demos)

```bash
pnpm demo:compare
```

This runs all 4 demos (Puppeteer and Playwright, with and without stealth) and generates a comparison report.

### Individual Demos

```bash
# Puppeteer without stealth (should be blocked)
pnpm demo:puppeteer:no-stealth

# Puppeteer with stealth (should succeed)
pnpm demo:puppeteer:with-stealth

# Playwright without stealth (should be blocked)
pnpm demo:playwright:no-stealth

# Playwright with stealth (should succeed)
pnpm demo:playwright:with-stealth
```

### Expected Results

| Demo | Expected Outcome | Detection Score |
|------|-----------------|-----------------|
| Puppeteer (No Stealth) | 🚫 Blocked | 10-30 / 124 |
| Puppeteer (With Stealth) | ✅ Access Granted | 115-124 / 124 |
| Playwright (No Stealth) | 🚫 Blocked | 10-30 / 124 |
| Playwright (With Stealth) | ✅ Access Granted | 115-124 / 124 |

### Testing Against Production

To test against the live site (once deployed):

```bash
TARGET_URL=https://zorilla-demo.pages.dev/api/secret pnpm demo:compare
```

## Deployment

### Deploy to Cloudflare Workers

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy:
```bash
pnpm deploy
```

The site will be deployed to `https://zorilla-demo.pages.dev` (or your configured domain).

## Project Structure

```
packages/demo-site/
├── src/
│   ├── index.ts                    # Worker entry point
│   ├── detection/
│   │   ├── server-side.ts          # Server-side bot detection
│   │   ├── client-side.ts          # Client-side test definitions
│   │   └── scoring.ts              # Scoring system
│   ├── templates/
│   │   ├── landing.html            # Landing/docs page
│   │   ├── protected.html          # Protected resource
│   │   └── blocked.html            # Bot detected page
│   └── static/
│       ├── detector.js             # Client-side detection runner
│       └── styles.css              # Site styles
├── scripts/stealth/
│   ├── puppeteer-no-stealth.js
│   ├── puppeteer-with-stealth.js
│   ├── playwright-no-stealth.js
│   ├── playwright-with-stealth.js
│   └── compare.js
└── package.json
```

## How It Works

### 1. Server-Side Detection (First Layer)

When a request hits `/api/secret`, the Cloudflare Worker analyzes:
- User-Agent header for "Headless" strings
- Accept-Language header (missing or suspicious values)
- Automation-specific headers
- Accept header detail

If confidence > 60%, the request is blocked immediately with a 403 response.

### 2. Client-Side Detection (Second Layer)

If the request passes server-side checks, the browser loads JavaScript that runs 15 detection tests:
- Checks browser properties (navigator.webdriver, chrome objects, etc.)
- Analyzes WebGL fingerprints
- Tests codec support and permissions
- Calculates a score out of 124 points

If score < 75, the page redirects to `/blocked`.
If score >= 75, the secret content is revealed.

### 3. Stealth Plugin Bypass

The `@zorilla/puppeteer-extra-plugin-stealth` plugin patches all these detection points:
- Removes navigator.webdriver
- Mocks Chrome objects (app, runtime, csi, loadTimes)
- Fixes WebGL vendor/renderer strings
- Adds plugins and MIME types
- Fixes User-Agent, permissions, window dimensions, etc.

Result: Score jumps from ~20 to ~120, granting access!

## Troubleshooting

### Worker fails to start

Make sure you're in the correct directory:
```bash
cd packages/demo-site
pnpm dev
```

### Demo scripts can't connect

Make sure the worker is running:
```bash
pnpm dev
```

The default target is `http://localhost:8787/api/secret`.

### Demo scripts show unexpected results

1. Check if the worker is running
2. Try opening `http://localhost:8787` in a real browser first
3. Check the worker logs for errors
4. Make sure all workspace dependencies are installed: `pnpm install` from monorepo root

## Future Enhancements

- [ ] TLS fingerprinting (JA3) for server-side detection
- [ ] HTTP/2 header analysis
- [ ] Request timing pattern analysis
- [ ] Additional plugin demos (recaptcha, adblocker, etc.)
- [ ] Real-time analytics dashboard

## License

Part of the [Zorilla](https://github.com/zorillajs/zorilla) monorepo. See root LICENSE for details.
