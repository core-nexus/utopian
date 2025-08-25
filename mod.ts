#!/usr/bin/env -S deno run --allow-read=. --allow-write=. --allow-net=127.0.0.1,api.openai.com,localhost:1234 --allow-env --allow-run=lms

import { parseArgs } from 'jsr:@std/cli@1.0.21/parse-args';
import { runSimpleAgent } from './src/simple-agent.ts';

interface Args {
  base?: string;
  model?: string;
  auto?: boolean;
  help?: boolean;
}

function printHelp() {
  console.log(`
utopian - Utopia Node agent (local-first)

USAGE:
  deno run --allow-read=. --allow-write=. --allow-net=127.0.0.1,api.openai.com,localhost:1234 --allow-env --allow-run=lms mod.ts [OPTIONS]

OPTIONS:
  --base <url>     OpenAI-compatible base URL (default: https://api.openai.com/v1 if OPENAI_API_KEY set, else http://localhost:1234/v1)
  --model <name>   model name (default: gpt-5 if OPENAI_API_KEY set, else openai/gpt-oss-20b)
  --auto           skip HITL gates
  --help           show this help message
`);
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ['base', 'model'],
    boolean: ['auto', 'help'],
    alias: {
      h: 'help',
    },
  }) as Args;

  if (args.help) {
    printHelp();
    Deno.exit(0);
  }

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  const lmstudioBaseUrl = Deno.env.get('LMSTUDIO_BASE_URL');
  const lmstudioModel = Deno.env.get('LMSTUDIO_MODEL');

  const baseURL = args.base ||
    (openaiApiKey
      ? 'https://api.openai.com/v1'
      : lmstudioBaseUrl || 'http://localhost:1234/v1');

  const model = args.model ||
    (openaiApiKey ? 'gpt-5' : lmstudioModel || 'openai/gpt-oss-20b');

  // Auto-start LM Studio if no OpenAI API key and using localhost
  if (!openaiApiKey && baseURL.includes('localhost:1234')) {
    try {
      console.log('🚀 Starting LM Studio server...');
      const cmd = new Deno.Command('lms', {
        args: ['server', 'start'],
        stdout: 'piped',
        stderr: 'piped',
      });
      await cmd.output();

      const statusCmd = new Deno.Command('lms', {
        args: ['status'],
        stdout: 'piped',
        stderr: 'piped',
      });
      await statusCmd.output();
    } catch {
      console.log('⚠️  Could not start LM Studio (continuing anyway)');
    }
  }

  await runSimpleAgent({
    cwd: Deno.cwd(),
    baseURL,
    model,
    auto: !!args.auto,
  });
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('❌ utopian error:', err);
    Deno.exit(1);
  });
}
