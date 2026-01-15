// Runs all 4 demos and generates a comparison report
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const demos = [
  {
    name: 'Puppeteer (No Stealth)',
    script: join(__dirname, 'puppeteer-no-stealth.js'),
    expectedResult: 'blocked',
  },
  {
    name: 'Puppeteer (With Stealth)',
    script: join(__dirname, 'puppeteer-with-stealth.js'),
    expectedResult: 'granted',
  },
  {
    name: 'Playwright (No Stealth)',
    script: join(__dirname, 'playwright-no-stealth.js'),
    expectedResult: 'blocked',
  },
  {
    name: 'Playwright (With Stealth)',
    script: join(__dirname, 'playwright-with-stealth.js'),
    expectedResult: 'granted',
  },
];

console.log('🔬 Zorilla Stealth Plugin Comparison Test Suite\n');
console.log('='.repeat(60));
console.log(
  `Running ${demos.length} demos to compare bot detection with and without stealth plugin\n`
);

const results = [];

for (const demo of demos) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${demo.name}`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  const result = await runDemo(demo.script);
  const duration = Date.now() - startTime;

  const success =
    (demo.expectedResult === 'blocked' && result.blocked) ||
    (demo.expectedResult === 'granted' && result.granted);

  results.push({
    name: demo.name,
    expectedResult: demo.expectedResult,
    actualResult: result.blocked
      ? 'blocked'
      : result.granted
        ? 'granted'
        : 'error',
    success,
    detectionScore: result.detectionScore,
    duration,
    error: result.error,
  });

  if (success) {
    console.log(
      `\n✅ ${demo.name}: ${result.blocked ? 'BLOCKED (as expected)' : 'GRANTED (as expected)'}`
    );
  } else {
    console.log(
      `\n⚠️ ${demo.name}: Unexpected result (expected ${demo.expectedResult}, got ${result.blocked ? 'blocked' : 'granted'})`
    );
  }
}

// Generate comparison report
console.log('\n\n📊 COMPARISON REPORT');
console.log('='.repeat(60));

const table = results.map(r => ({
  Demo: r.name,
  Expected: r.expectedResult,
  Actual: r.actualResult,
  Score: r.detectionScore || 'N/A',
  Duration: `${r.duration}ms`,
  Result: r.success ? '✅ PASS' : '❌ FAIL',
}));

console.table(table);

// Save detailed report
const detailedReport = {
  timestamp: new Date().toISOString(),
  summary: {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
  },
  results,
};

const reportPath = 'comparison-report.json';
await writeFile(reportPath, JSON.stringify(detailedReport, null, 2));
console.log(`\n✅ Detailed report saved to ${reportPath}`);

// Summary
console.log('\n📈 SUMMARY');
console.log(
  `Passed: ${detailedReport.summary.passed}/${detailedReport.summary.total}`
);
console.log(
  `Failed: ${detailedReport.summary.failed}/${detailedReport.summary.total}`
);

if (detailedReport.summary.failed === 0) {
  console.log('\n🎉 All tests passed! Stealth plugin is working correctly.');
} else {
  console.log('\n⚠️ Some tests failed. Check the report for details.');
  process.exit(1);
}

/**
 * Runs a demo script and captures its output
 */
function runDemo(scriptPath) {
  return new Promise(resolve => {
    let output = '';

    const child = spawn('node', [scriptPath], {
      env: { ...process.env },
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    child.stdout.on('data', data => {
      const text = data.toString();
      process.stdout.write(text);
      output += text;
    });

    child.stderr.on('data', data => {
      const text = data.toString();
      process.stderr.write(text);
      output += text;
    });

    child.on('close', code => {
      // Parse output to determine result
      const blocked = output.includes('ACCESS DENIED');
      const granted = output.includes('ACCESS GRANTED');

      // Try to extract detection score
      const scoreMatch = output.match(/Detection Score: (\d+)/);
      const detectionScore = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

      resolve({
        blocked,
        granted,
        detectionScore,
        exitCode: code,
        error:
          code !== 0 && !blocked && !granted
            ? 'Script exited with error'
            : null,
      });
    });
  });
}
