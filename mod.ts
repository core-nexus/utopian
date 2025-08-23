#!/usr/bin/env -S deno run --allow-read=. --allow-write=. --allow-net=api.openai.com,localhost:1234 --allow-run=lms --allow-env
/**
 * Deno entry point for utopian with explicit security permissions
 * Network access: Only api.openai.com and localhost:1234
 * File access: Limited to current directory
 * Process execution: Only lms command
 */

import { parse } from 'https://deno.land/std@0.224.0/flags/mod.ts';

/**
 * Check if LM Studio is available by testing if the lms command exists
 * and if the server is responsive on localhost:1234
 */
async function checkLMStudioAvailable(): Promise<boolean> {
  try {
    // First check if lms command exists
    const lmsCmd = new Deno.Command('lms', {
      args: ['--version'],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code } = await lmsCmd.output();

    if (code !== 0) {
      return false;
    }

    // Check if LM Studio server is running on localhost:1234
    try {
      const response = await fetch('http://localhost:1234/v1/models', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      // Server not running, but lms command exists - we can try to start it
      return true;
    }
  } catch {
    return false;
  }
}

interface UtopianOptions {
  base: string;
  model: string;
  auto: boolean;
  cwd: string;
}

async function runSimpleAgent(options: UtopianOptions): Promise<void> {
  // This would contain the actual agent implementation
  // For now, we'll create a minimal implementation that shows the concept
  console.log(`🤖 Running utopian agent with:
  📍 Working directory: ${options.cwd}
  🌐 API base: ${options.base}
  🧠 Model: ${options.model}
  🚀 Auto mode: ${options.auto ? 'enabled' : 'disabled'}`);

  // Simulate the agent work
  console.log('🔒 Running with Deno security sandbox:');
  console.log('  ✅ Network access restricted to API endpoints only');
  console.log('  ✅ File system access limited to current directory');
  console.log('  ✅ Process execution limited to lms command only');

  // Check if we can access the working directory
  try {
    const entries = [];
    for await (const entry of Deno.readDir(options.cwd)) {
      entries.push(entry.name);
    }
    console.log(`📁 Found ${entries.length} items in working directory`);
  } catch (error) {
    console.error('❌ Cannot read working directory:', error.message);
    return;
  }

  console.log('✨ Utopian agent completed successfully');
}

async function main() {
  const args = parse(Deno.args, {
    string: ['base', 'model'],
    boolean: ['auto', 'help'],
    default: {
      auto: false,
    },
  });

  // Determine base URL and model by checking LM Studio availability first
  const lmStudioAvailable = await checkLMStudioAvailable();

  // Set defaults based on LM Studio availability, prioritizing LM Studio
  if (!args.base) {
    if (lmStudioAvailable) {
      args.base = Deno.env.get('LMSTUDIO_BASE_URL') || 'http://localhost:1234/v1';
    } else if (Deno.env.get('OPENAI_API_KEY')) {
      args.base = 'https://api.openai.com/v1';
    } else {
      args.base = 'http://localhost:1234/v1'; // Default fallback
    }
  }

  if (!args.model) {
    if (lmStudioAvailable) {
      args.model = Deno.env.get('LMSTUDIO_MODEL') || 'openai/gpt-oss-20b';
    } else if (Deno.env.get('OPENAI_API_KEY')) {
      args.model = 'gpt-5';
    } else {
      args.model = 'openai/gpt-oss-20b'; // Default fallback
    }
  }

  if (args.help) {
    console.log(`
Utopian - Secure AI agent with Deno sandbox

Usage: deno run --allow-read=. --allow-write=. --allow-net=api.openai.com,localhost:1234 --allow-run=lms mod.ts [options]

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

  // Auto-start LM Studio if using localhost (prioritize LM Studio)
  if (args.base.includes('localhost:1234')) {
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

  await runSimpleAgent({
    cwd: Deno.cwd(),
    base: args.base,
    model: args.model,
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