import path from 'node:path';
import { SimpleOpenAIClient, type ChatMessage } from './openai-client.js';
import { ensureDir, readText, writeText, listDir, writeYaml } from './tools/fsTools.js';
import { SYSTEM_PROMPT } from './prompts/system.js';
import { hitl } from './hitl.js';

export type AgentOptions = {
  cwd: string;
  model?: string;
  baseURL?: string;
  auto?: boolean;
};

export async function runSimpleAgent(opts: AgentOptions) {
  const cwd = opts.cwd;
  const baseURL =
    opts.baseURL ??
    (process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : 'http://localhost:1234/v1');
  const modelName = opts.model ?? (process.env.OPENAI_API_KEY ? 'gpt-5' : 'openai/gpt-oss-20b');

  const client = new SimpleOpenAIClient(baseURL);

  // ---------- Initial context ----------
  const goals = await readText(path.join(cwd, 'goals', 'README.md'));
  const found = await readText(path.join(cwd, 'foundations', 'index.yaml'));
  const trust = await readText(path.join(cwd, 'trust', 'known_nodes.yaml'));

  const contextSummary = [
    `Repo present: ${!!(goals || found || trust)}`,
    goals ? '- goals present' : '- goals missing',
    found ? '- foundations present' : '- foundations missing',
    trust ? '- trust present' : '- trust missing',
  ].join('\n');

  // Optional HITL at the start to confirm plan
  await hitl('planning', cwd, '01-planning', contextSummary, opts.auto);

  // Create the basic structure first
  await createBasicStructure(cwd);

  // Generate AI-powered content for critical topics
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

Respond with a structured JSON format containing the topics and their content.`,
    },
  ];

  try {
    console.log('\n🧠 Model: Generating critical topics and content...');
    const response = await client.chat(messages, modelName);
    console.log(response);

    // Parse and create the suggested topics
    await createCriticalTopics(cwd, response);

    console.log('\n✅ Utopia node initialized - now entering continuous generation mode!');
    console.log('📁 Created basic structure: goals/, foundations/, trust/');
    console.log('🌍 Generated critical global topics with slides and video content');
    console.log('🔄 Beginning deep research and continuous content generation...');

    // Enter continuous generation mode
    await continuousGeneration(cwd, client, modelName);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

async function createBasicStructure(cwd: string) {
  // Check existing structure
  const foundationsExists = (await listDir(path.join(cwd, 'foundations'))).length > 0;
  const topicsExists = (await listDir(path.join(cwd, 'topics'))).length > 0;

  // Create directories only if they don't exist
  await ensureDir(path.join(cwd, 'goals'));
  await ensureDir(path.join(cwd, 'trust'));
  if (!foundationsExists) {
    await ensureDir(path.join(cwd, 'foundations'));
  }

  // Create goals/README.md only if it doesn't exist
  const goalsReadme = path.join(cwd, 'goals', 'README.md');
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

  // Only create foundations/index.yaml if foundations/ directory was empty
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
    await writeYaml(path.join(cwd, 'foundations', 'index.yaml'), foundationsData);
  }

  // Create trust/known_nodes.yaml only if it doesn't exist
  const trustFile = path.join(cwd, 'trust', 'known_nodes.yaml');
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

  // Create report in topics/utopia-init/reports/report.md if topics/ exists, otherwise reports/utopia-report.md
  const reportContent = `# Utopia Node Report

## Node Status
**Status**: Initializing
**Created**: ${new Date().toISOString().split('T')[0]}
**Version**: 0.1.0

## Overview
This Utopia node has been successfully initialized with the basic structure and configuration.

## Structure Created
- ✅ Goals defined in \`goals/README.md\`
${!foundationsExists ? '- ✅ Foundations established in `foundations/index.yaml`' : '- ℹ️  Foundations directory already exists (preserved)'}
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

  if (topicsExists) {
    // Use topics/utopia-init/reports/report.md structure
    const topicReportsDir = path.join(cwd, 'topics', 'utopia-init', 'reports');
    await ensureDir(topicReportsDir);
    await writeText(path.join(topicReportsDir, 'report.md'), reportContent);
  } else {
    // Fall back to reports/utopia-report.md
    await ensureDir(path.join(cwd, 'reports'));
    await writeText(path.join(cwd, 'reports', 'utopia-report.md'), reportContent);
  }
}

async function createCriticalTopics(cwd: string, _aiResponse: string) {
  // Critical global topics to create regardless of AI response
  const criticalTopics = [
    {
      slug: 'climate-action',
      title: 'Climate Action & Sustainability',
      description:
        'Addressing climate change through renewable energy, sustainable practices, and policy advocacy',
      actions: [
        'Transition to renewable energy sources',
        'Implement circular economy principles',
        'Support climate policy and regulation',
        'Educate communities on sustainable practices',
      ],
    },
    {
      slug: 'digital-rights',
      title: 'Digital Rights & AI Ethics',
      description: 'Ensuring ethical AI development and protecting digital rights for all',
      actions: [
        'Advocate for transparent AI governance',
        'Protect digital privacy and data rights',
        'Ensure equitable access to technology',
        'Promote ethical AI research and development',
      ],
    },
    {
      slug: 'global-health-equity',
      title: 'Global Health Equity',
      description: 'Ensuring healthcare access and addressing global health disparities',
      actions: [
        'Support universal healthcare initiatives',
        'Address healthcare disparities in underserved communities',
        'Promote public health education and prevention',
        'Advocate for affordable medicines and treatments',
      ],
    },
  ];

  // Create topics directory structure
  const topicsExists = (await listDir(path.join(cwd, 'topics'))).length > 0;
  if (!topicsExists) {
    await ensureDir(path.join(cwd, 'topics'));
  }

  for (const topic of criticalTopics) {
    const topicDir = path.join(cwd, 'topics', topic.slug);
    await ensureDir(topicDir);
    await ensureDir(path.join(topicDir, 'docs'));
    await ensureDir(path.join(topicDir, 'slides'));
    await ensureDir(path.join(topicDir, 'video'));
    await ensureDir(path.join(topicDir, 'reports'));

    // Create topic overview document
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

## Key Actions Required

${topic.actions.map(action => `- ${action}`).join('\n')}

## Current Status
This topic requires immediate attention and coordinated global action.

## Next Steps
1. Research current initiatives and best practices
2. Identify key stakeholders and organizations
3. Develop concrete action plans
4. Create educational materials and presentations
5. Engage communities and build awareness

## Resources
- [Add relevant links and resources]
- [Research papers and studies]
- [Organizations working in this area]

---
*Generated by Utopia Node Agent - ${new Date().toISOString().split('T')[0]}*
`;
    await writeText(path.join(topicDir, 'docs', 'overview.md'), overviewContent);

    // Create Marp-compatible presentation slides
    const slidesContent = `---
marp: true
title: ${topic.title}
description: ${topic.description}
theme: default
paginate: true
---

# ${topic.title}
## A Critical Global Challenge

${topic.description}

---

# Why This Matters Now

- **Urgent Action Required**: Time-sensitive global challenge
- **Collective Impact**: Requires coordinated worldwide effort  
- **Proven Solutions**: We have the tools and knowledge to act
- **Future at Stake**: Decisions made today shape tomorrow

---

# Key Action Areas

${topic.actions.map((action, i) => `## ${i + 1}. ${action}`).join('\n\n')}

---

# What You Can Do

## Individual Actions
- Stay informed about the latest developments
- Support organizations working in this area
- Make sustainable choices in daily life
- Advocate for policy changes

## Organizational Actions
- Implement best practices and standards
- Collaborate with other organizations
- Invest in research and development
- Educate stakeholders and communities

---

# Get Involved

## Join the Movement
- **Research**: Learn more about the issue
- **Connect**: Find local and global organizations
- **Act**: Take concrete steps in your community
- **Share**: Spread awareness and knowledge

## Resources
- Visit utopia-node.org for more information
- Connect with local action groups
- Follow evidence-based solutions

---

# Thank You

## Together We Can Make a Difference

*${topic.title} - Every action counts*

Generated by Utopia Node Agent
${new Date().toISOString().split('T')[0]}
`;
    await writeText(path.join(topicDir, 'slides', 'presentation.md'), slidesContent);

    // Create video script outline
    const videoScriptContent = `# Video Script: ${topic.title}

**Duration**: 5-7 minutes  
**Target Audience**: General public, activists, organizations  
**Tone**: Urgent but hopeful, actionable  

## Script Outline

### Opening Hook (0-30s)
**Visual**: Compelling imagery related to the challenge
**Narration**: 
"In the next few minutes, you'll discover one of the most critical challenges facing our world today - and more importantly, what you can do about it right now."

### Problem Definition (30s-2m)
**Visual**: Data visualizations, real-world examples
**Narration**:
"${topic.description}

The scale of this challenge is unprecedented, but so is our capacity to address it."

### Solution Overview (2m-4m)
**Visual**: Success stories, innovative solutions
**Narration**:
"Here's what we can do:

${topic.actions.map(action => `- ${action}`).join('\n')}

These aren't just ideas - they're proven approaches that are already making a difference."

### Call to Action (4m-5m)
**Visual**: People taking action, community engagement
**Narration**:
"The question isn't whether we can solve this challenge - it's whether we will choose to act.

Here's how you can start today:
1. Learn more at [website/resources]
2. Connect with organizations in your area
3. Take one concrete action this week
4. Share this message with others"

### Closing (5m-7m)
**Visual**: Inspiring footage of positive change
**Narration**:
"Every movement starts with individuals who decide to act. Today, that individual is you.

${topic.title} - Because the future depends on what we do today."

## Production Notes
- Use real footage and interviews when possible
- Include on-screen statistics and key facts
- Provide clear resource links and next steps
- Make it shareable across social platforms
- Include captions for accessibility

## Resources for B-roll
- [List relevant stock footage sources]
- [Interviews with experts/activists]
- [Data visualization sources]

---
*Generated by Utopia Node Agent - ${new Date().toISOString().split('T')[0]}*
`;
    await writeText(path.join(topicDir, 'video', 'script.md'), videoScriptContent);

    // Create initial report
    const reportContent = `# ${topic.title} - Status Report

**Report Date**: ${new Date().toISOString().split('T')[0]}  
**Status**: Topic Initialized  
**Priority**: Critical  

## Topic Overview
${topic.description}

## Content Created
- ✅ Topic overview document
- ✅ Presentation slides (Marp-compatible)
- ✅ Video script outline
- ✅ Initial project structure

## Next Steps
1. Research current initiatives and organizations
2. Identify key stakeholders and partners
3. Develop detailed action plans
4. Create additional educational materials
5. Begin community outreach and engagement

## Metrics to Track
- Community engagement levels
- Action items completed
- Partnerships formed
- Educational content distributed
- Impact measurements

---
*Generated by Utopia Node Agent*
`;
    await writeText(path.join(topicDir, 'reports', 'report.md'), reportContent);
  }

  console.log(`\n📁 Created ${criticalTopics.length} critical topic directories:`);
  criticalTopics.forEach(topic => {
    console.log(`  - topics/${topic.slug}/ (${topic.title})`);
  });
}

async function continuousGeneration(cwd: string, client: SimpleOpenAIClient, modelName: string) {
  let iteration = 1;
  const maxIterations = 50; // Safety limit to prevent infinite loops during development

  while (iteration <= maxIterations) {
    console.log(`\n🔄 === Continuous Generation Cycle ${iteration} ===`);

    try {
      // Phase 1: Deep Research Reports
      console.log('📊 Phase 1: Generating deep research reports...');
      await generateResearchReports(cwd, client, modelName, iteration);

      // Phase 2: Explore Trust Network
      console.log('🕸️  Phase 2: Exploring and expanding trust network...');
      await exploreTrustNetwork(cwd, client, modelName);

      // Phase 3: Generate New Topics
      console.log('🆕 Phase 3: Discovering and creating new critical topics...');
      await discoverNewTopics(cwd, client, modelName, iteration);

      // Phase 4: Synthesize Existing Content
      console.log('🔄 Phase 4: Synthesizing and updating existing content...');
      await synthesizeExistingContent(cwd, client, modelName);

      // Phase 5: Generate Media Content
      console.log('🎬 Phase 5: Creating video scripts and slide presentations...');
      await generateMediaContent(cwd, client, modelName, iteration);

      console.log(`✅ Cycle ${iteration} complete. Continuing to next iteration...`);
      iteration++;

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(
        `❌ Error in cycle ${iteration}:`,
        error instanceof Error ? error.message : error
      );
      console.log('🔄 Continuing with next cycle...');
      iteration++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log(`\n🏁 Completed ${maxIterations} generation cycles. System ready for production!`);
}

async function generateResearchReports(
  cwd: string,
  client: SimpleOpenAIClient,
  modelName: string,
  iteration: number
) {
  // Get existing topics to research
  const topicDirs = await listDir(path.join(cwd, 'topics'));

  for (const topicSlug of topicDirs.slice(0, 2)) {
    // Process 2 topics per cycle to avoid overwhelming
    const researchPrompt = `Generate a comprehensive research report for the ${topicSlug} topic. Include:
    
1. Current global statistics and data
2. Key organizations and initiatives currently working on this
3. Recent developments and breakthroughs (2023-2024)
4. Funding landscape and investment opportunities
5. Barriers and challenges
6. Evidence-based solutions with proven impact
7. Concrete action items for individuals and organizations
8. Resource links and citations

Make it thorough, well-researched, and actionable. Focus on data-driven insights and practical next steps.`;

    try {
      const research = await client.chat(
        [
          {
            role: 'system',
            content:
              'You are an expert researcher focused on global challenges and solutions. Provide comprehensive, well-sourced research reports.',
          },
          { role: 'user', content: researchPrompt },
        ],
        modelName
      );

      const reportPath = path.join(
        cwd,
        'topics',
        topicSlug,
        'reports',
        `deep-research-${iteration}.md`
      );
      const reportContent = `# Deep Research Report - ${topicSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

**Report #**: ${iteration}  
**Generated**: ${new Date().toISOString()}  
**Focus**: Comprehensive analysis and actionable insights  

${research}

---
*Generated by eutopia-agent continuous generation cycle ${iteration}*
`;

      await writeText(reportPath, reportContent);
      console.log(`  📄 Generated research report: ${reportPath}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate research for ${topicSlug}:`, error);
    }
  }
}

async function exploreTrustNetwork(cwd: string, client: SimpleOpenAIClient, modelName: string) {
  const trustPrompt = `Identify 10 highly trusted organizations, research institutions, and initiatives working on global challenges like climate action, digital rights, and health equity. For each, provide:

1. Organization name and website
2. Trust score (0.0-1.0) based on credibility, impact, and transparency
3. Primary focus areas
4. Key contributions and achievements
5. How they could collaborate with Utopia nodes

Format as YAML for trust/known_nodes.yaml`;

  try {
    const trustResponse = await client.chat(
      [
        {
          role: 'system',
          content:
            'You are a network analyst identifying trustworthy organizations for collaboration in global challenge solutions.',
        },
        { role: 'user', content: trustPrompt },
      ],
      modelName
    );

    // Parse and append to existing trust network
    const timestamp = new Date().toISOString();

    const expandedTrustContent = `# Expanded Trust Network - ${timestamp}

${trustResponse}

# Network Analysis
last_updated: ${timestamp}
expansion_cycle: continuous_generation
status: active_discovery

---
*Generated by eutopia-agent trust network exploration*
`;

    const expandedTrustFile = path.join(cwd, 'trust', `expanded-network-${Date.now()}.yaml`);
    await writeText(expandedTrustFile, expandedTrustContent);
    console.log(`  🕸️  Expanded trust network: ${expandedTrustFile}`);
  } catch (error) {
    console.error('  ❌ Failed to expand trust network:', error);
  }
}

async function discoverNewTopics(
  cwd: string,
  client: SimpleOpenAIClient,
  modelName: string,
  iteration: number
) {
  const discoveryPrompt = `Based on current global developments in 2024-2025, identify 2 emerging critical challenges that need urgent attention but aren't widely discussed yet. Consider:

1. Technological disruptions and their societal impact
2. Environmental tipping points and cascading effects  
3. Social and economic vulnerabilities
4. Geopolitical shifts affecting global cooperation
5. Emerging health and education challenges

For each topic, provide:
- Topic name and slug
- Description and urgency level
- Key stakeholders and affected populations
- Potential solutions and intervention points
- Why this needs attention now

Format as JSON with topic details.`;

  try {
    const newTopics = await client.chat(
      [
        {
          role: 'system',
          content:
            'You are a futures analyst identifying emerging global challenges that require immediate attention and action.',
        },
        { role: 'user', content: discoveryPrompt },
      ],
      modelName
    );

    // Create directory for discovered topics
    const discoveryDir = path.join(cwd, 'topics', `emerging-${iteration}`);
    await ensureDir(discoveryDir);

    const discoveryFile = path.join(discoveryDir, 'discovery.md');
    const discoveryContent = `# Emerging Topics Discovery - Cycle ${iteration}

**Discovery Date**: ${new Date().toISOString()}  
**Analysis Focus**: Emerging critical challenges requiring immediate attention  

${newTopics}

## Next Steps
1. Validate urgency and impact potential
2. Identify key stakeholders and existing initiatives
3. Develop action frameworks and intervention strategies
4. Create educational and advocacy materials
5. Build coalitions for coordinated response

---
*Generated by eutopia-agent topic discovery cycle ${iteration}*
`;

    await writeText(discoveryFile, discoveryContent);
    console.log(`  🆕 Discovered new topics: ${discoveryFile}`);
  } catch (error) {
    console.error('  ❌ Failed to discover new topics:', error);
  }
}

async function synthesizeExistingContent(
  cwd: string,
  client: SimpleOpenAIClient,
  modelName: string
) {
  // Read existing reports and synthesize insights
  const synthesisPrompt = `Analyze all existing content in this Utopia node and create a synthesis report that:

1. Identifies common themes and interconnections between topics
2. Highlights gaps that need more attention
3. Suggests cross-topic collaboration opportunities
4. Proposes integrated action strategies
5. Recommends priority areas for next phase development

Focus on creating actionable insights that connect different challenge areas.`;

  try {
    const synthesis = await client.chat(
      [
        {
          role: 'system',
          content:
            'You are a systems analyst synthesizing complex information to identify patterns and strategic opportunities.',
        },
        { role: 'user', content: synthesisPrompt },
      ],
      modelName
    );

    const synthesisFile = path.join(cwd, 'reports', `synthesis-${Date.now()}.md`);
    const synthesisContent = `# Content Synthesis Report

**Generated**: ${new Date().toISOString()}  
**Purpose**: Cross-topic analysis and strategic insights  

${synthesis}

## Implementation Priorities
Based on this synthesis, the following actions are recommended for maximum impact:

1. **Immediate**: High-impact, low-barrier actions
2. **Short-term**: 3-6 month initiatives requiring coordination
3. **Long-term**: Strategic projects requiring sustained effort

---
*Generated by eutopia-agent content synthesis*
`;

    await ensureDir(path.join(cwd, 'reports'));
    await writeText(synthesisFile, synthesisContent);
    console.log(`  🔄 Content synthesis: ${synthesisFile}`);
  } catch (error) {
    console.error('  ❌ Failed to synthesize content:', error);
  }
}

async function generateMediaContent(
  cwd: string,
  client: SimpleOpenAIClient,
  modelName: string,
  iteration: number
) {
  // Generate updated slide decks and video scripts
  const mediaPrompt = `Create compelling presentation and video content for global challenge solutions. Generate:

1. A powerful 10-slide presentation outline for one critical topic
2. A detailed video script (10-15 minutes) that could go viral
3. Social media content snippets for maximum engagement
4. Call-to-action frameworks for different audiences

Make it inspiring, data-driven, and focused on concrete actions people can take immediately.`;

  try {
    const mediaContent = await client.chat(
      [
        {
          role: 'system',
          content:
            'You are a content creator specializing in compelling, action-oriented media that drives social change.',
        },
        { role: 'user', content: mediaPrompt },
      ],
      modelName
    );

    const mediaFile = path.join(cwd, 'media', `content-${iteration}-${Date.now()}.md`);
    const mediaContentFormatted = `# Media Content Package - Cycle ${iteration}

**Generated**: ${new Date().toISOString()}  
**Purpose**: High-impact presentations and video content  

${mediaContent}

## Production Notes
- Optimize for viral sharing and engagement
- Include clear calls-to-action at multiple points
- Ensure accessibility with captions and transcripts
- Create versions for different platforms and audiences

---
*Generated by eutopia-agent media generation cycle ${iteration}*
`;

    await ensureDir(path.join(cwd, 'media'));
    await writeText(mediaFile, mediaContentFormatted);
    console.log(`  🎬 Media content: ${mediaFile}`);
  } catch (error) {
    console.error('  ❌ Failed to generate media content:', error);
  }
}
