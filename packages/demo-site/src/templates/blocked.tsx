export function BlockedPage() {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Access Denied - Bot Detected</title>
        <link rel="stylesheet" href="/styles.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css"
        />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
      </head>
      <body>
        <div className="container">
          <header className="blocked-header">
            <h1>🚫 Access Denied</h1>
            <h2>Bot Detected</h2>
            <p>This is what your automation script sees when detection fails.</p>
          </header>

          <section className="failed-checks">
            <h3>Failed Detection Checks</h3>
            <div id="failed-checks-list" className="failed-checks-list">
              {/* Populated by JavaScript */}
            </div>
          </section>

          <section className="explanation">
            <h3>Why Was I Blocked?</h3>
            <p>
              This page uses multiple bot detection techniques to identify automated browsers. Your
              browser failed one or more critical checks, indicating it's likely running in
              automated/headless mode.
            </p>
          </section>

          <section className="solution">
            <h3>💡 How to Fix This</h3>
            <p>
              Try accessing this page using <code>@zorilla/puppeteer-extra-plugin-stealth</code>:
            </p>
            <pre>
              <code className="language-javascript">
                {`import puppeteer from '@zorilla/puppeteer-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto('https://zorilla-demo.pages.dev/challenge')
// Now you'll get the secret content!`}
              </code>
            </pre>
          </section>

          <section className="links">
            <a href="/" className="button">
              ← Back to Documentation
            </a>
            <a href="https://github.com/zorillajs/zorilla" className="button button-secondary">
              View on GitHub
            </a>
          </section>

          <footer>
            <p className="note">
              Detection Score: <span id="detection-score">--</span> / 124 (Threshold: 75)
            </p>
          </footer>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
        // Parse query parameters to show failed checks
        const params = new URLSearchParams(window.location.search)
        const failedCount = params.get('failed')

        // Try to get detection results from sessionStorage (set during redirect)
        const detectionResults = sessionStorage.getItem('detectionResults')
        const detectionScore = sessionStorage.getItem('detectionScore')

        if (detectionScore) {
            document.getElementById('detection-score').textContent = detectionScore
        }

        if (detectionResults) {
            try {
                const results = JSON.parse(detectionResults)
                const failedTests = results.filter(t => !t.passed)

                const listEl = document.getElementById('failed-checks-list')
                if (failedTests.length > 0) {
                    failedTests.forEach(test => {
                        const item = document.createElement('div')
                        item.className = \`failed-check \${test.severity.toLowerCase()}\`
                        item.innerHTML = \`
                            <div class="check-header">
                                <span class="check-icon">❌</span>
                                <span class="check-name">\${test.name}</span>
                                <span class="check-severity">\${test.severity}</span>
                            </div>
                            <p class="check-explanation">\${test.explanation}</p>
                            <p class="check-value">Value: <code>\${JSON.stringify(test.value)}</code></p>
                        \`
                        listEl.appendChild(item)
                    })
                } else {
                    listEl.innerHTML = '<p>No specific failure details available.</p>'
                }
            } catch (e) {
                console.error('Failed to parse detection results:', e)
            }
        } else if (failedCount) {
            document.getElementById('failed-checks-list').innerHTML = \`
                <p>\${failedCount} detection check(s) failed.</p>
                <p class="note">Run the detection locally to see detailed results.</p>
            \`
        } else {
            document.getElementById('failed-checks-list').innerHTML = \`
                <p>Your browser appears to be automated or headless.</p>
                <p class="note">Common indicators:</p>
                <ul>
                    <li>navigator.webdriver = true</li>
                    <li>Empty navigator.plugins array</li>
                    <li>Missing Chrome runtime objects</li>
                    <li>Headless User-Agent string</li>
                </ul>
            \`
        }
    `,
          }}
        />
      </body>
    </html>
  )
}
