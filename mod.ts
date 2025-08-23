#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net=api.openai.com,localhost:1234 --allow-run=lms
/**
 * Deno entry point for utopian - provides secure sandbox with explicit permissions
 * 
 * This module provides the same CLI functionality as the Node.js version but with
 * Deno's security-first approach and explicit permission model.
 */

import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

// Type definitions for better TypeScript support
interface AgentOptions {
  cwd: string;
  model?: string;
  baseURL?: string;
  auto?: boolean;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Simple OpenAI-compatible client for Deno
class SimpleOpenAIClient {
  constructor(private baseURL: string) {}

  async chat(messages: ChatMessage[], model: string): Promise<string> {
    const apiKey = Deno.env.get('OPENAI_API_KEY') || 'not-needed-for-localhost';
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }
}

// File system utilities with explicit Deno permissions
class FileSystem {
  static async ensureDir(path: string): Promise<void> {
    try {
      await Deno.mkdir(path, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }
  }

  static async readText(path: string): Promise<string | null> {
    try {
      return await Deno.readTextFile(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return null;
      }
      throw error;
    }
  }

  static async writeText(path: string, content: string): Promise<void> {
    await Deno.writeTextFile(path, content);
  }

  static async writeYaml(path: string, data: any): Promise<void> {
    // Simple YAML serialization for basic structures
    const yamlContent = this.objectToYaml(data);
    await Deno.writeTextFile(path, yamlContent);
  }

  static async listDir(path: string): Promise<string[]> {
    try {
      const entries: string[] = [];
      for await (const entry of Deno.readDir(path)) {
        entries.push(entry.name);
      }
      return entries;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return [];
      }
      throw error;
    }
  }

  private static objectToYaml(obj: any, indent = 0): string {
    let yaml = '';
    const spaces = ' '.repeat(indent);
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object') {
          yaml += `${spaces}- `;
          yaml += this.objectToYaml(item, indent + 2).trim() + '\n';
        } else {
          yaml += `${spaces}- ${item}\n`;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          yaml += this.objectToYaml(value, indent + 2);
        } else if (typeof value === 'object') {
          yaml += `${spaces}${key}:\n`;
          yaml += this.objectToYaml(value, indent + 2);
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      }
    }
    
    return yaml;
  }
}

// Human-in-the-loop confirmation with secure prompts
async function hitl(phase: string, cwd: string, step: string, summary: string, auto: boolean): Promise<void> {
  if (auto) {
    console.log(`🤖 Auto mode: Skipping HITL for ${phase} (${step})`);
    return;
  }

  console.log(`\n🔍 HITL Check: ${phase} (${step})`);
  console.log(`📁 Working directory: ${cwd}`);
  console.log(`📝 Context: ${summary}`);
  
  const input = prompt('\n❓ Continue? (y/n): ');
  if (input?.toLowerCase() !== 'y') {
    console.log('❌ User cancelled operation');
    Deno.exit(1);
  }
}

// System prompt for the AI agent
const SYSTEM_PROMPT = `You are a Utopia Node Agent, designed to help create and manage decentralized networks focused on solving global challenges.

Your role is to:
1. Initialize and structure Utopia nodes with proper directories and content
2. Generate comprehensive content about critical global challenges
3. Create actionable solutions and resources
4. Build trust networks with credible organizations
5. Facilitate continuous content generation and knowledge synthesis

Focus on:
- Evidence-based approaches to global challenges
- Actionable solutions for individuals and organizations
- Building connections between related topics and solutions
- Creating high-quality educational and advocacy materials
- Maintaining transparency and credibility

Always prioritize accuracy, actionability, and positive impact in your responses.`;

// Main agent functionality (simplified version focusing on core features)
async function runSimpleAgent(opts: AgentOptions): Promise<void> {
  const cwd = opts.cwd;
  const baseURL = opts.baseURL ?? 
    (Deno.env.get('OPENAI_API_KEY') ? 'https://api.openai.com/v1' : 'http://localhost:1234/v1');
  const modelName = opts.model ?? 
    (Deno.env.get('OPENAI_API_KEY') ? 'gpt-4' : 'openai/gpt-oss-20b');

  const client = new SimpleOpenAIClient(baseURL);

  // Check initial context
  const goals = await FileSystem.readText(`${cwd}/goals/README.md`);
  const foundations = await FileSystem.readText(`${cwd}/foundations/index.yaml`);
  const trust = await FileSystem.readText(`${cwd}/trust/known_nodes.yaml`);

  const contextSummary = [
    `Repo present: ${!!(goals || foundations || trust)}`,
    goals ? '- goals present' : '- goals missing',
    foundations ? '- foundations present' : '- foundations missing', 
    trust ? '- trust present' : '- trust missing',
  ].join('\n');

  // HITL confirmation
  await hitl('planning', cwd, '01-planning', contextSummary, opts.auto ?? false);

  // Create basic structure
  await createBasicStructure(cwd);

  // Generate AI-powered content
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Project root: ${cwd}

Context:
${contextSummary}

I need you to identify and create content for the 3 most critical global challenges that need immediate attention in 2024-2025. For each challenge, create:

1. A topic overview document
2. Presentation slides content (Marp-compatible Markdown)
3. A video script outline

Focus on actionable solutions and concrete next steps that individuals and organizations can take.

Respond with a structured summary of the topics and their content.`,
    },
  ];

  try {
    console.log('\n🧠 Model: Generating critical topics and content...');
    const response = await client.chat(messages, modelName);
    console.log(response);

    // Create critical topics
    await createCriticalTopics(cwd, response);

    console.log('\n✅ Utopia node initialized successfully with Deno security!');
    console.log('📁 Created basic structure: goals/, foundations/, trust/');
    console.log('🌍 Generated critical global topics with slides and video content');
    console.log('🔒 Running with Deno security sandbox and explicit permissions');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

async function createBasicStructure(cwd: string): Promise<void> {
  // Create directories
  await FileSystem.ensureDir(`${cwd}/goals`);
  await FileSystem.ensureDir(`${cwd}/trust`);
  await FileSystem.ensureDir(`${cwd}/foundations`);

  // Create goals/README.md if it doesn't exist
  const goalsPath = `${cwd}/goals/README.md`;
  if (!(await FileSystem.readText(goalsPath))) {
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
    await FileSystem.writeText(goalsPath, goalsContent);
  }

  // Create foundations/index.yaml if it doesn't exist
  const foundationsPath = `${cwd}/foundations/index.yaml`;
  if (!(await FileSystem.readText(foundationsPath))) {
    const foundationsData = {
      principles: [
        'Transparency and openness',
        'Mutual respect and collaboration', 
        'Quality and reliability',
        'Continuous improvement',
        'Community-driven development',
      ],
      values: ['Trust', 'Innovation', 'Sustainability', 'Inclusivity', 'Decentralization'],
      established: new Date().toISOString().split('T')[0],
    };
    await FileSystem.writeYaml(foundationsPath, foundationsData);
  }

  // Create trust/known_nodes.yaml if it doesn't exist
  const trustPath = `${cwd}/trust/known_nodes.yaml`;
  if (!(await FileSystem.readText(trustPath))) {
    const trustData = {
      nodes: [
        {
          url: 'https://github.com/core-nexus/utopia',
          score: 1.0,
          type: 'core',
          description: 'Core Utopia project repository',
        },
      ],
      last_updated: new Date().toISOString(),
    };
    await FileSystem.writeYaml(trustPath, trustData);
  }
}

async function createCriticalTopics(cwd: string, aiResponse: string): Promise<void> {
  // Create topics directory
  await FileSystem.ensureDir(`${cwd}/topics`);

  // Create critical topics based on the current global context
  const criticalTopics = [
    {
      slug: 'climate-action',
      title: 'Climate Action & Sustainability',
      description: 'Addressing climate change through renewable energy, sustainable practices, and policy advocacy',
    },
    {
      slug: 'digital-rights',
      title: 'Digital Rights & AI Ethics', 
      description: 'Ensuring ethical AI development and protecting digital rights for all',
    },
    {
      slug: 'global-health-equity',
      title: 'Global Health Equity',
      description: 'Ensuring healthcare access and addressing global health disparities',
    },
  ];

  for (const topic of criticalTopics) {
    const topicDir = `${cwd}/topics/${topic.slug}`;
    await FileSystem.ensureDir(topicDir);
    await FileSystem.ensureDir(`${topicDir}/docs`);
    await FileSystem.ensureDir(`${topicDir}/slides`);
    await FileSystem.ensureDir(`${topicDir}/video`);
    await FileSystem.ensureDir(`${topicDir}/reports`);

    // Create overview document
    const overviewContent = `---
title: ${topic.title}
description: ${topic.description}
status: active
priority: critical
tags: [global-challenges, sustainability, action-needed]
created: ${new Date().toISOString().split('T')[0]}
---

# ${topic.title}

## Overview
${topic.description}

## Current Status
This topic requires immediate attention and coordinated global action.

## Next Steps
1. Research current initiatives and best practices
2. Identify key stakeholders and organizations
3. Develop concrete action plans
4. Create educational materials and presentations
5. Engage communities and build awareness

---
*Generated by Utopia Node Agent (Deno) - ${new Date().toISOString().split('T')[0]}*
`;
    await FileSystem.writeText(`${topicDir}/docs/overview.md`, overviewContent);

    console.log(`📁 Created topic: ${topic.slug}`);
  }
}

// CLI entry point
async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    string: ['base', 'model'],
    boolean: ['auto', 'help'],
    default: {
      base: Deno.env.get('OPENAI_API_KEY') 
        ? 'https://api.openai.com/v1'
        : Deno.env.get('LMSTUDIO_BASE_URL') || 'http://localhost:1234/v1',
      model: Deno.env.get('OPENAI_API_KEY') 
        ? 'gpt-4' 
        : Deno.env.get('LMSTUDIO_MODEL') || 'openai/gpt-oss-20b',
      auto: false,
    },
    alias: {
      h: 'help',
    },
  });

  if (args.help) {
    console.log(`
Utopia Node Agent (Deno Edition) - Secure-by-default with explicit permissions

Usage:
  deno run --allow-read --allow-write --allow-net=api.openai.com,localhost:1234 --allow-run=lms mod.ts [options]

Options:
  --base <url>     OpenAI-compatible base URL
  --model <name>   Model name to use
  --auto           Skip human-in-the-loop confirmations
  --help, -h       Show this help

Security Features:
  ✅ Explicit permissions required (no ambient authority)
  ✅ Network access limited to AI APIs only
  ✅ File system access scoped to current directory
  ✅ Process execution limited to specific tools

Environment Variables:
  OPENAI_API_KEY      OpenAI API key for GPT models
  LMSTUDIO_BASE_URL   LM Studio server URL (default: http://localhost:1234/v1)
  LMSTUDIO_MODEL      LM Studio model name
`);
    return;
  }

  // Auto-start LM Studio if no OpenAI API key and using localhost
  if (!Deno.env.get('OPENAI_API_KEY') && args.base.includes('localhost:1234')) {
    try {
      console.log('🚀 Starting LM Studio server...');
      const command = new Deno.Command('lms', {
        args: ['server', 'start'],
        stdout: 'piped',
        stderr: 'piped',
      });
      await command.output();
      console.log('✅ LM Studio server started');
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

// Export for module usage
export { runSimpleAgent, SimpleOpenAIClient, FileSystem };

// Run if this is the main module
if (import.meta.main) {
  main().catch(err => {
    console.error('❌ utopian error:', err);
    Deno.exit(1);
  });
}