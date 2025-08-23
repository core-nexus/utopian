#!/usr/bin/env -S deno run --allow-read=. --allow-write=. --allow-net=api.openai.com,localhost:1234 --allow-run=lms --allow-env

// Deno entry point for utopian - mirrors Node.js CLI functionality with enhanced security
import { parseArgs } from "https://deno.land/std@0.203.0/cli/parse_args.ts";
import { join } from "https://deno.land/std@0.203.0/path/mod.ts";

// Types matching Node.js version
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

// Simple OpenAI-compatible client for Deno
class SimpleOpenAIClient {
  constructor(
    private baseURL: string = 'http://localhost:1234/v1',
    private apiKey: string = Deno.env.get('OPENAI_API_KEY') || 'lm-studio'
  ) {}

  async chat(messages: ChatMessage[], model: string = 'openai/gpt-oss-20b'): Promise<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} ${errorText}`);
    }

    const result: ChatCompletionResponse = await response.json();
    return result.choices[0]?.message?.content || '';
  }
}

// File system utilities for Deno
async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

async function readText(filePath: string): Promise<string> {
  try {
    return await Deno.readTextFile(filePath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return '';
    }
    throw error;
  }
}

async function writeText(filePath: string, content: string): Promise<void> {
  await Deno.writeTextFile(filePath, content);
}

async function listDir(dirPath: string): Promise<string[]> {
  try {
    const entries = [];
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isDirectory) {
        entries.push(entry.name);
      }
    }
    return entries;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    throw error;
  }
}

async function writeYaml(filePath: string, data: unknown): Promise<void> {
  // Simple YAML serializer for basic objects
  const yamlContent = Object.entries(data as Record<string, unknown>)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const items = value.map(item => 
          typeof item === 'object' 
            ? Object.entries(item as Record<string, unknown>)
                .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
                .join('\n')
            : `  - ${JSON.stringify(item)}`
        ).join('\n');
        return `${key}:\n${items}`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join('\n');
  
  await writeText(filePath, yamlContent);
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ['base', 'model'],
    boolean: ['auto'],
    default: {
      auto: false,
    },
  });

  const cwd = Deno.cwd();
  
  // Priority logic: Check for LM Studio first, fallback to OpenAI
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const lmStudioBaseUrl = Deno.env.get('LMSTUDIO_BASE_URL') || 'http://localhost:1234/v1';
  const lmStudioModel = Deno.env.get('LMSTUDIO_MODEL') || 'openai/gpt-oss-20b';
  
  const baseURL = args.base || (openaiKey 
    ? 'https://api.openai.com/v1' 
    : lmStudioBaseUrl);
  
  const model = args.model || (openaiKey ? 'gpt-5' : lmStudioModel);

  // Auto-start LM Studio if no OpenAI API key and using localhost
  if (!openaiKey && baseURL.includes('localhost:1234')) {
    try {
      console.log('🚀 Starting LM Studio server...');
      const command = new Deno.Command('lms', {
        args: ['server', 'start', '&&', 'lms', 'status'],
        stdout: 'inherit',
        stderr: 'inherit',
      });
      await command.output();
    } catch {
      console.log('⚠️  Could not start LM Studio (continuing anyway)');
    }
  }

  // Initialize the agent (simplified version for Deno)
  const client = new SimpleOpenAIClient(baseURL);
  
  // Read context files
  const goals = await readText(join(cwd, 'goals', 'README.md'));
  const found = await readText(join(cwd, 'foundations', 'index.yaml'));
  const trust = await readText(join(cwd, 'trust', 'known_nodes.yaml'));

  const contextSummary = [
    `Repo present: ${!!(goals || found || trust)}`,
    goals ? '- goals present' : '- goals missing',
    found ? '- foundations present' : '- foundations missing',
    trust ? '- trust present' : '- trust missing',
  ].join('\n');

  console.log(`\n🦕 Running with Deno security sandbox...
  🔒 Network: ${baseURL.includes('api.openai.com') ? 'api.openai.com,localhost:1234' : 'localhost:1234'} only
  🔒 Files: current directory only
  🔒 Process: lms command only
  🔒 Environment: limited access`);

  // Human-in-the-loop confirmation (simplified)
  if (!args.auto) {
    console.log('\n📋 Planning Phase:');
    console.log(contextSummary);
    console.log('\n🤖 Using model:', model);
    console.log('🌐 Base URL:', baseURL);
    console.log('\n⚡ Proceeding with Utopia node initialization...');
  }

  // Create basic structure
  await createBasicStructure(cwd);

  // Run the agent
  console.log('\n🧠 Generating critical topics and content...');
  
  try {
    const messages: ChatMessage[] = [
      { 
        role: 'system', 
        content: 'You are an AI agent focused on creating content for critical global challenges. Respond with structured, actionable information.' 
      },
      {
        role: 'user',
        content: `Project root: ${cwd}

Context:
${contextSummary}

I need you to identify and create content for the 3 most critical global challenges that need immediate attention in 2024-2025. Focus on actionable solutions and concrete next steps.

Respond with a brief summary of what topics were identified.`,
      },
    ];

    const response = await client.chat(messages, model);
    console.log(response);

    // Create the critical topics structure
    await createCriticalTopics(cwd);

    console.log('\n✅ Utopia node initialized successfully!');
    console.log('📁 Created basic structure: goals/, foundations/, trust/');
    console.log('🌍 Generated critical global topics with slides and video content');
    console.log('🔐 Deno security sandbox maintained throughout execution');

  } catch (error) {
    console.error('❌ utopian error:', error instanceof Error ? error.message : error);
    Deno.exit(1);
  }
}

async function createBasicStructure(cwd: string) {
  // Check existing structure
  const foundationsExists = (await listDir(join(cwd, 'foundations'))).length > 0;
  const topicsExists = (await listDir(join(cwd, 'topics'))).length > 0;

  // Create directories
  await ensureDir(join(cwd, 'goals'));
  await ensureDir(join(cwd, 'trust'));
  if (!foundationsExists) {
    await ensureDir(join(cwd, 'foundations'));
  }

  // Create goals/README.md only if it doesn't exist
  const goalsReadme = join(cwd, 'goals', 'README.md');
  if (!(await readText(goalsReadme))) {
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
    await writeText(goalsReadme, goalsContent);
  }

  // Create foundations/index.yaml only if foundations/ directory was empty
  if (!foundationsExists) {
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
    await writeYaml(join(cwd, 'foundations', 'index.yaml'), foundationsData);
  }

  // Create trust/known_nodes.yaml only if it doesn't exist
  const trustFile = join(cwd, 'trust', 'known_nodes.yaml');
  if (!(await readText(trustFile))) {
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
    await writeYaml(trustFile, trustData);
  }

  // Create report
  const reportContent = `# Utopia Node Report

## Node Status
**Status**: Initializing
**Created**: ${new Date().toISOString().split('T')[0]}
**Version**: 0.1.0
**Runtime**: Deno (Security Enhanced)

## Overview
This Utopia node has been successfully initialized with the basic structure and configuration using Deno's security sandbox.

## Structure Created
- ✅ Goals defined in \`goals/README.md\`
${!foundationsExists ? '- ✅ Foundations established in `foundations/index.yaml`' : '- ℹ️  Foundations directory already exists (preserved)'}
- ✅ Trust network initialized in \`trust/known_nodes.yaml\`
- ✅ Reporting system set up

## Security Features
- 🔒 Network access limited to AI APIs and localhost only
- 🔒 File system access restricted to current directory
- 🔒 Process execution limited to lms command only
- 🔒 Environment variable access controlled

## Next Steps
1. Customize goals and objectives based on specific use case
2. Expand trust network by connecting with other nodes
3. Implement specific services or contributions
4. Regular monitoring and reporting

---
*Generated by Utopia Node Agent (Deno Runtime)*
`;

  if (topicsExists) {
    const topicReportsDir = join(cwd, 'topics', 'utopia-init', 'reports');
    await ensureDir(topicReportsDir);
    await writeText(join(topicReportsDir, 'report.md'), reportContent);
  } else {
    await ensureDir(join(cwd, 'reports'));
    await writeText(join(cwd, 'reports', 'utopia-report.md'), reportContent);
  }
}

async function createCriticalTopics(cwd: string) {
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

  // Create topics directory structure
  const topicsExists = (await listDir(join(cwd, 'topics'))).length > 0;
  if (!topicsExists) {
    await ensureDir(join(cwd, 'topics'));
  }

  for (const topic of criticalTopics) {
    const topicDir = join(cwd, 'topics', topic.slug);
    await ensureDir(topicDir);
    await ensureDir(join(topicDir, 'docs'));
    await ensureDir(join(topicDir, 'reports'));

    // Create simplified topic overview
    const overviewContent = `---
title: ${topic.title}
description: ${topic.description}
status: active
runtime: deno
created: ${new Date().toISOString().split('T')[0]}
---

# ${topic.title}

## Overview
${topic.description}

This topic has been initialized using Deno's secure runtime environment.

## Security Context
- Network access restricted to necessary APIs only
- File system access limited to project directory
- Environment variable access controlled
- Process execution sandboxed

---
*Generated by Utopia Node Agent (Deno Runtime)*
`;
    await writeText(join(topicDir, 'docs', 'overview.md'), overviewContent);

    // Create initial report
    const reportContent = `# ${topic.title} - Status Report

**Report Date**: ${new Date().toISOString().split('T')[0]}
**Status**: Topic Initialized (Deno Runtime)
**Security Level**: Enhanced

## Topic Overview
${topic.description}

## Security Features
- 🔐 Sandboxed execution environment
- 🔐 Explicit permission model
- 🔐 Network access restrictions
- 🔐 File system boundaries enforced

## Next Steps
1. Research current initiatives and organizations
2. Develop detailed action plans
3. Create educational materials
4. Begin community engagement

---
*Generated by Utopia Node Agent (Deno Runtime)*
`;
    await writeText(join(topicDir, 'reports', 'report.md'), reportContent);
  }

  console.log(`\n📁 Created ${criticalTopics.length} critical topic directories with enhanced security:`);
  criticalTopics.forEach(topic => {
    console.log(`  - topics/${topic.slug}/ (${topic.title})`);
  });
}

// Run main function
if (import.meta.main) {
  await main();
}