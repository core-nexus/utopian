import { generateText, tool } from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import path from "node:path";
import {
  ensureDir, readText, writeText, listDir, readYaml, writeYaml
} from "./tools/fsTools.js";
import { runCmd } from "./tools/systemTools.js";
import { SYSTEM_PROMPT } from "./prompts/system.js";
import { hitl } from "./hitl.js";

type KnownNodes = { nodes: Array<{ url: string; score?: number }> };

export type AgentOptions = {
  cwd: string;
  model?: string;
  baseURL?: string; // LM Studio default if undefined
  auto?: boolean;   // skip HITL if true
};

export async function runAgent(opts: AgentOptions) {
  const cwd = opts.cwd;
  const baseURL = opts.baseURL ?? "http://localhost:1234/v1"; // LM Studio default
  const modelName = opts.model ?? "openai/gpt-oss-20b"; // Default LM Studio model

  const openai = createOpenAI({
    apiKey: process.env.LMSTUDIO_API_KEY ?? "lm-studio",
    baseURL,
    compatibility: "compatible" // Better compatibility with local models
  });

  // ---------- Tools ----------
  const readFile = tool({
    description: "Read text file",
    parameters: z.object({ path: z.string() }),
    execute: async ({ path }: { path: string }) => (await readText(path)) ?? ""
  });

  const writeFile = tool({
    description: "Write text file (creates dirs)",
    parameters: z.object({ path: z.string(), content: z.string() }),
    execute: async ({ path, content }: { path: string; content: string }) => await writeText(path, content)
  });

  const list = tool({
    description: "List directory entries",
    parameters: z.object({ path: z.string() }),
    execute: async ({ path }: { path: string }) => (await listDir(path)).join("\n")
  });

  const ensure = tool({
    description: "Ensure directory exists",
    parameters: z.object({ path: z.string() }),
    execute: async ({ path }: { path: string }) => { await ensureDir(path); return path; }
  });

  const marp = tool({
    description: "Compile Marp slides to dist/ (PDF/HTML)",
    parameters: z.object({ pattern: z.string().default("slides/*.md") }),
    execute: async ({ pattern }: { pattern: string }) => await runCmd("marp", [pattern, "-o", "dist", "--allow-local-files"], { cwd })
  });

  const git = tool({
    description: "Run a safe git commit of changes",
    parameters: z.object({ message: z.string().default("e-utopia update") }),
    execute: async ({ message }: { message: string }) => {
      await runCmd("git", ["add", "."], { cwd });
      try { await runCmd("git", ["commit", "-m", message], { cwd }); } catch { /* no changes */ }
      return "committed";
    }
  });

  const trustNodes = tool({
    description: "Read and update trust/known_nodes.yaml",
    parameters: z.object({
      add: z.array(z.object({ url: z.string(), score: z.number().optional() })).optional()
    }),
    execute: async ({ add }: { add?: Array<{ url: string; score?: number }> }) => {
      const p = path.join(cwd, "trust", "known_nodes.yaml");
      const current = (await readYaml<KnownNodes>(p)) ?? { nodes: [] };
      if (add?.length) current.nodes.push(...add);
      await ensureDir(path.dirname(p));
      await writeYaml(p, current);
      return p;
    }
  });

  const makeSlides = tool({
    description: "Create a simple Marp deck from bullet points",
    parameters: z.object({
      title: z.string(),
      bullets: z.array(z.string()),
      out: z.string().default("slides/overview.md")
    }),
    execute: async ({ title, bullets, out }: { title: string; bullets: string[]; out: string }) => {
      const md = `---
marp: true
title: ${title}
paginate: true
---

# ${title}

${bullets.map((b: string) => `- ${b}`).join("\n")}
`;
      return writeText(path.join(cwd, out), md);
    }
  });

  const writeReport = tool({
    description: "Write a Markdown report",
    parameters: z.object({
      title: z.string(),
      body: z.string(),
      out: z.string().default("reports/utopia-report.md")
    }),
    execute: async ({ title, body, out }: { title: string; body: string; out: string }) => {
      const md = `# ${title}\n\n${body}\n`;
      return writeText(path.join(cwd, out), md);
    }
  });

  // ---------- Initial context ----------
  const goals = await readText(path.join(cwd, "goals", "README.md"));
  const found = await readText(path.join(cwd, "foundations", "index.yaml"));
  const trust = await readText(path.join(cwd, "trust", "known_nodes.yaml"));
  const contextSummary = [
    `Repo present: ${!!(goals || found || trust)}`,
    goals ? "- goals present" : "- goals missing",
    found ? "- foundations present" : "- foundations missing",
    trust ? "- trust present" : "- trust missing"
  ].join("\n");

  // Optional HITL at the start to confirm plan
  await hitl("planning", cwd, "01-planning", contextSummary);

  // ---------- Orchestration loop ----------
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `Project root: ${cwd}

Context:
${contextSummary}

If something is missing, propose a minimal plan and then use tools to create:
- reports/utopia-report.md (high-level)
- slides/overview.md (Marp) then compile
- trust/known_nodes.yaml (ensure exists; seed with at least core-nexus/utopia)

Ask for HITL checkpoints by outputting short notes (the host will pause between iterations).`
    }
  ];

  // We'll run a few "turns" so the model can call tools multiple times.
  for (let i = 0; i < 6; i++) {
    const result = await generateText({
      model: openai(modelName),
      messages,
      tools: { readFile, writeFile, list, ensure, marp, git, trustNodes, makeSlides, writeReport }
    });

    // Log model text (status/plan) for the user
    if (result.text) {
      process.stdout.write(`\n🧠 Model:\n${result.text}\n`);
    }

    // Execute tool calls (the SDK already executed them; we just show results)
    for (const call of result.toolCalls) {
      const r = result.toolResults.find(t => t.toolCallId === call.toolCallId);
      process.stdout.write(`🔧 ${call.toolName} -> ${JSON.stringify(r)}\n`);
    }

    // Simple "done" heuristic: if no tools called this turn, stop.
    if (result.toolCalls.length === 0) break;

    // HITL pause between turns (unless AUTO=1)
    if (process.env.AUTO !== "1") {
      process.stdout.write("\n⏸  HITL: press Enter to continue… ");
      await new Promise<void>(res => process.stdin.once("data", () => res()));
    }

    // Append a tiny "continue" message and loop
    messages.push({ role: "user", content: "Continue. If main artifacts exist, finalize." });
  }

  // Final checkpoint
  await hitl("finalize", cwd, "99-finalize", "Review artifacts and commit.");
}
