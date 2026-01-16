// Type augmentations for browser APIs used by stealth evasions

interface Window {
  chrome?: {
    app?: unknown;
    csi?: () => unknown;
    loadTimes?: () => unknown;
    runtime?: unknown;
    [key: string]: unknown;
  };
}

interface PerformanceNavigationEntry extends PerformanceEntry {
  nextHopProtocol: string;
  type: string;
}

interface Navigator {
  webdriver?: boolean;
}
