// Setup file for Vitest tests
// This file runs before all tests and configures global error handling

// Suppress unhandled rejections for ERR_SERVER_NOT_RUNNING errors
// These occur when the proxy-chain library's internal server is closed
// asynchronously during test cleanup
process.on('unhandledRejection', (reason: unknown) => {
  // Only suppress the specific ERR_SERVER_NOT_RUNNING error
  if (
    typeof reason === 'object' &&
    reason !== null &&
    'code' in reason &&
    reason.code === 'ERR_SERVER_NOT_RUNNING'
  ) {
    // Silently ignore this error as it's expected during cleanup
    return;
  }
  // Re-throw all other unhandled rejections
  throw reason;
});
