export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ClientDetectionTest {
  name: string;
  passed: boolean;
  value: unknown; // Can be boolean, string, number, or object depending on the test
  explanation: string;
  severity: Severity;
  points: number;
}

export function getPointsForSeverity(
  severity: Severity,
  passed: boolean
): number {
  if (passed) {
    const points = {
      CRITICAL: 15,
      HIGH: 10,
      MEDIUM: 5,
      LOW: 2,
    };
    return points[severity];
  }
  return 0;
}

export function calculateClientScore(tests: ClientDetectionTest[]): number {
  return tests.reduce((sum, test) => sum + test.points, 0);
}

export const DETECTION_THRESHOLD = 75;
export const MAX_SCORE = 124; // 3*15 + 5*10 + 5*5 + 2*2
