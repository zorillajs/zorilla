import { describe, expect, test } from 'vitest';
import { formatReport, type RunMetadata, runConformance } from './index.js';

const metadata: RunMetadata = {
  browser: 'chromium',
  browserVersion: '1',
  framework: 'puppeteer',
  frameworkVersion: '1',
  backend: 'standard',
  headless: 'headless',
  os: 'test',
  enabledPlugins: ['stealth'],
  identitySeed: null,
};

describe('runConformance', () => {
  test('collects successes and actionable failures', async () => {
    let calls = 0;
    const result = await runConformance(
      async () => {
        calls++;
        if (calls === 2) throw new Error('evaluation failed');
        return { passed: true, expected: 'yes', observed: 'yes' };
      },
      metadata,
      [
        { id: 'one', category: 'test', description: 'one', expression: 'one' },
        { id: 'two', category: 'test', description: 'two', expression: 'two' },
      ]
    );
    expect(result.schemaVersion).toBe(1);
    expect(result.summary).toEqual({ passed: 1, failed: 1, total: 2 });
    expect(result.probes[1]?.error).toBe('evaluation failed');
  });

  test('runs the default probe catalog', async () => {
    const result = await runConformance(
      async () => ({ passed: true, expected: undefined, observed: undefined }),
      metadata
    );
    expect(result.summary).toEqual({ passed: 6, failed: 0, total: 6 });
    expect(formatReport(result)).toContain(
      '| navigator.webdriver | navigator | PASS | undefined | undefined |'
    );
  });

  test.each([
    null,
    {},
    { passed: 'yes' },
  ])('reports invalid evaluator result %#', async value => {
    const result = await runConformance(async () => value, metadata, [
      {
        id: 'invalid',
        category: 'test',
        description: 'invalid result',
        expression: 'invalid',
      },
    ]);
    expect(result.probes[0]?.error).toBe('Probe returned an invalid result');
  });

  test('stringifies non-Error failures', async () => {
    const result = await runConformance(
      async () => {
        throw 'plain failure';
      },
      metadata,
      [
        {
          id: 'failure',
          category: 'test',
          description: 'failure',
          expression: 'failure',
        },
      ]
    );
    expect(result.probes[0]?.error).toBe('plain failure');
  });

  test('renders metadata and probe details', async () => {
    const result = await runConformance(
      async () => ({ passed: false, expected: false, observed: true }),
      metadata,
      [
        {
          id: 'webdriver',
          category: 'navigator',
          description: 'test',
          expression: 'x',
        },
      ]
    );
    expect(formatReport(result)).toContain(
      '| webdriver | navigator | FAIL | false | true |'
    );
    expect(formatReport(result)).toContain('- Framework: puppeteer 1');
  });

  test('renders populated optional metadata and escapes table values', async () => {
    const result = await runConformance(
      async () => ({ passed: true, expected: 'a|b', observed: 'a|b' }),
      { ...metadata, enabledPlugins: [], identitySeed: 'seed-1' },
      [
        {
          id: 'escaped',
          category: 'test',
          description: 'test',
          expression: 'x',
        },
      ]
    );
    const report = formatReport(result);
    expect(report).toContain('- Plugins: none');
    expect(report).toContain('- Identity seed: seed-1');
    expect(report).toContain('"a\\|b"');
  });
});
