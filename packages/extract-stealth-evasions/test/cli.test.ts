import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptPath = join(__dirname, '..', 'dist', 'index.js');

describe('CLI execution', () => {
  it('should execute script and handle errors', async () => {
    // This test executes the compiled script directly to cover the entry point
    const child = spawn('node', [scriptPath, '--list'], {
      env: { ...process.env },
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', data => {
      stdout += data.toString();
    });

    child.stderr?.on('data', data => {
      stderr += data.toString();
    });

    await new Promise((resolve, reject) => {
      child.on('close', code => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(
            new Error(`Process exited with code ${code}\nstderr: ${stderr}`)
          );
        }
      });

      child.on('error', reject);

      // Set a timeout in case the process hangs
      setTimeout(() => {
        child.kill();
        reject(new Error('Process timed out'));
      }, 10000);
    });

    expect(stdout).toContain('Available evasions:');
  });
});
