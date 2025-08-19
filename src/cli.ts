#!/usr/bin/env node
import { Command } from "commander";
import { runSimpleAgent } from "./simple-agent.js";

const program = new Command()
  .name("utopian")
  .description("Utopia Node agent (local-first)")
  .option("--base <url>", "OpenAI-compatible base URL", process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1")
  .option("--model <name>", "model name", process.env.LMSTUDIO_MODEL || "openai/gpt-oss-20b")
  .option("--auto", "skip HITL gates", false)
  .parse(process.argv);

const opts = program.opts();

runSimpleAgent({
  cwd: process.cwd(),
  baseURL: opts.base,
  model: opts.model,
  auto: !!opts.auto
}).catch(err => {
  console.error("❌ utopian error:", err);
  process.exit(1);
});
