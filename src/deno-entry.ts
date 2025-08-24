#!/usr/bin/env -S deno run --allow-read=. --allow-write=. --allow-net=api.openai.com,localhost:1234 --allow-run=lms --allow-env
/**
 * Deno entry point for utopian with explicit security permissions
 * Network access: Only api.openai.com and localhost:1234
 * File access: Limited to current directory
 * Process execution: Only lms command
 */

import { parse } from 'https://deno.land/std@0.224.0/flags/mod.ts';

// Import the Deno-compatible agent implementation
import { runSimpleAgent } from './deno-agent.ts';

interface AgentOptions {
  cwd: string;
  baseURL: string;
  model: string;
  auto: boolean;
}

/**
 * Deno agent runner with security restrictions
 */
async function runUtopianWithDeno(options: AgentOptions): Promise<void> {
  console.log(`🤖 Running utopian agent with:
  📍 Working directory: ${options.cwd}
  🌐 API base: ${options.baseURL}
  🧠 Model: ${options.model}  
  🚀 Auto mode: ${options.auto ? 'enabled' : 'disabled'}`);

  console.log('🔒 Running with Deno security sandbox:');
  console.log('  ✅ Network access restricted to API endpoints only');
  console.log('  ✅ File system access limited to current directory');
  console.log('  ✅ Process execution limited to lms command only\n');

  // Call the actual Deno agent implementation
  await runSimpleAgent(options);
}

/**
 * Check if LM Studio is available by testing if the lms command exists
 */
async function checkLMStudioAvailable(): Promise<boolean> {
  try {
    const lmsCmd = new Deno.Command('lms', {
      args: ['--version'],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code } = await lmsCmd.output();
    return code === 0;
  } catch {
    return false;
  }
}

async function main() {
  const args = parse(Deno.args, {
    string: ['base', 'model'],
    boolean: ['auto', 'help'],
    default: {
      auto: false,
    },
  });

  if (args.help) {
    console.log(`
Utopian - Secure AI agent with Deno sandbox

Usage: deno run --allow-read=. --allow-write=. --allow-net=api.openai.com,localhost:1234 --allow-run=lms src/deno-entry.ts [options]

Options:
  --base <url>     OpenAI-compatible base URL  
  --model <name>   Model name
  --auto          Skip human-in-the-loop gates
  --help          Show this help message

Security Features:
  🔒 Network access restricted to AI API endpoints only
  🔒 File system access limited to current directory
  🔒 Process execution limited to lms command only
`);
    return;
  }

  // Set defaults based on environment
  const lmStudioAvailable = await checkLMStudioAvailable();

  const baseURL =
    args.base ||
    (lmStudioAvailable
      ? Deno.env.get('LMSTUDIO_BASE_URL') || 'http://localhost:1234/v1'
      : Deno.env.get('OPENAI_API_KEY')
        ? 'https://api.openai.com/v1'
        : 'http://localhost:1234/v1');

  const model =
    args.model ||
    (lmStudioAvailable
      ? Deno.env.get('LMSTUDIO_MODEL') || 'openai/gpt-oss-20b'
      : Deno.env.get('OPENAI_API_KEY')
        ? 'gpt-5'
        : 'openai/gpt-oss-20b');

  // Auto-start LM Studio if using localhost
  if (baseURL.includes('localhost:1234')) {
    try {
      console.log('🚀 Starting LM Studio server...');
      const cmd = new Deno.Command('lms', {
        args: ['server', 'start'],
        stdout: 'piped',
        stderr: 'piped',
      });
      const { code } = await cmd.output();

      if (code === 0) {
        const statusCmd = new Deno.Command('lms', {
          args: ['status'],
          stdout: 'piped',
          stderr: 'piped',
        });
        await statusCmd.output();
      }
    } catch {
      console.log('⚠️  Could not start LM Studio (continuing anyway)');
    }
  }

  await runUtopianWithDeno({
    cwd: Deno.cwd(),
    baseURL,
    model,
    auto: args.auto,
  });
}

if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    console.error('❌ utopian error:', err);
    Deno.exit(1);
  }
}
