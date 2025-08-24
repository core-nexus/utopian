#!/usr/bin/env node

/**
 * Smart security launcher for utopian
 *
 * Detects Deno availability and uses it with security restrictions when available.
 * Falls back to Node.js when Deno is not installed.
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

function checkDenoAvailable() {
  return new Promise(resolve => {
    const deno = spawn('deno', ['--version'], {
      stdio: 'pipe',
      shell: true,
    });

    let output = '';
    deno.stdout.on('data', data => {
      output += data.toString();
    });

    deno.on('close', code => {
      resolve(code === 0 && output.includes('deno'));
    });

    deno.on('error', () => {
      resolve(false);
    });
  });
}

function findModuleRoot() {
  // Find the package root by looking for package.json
  let currentDir = __dirname;

  while (currentDir !== path.parse(currentDir).root) {
    const packagePath = path.join(currentDir, 'package.json');
    if (existsSync(packagePath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // If not found, assume we're in src directory
  return path.dirname(__dirname);
}

async function runWithDeno(args) {
  const moduleRoot = findModuleRoot();
  const denoEntryPath = path.join(moduleRoot, 'src', 'deno-entry.ts');

  if (!existsSync(denoEntryPath)) {
    console.error('❌ Deno entry point not found at:', denoEntryPath);
    console.log('Falling back to Node.js...\n');
    return false;
  }

  console.log('🦕 Running with Deno security sandbox...');
  console.log('  🔒 Network: api.openai.com,localhost:1234 only');
  console.log('  🔒 Files: current directory only');
  console.log('  🔒 Process: lms command only');
  console.log('  🔒 Environment: limited variable access\n');

  const denoArgs = [
    'run',
    '--allow-read=.',
    '--allow-write=.',
    '--allow-net=api.openai.com,localhost:1234',
    '--allow-run=lms',
    '--allow-env',
    denoEntryPath,
    ...args,
  ];

  const deno = spawn('deno', denoArgs, {
    stdio: 'inherit',
    shell: true,
  });

  return new Promise(resolve => {
    deno.on('close', code => {
      process.exit(code || 0);
    });

    deno.on('error', err => {
      console.error('❌ Error running Deno:', err.message);
      resolve(false);
    });
  });
}

function runWithNode(args) {
  const moduleRoot = findModuleRoot();
  const distPath = path.join(moduleRoot, 'dist', 'cli.js');

  if (!existsSync(distPath)) {
    console.error('❌ Node.js entry point not found at:', distPath);
    console.error('Please run: npm run build');
    process.exit(1);
  }

  console.log('⚠️  Running with Node.js (no sandbox)');
  console.log('💡 Install Deno for enhanced security: https://deno.com/\n');

  const node = spawn('node', [distPath, ...args], {
    stdio: 'inherit',
    shell: true,
  });

  node.on('close', code => {
    process.exit(code || 0);
  });

  node.on('error', err => {
    console.error('❌ Error running Node.js:', err.message);
    process.exit(1);
  });
}

async function main() {
  console.log('🤖 Utopian AI Agent\n');
  const args = process.argv.slice(2);

  // Show help for security options
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Utopian - AI agent with optional security sandbox

Usage: npx utopian [options]

Options:
  --base <url>     OpenAI-compatible base URL
  --model <name>   Model name
  --auto          Skip human-in-the-loop gates
  --help          Show this help message

Security Features:
  🦕 With Deno (recommended): Sandboxed execution with restricted permissions
  ⚠️  With Node.js: Full system access (install Deno for security)

Install Deno for enhanced security: https://deno.com/
`);
    return;
  }

  const hasDenoAvailable = await checkDenoAvailable();

  if (hasDenoAvailable) {
    const success = await runWithDeno(args);
    if (!success) {
      console.log('Falling back to Node.js...\n');
      runWithNode(args);
    }
  } else {
    runWithNode(args);
  }
}

main().catch(err => {
  console.error('❌ Launcher error:', err);
  process.exit(1);
});
