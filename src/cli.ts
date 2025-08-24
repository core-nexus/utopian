#!/usr/bin/env node
import { Command } from 'commander';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command()
  .name('utopian')
  .description('Utopia Node agent (local-first) - Deno-powered')
  .option(
    '--base <url>',
    'OpenAI-compatible base URL (default: https://api.openai.com/v1 if OPENAI_API_KEY set, else http://localhost:1234/v1)',
    process.env.OPENAI_API_KEY
      ? 'https://api.openai.com/v1'
      : process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1'
  )
  .option(
    '--model <name>',
    'model name',
    process.env.OPENAI_API_KEY ? 'gpt-5' : process.env.LMSTUDIO_MODEL || 'openai/gpt-oss-20b'
  )
  .option('--auto', 'skip HITL gates', false)
  .parse(process.argv);

const opts = program.opts();

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

  console.log('🦕 Spawning Deno process...');
  
  // Path to the Deno entry point
  const denoScript = join(__dirname, '..', 'mod.ts');
  
  // Build Deno arguments
  const denoArgs = [
    'run',
    '--allow-read=.',
    '--allow-write=.',
    '--allow-net=127.0.0.1,api.openai.com,localhost:1234',
    '--allow-env',
    '--allow-run=lms',
    denoScript
  ];

  // Add CLI arguments to Deno
  if (opts.base) {
    denoArgs.push('--base', opts.base);
  }
  if (opts.model) {
    denoArgs.push('--model', opts.model);
  }
  if (opts.auto) {
    denoArgs.push('--auto');
  }

  // Spawn Deno process
  const denoProcess = spawn('deno', denoArgs, {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Pass through environment variables
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      LMSTUDIO_BASE_URL: process.env.LMSTUDIO_BASE_URL,
      LMSTUDIO_MODEL: process.env.LMSTUDIO_MODEL,
      AUTO: opts.auto ? '1' : undefined,
    }
  });

  // Handle Deno process events
  denoProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Deno process exited with code ${code}`);
      process.exit(code);
    }
  });

  denoProcess.on('error', (error) => {
    console.error('❌ Failed to spawn Deno process:', error);
    process.exit(1);
  });
}

main().catch(err => {
  console.error('❌ utopian error:', err);
  process.exit(1);
});
