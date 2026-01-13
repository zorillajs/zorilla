import type { Server as ProxyServer } from 'proxy-chain';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type ConnectionStats, ProxyRouterStats } from './stats.js';

describe('ProxyRouterStats', () => {
  let mockProxyServer: ProxyServer;
  let stats: ProxyRouterStats;

  beforeEach(() => {
    // Create a mock proxy server with minimal required methods
    mockProxyServer = {
      getConnectionIds: vi.fn(() => []),
      getConnectionStats: vi.fn(() => null),
    } as unknown as ProxyServer;

    stats = new ProxyRouterStats(mockProxyServer);
  });

  describe('addConnection', () => {
    test('should add connection to log', () => {
      stats.addConnection(1, 'DEFAULT', 'example.com');

      expect(stats.connectionLog).toHaveLength(1);
      expect(stats.connectionLog[0]).toEqual({
        id: 1,
        proxy: 'DEFAULT',
        host: 'example.com',
      });
    });

    test('should add multiple connections', () => {
      stats.addConnection(1, 'DEFAULT', 'example.com');
      stats.addConnection(2, 'DIRECT', 'google.com');
      stats.addConnection(3, 'PROXY_US', 'facebook.com');

      expect(stats.connectionLog).toHaveLength(3);
      expect(stats.connectionLog[1]).toEqual({
        id: 2,
        proxy: 'DIRECT',
        host: 'google.com',
      });
    });
  });

  describe('addStats', () => {
    test('should store connection stats', () => {
      const connectionStats: ConnectionStats = {
        srcTxBytes: 100,
        srcRxBytes: 200,
        trgTxBytes: 300,
        trgRxBytes: 400,
      };

      stats.addStats(1, connectionStats);

      // Access private connectionStats map via byProxy getter
      stats.addConnection(1, 'DEFAULT', 'example.com');
      const result = stats.byProxy;
      expect(result.DEFAULT).toBe(700); // trgTxBytes + trgRxBytes
    });
  });

  describe('byProxy', () => {
    test('should return empty object when no connections', () => {
      const result = stats.byProxy;
      expect(result).toEqual({});
    });

    test('should calculate bytes by proxy', () => {
      stats.addConnection(1, 'DEFAULT', 'example.com');
      stats.addConnection(2, 'DIRECT', 'google.com');
      stats.addConnection(3, 'DEFAULT', 'facebook.com');

      stats.addStats(1, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 100,
        trgRxBytes: 200,
      });
      stats.addStats(2, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 50,
        trgRxBytes: 50,
      });
      stats.addStats(3, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 300,
        trgRxBytes: 400,
      });

      const result = stats.byProxy;
      expect(result.DEFAULT).toBe(1000); // (100+200) + (300+400)
      expect(result.DIRECT).toBe(100); // 50+50
    });

    test('should sort proxies by bytes in descending order', () => {
      stats.addConnection(1, 'PROXY_A', 'example.com');
      stats.addConnection(2, 'PROXY_B', 'google.com');
      stats.addConnection(3, 'PROXY_C', 'facebook.com');

      stats.addStats(1, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 100,
        trgRxBytes: 0,
      });
      stats.addStats(2, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 500,
        trgRxBytes: 0,
      });
      stats.addStats(3, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 300,
        trgRxBytes: 0,
      });

      const result = stats.byProxy;
      const entries = Object.entries(result);
      expect(entries[0][0]).toBe('PROXY_B'); // 500 bytes
      expect(entries[1][0]).toBe('PROXY_C'); // 300 bytes
      expect(entries[2][0]).toBe('PROXY_A'); // 100 bytes
    });

    test('should handle connections without stats', () => {
      stats.addConnection(1, 'DEFAULT', 'example.com');

      const result = stats.byProxy;
      expect(result.DEFAULT).toBe(0);
    });

    test('should fetch stats from active connections', () => {
      const activeStats: ConnectionStats = {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 100,
        trgRxBytes: 200,
      };

      vi.mocked(mockProxyServer.getConnectionIds).mockReturnValue([42]);
      vi.mocked(mockProxyServer.getConnectionStats).mockReturnValue(
        activeStats
      );

      stats.addConnection(42, 'DEFAULT', 'example.com');

      const result = stats.byProxy;
      expect(result.DEFAULT).toBe(300);
      expect(mockProxyServer.getConnectionIds).toHaveBeenCalled();
      expect(mockProxyServer.getConnectionStats).toHaveBeenCalledWith(42);
    });

    test('should handle null stats from getConnectionStats', () => {
      vi.mocked(mockProxyServer.getConnectionIds).mockReturnValue([42]);
      vi.mocked(mockProxyServer.getConnectionStats).mockReturnValue(null);

      stats.addConnection(42, 'DEFAULT', 'example.com');

      const result = stats.byProxy;
      expect(result.DEFAULT).toBe(0);
    });
  });

  describe('byHost', () => {
    test('should return empty object when no connections', () => {
      const result = stats.byHost;
      expect(result).toEqual({});
    });

    test('should calculate bytes by host', () => {
      stats.addConnection(1, 'DEFAULT', 'example.com');
      stats.addConnection(2, 'DIRECT', 'google.com');
      stats.addConnection(3, 'DEFAULT', 'example.com');

      stats.addStats(1, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 100,
        trgRxBytes: 200,
      });
      stats.addStats(2, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 50,
        trgRxBytes: 50,
      });
      stats.addStats(3, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 300,
        trgRxBytes: 400,
      });

      const result = stats.byHost;
      expect(result['example.com']).toBe(1000); // (100+200) + (300+400)
      expect(result['google.com']).toBe(100); // 50+50
    });

    test('should sort hosts by bytes in descending order', () => {
      stats.addConnection(1, 'DEFAULT', 'host-a.com');
      stats.addConnection(2, 'DEFAULT', 'host-b.com');
      stats.addConnection(3, 'DEFAULT', 'host-c.com');

      stats.addStats(1, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 100,
        trgRxBytes: 0,
      });
      stats.addStats(2, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 500,
        trgRxBytes: 0,
      });
      stats.addStats(3, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 300,
        trgRxBytes: 0,
      });

      const result = stats.byHost;
      const entries = Object.entries(result);
      expect(entries[0][0]).toBe('host-b.com'); // 500 bytes
      expect(entries[1][0]).toBe('host-c.com'); // 300 bytes
      expect(entries[2][0]).toBe('host-a.com'); // 100 bytes
    });

    test('should handle hosts without stats', () => {
      stats.addConnection(1, 'DEFAULT', 'example.com');

      const result = stats.byHost;
      expect(result['example.com']).toBe(0);
    });

    test('should handle partial connection stats with missing trgRxBytes', () => {
      stats.addConnection(1, 'DEFAULT', 'example.com');
      stats.addStats(1, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: 100,
        trgRxBytes: undefined as any,
      });

      const result = stats.byHost;
      expect(result['example.com']).toBe(100);
    });

    test('should handle partial connection stats with missing trgTxBytes', () => {
      stats.addConnection(1, 'DEFAULT', 'example.com');
      stats.addStats(1, {
        srcTxBytes: 0,
        srcRxBytes: 0,
        trgTxBytes: undefined as any,
        trgRxBytes: 200,
      });

      const result = stats.byHost;
      expect(result['example.com']).toBe(200);
    });

    test('should handle null stats from active connections in byHost', () => {
      vi.mocked(mockProxyServer.getConnectionIds).mockReturnValue([42]);
      vi.mocked(mockProxyServer.getConnectionStats).mockReturnValue(null);

      stats.addConnection(42, 'DEFAULT', 'example.com');

      const result = stats.byHost;
      expect(result['example.com']).toBe(0);
    });
  });
});
