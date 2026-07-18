# `@zorilla/stealth-tests`

Deterministic, Zorilla-owned browser stealth conformance probes. The suite runs
the standard Chromium backend through both Puppeteer and Playwright, writes a
versioned JSON result and a Markdown report, and exits non-zero on any failed
probe.

```bash
pnpm --filter @zorilla/stealth-tests build
pnpm --filter @zorilla/stealth-tests test
pnpm --filter @zorilla/stealth-tests test:coverage
pnpm --filter @zorilla/stealth-tests test:conformance
```

Reports are written to `results/` and include the browser, browser version,
framework, framework version, backend, launch mode, OS, enabled plugins, and
identity seed. Add a deterministic probe to `defaultProbes` for every fixed
detection regression. Live third-party bot-test sites intentionally do not run
as part of this release gate.

## Coverage policy

The reusable probe engine and report generator in `src/index.ts` are held to
100% statement, branch, function, and line coverage. The browser runner is
validated separately by `test:conformance`, because it launches real Chromium
instances rather than mocked browser objects.

## CI behavior

Pull requests run the suite against the standard Chromium backend through both
Puppeteer and Playwright. Any failed probe fails the job. JSON and Markdown
reports are uploaded as the `stealth-conformance-results` workflow artifact,
including on failures.
