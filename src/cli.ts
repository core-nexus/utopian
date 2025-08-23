#!/usr/bin/env node
import { Command } from "commander";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { runSimpleAgent } from "./simple-agent.js";

const execAsync = promisify(exec);

const program = new Command()
  .name("e-utopia")
  .description("Utopia Node agent (local-first)")
  .option("--base <url>", "OpenAI-compatible base URL (default: https://api.openai.com/v1 if OPENAI_API_KEY set, else http://localhost:1234/v1)",
    process.env.OPENAI_API_KEY ? "https://api.openai.com/v1" : (process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1"))
  .option("--model <name>", "model name",
    process.env.OPENAI_API_KEY ? "gpt-5" : (process.env.LMSTUDIO_MODEL || "openai/gpt-oss-20b"))
  .option("--auto", "skip HITL gates", false)
  .parse(process.argv);

const opts = program.opts();

async function main() {
  // Auto-start LM Studio if no OpenAI API key and using localhost
  if (!process.env.OPENAI_API_KEY && opts.base.includes("localhost:1234")) {
    try {
      console.log("🚀 Starting LM Studio server...");
      await execAsync("lms server start && lms status");
    } catch (error) {
      console.log("⚠️  Could not start LM Studio (continuing anyway)");
    }
  }

  await runSimpleAgent({
    cwd: process.cwd(),
    baseURL: opts.base,
    model: opts.model,
    auto: !!opts.auto
  });
}

main().catch(err => {
  console.error("❌ e-utopia error:", err);
  process.exit(1);
});
