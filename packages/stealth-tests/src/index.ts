export const RESULT_SCHEMA_VERSION = 1 as const;

export type Framework = 'puppeteer' | 'playwright';
export type Backend = 'standard' | 'rebrowser' | 'patchright';
export type HeadlessMode = 'headless' | 'headful';

export interface RunMetadata {
  browser: string;
  browserVersion: string;
  framework: Framework;
  frameworkVersion: string;
  backend: Backend;
  headless: HeadlessMode;
  os: string;
  enabledPlugins: string[];
  identitySeed: string | null;
}

export interface ProbeResult {
  id: string;
  category: string;
  description: string;
  passed: boolean;
  expected: unknown;
  observed: unknown;
  error?: string;
}

export interface ConformanceResult {
  schemaVersion: typeof RESULT_SCHEMA_VERSION;
  generatedAt: string;
  metadata: RunMetadata;
  summary: { passed: number; failed: number; total: number };
  probes: ProbeResult[];
}

export interface Probe {
  id: string;
  category: string;
  description: string;
  expression: string;
}

export type PageEvaluator = (expression: string) => Promise<unknown>;

export const defaultProbes: readonly Probe[] = [
  {
    id: 'navigator.webdriver',
    category: 'navigator',
    description: 'webdriver does not disclose automation',
    expression: `(() => { const observed = navigator.webdriver; return { passed: observed !== true, expected: "not true", observed }; })()`,
  },
  {
    id: 'navigator.languages',
    category: 'locale',
    description: 'languages is a non-empty array of valid tags',
    expression: `(() => { const observed = Array.from(navigator.languages); const passed = observed.length > 0 && observed.every(value => typeof value === "string" && value.length > 0); return { passed, expected: "one or more language tags", observed }; })()`,
  },
  {
    id: 'navigator.plugins',
    category: 'plugins',
    description: 'plugins exposes the native PluginArray shape',
    expression: `(() => { const observed = { tag: Object.prototype.toString.call(navigator.plugins), length: navigator.plugins.length }; return { passed: observed.tag === "[object PluginArray]", expected: { tag: "[object PluginArray]" }, observed }; })()`,
  },
  {
    id: 'function.native-appearance',
    category: 'descriptors',
    description: 'patched platform accessors retain native appearance',
    expression: `(() => { const getter = Object.getOwnPropertyDescriptor(Navigator.prototype, "languages")?.get; const observed = getter ? Function.prototype.toString.call(getter) : null; return { passed: typeof observed === "string" && observed.includes("[native code]"), expected: "native code function", observed }; })()`,
  },
  {
    id: 'screen.bounds',
    category: 'screen',
    description: 'available screen dimensions fit within the screen',
    expression: `(() => { const observed = { width: screen.width, height: screen.height, availWidth: screen.availWidth, availHeight: screen.availHeight }; const passed = observed.width > 0 && observed.height > 0 && observed.availWidth > 0 && observed.availHeight > 0 && observed.availWidth <= observed.width && observed.availHeight <= observed.height; return { passed, expected: "positive and bounded dimensions", observed }; })()`,
  },
  {
    id: 'sourceurl.stack',
    category: 'source-url',
    description:
      'evaluation stack does not contain Puppeteer sourceURL markers',
    expression: `(() => { let observed = ""; try { throw new Error("probe"); } catch (error) { observed = error instanceof Error ? error.stack ?? "" : String(error); } return { passed: !observed.includes("__puppeteer_evaluation_script__"), expected: "no Puppeteer evaluation marker", observed }; })()`,
  },
];

interface EvaluationResult {
  passed: boolean;
  expected: unknown;
  observed: unknown;
}

const isEvaluationResult = (value: unknown): value is EvaluationResult => {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as Record<string, unknown>).passed === 'boolean';
};

export async function runConformance(
  evaluate: PageEvaluator,
  metadata: RunMetadata,
  probes: readonly Probe[] = defaultProbes
): Promise<ConformanceResult> {
  const results: ProbeResult[] = [];
  for (const probe of probes) {
    try {
      const value = await evaluate(probe.expression);
      if (!isEvaluationResult(value))
        throw new Error('Probe returned an invalid result');
      results.push({
        id: probe.id,
        category: probe.category,
        description: probe.description,
        ...value,
      });
    } catch (error) {
      results.push({
        id: probe.id,
        category: probe.category,
        description: probe.description,
        passed: false,
        expected: 'probe completes successfully',
        observed: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const passed = results.filter(result => result.passed).length;
  return {
    schemaVersion: RESULT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    metadata,
    summary: { passed, failed: results.length - passed, total: results.length },
    probes: results,
  };
}

export function formatReport(result: ConformanceResult): string {
  const { metadata, summary } = result;
  const lines = [
    '# Stealth conformance report',
    '',
    `- Framework: ${metadata.framework} ${metadata.frameworkVersion}`,
    `- Browser: ${metadata.browser} ${metadata.browserVersion}`,
    `- Backend: ${metadata.backend}`,
    `- Mode: ${metadata.headless}`,
    `- OS: ${metadata.os}`,
    `- Plugins: ${metadata.enabledPlugins.join(', ') || 'none'}`,
    `- Identity seed: ${metadata.identitySeed ?? 'none'}`,
    `- Result: ${summary.passed}/${summary.total} passed`,
    '',
    '| Probe | Category | Result | Expected | Observed |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const probe of result.probes) {
    const encode = (value: unknown) =>
      (JSON.stringify(value) ?? 'undefined').replaceAll('|', '\\|');
    lines.push(
      `| ${probe.id} | ${probe.category} | ${probe.passed ? 'PASS' : 'FAIL'} | ${encode(probe.expected)} | ${encode(probe.error ?? probe.observed)} |`
    );
  }
  return `${lines.join('\n')}\n`;
}
