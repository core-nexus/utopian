#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create dist directory
mkdirSync('dist', { recursive: true });

// Create a minimal Node.js wrapper that spawns Deno
const cliWrapper = `#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Check if Deno is available
  try {
    const denoCheck = spawn('deno', ['--version'], { stdio: 'pipe' });
    await new Promise((resolve, reject) => {
      denoCheck.on('close', (code) => {
        if (code !== 0) {
          reject(new Error('Deno not available'));
        } else {
          resolve(null);
        }
      });
      denoCheck.on('error', reject);
    });
  } catch (error) {
    console.error('❌ Deno is required but not available. Please install Deno: https://deno.com/');
    console.error('❌ This tool ONLY works with Deno - Node.js fallback is disabled by design.');
    process.exit(1);
  }

  console.log('🦕 Launching Deno-powered utopian...');
  
  // Find the mod.ts file (it should be in the package root)
  const modPath = join(__dirname, '..', 'mod.ts');
  
  // Spawn Deno with the proper permissions and forward all arguments
  const denoArgs = [
    'run',
    '--allow-read=.',
    '--allow-write=.',
    '--allow-net=127.0.0.1,api.openai.com,localhost:1234',
    '--allow-env',
    '--allow-run=lms',
    modPath,
    ...process.argv.slice(2)
  ];
  
  const denoProcess = spawn('deno', denoArgs, { stdio: 'inherit' });
  
  denoProcess.on('close', (code) => {
    process.exit(code);
  });
  
  denoProcess.on('error', (error) => {
    console.error('❌ Failed to start Deno process:', error);
    process.exit(1);
  });
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
`;

writeFileSync('dist/cli.js', cliWrapper);
console.log('✅ Built npm wrapper at dist/cli.js');
