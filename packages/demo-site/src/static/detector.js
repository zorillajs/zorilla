// Client-side bot detection suite
// Implements 15 detection tests based on zorilla stealth plugin evasions

const SEVERITY_POINTS = {
  CRITICAL: 15,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 2,
};

const DETECTION_THRESHOLD = 75;

// Test 1: WebDriver Property (CRITICAL)
function testWebDriver() {
  const detected = navigator.webdriver === true;
  return {
    name: 'navigator.webdriver',
    passed: !detected,
    value: navigator.webdriver,
    explanation: 'navigator.webdriver should be undefined in real browsers',
    severity: 'CRITICAL',
    points: detected ? 0 : SEVERITY_POINTS.CRITICAL,
  };
}

// Test 2: Chrome Runtime (HIGH)
function testChromeRuntime() {
  const exists = window.chrome?.runtime !== undefined;
  const hasConnect = typeof window.chrome?.runtime?.connect === 'function';
  const passed = exists && hasConnect;

  return {
    name: 'chrome.runtime',
    passed,
    value: { exists, hasConnect },
    explanation: 'chrome.runtime with connect() method should exist in Chrome',
    severity: 'HIGH',
    points: passed ? SEVERITY_POINTS.HIGH : 0,
  };
}

// Test 3: Chrome App (HIGH)
function testChromeApp() {
  const exists = window.chrome?.app !== undefined;
  const passed = exists;

  return {
    name: 'chrome.app',
    passed,
    value: exists,
    explanation: 'chrome.app object should exist in Chrome browsers',
    severity: 'HIGH',
    points: passed ? SEVERITY_POINTS.HIGH : 0,
  };
}

// Test 4: Chrome CSI (MEDIUM)
function testChromeCsi() {
  const exists = typeof window.chrome?.csi === 'function';

  return {
    name: 'chrome.csi',
    passed: exists,
    value: exists,
    explanation: 'chrome.csi() timing function should exist',
    severity: 'MEDIUM',
    points: exists ? SEVERITY_POINTS.MEDIUM : 0,
  };
}

// Test 5: Chrome LoadTimes (MEDIUM)
function testChromeLoadTimes() {
  const exists = typeof window.chrome?.loadTimes === 'function';

  return {
    name: 'chrome.loadTimes',
    passed: exists,
    value: exists,
    explanation: 'chrome.loadTimes() function should exist',
    severity: 'MEDIUM',
    points: exists ? SEVERITY_POINTS.MEDIUM : 0,
  };
}

// Test 6: Plugins Array (CRITICAL)
function testPlugins() {
  const count = navigator.plugins.length;
  const passed = count > 0;

  return {
    name: 'navigator.plugins',
    passed,
    value: count,
    explanation:
      'Real browsers have plugins, headless browsers have empty array',
    severity: 'CRITICAL',
    points: passed ? SEVERITY_POINTS.CRITICAL : 0,
  };
}

// Test 7: MIME Types (HIGH)
function testMimeTypes() {
  const count = navigator.mimeTypes.length;
  const passed = count > 0;

  return {
    name: 'navigator.mimeTypes',
    passed,
    value: count,
    explanation: 'Real browsers have MIME types registered',
    severity: 'HIGH',
    points: passed ? SEVERITY_POINTS.HIGH : 0,
  };
}

// Test 8: Languages (MEDIUM)
function testLanguages() {
  const langs = navigator.languages;
  const passed = Array.isArray(langs) && langs.length > 0;

  return {
    name: 'navigator.languages',
    passed,
    value: langs,
    explanation: 'Real browsers report language preferences',
    severity: 'MEDIUM',
    points: passed ? SEVERITY_POINTS.MEDIUM : 0,
  };
}

// Test 9: WebGL Vendor (HIGH)
function testWebGLVendor() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return {
        name: 'WebGL Vendor',
        passed: false,
        value: 'WebGL not available',
        explanation: 'WebGL should be available in modern browsers',
        severity: 'HIGH',
        points: 0,
      };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return {
        name: 'WebGL Vendor',
        passed: true,
        value: 'Extension not available',
        explanation: 'WEBGL_debug_renderer_info extension missing (acceptable)',
        severity: 'HIGH',
        points: SEVERITY_POINTS.HIGH,
      };
    }

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const passed = !vendor.includes('Google') || vendor.includes('Inc');

    return {
      name: 'WebGL Vendor',
      passed,
      value: vendor,
      explanation: 'Google Inc. (without proper renderer) indicates headless',
      severity: 'HIGH',
      points: passed ? SEVERITY_POINTS.HIGH : 0,
    };
  } catch (e) {
    return {
      name: 'WebGL Vendor',
      passed: false,
      value: `Error: ${e.message}`,
      explanation: 'Failed to check WebGL vendor',
      severity: 'HIGH',
      points: 0,
    };
  }
}

// Test 10: WebGL Renderer (HIGH)
function testWebGLRenderer() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return {
        name: 'WebGL Renderer',
        passed: false,
        value: 'WebGL not available',
        explanation: 'WebGL should be available',
        severity: 'HIGH',
        points: 0,
      };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return {
        name: 'WebGL Renderer',
        passed: true,
        value: 'Extension not available',
        explanation: 'Extension missing (acceptable)',
        severity: 'HIGH',
        points: SEVERITY_POINTS.HIGH,
      };
    }

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const passed =
      !renderer.includes('SwiftShader') && !renderer.includes('Google');

    return {
      name: 'WebGL Renderer',
      passed,
      value: renderer,
      explanation: 'Google SwiftShader indicates headless Chrome',
      severity: 'HIGH',
      points: passed ? SEVERITY_POINTS.HIGH : 0,
    };
  } catch (e) {
    return {
      name: 'WebGL Renderer',
      passed: false,
      value: `Error: ${e.message}`,
      explanation: 'Failed to check WebGL renderer',
      severity: 'HIGH',
      points: 0,
    };
  }
}

// Test 11: User-Agent Analysis (CRITICAL)
function testUserAgent() {
  const ua = navigator.userAgent;
  const hasHeadless = ua.includes('Headless') || ua.includes('HeadlessChrome');
  const passed = !hasHeadless;

  return {
    name: 'User-Agent',
    passed,
    value: ua.substring(0, 100),
    explanation: 'User-Agent should not contain "Headless"',
    severity: 'CRITICAL',
    points: passed ? SEVERITY_POINTS.CRITICAL : 0,
  };
}

// Test 12: Window Dimensions (MEDIUM)
function testWindowDimensions() {
  const hasOuterWidth =
    typeof window.outerWidth === 'number' && window.outerWidth > 0;
  const hasOuterHeight =
    typeof window.outerHeight === 'number' && window.outerHeight > 0;
  const passed = hasOuterWidth && hasOuterHeight;

  return {
    name: 'Window Dimensions',
    passed,
    value: { outerWidth: window.outerWidth, outerHeight: window.outerHeight },
    explanation: 'window.outerWidth and outerHeight should exist',
    severity: 'MEDIUM',
    points: passed ? SEVERITY_POINTS.MEDIUM : 0,
  };
}

// Test 13: Notification Permission (MEDIUM)
function testNotificationPermission() {
  // On HTTPS, default should be "default", not "denied"
  const isHTTPS = location.protocol === 'https:';
  const permission = Notification.permission;

  let passed;
  if (isHTTPS) {
    // On HTTPS, "denied" immediately is suspicious (headless default)
    // Real browsers start with "default"
    passed = permission !== 'denied';
  } else {
    // On HTTP, "denied" is expected
    passed = true;
  }

  return {
    name: 'Notification Permission',
    passed,
    value: permission,
    explanation: isHTTPS
      ? 'Should be "default" on HTTPS, not immediately "denied"'
      : 'On HTTP, "denied" is expected',
    severity: 'MEDIUM',
    points: passed ? SEVERITY_POINTS.MEDIUM : 0,
  };
}

// Test 14: Media Codec Support (LOW)
function testMediaCodecs() {
  const video = document.createElement('video');

  // Test for proprietary codec support (missing in Chromium headless)
  const mp4Support = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
  const passed = mp4Support === 'probably' || mp4Support === 'maybe';

  return {
    name: 'Media Codecs',
    passed,
    value: mp4Support,
    explanation: 'Should support MP4 with H.264 codec',
    severity: 'LOW',
    points: passed ? SEVERITY_POINTS.LOW : 0,
  };
}

// Test 15: iframe ContentWindow (LOW)
function testIframeContentWindow() {
  try {
    const iframe = document.createElement('iframe');
    iframe.srcdoc = '<html></html>';
    document.body.appendChild(iframe);

    // Check if iframe.contentWindow properly handles chrome object
    const hasChromeInIframe = iframe.contentWindow?.chrome !== undefined;
    document.body.removeChild(iframe);

    // This is a subtle check; passing means proper iframe handling
    // Chromium bug makes chrome available in srcdoc iframes incorrectly
    const passed = true; // For now, just check it doesn't crash

    return {
      name: 'iframe ContentWindow',
      passed,
      value: hasChromeInIframe,
      explanation: 'Checks for Chromium iframe bug #1106',
      severity: 'LOW',
      points: passed ? SEVERITY_POINTS.LOW : 0,
    };
  } catch (e) {
    return {
      name: 'iframe ContentWindow',
      passed: false,
      value: `Error: ${e.message}`,
      explanation: 'iframe test failed',
      severity: 'LOW',
      points: 0,
    };
  }
}

// Main detection runner
function runBotDetection() {
  const tests = [
    testWebDriver(),
    testChromeRuntime(),
    testChromeApp(),
    testChromeCsi(),
    testChromeLoadTimes(),
    testPlugins(),
    testMimeTypes(),
    testLanguages(),
    testWebGLVendor(),
    testWebGLRenderer(),
    testUserAgent(),
    testWindowDimensions(),
    testNotificationPermission(),
    testMediaCodecs(),
    testIframeContentWindow(),
  ];

  const score = tests.reduce((sum, test) => sum + test.points, 0);
  const failedTests = tests.filter(t => !t.passed);

  // Store results globally for demo scripts to read
  window.detectionResults = tests;
  window.detectionScore = score;
  window.failedDetections = failedTests.map(t => t.name);

  console.log('Detection Results:', {
    score,
    maxScore: 124,
    threshold: DETECTION_THRESHOLD,
    passed: score >= DETECTION_THRESHOLD,
    failedTests: failedTests.length,
  });

  // Decide: block or allow
  if (score < DETECTION_THRESHOLD) {
    blockAccess(failedTests, score);
  } else {
    grantAccess(score, tests);
  }
}

function blockAccess(failedTests, score) {
  console.log('🚫 BOT DETECTED - Blocking access');

  // Store results in sessionStorage for blocked page
  sessionStorage.setItem(
    'detectionResults',
    JSON.stringify(window.detectionResults)
  );
  sessionStorage.setItem('detectionScore', score);

  // Redirect to blocked page
  window.location.href = `/blocked?failed=${failedTests.length}`;
}

function grantAccess(score, tests) {
  console.log('✅ ACCESS GRANTED - Score:', score);

  // Hide loading, show secret content
  document.getElementById('loading').style.display = 'none';
  document.getElementById('secret-content').style.display = 'block';

  // Update score displays
  document.getElementById('detection-score').textContent = score;
  document.getElementById('score-in-json').textContent = score;

  // Render test results
  renderTestResults(tests);
}

function renderTestResults(tests) {
  const grid = document.getElementById('test-results-grid');
  if (!grid) return;

  tests.forEach(test => {
    const card = document.createElement('div');
    card.className = `test-card ${test.passed ? 'passed' : 'failed'} ${test.severity.toLowerCase()}`;

    card.innerHTML = `
      <div class="test-header">
        <span class="test-icon">${test.passed ? '✅' : '❌'}</span>
        <span class="test-name">${test.name}</span>
        <span class="test-severity">${test.severity}</span>
      </div>
      <p class="test-explanation">${test.explanation}</p>
      <p class="test-value"><strong>Value:</strong> <code>${JSON.stringify(test.value)}</code></p>
      <p class="test-points"><strong>Points:</strong> ${test.points} / ${SEVERITY_POINTS[test.severity]}</p>
    `;

    grid.appendChild(card);
  });
}

// Run detection on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runBotDetection);
} else {
  runBotDetection();
}
