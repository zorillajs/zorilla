import { describe, expect, it, vi } from 'vitest';

describe('minifyScripts edge case', () => {
  it('should handle nullish code from terser', async () => {
    // Mock terser to return undefined code before importing the module
    vi.doMock('terser', () => ({
      minify: vi.fn().mockResolvedValue({ code: undefined }),
    }));

    // Dynamically import the module after mocking
    const { minifyScripts } = await import('../src/index.js');

    const result = await minifyScripts('function test() {}');

    // Should return empty string due to nullish coalescing
    expect(result).toBe('');

    vi.doUnmock('terser');
  });

  it('should handle null code from terser', async () => {
    // Mock terser to return null code before importing the module
    vi.doMock('terser', () => ({
      minify: vi.fn().mockResolvedValue({ code: null }),
    }));

    // Dynamically import the module after mocking
    const { minifyScripts } = await import('../src/index.js');

    const result = await minifyScripts('function test() {}');

    // Should return empty string due to nullish coalescing
    expect(result).toBe('');

    vi.doUnmock('terser');
  });
});
