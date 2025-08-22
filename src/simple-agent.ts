import path from "node:path";
import { SimpleOpenAIClient, type ChatMessage } from './openai-client.js';
import {
  ensureDir, readText, writeText, listDir, writeYaml
} from "./tools/fsTools.js";
import { SYSTEM_PROMPT } from "./prompts/system.js";
import { hitl } from "./hitl.js";

export type AgentOptions = {
  cwd: string;
  model?: string;
  baseURL?: string;
  auto?: boolean;
};

export async function runSimpleAgent(opts: AgentOptions) {
  const cwd = opts.cwd;
  const baseURL = opts.baseURL ?? (process.env.OPENAI_API_KEY ? "https://api.openai.com/v1" : "http://localhost:1234/v1");
  const modelName = opts.model ?? (process.env.OPENAI_API_KEY ? "gpt-5" : "openai/gpt-oss-20b");

  const client = new SimpleOpenAIClient(baseURL);

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

  // Simple conversation with the AI
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Project root: ${cwd}

Context:
${contextSummary}

Please create a plan to set up this Utopia node with the following structure:
1. Create basic goals/README.md with project purpose
2. Create foundations/index.yaml with core principles
3. Create trust/known_nodes.yaml with initial trusted nodes
4. Create a simple report in reports/utopia-report.md

Please provide the plan and I'll execute it.`
    }
  ];

  try {
    console.log("\n🧠 Model: Generating plan...");
    const response = await client.chat(messages, modelName);
    console.log(response);

    // Create the basic structure based on the plan
    await createBasicStructure(cwd);

    console.log("\n✅ Basic Utopia node structure created!");
    console.log("📁 Created directories: goals/, foundations/, trust/, reports/");
    console.log("📝 Created initial files with sensible defaults");

  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    throw error;
  }
}

async function createBasicStructure(cwd: string) {
  // Create directories
  await ensureDir(path.join(cwd, "goals"));
  await ensureDir(path.join(cwd, "foundations"));
  await ensureDir(path.join(cwd, "trust"));
  await ensureDir(path.join(cwd, "reports"));

  // Create goals/README.md
  const goalsContent = `# Utopia Node Goals

## Purpose
This node aims to contribute to the Utopia ecosystem by providing valuable services and fostering meaningful connections.

## Objectives
- [ ] Establish trusted relationships with other nodes
- [ ] Contribute useful resources to the network
- [ ] Maintain high standards of operation and transparency
- [ ] Support the growth and development of the Utopia ecosystem

## Vision
A decentralized, collaborative network where nodes work together to create positive impact and shared value.
`;
  await writeText(path.join(cwd, "goals", "README.md"), goalsContent);

  // Create foundations/index.yaml
  const foundationsData = {
    principles: [
      "Transparency and openness",
      "Mutual respect and collaboration",
      "Quality and reliability",
      "Continuous improvement",
      "Community-driven development"
    ],
    values: [
      "Trust",
      "Innovation",
      "Sustainability",
      "Inclusivity",
      "Decentralization"
    ],
    established: new Date().toISOString().split('T')[0]
  };
  await writeYaml(path.join(cwd, "foundations", "index.yaml"), foundationsData);

  // Create trust/known_nodes.yaml
  const trustData = {
    nodes: [
      {
        url: "https://github.com/core-nexus/utopia",
        score: 1.0,
        type: "core",
        description: "Core Utopia project repository"
      }
    ],
    last_updated: new Date().toISOString()
  };
  await writeYaml(path.join(cwd, "trust", "known_nodes.yaml"), trustData);

  // Create reports/utopia-report.md
  const reportContent = `# Utopia Node Report

## Node Status
**Status**: Initializing
**Created**: ${new Date().toISOString().split('T')[0]}
**Version**: 0.1.0

## Overview
This Utopia node has been successfully initialized with the basic structure and configuration.

## Structure Created
- ✅ Goals defined in \`goals/README.md\`
- ✅ Foundations established in \`foundations/index.yaml\`
- ✅ Trust network initialized in \`trust/known_nodes.yaml\`
- ✅ Reporting system set up

## Next Steps
1. Customize goals and objectives based on specific use case
2. Expand trust network by connecting with other nodes
3. Implement specific services or contributions
4. Regular monitoring and reporting

---
*Generated by Utopia Node Agent*
`;
  await writeText(path.join(cwd, "reports", "utopia-report.md"), reportContent);
}
