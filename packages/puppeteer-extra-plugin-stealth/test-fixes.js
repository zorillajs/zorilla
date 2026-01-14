/**
 * Quick test to verify the fixes we made
 */

import StealthPlugin from './dist/index.js';

console.log('🔍 Verifying Fixes\n');
console.log('='.repeat(80));

// Test 1: Verify navigator.vendor is in availableEvasions
console.log('\n1️⃣  Testing navigator.vendor is now available');
console.log('-'.repeat(80));

const plugin = StealthPlugin();
const availableEvasions = Array.from(plugin.availableEvasions).sort();

console.log('Available evasions:', availableEvasions.length);
console.log('\nAll available evasions:');
availableEvasions.forEach((evasion, i) => {
  console.log(`  ${(i + 1).toString().padStart(2)}. ${evasion}`);
});

const hasNavigatorVendor = plugin.availableEvasions.has('navigator.vendor');
console.log(
  `\n${hasNavigatorVendor ? '✅' : '❌'} navigator.vendor is ${hasNavigatorVendor ? 'present' : 'MISSING'}`
);

// Test 2: Verify it's enabled by default
console.log('\n2️⃣  Testing navigator.vendor is enabled by default');
console.log('-'.repeat(80));

const isEnabled = plugin.enabledEvasions.has('navigator.vendor');
console.log(
  `${isEnabled ? '✅' : '❌'} navigator.vendor is ${isEnabled ? 'enabled' : 'NOT enabled'} by default`
);

// Test 3: Verify count is correct
console.log('\n3️⃣  Testing evasion count');
console.log('-'.repeat(80));

const expectedCount = 17; // 16 original + 1 new (navigator.vendor)
const actualCount = plugin.availableEvasions.size;
console.log(`Expected: ${expectedCount} evasions`);
console.log(`Actual: ${actualCount} evasions`);
console.log(
  `${actualCount === expectedCount ? '✅' : '❌'} Count is ${actualCount === expectedCount ? 'correct' : 'INCORRECT'}`
);

// Summary
console.log('\n' + '='.repeat(80));
const allTestsPassed =
  hasNavigatorVendor && isEnabled && actualCount === expectedCount;
if (allTestsPassed) {
  console.log('✅ All fixes verified successfully!');
} else {
  console.log('❌ Some fixes failed verification');
  process.exit(1);
}
console.log('='.repeat(80) + '\n');
