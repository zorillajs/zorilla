export function LandingPage() {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Zorilla Stealth Demo - Try to Scrape Me!</title>
        <link rel="stylesheet" href="/styles.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css"
        />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
      </head>
      <body>
        <div className="container">
          <header className="hero">
            <h1>🛡️ Try to Scrape Me... I Dare You</h1>
            <p className="subtitle">
              A hostile website protected by{' '}
              <strong>15+ bot detection techniques</strong>
            </p>
            <p className="status">
              You're viewing this in a real browser - welcome, human! 👋
            </p>
          </header>

          <section className="intro">
            <h2>What is this?</h2>
            <p>
              This website actively detects and blocks automated browsers
              (Puppeteer, Playwright, Selenium, etc.). It demonstrates the
              effectiveness of the{' '}
              <code>@zorilla/puppeteer-extra-plugin-stealth</code> plugin by
              showing how it can bypass these protections.
            </p>
          </section>

          <section className="instructions">
            <h2>How to Test</h2>
            <ol>
              <li>
                <strong>Try accessing the protected resource</strong> at{' '}
                <code>/challenge</code> with Puppeteer → You'll be blocked
              </li>
              <li>
                <strong>Enable the stealth plugin</strong> and try again →
                Success!
              </li>
              <li>
                <strong>Clone the zorilla repo</strong> and run the demo scripts
                to see the difference
              </li>
            </ol>

            <div className="code-example">
              <h3>Without Stealth (Gets Blocked)</h3>
              <pre>
                <code className="language-javascript">
                  {`import puppeteer from '@zorilla/puppeteer-extra'

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto('https://zorilla-demo.pages.dev/challenge')
// Result: Redirected to /blocked - Bot Detected!`}
                </code>
              </pre>
            </div>

            <div className="code-example">
              <h3>With Stealth (Gets Through)</h3>
              <pre>
                <code className="language-javascript">
                  {`import puppeteer from '@zorilla/puppeteer-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin()) // ← The magic happens here

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto('https://zorilla-demo.pages.dev/challenge')
// Result: Access Granted! 🎉`}
                </code>
              </pre>
            </div>
          </section>

          <section className="protections">
            <h2>Active Protections (15 Detection Tests)</h2>
            <p className="note">
              Each protection links to its corresponding stealth evasion
              implementation
            </p>
            <div className="protection-grid">
              <div className="protection-item critical">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/navigator.webdriver"
                    target="_blank"
                    rel="noopener"
                  >
                    navigator.webdriver
                  </a>
                </h4>
                <p>Detects the primary automation indicator property</p>
                <span className="severity">CRITICAL</span>
              </div>
              <div className="protection-item high">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/chrome.runtime"
                    target="_blank"
                    rel="noopener"
                  >
                    Chrome Runtime
                  </a>
                </h4>
                <p>Validates window.chrome.runtime object and methods</p>
                <span className="severity">HIGH</span>
              </div>
              <div className="protection-item high">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/chrome.app"
                    target="_blank"
                    rel="noopener"
                  >
                    Chrome App
                  </a>
                </h4>
                <p>Checks for window.chrome.app object presence</p>
                <span className="severity">HIGH</span>
              </div>
              <div className="protection-item critical">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/navigator.plugins"
                    target="_blank"
                    rel="noopener"
                  >
                    Plugins Array
                  </a>
                </h4>
                <p>Empty plugins array indicates headless mode</p>
                <span className="severity">CRITICAL</span>
              </div>
              <div className="protection-item high">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/webgl.vendor"
                    target="_blank"
                    rel="noopener"
                  >
                    WebGL Vendor
                  </a>
                </h4>
                <p>"Google Inc." reveals headless Chrome</p>
                <span className="severity">HIGH</span>
              </div>
              <div className="protection-item high">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/webgl.vendor"
                    target="_blank"
                    rel="noopener"
                  >
                    WebGL Renderer
                  </a>
                </h4>
                <p>"Google SwiftShader" indicates automation</p>
                <span className="severity">HIGH</span>
              </div>
              <div className="protection-item critical">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/user-agent-override"
                    target="_blank"
                    rel="noopener"
                  >
                    User-Agent Analysis
                  </a>
                </h4>
                <p>Looks for "Headless" or "HeadlessChrome"</p>
                <span className="severity">CRITICAL</span>
              </div>
              <div className="protection-item medium">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/navigator.languages"
                    target="_blank"
                    rel="noopener"
                  >
                    Languages Array
                  </a>
                </h4>
                <p>Empty or suspicious navigator.languages</p>
                <span className="severity">MEDIUM</span>
              </div>
              <div className="protection-item high">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/navigator.plugins"
                    target="_blank"
                    rel="noopener"
                  >
                    MIME Types
                  </a>
                </h4>
                <p>Empty mimeTypes array detection</p>
                <span className="severity">HIGH</span>
              </div>
              <div className="protection-item medium">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/chrome.csi"
                    target="_blank"
                    rel="noopener"
                  >
                    Chrome CSI
                  </a>
                </h4>
                <p>Deprecated chrome.csi() function check</p>
                <span className="severity">MEDIUM</span>
              </div>
              <div className="protection-item medium">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/chrome.loadTimes"
                    target="_blank"
                    rel="noopener"
                  >
                    Chrome LoadTimes
                  </a>
                </h4>
                <p>Deprecated chrome.loadTimes() function</p>
                <span className="severity">MEDIUM</span>
              </div>
              <div className="protection-item medium">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/window.outerdimensions"
                    target="_blank"
                    rel="noopener"
                  >
                    Window Dimensions
                  </a>
                </h4>
                <p>Missing outerWidth/outerHeight properties</p>
                <span className="severity">MEDIUM</span>
              </div>
              <div className="protection-item medium">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/navigator.permissions"
                    target="_blank"
                    rel="noopener"
                  >
                    Notification Permission
                  </a>
                </h4>
                <p>Incorrect permission states in headless</p>
                <span className="severity">MEDIUM</span>
              </div>
              <div className="protection-item low">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/media.codecs"
                    target="_blank"
                    rel="noopener"
                  >
                    Media Codecs
                  </a>
                </h4>
                <p>Missing proprietary codec support</p>
                <span className="severity">LOW</span>
              </div>
              <div className="protection-item low">
                <h4>
                  <a
                    href="https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth/src/evasions/iframe.contentWindow"
                    target="_blank"
                    rel="noopener"
                  >
                    iframe ContentWindow
                  </a>
                </h4>
                <p>Chromium bug #1106 detection</p>
                <span className="severity">LOW</span>
              </div>
            </div>
          </section>

          <section className="demo-scripts">
            <h2>Run Demo Scripts Locally</h2>
            <p>
              The zorilla repository includes demo scripts to test the stealth
              plugin effectiveness. These scripts attempt to access{' '}
              <code>/challenge</code> with and without the stealth plugin.
            </p>

            <h3>Quick Start</h3>
            <pre>
              <code className="language-bash">
                {`# Clone the repository
git clone https://github.com/zorillajs/zorilla.git
cd zorilla

# Install dependencies
pnpm install

# Start the demo site locally
pnpm --filter @zorilla/demo-site run dev

# In a new terminal, run all demos and compare results
pnpm --filter @zorilla/demo-site run demo:compare`}
              </code>
            </pre>

            <h3>Individual Demo Scripts</h3>
            <div className="demo-grid">
              <div className="demo-item">
                <h4>Puppeteer (No Stealth)</h4>
                <pre>
                  <code className="language-bash">
                    pnpm --filter @zorilla/demo-site run
                    demo:puppeteer:no-stealth
                  </code>
                </pre>
                <p className="note">❌ Expected: Blocked (~20-30 points)</p>
              </div>
              <div className="demo-item">
                <h4>Puppeteer (With Stealth)</h4>
                <pre>
                  <code className="language-bash">
                    pnpm --filter @zorilla/demo-site run
                    demo:puppeteer:with-stealth
                  </code>
                </pre>
                <p className="note">
                  ✅ Expected: Access Granted (~115-124 points)
                </p>
              </div>
              <div className="demo-item">
                <h4>Playwright (No Stealth)</h4>
                <pre>
                  <code className="language-bash">
                    pnpm --filter @zorilla/demo-site run
                    demo:playwright:no-stealth
                  </code>
                </pre>
                <p className="note">❌ Expected: Blocked (~20-30 points)</p>
              </div>
              <div className="demo-item">
                <h4>Playwright (With Stealth)</h4>
                <pre>
                  <code className="language-bash">
                    pnpm --filter @zorilla/demo-site run
                    demo:playwright:with-stealth
                  </code>
                </pre>
                <p className="note">
                  ✅ Expected: Access Granted (~115-124 points)
                </p>
              </div>
            </div>

            <h3>What the Scripts Do</h3>
            <ul>
              <li>Launch a headless browser (Puppeteer or Playwright)</li>
              <li>
                Navigate to the protected resource at <code>/challenge</code>
              </li>
              <li>Run through all 15 detection tests</li>
              <li>
                Display the detection score and result (blocked or granted)
              </li>
              <li>Generate screenshots showing the results</li>
            </ul>

            <p className="note">
              💡 <strong>Tip:</strong> Run <code>demo:compare</code> to execute
              all 4 demos and generate a comparison report.
            </p>
          </section>

          <section className="cta">
            <h2>Ready to Test?</h2>
            <a href="/challenge" className="button">
              Try the Protected Resource →
            </a>
            <p className="note">
              Or run the demo scripts from the zorilla repository (instructions
              above)
            </p>
          </section>

          <footer>
            <p>
              <a href="https://github.com/zorillajs/zorilla">View on GitHub</a>{' '}
              |{' '}
              <a href="https://github.com/zorillajs/zorilla/tree/main/packages/demo-site">
                Source Code
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
