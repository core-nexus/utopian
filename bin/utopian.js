#!/usr/bin/env node
/**
 * Node.js wrapper for utopian that delegates to Deno when available for enhanced security
 * 
 * This provides the familiar `npx utopian` experience while leveraging Deno's 
 * security sandbox when possible. Falls back to Node.js implementation otherwise.
 * 
 * As suggested in issue #4, this combines:
 * - The trust halo and familiarity of npx
 * - The security sandbox of Deno with explicit --allow-* flags
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function checkDenoAvailable() {
  try {
    const result = spawnSync('deno', ['--version'], { 
      stdio: 'pipe',
      timeout: 5000
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

function runWithDeno(args) {
  console.log('🦕 Using Deno runtime with security sandbox...');
  
  const denoArgs = [
    'run',
    // Explicit permissions for security
    '--allow-read=.',
    '--allow-write=.',
    // Network access limited to AI APIs only
    '--allow-net=api.openai.com,localhost:1234',
    // Allow LM Studio control if needed
    '--allow-run=lms',
    // Deno entry point
    resolve(projectRoot, 'mod.ts'),
    ...args
  ];

  const result = spawnSync('deno', denoArgs, {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  if (result.error) {
    console.error('❌ Failed to run with Deno:', result.error.message);
    return false;
  }

  process.exit(result.status || 0);
}

function runWithNode(args) {
  console.log('🟢 Using Node.js runtime (Deno not available)...');
  
  // Import and run the Node.js CLI
  import('../dist/cli.js').then(() => {
    // The CLI handles its own argument parsing and execution
  }).catch(err => {
    console.error('❌ Failed to run with Node.js:', err);
    process.exit(1);
  });
}

function printHelp() {
  console.log(`
Utopia Node Agent - Secure AI-powered content generation for global challenges

Usage:
  npx utopian [options]

Options:
  --base <url>     OpenAI-compatible base URL
                   (default: https://api.openai.com/v1 if OPENAI_API_KEY set, 
                            else http://localhost:1234/v1)
  --model <name>   Model name to use
                   (default: gpt-4 if OPENAI_API_KEY set,
                            else openai/gpt-oss-20b)
  --auto           Skip human-in-the-loop confirmations
  --help, -h       Show this help

Security Features:
🦕 **When Deno is available:**
  ✅ Explicit permissions model (no ambient authority)
  ✅ Network access limited to AI APIs only  
  ✅ File system access scoped to current directory
  ✅ Process execution limited to specific tools

🟢 **Node.js fallback:**
  ⚠️  Standard Node.js permissions apply
  ℹ️  Install Deno for enhanced security: https://deno.land/

Environment Variables:
  OPENAI_API_KEY      OpenAI API key for GPT models
  LMSTUDIO_BASE_URL   LM Studio server URL
  LMSTUDIO_MODEL      LM Studio model name

Examples:
  npx utopian
  npx utopian --auto
  npx utopian --base http://localhost:1234/v1 --model custom-model
`);
}

function main() {
  const { values: options, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      base: { type: 'string' },
      model: { type: 'string' },
      auto: { type: 'boolean' },
      help: { type: 'boolean' },
    },
    allowPositionals: true,
  });

  if (options.help) {
    printHelp();
    return;
  }

  // Build argument list for delegation
  const delegateArgs = [];
  if (options.base) {
    delegateArgs.push('--base', options.base);
  }
  if (options.model) {
    delegateArgs.push('--model', options.model);
  }
  if (options.auto) {
    delegateArgs.push('--auto');
  }
  delegateArgs.push(...positionals);

  // Try Deno first for enhanced security, fall back to Node.js
  if (checkDenoAvailable()) {
    runWithDeno(delegateArgs);
  } else {
    console.log('💡 For enhanced security, consider installing Deno: https://deno.land/');
    console.log('   Then run: deno run --allow-read=. --allow-write=. --allow-net=api.openai.com,localhost:1234 --allow-run=lms mod.ts');
    console.log('');
    runWithNode(delegateArgs);
  }
}

main();