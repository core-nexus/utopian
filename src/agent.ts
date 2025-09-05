import { generateText, tool } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { dirname, join } from 'jsr:@std/path';
import {
  ensureDir,
  listDir,
  readText,
  readYaml,
  writeText,
  writeYaml,
} from './tools/fsTools.ts';
import { runCmd } from './tools/systemTools.ts';
import { SYSTEM_PROMPT } from './prompts/system.ts';
import { hitl } from './hitl.ts';

type KnownNodes = { nodes: Array<{ url: string; score?: number }> };

export type AgentOptions = {
  cwd: string;
  model?: string;
  baseURL?: string; // LM Studio default if undefined
  auto?: boolean; // skip HITL if true
};

export async function runAgent(opts: AgentOptions) {
  const cwd = opts.cwd;
  const baseURL = opts.baseURL ?? 'http://localhost:1234/v1'; // LM Studio default
  const modelName = opts.model ?? 'openai/gpt-oss-20b'; // Default LM Studio model

  const openai = createOpenAI({
    apiKey: Deno.env.get('LMSTUDIO_API_KEY') ?? 'lm-studio',
    baseURL,
    compatibility: 'compatible', // Better compatibility with local models
  });

  // ---------- Tools ----------
  const readFile = tool({
    description: 'Read text file',
    parameters: z.object({ path: z.string() }),
    execute: async ({ path }: { path: string }) => (await readText(path)) ?? '',
  });

  const writeFile = tool({
    description: 'Write text file (creates dirs)',
    parameters: z.object({ path: z.string(), content: z.string() }),
    execute: async ({ path, content }: { path: string; content: string }) =>
      await writeText(path, content),
  });

  const list = tool({
    description: 'List directory entries',
    parameters: z.object({ path: z.string() }),
    execute: async ({ path }: { path: string }) =>
      (await listDir(path)).join('\n'),
  });

  const ensure = tool({
    description: 'Ensure directory exists',
    parameters: z.object({ path: z.string() }),
    execute: async ({ path }: { path: string }) => {
      await ensureDir(path);
      return path;
    },
  });

  const marp = tool({
    description: 'Compile Marp slides to dist/ (PDF/HTML)',
    parameters: z.object({ pattern: z.string().default('slides/*.md') }),
    execute: async ({ pattern }: { pattern: string }) =>
      await runCmd('marp', [pattern, '-o', 'dist', '--allow-local-files'], {
        cwd,
      }),
  });

  const git = tool({
    description: 'Run a safe git commit of changes',
    parameters: z.object({ message: z.string().default('utopian update') }),
    execute: async ({ message }: { message: string }) => {
      await runCmd('git', ['add', '.'], { cwd });
      try {
        await runCmd('git', ['commit', '-m', message], { cwd });
      } catch {
        /* no changes */
      }
      return 'committed';
    },
  });

  const trustNodes = tool({
    description: 'Read and update trust/known_nodes.yaml',
    parameters: z.object({
      add: z.array(z.object({ url: z.string(), score: z.number().optional() }))
        .optional(),
    }),
    execute: async (
      { add }: { add?: Array<{ url: string; score?: number }> },
    ) => {
      const p = join(cwd, 'trust', 'known_nodes.yaml');
      const current = (await readYaml<KnownNodes>(p)) ?? { nodes: [] };
      if (add?.length) current.nodes.push(...add);
      await ensureDir(dirname(p));
      await writeYaml(p, current);
      return p;
    },
  });

  const makeSlides = tool({
    description: 'Create a simple Marp deck from bullet points',
    parameters: z.object({
      title: z.string(),
      bullets: z.array(z.string()),
      out: z.string().default('slides/overview.md'),
    }),
    execute: (
      { title, bullets, out }: {
        title: string;
        bullets: string[];
        out: string;
      },
    ) => {
      const md = `---
marp: true
title: ${title}
paginate: true
---

# ${title}

${bullets.map((b: string) => `- ${b}`).join('\n')}
`;
      return writeText(join(cwd, out), md);
    },
  });

  const writeReport = tool({
    description: 'Write a Markdown report',
    parameters: z.object({
      title: z.string(),
      body: z.string(),
      out: z.string().default('reports/utopia-report.md'),
    }),
    execute: (
      { title, body, out }: { title: string; body: string; out: string },
    ) => {
      const md = `# ${title}\n\n${body}\n`;
      return writeText(join(cwd, out), md);
    },
  });

  // ---------- Initial context ----------
  const goals = await readText(join(cwd, 'goals', 'README.md'));
  const found = await readText(join(cwd, 'foundations', 'index.yaml'));
  const trust = await readText(join(cwd, 'trust', 'known_nodes.yaml'));
  const contextSummary = [
    `Repo present: ${!!(goals || found || trust)}`,
    goals ? '- goals present' : '- goals missing',
    found ? '- foundations present' : '- foundations missing',
    trust ? '- trust present' : '- trust missing',
  ].join('\n');

  // Optional HITL at the start to confirm plan
  await hitl('planning', cwd, '01-planning', contextSummary);

  // ---------- Orchestration loop ----------
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Project root: ${cwd}

Context:
${contextSummary}

CREATE A LIVING WEB OF INTERCONNECTED KNOWLEDGE:

ESSENTIAL STRUCTURE (create/enhance these with rich cross-references):
- index.md: Comprehensive navigation hub with status dashboard, interconnection map, and multiple entry points
- reports/utopia-report.md: Enhanced operational status with partnership analysis and strategic intelligence
- reports/synthesis-[timestamp].md: Deep cross-topic analysis identifying collaboration opportunities and patterns
- slides/overview.md (Marp): Rich presentation with cross-references, then compile
- trust/known_nodes.yaml: Ensure exists, seed with core-nexus/utopia, analyze for strategic connections
- goals/README.md: Connect strategic objectives explicitly to trust relationships and collaboration opportunities

LIVING WEB CREATION APPROACH:
- Look for existing content to enhance with richer analysis and natural cross-links
- Create meaningful cross-references when content naturally connects using [link text](./path/to/file.md)
- Consider bidirectional relationships where they make sense
- Build synthesis reports when you see meaningful patterns across different data sources
- Enhance existing content when possible rather than always creating new files
- Create substantial reports with actionable intelligence when the content warrants it
- Look for natural connections between trust network analysis and strategic planning

NATURAL INTERCONNECTION OPPORTUNITIES:
- Goals ↔ Trust Network: Look for connections between strategic objectives and partnership opportunities
- Trust Data ↔ Reports: Consider how partnership analysis might inform strategic insights  
- Foundations ↔ Other Content: Connect core values to strategic content where it makes sense
- Use your creativity to identify meaningful connections that enhance understanding

Ask for HITL checkpoints when making major structural decisions or before final commit.`,
    },
  ];

  // We'll run a few "turns" so the model can call tools multiple times.
  for (let i = 0; i < 6; i++) {
    const result = await generateText({
      model: openai(modelName),
      messages,
      tools: {
        readFile,
        writeFile,
        list,
        ensure,
        marp,
        git,
        trustNodes,
        makeSlides,
        writeReport,
      },
    });

    // Log model text (status/plan) for the user
    if (result.text) {
      console.log(`\n🧠 Model:\n${result.text}`);
    }

    // Execute tool calls (the SDK already executed them; we just show results)
    for (const call of result.toolCalls) {
      const r = result.toolResults.find((t) =>
        t.toolCallId === call.toolCallId
      );
      console.log(`🔧 ${call.toolName} -> ${JSON.stringify(r)}`);
    }

    // Simple "done" heuristic: if no tools called this turn, stop.
    if (result.toolCalls.length === 0) break;

    // HITL pause between turns (unless AUTO=1)
    if (Deno.env.get('AUTO') !== '1') {
      console.log('\n⏸  HITL: press Enter to continue…');
      const buf = new Uint8Array(1024);
      await Deno.stdin.read(buf);
    }

    // Append a tiny "continue" message and loop
    messages.push({
      role: 'user',
      content: 'Continue. If main artifacts exist, finalize.',
    });
  }

  // Final checkpoint
  await hitl('finalize', cwd, '99-finalize', 'Review artifacts and commit.');
}
