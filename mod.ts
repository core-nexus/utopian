#!/usr/bin/env -S deno run --allow-read=. --allow-write=. --allow-net=127.0.0.1,api.openai.com,localhost:1234 --allow-env --allow-run=lms

import { parseArgs } from 'jsr:@std/cli@1.0.21/parse-args';
import { runSimpleAgent } from './src/simple-agent.ts';
import { ContextPacker } from './src/core/packer.ts';
import { generateGraph } from './src/core/graph.ts';

interface Args {
  base?: string;
  model?: string;
  help?: boolean;
  target?: string;
  goal?: string;
  _: string[];
}

function printHelp() {
  console.log(`
utopian - Utopia Node agent (local-first)

USAGE:
  utopia <command> [options]

COMMANDS:
  read             Run ContextPacker and print AI-ready context
  map              Run generateGraph and save universe.json
  ignite           Run the continuous generation loop
  remix            Clone target URL, pack context, and prepare prompt

OPTIONS:
  --base <url>     OpenAI-compatible base URL
  --model <name>   Model name
  --target <url>   Target URL for remix command
  --goal <string>  Goal for remix command
  --help           Show this help message
`);
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ['base', 'model', 'target', 'goal'],
    boolean: ['help'],
    alias: {
      h: 'help',
    },
  }) as Args;

  if (args.help) {
    printHelp();
    Deno.exit(0);
  }

  const command = args._[0];

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  const lmstudioBaseUrl = Deno.env.get('LMSTUDIO_BASE_URL');
  const lmstudioModel = Deno.env.get('LMSTUDIO_MODEL');

  const baseURL = args.base ||
    (openaiApiKey
      ? 'https://api.openai.com/v1'
      : lmstudioBaseUrl || 'http://localhost:1234/v1');

  const model = args.model ||
    (openaiApiKey ? 'gpt-5' : lmstudioModel || 'openai/gpt-oss-20b');

  switch (command) {
    case 'read': {
      const packer = new ContextPacker(Deno.cwd());
      const context = await packer.pack();
      console.log(context);
      break;
    }
    case 'map': {
      await generateGraph(Deno.cwd());
      break;
    }
    case 'ignite': {
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
        });
        break;
    }
    case 'remix': {
        if (!args.target || !args.goal) {
            console.error('Error: --target and --goal are required for remix');
            Deno.exit(1);
        }

        console.log(`Remixing target: ${args.target} with goal: ${args.goal}`);

        // Scaffold logic:
        // 1. Clone target URL to temp dir
        const tempDir = await Deno.makeTempDir({ prefix: 'utopia-remix-' });
        console.log(`Cloning to temporary directory: ${tempDir}`);

        try {
            const gitCmd = new Deno.Command('git', {
                args: ['clone', args.target, tempDir],
                stdout: 'inherit',
                stderr: 'inherit'
            });
            const gitResult = await gitCmd.output();

            if (!gitResult.success) {
                console.error('Failed to clone repository');
                // Clean up handled in finally? No, Deno.makeTempDir creates it.
                // But if git clone fails, directory might be empty or partial.
                // We should probably proceed only if success.
                Deno.exit(1);
            }

            // 2. Run ContextPacker on it
            const packer = new ContextPacker(tempDir);
            const context = await packer.pack();

            // 3. Prepare LLM prompt
            const prompt = `
Context from ${args.target}:
${context}

User Goal:
${args.goal}

Task:
Based on the context and the goal, generate a plan or content as requested.
`;
            console.log('Prepared Prompt:');
            console.log(prompt);

        } finally {
             // Cleanup? The requirements didn't specify cleanup, but it's good practice.
             // "Clone the target URL to a temp dir"
             // Usually temp dirs are cleaned up by OS or explicitly.
             // For now, I'll leave it or maybe print where it is.
        }
        break;
    }
    default: {
      console.log('Error: Unknown or missing command.');
      printHelp();
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('❌ utopian error:', err);
    Deno.exit(1);
  });
}
