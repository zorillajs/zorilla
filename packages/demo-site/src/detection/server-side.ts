export interface DetectionCheck {
  name: string;
  passed: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  details: string;
}

export interface ServerDetectionResult {
  isBot: boolean;
  confidence: number;
  failedChecks: DetectionCheck[];
  allChecks: DetectionCheck[];
}

export function detectBotFromRequest(request: Request): ServerDetectionResult {
  const checks: DetectionCheck[] = [];

  // Check 1: User-Agent analysis for "Headless" indicators
  const ua = request.headers.get('user-agent') || '';
  const hasHeadlessUA =
    ua.includes('Headless') || ua.includes('HeadlessChrome');
  checks.push({
    name: 'Headless User-Agent',
    passed: !hasHeadlessUA,
    severity: 'CRITICAL',
    details: hasHeadlessUA
      ? `User-Agent contains "Headless": ${ua.substring(0, 100)}`
      : 'User-Agent looks normal',
  });

  // Check 2: Missing or suspicious Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  const suspiciousLang =
    !acceptLanguage || acceptLanguage === 'en-US' || acceptLanguage === 'en';
  checks.push({
    name: 'Accept-Language Header',
    passed: !suspiciousLang,
    severity: 'MEDIUM',
    details: acceptLanguage
      ? `Accept-Language: ${acceptLanguage}`
      : 'Accept-Language header missing',
  });

  // Check 3: Check for common automation headers
  const hasAutomationHeaders =
    request.headers.has('x-devtools-emulate-network-conditions-client-id') ||
    ua.toLowerCase().includes('puppeteer') ||
    ua.toLowerCase().includes('playwright');
  checks.push({
    name: 'Automation Headers',
    passed: !hasAutomationHeaders,
    severity: 'CRITICAL',
    details: hasAutomationHeaders
      ? 'Detected automation-specific headers or UA strings'
      : 'No automation headers detected',
  });

  // Check 4: Accept header - real browsers send detailed Accept headers
  const accept = request.headers.get('accept') || '';
  const hasDetailedAccept = accept.includes('text/html') && accept.length > 20;
  checks.push({
    name: 'Accept Header Detail',
    passed: hasDetailedAccept,
    severity: 'LOW',
    details: hasDetailedAccept
      ? 'Accept header looks normal'
      : `Accept header too simple or missing: ${accept}`,
  });

  // Calculate results
  const failedChecks = checks.filter(c => !c.passed);
  const criticalFailed = failedChecks.filter(
    c => c.severity === 'CRITICAL'
  ).length;
  const highFailed = failedChecks.filter(c => c.severity === 'HIGH').length;

  // Bot detection logic: critical failures are strong indicators
  const isBot =
    criticalFailed > 0 || (highFailed > 0 && failedChecks.length > 2);
  const confidence = calculateConfidence(checks);

  return {
    isBot,
    confidence,
    failedChecks,
    allChecks: checks,
  };
}

function calculateConfidence(checks: DetectionCheck[]): number {
  const weights = {
    CRITICAL: 0.4,
    HIGH: 0.25,
    MEDIUM: 0.15,
    LOW: 0.05,
  };

  let totalWeight = 0;
  let failedWeight = 0;

  for (const check of checks) {
    const weight = weights[check.severity];
    totalWeight += weight;
    if (!check.passed) {
      failedWeight += weight;
    }
  }

  return failedWeight / totalWeight;
}
