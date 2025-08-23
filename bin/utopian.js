#!/usr/bin/env node

// Node.js wrapper that detects and uses Deno when available for enhanced security
const { spawn } = require('child_process');
const { join } = require('path');
const fs = require('fs');

async function checkDenoAvailable() {
  return new Promise((resolve) => {
    const deno = spawn('deno', ['--version'], { stdio: 'pipe' });
    deno.on('close', (code) => resolve(code === 0));
    deno.on('error', () => resolve(false));
  });
}

function runWithDeno(args) {
  const modPath = join(__dirname, '..', 'mod.ts');
  
  // Verify mod.ts exists
  if (!fs.existsSync(modPath)) {
    console.error('❌ Deno entry point not found:', modPath);
    console.log('📦 Falling back to Node.js implementation...');
    return runWithNode(args);
  }

  console.log('🦕 Running with Deno security sandbox...');
  console.log('  🔒 Network: api.openai.com,localhost:1234 only');
  console.log('  🔒 Files: current directory only');
  console.log('  🔒 Process: lms command only');
  console.log('  🔒 Environment: controlled access');
  console.log();

  const denoArgs = [
    'run',
    '--allow-read=.',
    '--allow-write=.',
    '--allow-net=api.openai.com,localhost:1234',
    '--allow-run=lms',
    '--allow-env=OPENAI_API_KEY,LMSTUDIO_BASE_URL,LMSTUDIO_MODEL',
    modPath,
    ...args
  ];

  const deno = spawn('deno', denoArgs, { stdio: 'inherit' });
  
  deno.on('error', (error) => {
    console.error('❌ Deno execution failed:', error.message);
    console.log('📦 Falling back to Node.js implementation...');
    runWithNode(args);
  });

  deno.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Deno process exited with code ${code}`);
    }
    process.exit(code || 0);
  });
}

function runWithNode(args) {
  const cliPath = join(__dirname, '..', 'dist', 'cli.js');
  
  if (!fs.existsSync(cliPath)) {
    console.error('❌ Node.js CLI not found:', cliPath);
    console.log('💡 Please run: npm run build');
    process.exit(1);
  }

  console.log('📦 Running with Node.js (standard security)...');
  console.log('💡 For enhanced security, install Deno: https://deno.land/manual/getting_started/installation');
  console.log();

  const node = spawn('node', [cliPath, ...args], { stdio: 'inherit' });
  
  node.on('error', (error) => {
    console.error('❌ Node.js execution failed:', error.message);
    process.exit(1);
  });

  node.on('close', (code) => {
    process.exit(code || 0);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  // Check if Deno is available and user hasn't explicitly requested Node.js
  if (await checkDenoAvailable() && !args.includes('--use-node')) {
    runWithDeno(args);
  } else {
    if (!await checkDenoAvailable()) {
      console.log('💡 For enhanced security, consider installing Deno: https://deno.land/manual/getting_started/installation');
      console.log('   Deno provides:');
      console.log('   🔒 Explicit permission model (no ambient authority)');
      console.log('   🔒 Network access restrictions');
      console.log('   🔒 File system sandboxing');
      console.log('   🔒 Environment variable controls');
      console.log();
    }
    runWithNode(args);
  }
}

main().catch(error => {
  console.error('❌ Wrapper error:', error);
  process.exit(1);
});