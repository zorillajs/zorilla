export function ProtectedPage() {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Protected Resource - Zorilla Demo</title>
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
          <div id="loading" className="loading">
            <div className="spinner"></div>
            <p>Running bot detection tests...</p>
          </div>

          <div id="secret-content" style={{ display: 'none' }}>
            <header className="success-header">
              <h1>🎉 Access Granted!</h1>
              <p>You successfully bypassed bot detection</p>
              <div className="score-display">
                <span className="score-label">Detection Score:</span>
                <span id="detection-score" className="score-value">
                  --
                </span>
                <span className="score-max">/ 124</span>
              </div>
            </header>

            <section className="api-response">
              <h2>Protected API Response</h2>
              <pre
                id="api-response"
                dangerouslySetInnerHTML={{
                  __html: `{
  "status": "success",
  "message": "Welcome, human (or very clever bot)!",
  "secretData": {
    "apiKey": "zrl_live_sk_demo_123456789",
    "message": "This data is only accessible with zorilla stealth plugin",
    "timestamp": "<span id="timestamp"></span>",
    "detectionScore": <span id="score-in-json">--</span>
  }
}`,
                }}
              />
            </section>

            <section className="test-results">
              <h2>Detection Test Results</h2>
              <div id="test-results-grid" className="test-results-grid">
                {/* Populated by detector.js */}
              </div>
            </section>

            <section className="download-section">
              <button onclick="downloadReport()" className="button">
                📥 Download Full Report
              </button>
            </section>

            <section className="code-samples">
              <h2>How to Access This Page Programmatically</h2>

              <div className="code-example">
                <h3>Without Stealth (Gets Blocked)</h3>
                <pre>
                  <code className="language-javascript">
                    {`import puppeteer from '@zorilla/puppeteer-extra'

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto('http://localhost:8787/challenge')
// Result: Redirected to /blocked - Bot Detected!`}
                  </code>
                </pre>
              </div>

              <div className="code-example">
                <h3>With Stealth Plugin (Gets Through)</h3>
                <pre>
                  <code className="language-javascript">
                    {`import puppeteer from '@zorilla/puppeteer-extra'
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin()) // ← The magic happens here

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto('http://localhost:8787/challenge')
// Result: Access Granted! 🎉`}
                  </code>
                </pre>
              </div>
            </section>

            <section className="next-steps">
              <h3>What's Next?</h3>
              <ul>
                <li>
                  <a href="https://github.com/zorillajs/zorilla">⭐ Star Zorilla on GitHub</a>
                </li>
                <li>
                  <a href="/">📖 Back to Documentation</a>
                </li>
                <li>Try other zorilla plugins (coming soon: recaptcha, adblocker)</li>
              </ul>
            </section>
          </div>

          <div id="blocked-content" style={{ display: 'none' }}>
            {/* This should never show (redirect happens instead) */}
            <h1>🚫 Access Denied</h1>
            <p>Bot detected - redirecting...</p>
          </div>
        </div>

        <script src="/detector.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        function downloadReport() {
            const report = {
                timestamp: new Date().toISOString(),
                score: window.detectionScore,
                maxScore: 124,
                threshold: 75,
                passed: window.detectionScore >= 75,
                tests: window.detectionResults,
                userAgent: navigator.userAgent
            }

            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = \`zorilla-detection-report-\${Date.now()}.json\`
            a.click()
            URL.revokeObjectURL(url)
        }

        // Set timestamp
        document.addEventListener('DOMContentLoaded', () => {
            const tsEl = document.getElementById('timestamp')
            if (tsEl) {
                tsEl.textContent = new Date().toISOString()
            }
        })
    `,
          }}
        />
      </body>
    </html>
  )
}
