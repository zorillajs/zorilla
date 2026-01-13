import net from 'node:net';
import { afterEach, describe, expect, test } from 'vitest';
import getPort from './port.js';

describe('getPort', () => {
  let servers: net.Server[] = [];

  afterEach(async () => {
    // Clean up all servers created during tests
    await Promise.all(
      servers.map(
        server =>
          new Promise(resolve => {
            server.close(() => resolve(undefined));
          })
      )
    );
    servers = [];
  });

  test('should return a random available port when no options provided', async () => {
    const port = await getPort();
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  test('should return a random available port when empty options provided', async () => {
    const port = await getPort({});
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  test('should return the requested port if available', async () => {
    const port = await getPort({ port: 0 });
    expect(port).toBeGreaterThan(0);
  });

  test('should return requested port from array if available', async () => {
    // Get a random available port first
    const availablePort = await getPort({ port: 0 });

    // Now try to get that same port (should work since we didn't bind to it)
    const port = await getPort({ port: [availablePort] });
    expect(port).toBe(availablePort);
  });

  test('should try next port in array if first is taken', async () => {
    // Occupy a port
    const server = net.createServer();
    servers.push(server);

    const occupiedPort = await new Promise<number>((resolve, reject) => {
      server.on('error', reject);
      server.listen(0, () => {
        const address = server.address() as net.AddressInfo;
        resolve(address.port);
      });
    });

    // Get another available port
    const availablePort = await getPort({ port: 0 });

    // Request the occupied port first, then the available one
    const port = await getPort({ port: [occupiedPort, availablePort] });
    expect(port).toBe(availablePort);
  });

  test('should fall back to random port if all requested ports are taken', async () => {
    // Occupy a port
    const server = net.createServer();
    servers.push(server);

    const occupiedPort = await new Promise<number>((resolve, reject) => {
      server.on('error', reject);
      server.listen(0, () => {
        const address = server.address() as net.AddressInfo;
        resolve(address.port);
      });
    });

    // Request only the occupied port
    const port = await getPort({ port: occupiedPort });
    expect(port).toBeGreaterThan(0);
    expect(port).not.toBe(occupiedPort);
  });

  test('should respect host option', async () => {
    const port = await getPort({ port: 0, host: '127.0.0.1' });
    expect(port).toBeGreaterThan(0);
  });

  test('should handle multiple ports in array', async () => {
    // Occupy two ports
    const server1 = net.createServer();
    const server2 = net.createServer();
    servers.push(server1, server2);

    const [port1, port2] = await Promise.all([
      new Promise<number>((resolve, reject) => {
        server1.on('error', reject);
        server1.listen(0, () => {
          const address = server1.address() as net.AddressInfo;
          resolve(address.port);
        });
      }),
      new Promise<number>((resolve, reject) => {
        server2.on('error', reject);
        server2.listen(0, () => {
          const address = server2.address() as net.AddressInfo;
          resolve(address.port);
        });
      }),
    ]);

    // Get an available port
    const availablePort = await getPort({ port: 0 });

    // Request two occupied ports, then an available one
    const port = await getPort({ port: [port1, port2, availablePort] });
    expect(port).toBe(availablePort);
  });

  test('should handle single port number converted to array', async () => {
    const availablePort = await getPort({ port: 0 });
    const port = await getPort({ port: availablePort });
    expect(port).toBe(availablePort);
  });
});
