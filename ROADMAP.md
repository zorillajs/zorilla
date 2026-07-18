# Zorilla Roadmap

> Status: proposed
> Last updated: July 18, 2026
> Scope: product and engineering direction; this is not a release commitment

## Purpose

Zorilla is a maintained, ESM-native fork of `puppeteer-extra` that provides a
shared plugin system for Puppeteer and Playwright. Its strongest differentiator
today is breadth: one framework can compose stealth evasions, CAPTCHA solving,
proxy routing, ad blocking, browser profiles, resource controls, and developer
tools.

The browser automation market has changed since the original stealth plugin was
designed. Modern competitors increasingly address detection below the page
JavaScript layer, generate internally consistent browser identities, and bind
those identities to proxies and persistent sessions. This roadmap evolves
Zorilla from a collection of useful browser plugins into an extensible control
plane for browser identity, stealth backends, sessions, proxies, and automation
plugins.

The roadmap is deliberately modular. Zorilla should integrate with patched
drivers and browsers before taking on the permanent maintenance cost of a
Chromium or Firefox fork.

## Product principles

1. **Measure signals, not marketing claims.** Report concrete compatibility and
   detection results. Do not promise that a configuration is "undetectable."
2. **Coherence over isolated spoofing.** A smaller, internally consistent
   identity is safer than a large collection of contradictory property patches.
3. **Compose rather than fork first.** Support standard and patched automation
   backends through adapters. Consider maintaining a browser fork only if
   integrations cannot meet documented requirements.
4. **Keep policy separate from mechanism.** Identity generation, session
   rotation, proxy selection, and challenge solving should have independent
   interfaces that can be composed.
5. **Preserve drop-in ergonomics.** A user who does not opt into advanced
   features should retain the familiar Puppeteer or Playwright API.
6. **Make capabilities explicit.** Plugins and backends must declare supported
   engines, frameworks, versions, and whether a mitigation is native,
   protocol-level, injected, or unavailable.
7. **Default to deterministic testing.** Randomized identity and interaction
   behavior must support seeds, serialization, and replay.

## Current baseline

As of July 2026, the repository provides:

- Puppeteer and Playwright wrappers with a shared plugin model.
- A plugin base class with lifecycle hooks, requirements, dependencies, data
  exchange, and ordering behavior.
- A stealth plugin containing 17 selectable evasions.
- Plugins for CAPTCHA solving, ad/tracker blocking, resource blocking, user
  preferences, user data directories, remote DevTools, REPL access, and other
  utilities.
- Dynamic proxy routing for Puppeteer and Playwright.
- A utility for extracting stealth evasions as standalone JavaScript.
- TypeScript, ESM-only packages, modern build tooling, and automated releases.

The principal gaps are coherent identity generation, low-level automation leak
mitigation, persistent identity/session management, production browser pooling,
and a versioned stealth conformance report.

## Competitive research

This comparison includes direct library competitors and adjacent projects that
set the standard for a particular capability. A filled circle means strong or
native support, a half circle means partial or integration-dependent support,
and an empty circle means absent or outside the project's normal scope.

### Project positioning

| Project | Category | Relevant strength | Relevant limitation |
| --- | --- | --- | --- |
| Zorilla | Cross-framework plugin system | Broad, composable plugin catalog across Puppeteer and Playwright | Stealth is primarily page-level JavaScript patching |
| [puppeteer-extra](https://github.com/berstend/puppeteer-extra) | Direct predecessor | Established API and third-party plugin ecosystem | Older packaging and the same page-level stealth model |
| [Rebrowser](https://github.com/rebrowser/rebrowser-patches) | Patched Puppeteer/Playwright packages | Mitigates CDP `Runtime.enable`, source URL, and utility-world leaks | Narrower than a general plugin/session platform; Chromium-focused |
| [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright) | Patched Playwright | Drop-in Playwright API with driver-level stealth changes | Stealth patches are limited to Chromium-based browsers |
| [Camoufox](https://github.com/daijro/camoufox) | Patched Firefox distribution | Browser-native fingerprint interception and broad identity coherence | Python-first specialized browser distribution rather than a general JS plugin SDK |
| [Crawlee Browser Pool](https://crawlee.dev/js/api/browser-pool) | Crawler/browser runtime | Pools, graceful retirement, fingerprinting, sessions, and proxy affinity | Larger crawling platform; stealth is not its sole focus |
| [BrowserForge](https://github.com/daijro/browserforge) | Fingerprint generator | Matching fingerprints and ordered headers | Its injection layer is deprecated in favor of Camoufox |

### Platform and operations matrix

| Capability | Zorilla | puppeteer-extra | Rebrowser | Patchright | Camoufox | Crawlee | BrowserForge |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Puppeteer support | ● | ● | ● | ○ | ○ | ● | ◐ |
| Playwright support | ● | ● | ● | ● | ● | ● | ● |
| Chromium | ● | ● | ● | ● | ○ | ● | ● |
| Firefox | ◐ | ◐ | ○ | ○ | ● | ● | ● |
| WebKit | ◐ | ◐ | ○ | ○ | ○ | ● | ◐ |
| JavaScript/TypeScript API | ● | ● | ● | ● | ○ | ● | ○ |
| Python API | ○ | ○ | ◐ | ● | ● | ● | ● |
| Drop-in upstream API | ● | ● | ● | ● | ◐ | ◐ | ○ |
| General-purpose plugin SDK | ● | ● | ○ | ○ | ○ | ◐ | ○ |
| Plugin lifecycle and ordering | ● | ● | ○ | ○ | ○ | ● | ○ |
| CAPTCHA integration | ● | ● | ○ | ○ | ○ | ◐ | ○ |
| Dynamic proxy routing | ● | ◐ | ○ | ○ | ◐ | ● | ○ |
| Persistent session identities | ○ | ○ | ○ | ◐ | ◐ | ● | ◐ |
| Browser pooling and retirement | ○ | ○ | ○ | ○ | ○ | ● | ○ |
| Crawl queues, retries, and storage | ○ | ○ | ○ | ○ | ○ | ● | ○ |

Firefox and WebKit are marked partial for Zorilla stealth because the framework
can drive them, but several existing evasions model Chromium-specific behavior.

### Stealth and identity matrix

| Capability | Zorilla | puppeteer-extra | Rebrowser | Patchright | Camoufox | Crawlee | BrowserForge |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `navigator.webdriver` mitigation | ● | ● | ◐ | ● | ● | ◐ | ◐ |
| UA and client-hints alignment | ◐ | ◐ | ○ | ◐ | ● | ● | ● |
| Navigator and Chrome API emulation | ● | ● | ○ | ◐ | ● | ● | ● |
| WebGL vendor/renderer override | ● | ● | ○ | ◐ | ● | ● | ● |
| Full WebGL parameter consistency | ○ | ○ | ○ | ◐ | ● | ● | ● |
| Canvas, audio, and font controls | ○ | ○ | ○ | ◐ | ● | ● | ● |
| Screen/viewport coherence | ◐ | ◐ | ○ | ◐ | ● | ● | ● |
| Locale/timezone/geolocation coherence | ◐ | ◐ | ○ | ◐ | ● | ● | ● |
| WebRTC IP protection/spoofing | ○ | ○ | ○ | ◐ | ● | ◐ | ● |
| Statistically realistic identities | ○ | ○ | ○ | ○ | ● | ● | ● |
| Fingerprint tied to proxy/session | ○ | ○ | ○ | ○ | ◐ | ● | ○ |
| Source URL leak mitigation | ● | ● | ● | ● | ● | ◐ | ○ |
| CDP `Runtime.enable` mitigation | ○ | ○ | ● | ● | N/A | ○ | ○ |
| Utility-world leak mitigation | ○ | ○ | ● | ● | ● | ○ | ○ |
| Main-world execution isolation | ◐ | ◐ | ● | ● | ● | ◐ | ◐ |
| Browser-native fingerprint patching | ○ | ○ | ○ | ◐ | ● | ○ | ○ |
| Humanized pointer movement | ○ | ○ | ○ | ○ | ● | ○ | ○ |
| Selectable modular evasions | ● | ● | ◐ | ○ | ◐ | ○ | ◐ |

### Research conclusions

1. Adding more isolated `navigator.*` evasions will not address driver-level
   automation signals such as CDP execution-context behavior.
2. Browser identity must be modeled as one coherent object rather than the sum
   of unrelated plugin options.
3. Identity, proxy, cookies, and persistent storage must rotate together or not
   at all.
4. Zorilla's plugin architecture remains a meaningful advantage: specialized
   patched drivers generally do not provide an equivalent general-purpose
   composition system.
5. Building a complete crawler would dilute the project. Lightweight pooling
   and sessions complement Zorilla; crawl queues and datasets are better left to
   Crawlee and similar platforms.

## Priorities at a glance

| Priority | Initiative | Outcome | Approximate size |
| --- | --- | --- | --- |
| P0 | 1. Stealth conformance suite | A measurable baseline and compatibility report | L |
| P0 | 2. Browser identity model | Coherent, serializable, validated identities | XL |
| P0 | 3. Low-level backend interface | Standard, Rebrowser, and Patchright launch paths | L |
| P1 | 4. Session and identity manager | Identity, proxy, cookies, and storage lifecycle | XL |
| P1 | 5. Proxy health and rotation | Production-grade proxy selection and affinity | L |
| P1 | 6. Challenge API modernization | Provider-neutral CAPTCHA/challenge handling | L |
| P1 | 7. Migration and ecosystem compatibility | Lower switching cost from `puppeteer-extra` | M |
| P1 | 8. Framework-neutral plugin SDK | Durable cross-framework plugin contracts | XL |
| P2 | 9. Advanced fingerprint modules | Coverage of modern identity surfaces | XL, ongoing |
| P2 | 10. Humanized interaction plugin | Seeded pointer, typing, and scrolling behavior | L |
| P2 | 11. Browser pool primitives | Resilient long-running browser workloads | XL |
| P2 | 12. Structured diagnostics | Actionable detection and compatibility reports | L |
| P3 | 13. Plugin catalog and metadata | Discoverable, trustworthy plugin ecosystem | M |
| P3 | 14. Agent-oriented utilities | Efficient, inspectable browser-agent workflows | XL |

Sizes are relative and intentionally exclude ongoing browser-version maintenance.

## Detailed initiatives

### 1. Stealth conformance suite — P0

**Problem:** Stealth behavior is currently difficult to compare across browser,
framework, version, launch mode, and backend. Without a baseline, changes risk
fixing one surface while making another identity inconsistent.

**Proposed scope:**

- Create a dedicated test package, for example `@zorilla/stealth-tests`.
- Define Zorilla-owned invariant tests rather than relying only on public bot
  test sites.
- Cover navigator descriptors, native function appearance, headers, client
  hints, frames, workers, service workers, popups, WebGL, screen metrics, locale,
  timezone, permissions, plugins, codecs, and source URLs.
- Run supported Puppeteer and Playwright versions against Chromium in headless
  and headful modes. Add Firefox and WebKit cases where the tested capability is
  meaningful.
- Add backend dimensions for standard, Rebrowser, and Patchright once available.
- Capture results as structured JSON and generate a human-readable report.
- Keep optional live-site tests separate from deterministic CI tests. Live-site
  failures must not block releases unless explicitly promoted to a stable gate.

**Deliverables:**

- Test fixture site and detection probe library.
- Versioned test-result schema.
- CI matrix with an explicit supported-version policy.
- Generated compatibility report and a documented process for updating it.
- Regression fixture for every fixed detection issue.

**Acceptance criteria:**

- A contributor can reproduce every CI signal locally.
- Each result identifies browser, browser version, framework, framework version,
  backend, headless mode, OS, enabled plugins, and identity seed.
- A failing probe explains the observed and expected values without logging
  secrets or proxy credentials.
- At least Chromium/Puppeteer and Chromium/Playwright standard backends are
  release-gated before the initiative is considered complete.

**Dependencies:** None. This should begin first and inform every stealth change.

**Risks:** Public test sites are unstable and may encourage misleading pass-rate
marketing. Treat them as observations, not as a definition of correctness.

### 2. Coherent browser identity model — P0

**Problem:** Current evasions configure related fingerprint surfaces
independently. That permits impossible combinations such as an operating system,
GPU, screen, locale, and user agent that do not plausibly coexist.

**Proposed scope:**

- Add a package such as `@zorilla/browser-identity`.
- Define a versioned `BrowserIdentity` schema containing:
  - browser family and version;
  - operating system, architecture, and device class;
  - user agent, client hints, and ordered request headers;
  - locale, languages, timezone, and optional geolocation;
  - screen, available screen, viewport, DPR, and color properties;
  - CPU count, device memory, touch capability, and media capabilities;
  - WebGL vendor, renderer, parameters, and supported extensions;
  - font, audio, media-device, speech-voice, and WebRTC policy references.
- Separate identity data from its application mechanism. An applicator reports
  whether each field was applied natively, through a protocol, through script
  injection, or not at all.
- Support deterministic generation from a seed, JSON import/export, schema
  migration, and user-supplied profiles.
- Add a consistency validator with machine-readable error codes.
- Begin with curated profiles and constraints; statistically weighted generation
  can follow after the data provenance and update policy are settled.

**Illustrative API:**

```ts
import { identities } from '@zorilla/browser-identity';

const identity = identities.generate({
  browser: 'chrome',
  operatingSystem: 'windows',
  seed: 'customer-session-42',
});

const result = await identity.apply(context);
console.log(result.coverage);
```

**Deliverables:**

- Schema, TypeScript types, JSON Schema, generator, validator, and migration API.
- Header generation that agrees with navigator and client-hint values.
- Applicators for Puppeteer and Playwright Chromium.
- Identity coverage report suitable for structured diagnostics.
- Documentation on profile provenance, versioning, and safe extension.

**Acceptance criteria:**

- The same seed and schema/data version produce the same identity.
- Serialized identities round-trip without loss.
- Validation rejects known impossible browser/OS, GPU/OS, mobile/screen, and
  locale/timezone combinations represented in the test corpus.
- HTTP headers, UA client hints, and JavaScript-visible values agree in tests.
- Unsupported properties are reported, never silently treated as applied.

**Dependencies:** The conformance schema from initiative 1 should be designed in
parallel so identity coverage appears in test results.

**Risks:** Fingerprint datasets age quickly and may have licensing or provenance
constraints. Store source and collection-version metadata; do not copy an
external dataset without confirming its license.

### 3. Low-level stealth backend interface — P0

**Problem:** Page-level plugins cannot completely mitigate protocol and driver
signals. Rebrowser and Patchright solve some of these problems, but adopting them
currently requires users to restructure imports and configuration outside the
Zorilla plugin model.

**Proposed scope:**

- Define a `BrowserBackend` capability contract for launch, connect, browser
  engine, framework compatibility, executable management, and mitigations.
- Ship standard Puppeteer and standard Playwright backends first.
- Prototype Rebrowser Puppeteer/Playwright and Patchright adapters.
- Detect incompatible versions at startup with actionable messages.
- Expose backend capabilities to plugins so an evasion can skip redundant or
  conflicting JavaScript patches.
- Keep package patching/install-time mutation outside the core runtime. Prefer
  published drop-in packages where available.

**Illustrative API:**

```ts
const browser = await zorilla.launch({
  framework: 'playwright',
  backend: 'patchright',
  browser: 'chromium',
  plugins: [StealthPlugin()],
});
```

**Deliverables:**

- Backend contract and capability vocabulary.
- Standard backend implementations with no behavior regression.
- At least one Rebrowser and one Patchright integration proof of concept.
- Version-compatibility checks and conformance-suite dimensions.
- Decision record documenting integration versus permanent-fork tradeoffs.

**Acceptance criteria:**

- The same minimal automation example runs through standard and patched backends
  with only backend configuration changed.
- Plugins can query `runtimeEnableMitigation`, `isolatedWorldMitigation`, and
  related capabilities without testing package names.
- Unsupported combinations fail before browser launch.
- Conformance results demonstrate the intended low-level signals rather than
  assuming them from the selected package.

**Dependencies:** Initiative 1. It should integrate with initiative 2 but need
not wait for the full identity model.

**Risks:** Patched drivers can lag upstream releases or change behavior. The
compatibility policy must identify tested versions and avoid broad semver claims.

### 4. Session and identity manager — P1

**Problem:** A convincing identity loses value if its proxy, cookies, local
storage, or profile changes independently. Users currently assemble this
lifecycle themselves.

**Proposed scope:**

- Add a package such as `@zorilla/session` that binds identity, proxy assignment,
  cookies, browser storage, user-data directory, reputation, and lifecycle.
- Support in-memory and filesystem-backed stores behind a storage interface.
- Lease sessions safely across concurrent tasks.
- Provide maximum age, usage count, idle timeout, and failure thresholds.
- Support sticky reuse, explicit rotation, quarantine, retirement, and recovery.
- Record challenge, navigation, proxy, and browser-crash outcomes without storing
  page content by default.
- Export/import sessions with optional application-provided encryption hooks.

**State model:**

```text
available -> leased -> available
                 |-> quarantined -> available or retired
                 |-> retired
```

**Deliverables:**

- Session schema and lifecycle API.
- Atomic lease/release semantics.
- In-memory and local filesystem stores.
- Identity and proxy affinity integration.
- Reputation hooks and lifecycle events.

**Acceptance criteria:**

- Two workers cannot simultaneously lease the same exclusive session.
- A session retains the same identity, proxy affinity, cookies, and storage
  across release and reacquisition.
- Challenge and ban policies can quarantine a session automatically.
- Crash recovery does not leave a session permanently leased.
- Logs and serialized metadata redact credentials by default.

**Dependencies:** Initiatives 2 and 5. A minimal interface can be designed while
those implementations are in progress.

**Risks:** Persisted sessions contain sensitive data. Encryption should be an
application concern exposed through hooks, and documentation must state the
default storage security clearly.

### 5. Proxy health, selection, and rotation — P1

**Problem:** The existing proxy router selects routes, but production workloads
also need health, reputation, affinity, and lifecycle management.

**Proposed scope:**

- Extend or complement `@zorilla/proxy-router` with normalized HTTP, HTTPS,
  SOCKS4, and SOCKS5 endpoint definitions.
- Add sticky session keys and identity affinity.
- Add health checks, exponentially weighted latency, failure counts, cooldown,
  geographic constraints, and per-domain routing.
- Define rotation strategies: round-robin, random, least-latency, weighted,
  sticky-until-failure, and application callback.
- Add credential-provider callbacks so secrets need not live in configuration.
- Emit metrics/events without exposing usernames or passwords.
- Ensure WebRTC and geolocation policy can be validated against proxy location.

**Deliverables:**

- Typed endpoint and pool APIs.
- Health and selection engine.
- Session affinity integration.
- Domain rules and failure classification.
- Metrics and redaction tests.

**Acceptance criteria:**

- Unhealthy endpoints leave selection and re-enter only after configured probes
  or cooldown.
- Sticky sessions remain on one endpoint until policy permits rotation.
- Authentication is supported for each protocol where the underlying framework
  permits it.
- No event, error, or debug log contains raw proxy credentials.
- Identity diagnostics detect proxy/geolocation/WebRTC contradictions.

**Dependencies:** Initiative 2 for full coherence; can otherwise proceed from the
existing proxy router.

### 6. Provider-neutral challenge API — P1

**Problem:** The existing reCAPTCHA plugin includes valuable solver integration,
but the challenge landscape now includes multiple CAPTCHA and managed-challenge
families. Provider-specific methods make extension and session feedback harder.

**Proposed scope:**

- Extract common detection, solving, token injection, timeout, retry, and result
  types into a neutral challenge package.
- Preserve the current plugin API through a compatibility facade.
- Define adapters for reCAPTCHA v2/v3/Enterprise, hCaptcha, Cloudflare Turnstile,
  Arkose Labs/FunCaptcha, AWS WAF CAPTCHA, and manual/custom solvers.
- Distinguish token challenges, interactive challenges, and managed challenge
  pages.
- Add budget, timeout, retry, cancellation, and provider fallback policies.
- Feed detected, solved, failed, and repeated challenges into session reputation.
- Never log site keys, API credentials, tokens, or response payloads by default.

**Deliverables:**

- Challenge and solver contracts.
- Compatibility adapter for existing reCAPTCHA/hCaptcha behavior.
- Turnstile support as the first new implementation.
- Event model and session-reputation hook.
- Test fixture pages that do not depend on paid solver services.

**Acceptance criteria:**

- Existing supported reCAPTCHA and hCaptcha workflows continue to work through
  the compatibility API.
- A solver can be added without modifying challenge-detection core code.
- Users can cap attempts, elapsed time, and estimated cost.
- Cancellation stops polling and disposes listeners.
- Tests use mock providers and never require production solver credentials.

**Dependencies:** Initiative 4 for reputation integration, but core API work can
begin independently.

### 7. `puppeteer-extra` migration and ecosystem compatibility — P1

**Problem:** Zorilla has a credible maintained-fork story, but the package scope,
ESM-only runtime, and Node.js requirements create switching friction for existing
users and third-party plugins.

**Proposed scope:**

- Publish a package-by-package migration guide and behavioral differences list.
- Build a codemod for imports, package names, and documented configuration
  changes.
- Provide a plugin compatibility harness authors can run in their repository.
- Catalog popular upstream plugins with verified status and limitations.
- Improve startup diagnostics for CommonJS-only plugins, missing peer
  dependencies, incompatible engines, and obsolete hooks.
- Evaluate aliases or compatibility facades only where they do not undermine the
  ESM-only architecture.

**Deliverables:**

- Migration documentation and codemod.
- Published compatibility test kit.
- Initial upstream-plugin compatibility report.
- Actionable runtime diagnostics.

**Acceptance criteria:**

- The documented standard quick-start application can be migrated automatically.
- The codemod is idempotent and provides warnings for cases it cannot transform.
- Plugin authors receive a result for each lifecycle hook and supported framework.
- Compatibility claims always state Node, framework, browser, and plugin versions.

**Dependencies:** None. Coordinate the compatibility harness with initiative 8.

### 8. Framework-neutral plugin SDK — P1

**Problem:** The shared base class retains Puppeteer-specific naming and types
even when a plugin targets Playwright. Capability requirements and lifecycle
semantics are partly implicit.

**Proposed scope:**

- Introduce `@zorilla/plugin` and `@zorilla/plugin-testing`.
- Define framework-neutral browser, context, page, target, and launch lifecycle
  contracts without weakening types to `any`.
- Add explicit engine, framework, backend, and version capability declarations.
- Formalize hook priority, dependency ordering, optional dependencies, conflict
  detection, disposal, and per-context configuration.
- Standardize logging, metrics, plugin data exchange, and abort signals.
- Preserve `@zorilla/puppeteer-extra-plugin` as a compatibility facade through a
  documented deprecation window.

**Deliverables:**

- Neutral base types and plugin class.
- Adapter layer for current plugins.
- Plugin testing fixtures for Puppeteer and Playwright.
- Compatibility/deprecation plan and migration guide.
- Reference plugin implemented natively against the new SDK.

**Acceptance criteria:**

- A neutral plugin can receive typed Puppeteer and Playwright lifecycle events.
- Unsupported browsers/backends are rejected with a specific capability error.
- Ordering is deterministic and cycles produce a readable dependency path.
- Cleanup runs on normal shutdown, launch failure, and abort.
- Existing first-party plugins continue to operate through the compatibility
  facade during the migration window.

**Dependencies:** Coordinate with initiative 3's backend capability vocabulary.

**Risks:** This can become a large breaking rewrite. Build the facade and port a
small plugin first; do not migrate every package in one release.

### 9. Advanced fingerprint modules — P2

**Problem:** Modern fingerprinting covers many surfaces beyond the current
navigator and WebGL vendor overrides. These surfaces must agree with the central
identity and cannot all be robustly implemented through JavaScript injection.

**Proposed scope:**

- Add identity applicators for canvas, AudioContext, fonts and metrics, full
  WebGL parameters, WebRTC, media devices, speech synthesis, battery/sensors,
  CSS media queries, codecs, and client-hint negotiation.
- Implement each surface as an independently testable module consuming the same
  `BrowserIdentity`.
- Classify implementation strength as native, protocol, injected, or unsupported.
- Prefer backend/native support when available and disable conflicting injection.
- Research TLS and HTTP/2 fingerprint visibility, but do not claim to control it
  unless the chosen browser/proxy stack actually does.

**Deliverables:**

- Per-surface modules and conformance probes.
- Identity consistency rules for each module.
- Coverage and implementation-strength reporting.
- Backend-specific fallback policy.

**Acceptance criteria:**

- Every module has a deterministic identity fixture and negative consistency
  tests.
- Modules do not independently randomize values.
- A module refuses an impossible value rather than silently degrading coherence.
- The diagnostic report distinguishes absent, unsupported, failed, and applied.

**Dependencies:** Initiatives 1–3.

**Risks:** Some injected evasions may be more detectable than browser defaults.
Each module should be opt-in until conformance evidence supports a safe default.

### 10. Humanized interaction plugin — P2

**Problem:** Perfectly linear pointer paths, instantaneous typing, and mechanical
scroll patterns can be behavioral signals. Applications also need deterministic
replay when humanization is enabled.

**Proposed scope:**

- Add an optional plugin for curved pointer paths, acceleration, overshoot,
  element-relative click targets, typing cadence, corrections, scroll inertia,
  pauses, hover, and focus transitions.
- Support seeds, speed profiles, reduced-motion policy, cancellation, and replay.
- Use framework-native input dispatch and avoid DOM event fabrication where
  possible.
- Keep this plugin disabled by default for test automation performance.

**Deliverables:**

- Pointer, keyboard, and scroll behavior engines.
- Seeded trace format and replay API.
- Accessibility/reduced-motion configuration.
- Statistical and integration tests.

**Acceptance criteria:**

- The same seed and geometry produce the same action trace.
- Actions respect element bounds, viewport clipping, cancellation, and navigation.
- The plugin exposes no global mutable randomness.
- Users can choose instant, deterministic-humanized, and custom behavior modes.

**Dependencies:** Initiative 8 is preferred but not required for a prototype.

### 11. Browser pool primitives — P2

**Problem:** Long-running services need browser reuse, retirement, crash recovery,
and backpressure. Zorilla currently leaves this lifecycle to each application.

**Proposed scope:**

- Build a lightweight pool, not a crawler.
- Limit browsers, contexts, and pages globally and per identity/proxy.
- Retire based on age, uses, memory, crashes, or application signals.
- Stop new work on retiring browsers while allowing active work a grace period.
- Support warm browsers/contexts, queue backpressure, launch retry, and shutdown.
- Integrate session leasing and plugin cleanup.

**Deliverables:**

- Pool and lease APIs.
- Retirement and health policies.
- Crash recovery and graceful shutdown.
- Metrics for queue time, launch time, utilization, crashes, and retirement.

**Acceptance criteria:**

- Configured concurrency limits are never exceeded under stress tests.
- Retiring browsers accept no new leases and close after active leases finish or
  the grace period expires.
- Crashed browsers are replaced without double-releasing sessions.
- Shutdown drains or cancels according to an explicit user-selected policy.

**Dependencies:** Initiatives 4 and 8.

**Non-goals:** Crawl request queues, datasets, autoscaled worker fleets, and URL
deduplication.

### 12. Structured diagnostics — P2

**Problem:** Users can see that a site challenged them but cannot easily identify
an unsupported backend, failed injection, contradictory identity, or proxy leak.

**Proposed scope:**

- Add a diagnostic collector callable before and after navigation.
- Report plugin graph and ordering, backend capabilities, browser versions,
  identity validation and coverage, effective headers, proxy/location coherence,
  injection failures, unsupported evasions, and challenge history.
- Produce both redacted JSON and a concise human-readable report.
- Attach correlation IDs to plugin/backend events without capturing page content.
- Provide an explicit opt-in deep mode for sensitive diagnostic data.

**Illustrative API:**

```ts
const report = await zorilla.diagnose(page, { level: 'standard' });
await report.write('./zorilla-diagnostic.json');
```

**Deliverables:**

- Versioned diagnostic schema.
- Redaction framework and safe defaults.
- Text and JSON renderers.
- Integration with identities, sessions, proxies, challenges, plugins, and tests.

**Acceptance criteria:**

- Standard reports contain no cookies, authorization headers, proxy credentials,
  solver tokens, or page content.
- Each warning has a stable code, evidence, and suggested corrective action.
- Reports from failed launches are still useful.
- Users can compare two reports to identify meaningful configuration differences.

**Dependencies:** Best delivered after initiatives 1–5 and 8 establish their
schemas, though the diagnostic schema should be considered during their design.

### 13. Plugin catalog and quality metadata — P3

**Problem:** Package discovery alone does not tell users whether a plugin is
maintained, compatible, safe, or tested against their browser stack.

**Proposed scope:**

- Define signed or repository-verified plugin metadata for frameworks, engines,
  backend requirements, tested versions, permissions/side effects, bundle size,
  maintenance state, and conformance results.
- Publish a curated catalog generated from source-controlled metadata.
- Add scaffolding and validation commands for plugin authors.
- Clearly separate first-party, verified third-party, community, and archived
  plugins.

**Deliverables:**

- Metadata schema and validator.
- Generated catalog site or documentation.
- Plugin scaffolding and submission process.
- Archival and security-response policy.

**Acceptance criteria:**

- Catalog entries can be reproduced from their source repository and package.
- Compatibility results link to exact test runs and versions.
- Permission claims are descriptive and not presented as a security sandbox.
- Archived plugins remain discoverable with a clear warning and replacement.

**Dependencies:** Initiatives 1 and 8.

### 14. Agent-oriented browser utilities — P3

**Problem:** Browser agents need compact, stable, and inspectable representations
of pages. Raw DOM and screenshots are expensive, while ordinary selectors become
stale across actions.

**Proposed scope:**

- Add optional semantic/accessibility snapshots with stable element references.
- Provide token-efficient DOM cleanup with explicit rules and raw-data escape
  hatches.
- Add trace/replay bundles, download/upload helpers, and deterministic action
  receipts.
- Explore an MCP-compatible control surface without coupling the core packages to
  one agent framework.
- Provide allow/deny policies for domains, downloads, uploads, and potentially
  destructive browser actions.

**Deliverables:**

- Semantic snapshot and element-reference package.
- Action receipt and trace format.
- File-transfer helpers.
- Optional protocol adapter and policy hooks.

**Acceptance criteria:**

- References fail explicitly when stale rather than selecting a different node.
- Snapshot cleanup is deterministic and configurable.
- Traces redact configured sensitive fields.
- Policy hooks run before navigation, download, upload, and script evaluation.

**Dependencies:** Initiative 8; initiative 11 is useful for scaled agent workloads.

## Recommended implementation sequence

The initiatives above are priorities, not a requirement to execute one enormous
project at a time. The first six work packages should be narrow vertical slices:

1. **Conformance harness foundation:** fixture site, result schema, Chromium with
   standard Puppeteer and Playwright, and CI artifact.
2. **Identity v1:** schema, seed, validation, ordered headers, UA/client hints,
   locale, screen, and existing WebGL vendor support.
3. **Patched backend proof of concept:** run the same test suite through one
   Rebrowser and one Patchright path; publish an architecture decision record.
4. **Session v1:** in-memory leases binding identity, proxy, cookies, and storage.
5. **Challenge v2:** neutral contracts, compatibility facade, and Turnstile.
6. **Plugin SDK pilot:** neutral capability declarations and one ported first-party
   plugin before committing to a repository-wide migration.

This order gives the project evidence first, then a coherent identity primitive,
then lower-level execution, and only afterward adds production lifecycle layers.

## Release milestones

### Milestone A: measurable stealth

- Initiative 1 baseline complete.
- Identity v1 schema and Chromium applicator available as experimental packages.
- Standard backend behavior represented in the compatibility report.

### Milestone B: backend-aware identity

- Rebrowser and Patchright integrations available experimentally.
- Capability-aware stealth avoids conflicting or redundant evasions.
- Identity coverage and backend implementation strength appear in reports.

### Milestone C: persistent sessions

- Identity, proxy, cookies, and storage can be leased and reused together.
- Proxy health and affinity are production-ready.
- Challenge outcomes feed session reputation.

### Milestone D: plugin platform vNext

- Framework-neutral SDK is stable.
- Compatibility facade and migration tools are published.
- First-party plugins have an incremental migration schedule.

### Milestone E: production and ecosystem

- Browser pooling, structured diagnostics, and curated plugin metadata are stable.
- Advanced fingerprint modules graduate individually based on conformance evidence.

## Cross-cutting requirements

Every new package or significant feature should include:

- Strict TypeScript types without `any` except for a documented unavoidable edge.
- ESM-only exports consistent with the repository architecture.
- Unit, integration, and applicable conformance tests.
- Abort/cancellation and cleanup behavior for asynchronous work.
- Structured, redacted debug output.
- Capability and version declarations.
- A changeset for release-worthy changes.
- Documentation with Puppeteer and Playwright examples where supported.
- A threat/privacy note when storing identities, credentials, cookies, or traces.

## Explicit non-goals

- Guaranteeing universal bypass of bot-detection or access-control systems.
- Building a full crawler, dataset platform, or distributed job scheduler.
- Maintaining a custom Chromium or Firefox fork before integrations are proven
  insufficient by the conformance suite.
- Supporting every automation language before stabilizing the JavaScript API.
- Expanding obsolete browser features such as Flash.
- Enabling randomized behavior by default in deterministic test workflows.

## Open decisions

These require focused design proposals before implementation:

1. Should identity generation use only curated profiles initially, or also a
   statistically weighted dataset? What is the data source and update policy?
2. Should backends be separate packages, optional peer dependencies, or runtime
   adapters configured in the existing framework packages?
3. Which Node.js and browser-version windows will conformance CI guarantee?
4. Where should encrypted session data live, and which encryption responsibilities
   belong to Zorilla versus the host application?
5. Should the neutral plugin SDK ship in a new major version or coexist
   experimentally for a full release cycle?
6. Which live detection services, if any, are stable and permissible enough to
   run as scheduled non-blocking tests?

## Research sources

- [Zorilla repository and package catalog](https://github.com/zorillajs/zorilla)
- [puppeteer-extra repository](https://github.com/berstend/puppeteer-extra)
- [Rebrowser patches and technical documentation](https://github.com/rebrowser/rebrowser-patches)
- [Patchright repository](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright)
- [Camoufox documentation](https://camoufox.com/)
- [Camoufox repository](https://github.com/daijro/camoufox)
- [Crawlee Browser Pool documentation](https://crawlee.dev/js/api/browser-pool)
- [BrowserForge repository](https://github.com/daijro/browserforge)

Competitive behavior changes quickly. Matrix entries are directional research
snapshots as of July 18, 2026, not permanent compatibility guarantees. Before
turning an entry into an implementation decision, verify it against the linked
primary source and record the tested version in the relevant design proposal.
