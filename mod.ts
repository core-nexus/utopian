#!/usr/bin/env -S deno run --allow-read=. --allow-write=. --allow-net=api.openai.com,localhost:1234 --allow-run=lms
/**
 * Deno entry point for utopian with explicit security permissions
 * Network access: Only api.openai.com and localhost:1234
 * File access: Limited to current directory
 * Process execution: Only lms command
 */

import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";

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
      base: Deno.env.get('OPENAI_API_KEY')
        ? 'https://api.openai.com/v1'
        : Deno.env.get('LMSTUDIO_BASE_URL') || 'http://localhost:1234/v1',
      model: Deno.env.get('OPENAI_API_KEY') 
        ? 'gpt-5' 
        : Deno.env.get('LMSTUDIO_MODEL') || 'openai/gpt-oss-20b',
      auto: false,
    },
  });

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

  // Auto-start LM Studio if no OpenAI API key and using localhost
  if (!Deno.env.get('OPENAI_API_KEY') && args.base.includes('localhost:1234')) {
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
    baseURL: args.base,
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