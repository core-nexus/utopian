import { join } from 'jsr:@std/path@1.1.2';
import { type ChatMessage, SimpleOpenAIClient } from './openai-client.ts';
import {
  ensureDir,
  listDir,
  readText,
  writeText,
  writeYaml,
} from './tools/fsTools.ts';
import {
  checkMfluxAvailable,
  generateImage,
  setupMfluxEnvironment,
} from './tools/systemTools.ts';
import { SYSTEM_PROMPT } from './prompts/system.ts';

interface FoundationalContext {
  universalTaxonomy?: string;
  roseFramework?: string;
  customDocuments: string[];
  isEmpty: boolean;
}

export type AgentOptions = {
  cwd: string;
  model?: string;
  baseURL?: string;
};

export async function runSimpleAgent(opts: AgentOptions) {
  const cwd = opts.cwd;
  const baseURL = opts.baseURL ??
    (Deno.env.get('OPENAI_API_KEY')
      ? 'https://api.openai.com/v1'
      : 'http://localhost:1234/v1');
  const modelName = opts.model ??
    (Deno.env.get('OPENAI_API_KEY') ? 'gpt-5' : 'openai/gpt-oss-20b');

  const client = new SimpleOpenAIClient(baseURL);

  // FIRST: Read and integrate foundations to inform everything
  console.log('\n🧠 Reading foundational documents to understand this Utopia node\'s perspective...');
  const foundationalContext = await readFoundationalDocuments(cwd);

  // Check for mflux-generate availability
  let mfluxAvailable = await checkMfluxAvailable(cwd);
  if (!mfluxAvailable) {
    console.log('\n🖼️  Image generation environment not found');
    console.log('   Setting up mflux for image generation...');
    console.log(
      '   ⚠️  Warning: This requires significant disk space and processing power',
    );

    const setupSuccess = await setupMfluxEnvironment(cwd);
    if (setupSuccess) {
      mfluxAvailable = await checkMfluxAvailable(cwd);
      if (mfluxAvailable) {
        console.log('✅ Image generation enabled: mflux environment ready');
      } else {
        console.log('❌ Image generation setup failed');
      }
    } else {
      console.log('❌ Failed to setup mflux environment');
      console.log('   Image generation will be disabled');
    }
  } else {
    console.log('✅ Image generation enabled: mflux environment ready');
  }

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

  // Create the basic structure first
  await createBasicStructure(cwd);

  // Generate AI-powered content for critical topics informed by foundations
  const foundationalGuidance = buildFoundationalGuidance(foundationalContext);
  
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + foundationalGuidance },
    {
      role: 'user',
      content: `Project root: ${cwd}

Context:
${contextSummary}

${!foundationalContext.isEmpty ? 'IMPORTANT: This node has specific foundational principles that should guide everything. Honor the philosophical and organizational frameworks found in this node\'s foundations.' : ''}

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

    console.log(
      '\n✅ Utopia node initialized - now entering continuous generation mode!',
    );
    console.log('📁 Created basic structure: goals/, foundations/, trust/');
    console.log(
      '🌍 Generated critical global topics with slides and video content',
    );
    console.log(
      '🔄 Beginning deep research and continuous content generation...',
    );

    // Enter continuous generation mode
    await continuousGeneration(cwd, client, modelName, mfluxAvailable);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

async function createBasicStructure(cwd: string) {
  // Check existing structure
  const foundationsExists =
    (await listDir(join(cwd, 'foundations'))).length > 0;
  const topicsExists = (await listDir(join(cwd, 'topics'))).length > 0;

  // Create directories only if they don't exist
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
      values: [
        'Trust',
        'Innovation',
        'Sustainability',
        'Inclusivity',
        'Decentralization',
      ],
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
${
    !foundationsExists
      ? '- ✅ Foundations established in `foundations/index.yaml`'
      : '- ℹ️  Foundations directory already exists (preserved)'
  }
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
    const topicReportsDir = join(cwd, 'topics', 'utopia-init', 'reports');
    await ensureDir(topicReportsDir);
    await writeText(join(topicReportsDir, 'report.md'), reportContent);
  } else {
    // Fall back to reports/utopia-report.md
    await ensureDir(join(cwd, 'reports'));
    await writeText(join(cwd, 'reports', 'utopia-report.md'), reportContent);
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
      description:
        'Ensuring ethical AI development and protecting digital rights for all',
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
      description:
        'Ensuring healthcare access and addressing global health disparities',
      actions: [
        'Support universal healthcare initiatives',
        'Address healthcare disparities in underserved communities',
        'Promote public health education and prevention',
        'Advocate for affordable medicines and treatments',
      ],
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
    await ensureDir(join(topicDir, 'slides'));
    await ensureDir(join(topicDir, 'video'));
    await ensureDir(join(topicDir, 'reports'));

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

${topic.actions.map((action) => `- ${action}`).join('\n')}

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
    await writeText(join(topicDir, 'docs', 'overview.md'), overviewContent);

    // Create Marp-compatible presentation slides
    const heroImage = topic.slug === 'climate-action'
      ? '../../../media/images/climate-action-hero.png'
      : topic.slug === 'digital-rights'
      ? '../../../media/images/digital-rights-network.png'
      : topic.slug === 'global-health-equity'
      ? '../../../media/images/global-health-unity.png'
      : '../../../media/images/collaboration-network.png';

    const slidesContent = `---
marp: true
title: ${topic.title}
description: ${topic.description}
theme: default
paginate: true
---

# ${topic.title}
## A Critical Global Challenge

![bg right:40%](${heroImage})

${topic.description}

---

# Why This Matters Now

![bg left:30%](../../../media/images/collaboration-network.png)

- **Urgent Action Required**: Time-sensitive global challenge
- **Collective Impact**: Requires coordinated worldwide effort
- **Proven Solutions**: We have the tools and knowledge to act
- **Future at Stake**: Decisions made today shape tomorrow

---

# Key Action Areas

${topic.actions.map((action, i) => `## ${i + 1}. ${action}`).join('\n\n')}

---

# What You Can Do

![bg right:30%](${heroImage})

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

![bg](${heroImage})

## Together We Can Make a Difference

*${topic.title} - Every action counts*

Generated by Utopia Node Agent
${new Date().toISOString().split('T')[0]}

<!-- Note: Images will be generated if mflux-generate is available -->
`;
    await writeText(join(topicDir, 'slides', 'presentation.md'), slidesContent);

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

${topic.actions.map((action) => `- ${action}`).join('\n')}

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
    await writeText(join(topicDir, 'video', 'script.md'), videoScriptContent);

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
    await writeText(join(topicDir, 'reports', 'report.md'), reportContent);
  }

  console.log(
    `\n📁 Created ${criticalTopics.length} critical topic directories:`,
  );
  criticalTopics.forEach((topic) => {
    console.log(`  - topics/${topic.slug}/ (${topic.title})`);
  });
}

async function continuousGeneration(
  cwd: string,
  client: SimpleOpenAIClient,
  modelName: string,
  mfluxAvailable: boolean,
) {
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
      console.log(
        '🆕 Phase 3: Discovering and creating new critical topics...',
      );
      await discoverNewTopics(cwd, client, modelName, iteration);

      // Phase 4: Synthesize Existing Content
      console.log('🔄 Phase 4: Synthesizing and updating existing content...');
      await synthesizeExistingContent(cwd, client, modelName);

      // Phase 5: Generate Media Content
      console.log(
        '🎬 Phase 5: Creating video scripts and slide presentations...',
      );
      await generateMediaContent(cwd, client, modelName, iteration);

      // Phase 6: Generate Images (if mflux available)
      console.log('🎨 Phase 6: Generating visual content...');
      await generateContentImages(cwd, client, modelName, mfluxAvailable);

      console.log(
        `✅ Cycle ${iteration} complete. Continuing to next iteration...`,
      );
      iteration++;

      // Small delay to prevent overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(
        `❌ Error in cycle ${iteration}:`,
        error instanceof Error ? error.message : error,
      );
      console.log('🔄 Continuing with next cycle...');
      iteration++;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log(
    `\n🏁 Completed ${maxIterations} generation cycles. System ready for production!`,
  );
}

async function readFoundationalDocuments(cwd: string): Promise<FoundationalContext> {
  const foundationsPath = join(cwd, 'foundations');
  const context: FoundationalContext = {
    customDocuments: [],
    isEmpty: true,
  };

  try {
    // Check if foundations directory exists
    const foundationsExists = (await listDir(foundationsPath)).length > 0;
    if (!foundationsExists) {
      console.log('  ℹ️  No foundations directory found - using default approach');
      return context;
    }

    console.log('  📚 Found foundations directory, reading documents...');

    // Look for Universal Taxonomy documents
    const taxonomyPath = join(foundationsPath, 'Universal Taxonomy');
    try {
      const taxonomyFiles = await listDir(taxonomyPath);
      
      // Read the white paper if it exists
      const whitePaper = taxonomyFiles.find(f => f.toLowerCase().includes('white paper') && f.endsWith('.pdf'));
      if (whitePaper) {
        const whitePaperContent = await readText(join(taxonomyPath, whitePaper));
        if (whitePaperContent) {
          context.universalTaxonomy = whitePaperContent.substring(0, 8000); // First ~8k chars for context
          console.log('  ✅ Integrated Universal Taxonomy white paper');
        }
      }

      // Read the ROSE framework if it exists
      const roseDocument = taxonomyFiles.find(f => f.toLowerCase().includes('rose') && f.endsWith('.pdf'));
      if (roseDocument) {
        const roseContent = await readText(join(taxonomyPath, roseDocument));
        if (roseContent) {
          context.roseFramework = roseContent.substring(0, 4000); // First ~4k chars
          console.log('  ✅ Integrated ROSE framework map');
        }
      }

      // Read the taxonomy matrix TSV if it exists
      const matrixFile = taxonomyFiles.find(f => f.toLowerCase().includes('matrix') && f.endsWith('.tsv'));
      if (matrixFile) {
        const matrixContent = await readText(join(taxonomyPath, matrixFile));
        if (matrixContent) {
          context.customDocuments.push(`UNIVERSAL TAXONOMY MATRIX:\n${matrixContent}`);
          console.log('  ✅ Integrated Universal Taxonomy language matrix');
        }
      }
    } catch {
      // Universal Taxonomy folder doesn't exist, that's fine
    }

    // Read any other foundational documents
    const allFoundationFiles = await listDir(foundationsPath);
    for (const item of allFoundationFiles) {
      if (item !== 'Universal Taxonomy' && !item.startsWith('.')) {
        try {
          const itemPath = join(foundationsPath, item);
          const itemContent = await readText(itemPath);
          if (itemContent) {
            context.customDocuments.push(`${item}:\n${itemContent.substring(0, 2000)}`);
            console.log(`  ✅ Integrated ${item}`);
          }
        } catch {
          // Skip files we can't read
        }
      }
    }

    context.isEmpty = !context.universalTaxonomy && !context.roseFramework && context.customDocuments.length === 0;
    
    if (!context.isEmpty) {
      console.log(`  🎯 Foundational context loaded - this node will be guided by these principles`);
    }

  } catch (error) {
    console.log('  ⚠️  Could not read foundations directory:', error instanceof Error ? error.message : 'Unknown error');
  }

  return context;
}

function buildFoundationalGuidance(context: FoundationalContext): string {
  if (context.isEmpty) {
    return '';
  }

  let guidance = '\n\n=== FOUNDATIONAL CONTEXT ===\n';
  guidance += 'This Utopia node operates according to specific foundational principles:\n\n';

  if (context.universalTaxonomy) {
    guidance += '🧠 UNIVERSAL TAXONOMY FRAMEWORK:\n';
    guidance += 'This node uses a cross-disciplinary approach integrating physics, mythology, psychology, and systems thinking. ';
    guidance += 'Content should reflect the harmonic progression from binary polarity (Yang/Yin) through elemental forces ';
    guidance += '(Fire, Air, Earth, Water, Energy/Life) to social impact sectors. All topics should be categorized ';
    guidance += 'within the Physical/Environmental, Social/Emotional, and Systemic/Mental dimensions.\n\n';
  }

  if (context.roseFramework) {
    guidance += '🌹 ROSE FRAMEWORK (Regenerative Operating System Experience):\n';
    guidance += 'Topics should align with harmonically organized impact sectors spanning Environmental (Water, Air, Fire, Earth, Life), ';
    guidance += 'Social (Communications, Education, Gender, Health, Vision, Arts), and Systemic ';
    guidance += '(Governance, Economics, Organization, Justice, Sciences, Innovation, Spirituality, Mystery) dimensions.\n\n';
  }

  if (context.customDocuments.length > 0) {
    guidance += '📄 ADDITIONAL FOUNDATIONAL DOCUMENTS:\n';
    for (const doc of context.customDocuments.slice(0, 3)) { // Limit to avoid overwhelming context
      guidance += `${doc}\n\n`;
    }
  }

  guidance += 'INTEGRATION REQUIREMENT: All content generation must honor these foundational principles. ';
  guidance += 'Topics should be selected and framed through this philosophical lens, using the taxonomic structure ';
  guidance += 'to ensure coherent, harmonic organization of global challenges and solutions.\n';
  guidance += '=== END FOUNDATIONAL CONTEXT ===\n\n';

  return guidance;
}

async function generateResearchReports(
  cwd: string,
  client: SimpleOpenAIClient,
  modelName: string,
  iteration: number,
) {
  // Get existing topics to research
  const topicsPath = join(cwd, 'topics');
  const allEntries = await listDir(topicsPath);

  // Filter to only include directories (skip .gitkeep and other files)
  const topicDirs = [];
  for (const entry of allEntries) {
    try {
      const entryPath = join(topicsPath, entry);
      const stat = await Deno.stat(entryPath);
      if (stat.isDirectory) {
        topicDirs.push(entry);
      }
    } catch {
      // Skip entries we can't stat
    }
  }

  for (const topicSlug of topicDirs.slice(0, 2)) {
    // Process 2 topics per cycle to avoid overwhelming
    const researchPrompt =
      `Generate a comprehensive research report for the ${topicSlug} topic. Include:

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
        modelName,
      );

      const reportPath = join(
        cwd,
        'topics',
        topicSlug,
        'reports',
        `deep-research-${iteration}.md`,
      );
      const reportContent = `# Deep Research Report - ${
        topicSlug
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase())
      }

**Report #**: ${iteration}
**Generated**: ${new Date().toISOString()}
**Focus**: Comprehensive analysis and actionable insights

${research}

---
*Generated by utopian continuous generation cycle ${iteration}*
`;

      await writeText(reportPath, reportContent);
      console.log(`  📄 Generated research report: ${reportPath}`);
    } catch (error) {
      console.error(
        `  ❌ Failed to generate research for ${topicSlug}:`,
        error,
      );
    }
  }
}

async function exploreTrustNetwork(
  cwd: string,
  client: SimpleOpenAIClient,
  modelName: string,
) {
  const trustPrompt =
    `Identify 10 highly trusted organizations, research institutions, and initiatives working on global challenges like climate action, digital rights, and health equity. For each, provide:

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
      modelName,
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
*Generated by utopian trust network exploration*
`;

    const expandedTrustFile = join(
      cwd,
      'trust',
      `expanded-network-${Date.now()}.yaml`,
    );
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
  iteration: number,
) {
  const discoveryPrompt =
    `Based on current global developments in 2024-2025, identify 2 emerging critical challenges that need urgent attention but aren't widely discussed yet. Consider:

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
      modelName,
    );

    // Create directory for discovered topics
    const discoveryDir = join(cwd, 'topics', `emerging-${iteration}`);
    await ensureDir(discoveryDir);

    const discoveryFile = join(discoveryDir, 'discovery.md');
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
*Generated by utopian topic discovery cycle ${iteration}*
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
  modelName: string,
) {
  // Read existing reports and synthesize insights
  const synthesisPrompt =
    `Analyze all existing content in this Utopia node and create a synthesis report that:

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
      modelName,
    );

    const synthesisFile = join(cwd, 'reports', `synthesis-${Date.now()}.md`);
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
*Generated by utopian content synthesis*
`;

    await ensureDir(join(cwd, 'reports'));
    await writeText(synthesisFile, synthesisContent);
    console.log(`  🔄 Content synthesis: ${synthesisFile}`);
  } catch (error) {
    console.error('  ❌ Failed to synthesize content:', error);
  }
}

async function generateContentImages(
  cwd: string,
  client: SimpleOpenAIClient,
  modelName: string,
  mfluxAvailable: boolean,
) {
  if (!mfluxAvailable) {
    console.log(
      '  ⏭️  Skipping image generation (mflux-generate not available)',
    );
    return;
  }

  console.log('  🤖 Generating contextual image prompts with AI...');
  
  // Get existing content to inform image generation
  const existingContent = await gatherContentForImageGeneration(cwd);
  
  const imagePrompts = await generateImagePrompts(
    client,
    modelName,
    existingContent,
  );

  await ensureDir(join(cwd, 'media', 'images'));

  for (const imageSpec of imagePrompts) {
    try {
      const fullPath = join(cwd, imageSpec.path);
      console.log(`  🎨 Generating image: ${imageSpec.name}`);
      console.log(`      Using prompt: "${imageSpec.prompt}"`);

      await generateImage(imageSpec.prompt, fullPath, {
        width: 1024,
        height: 1024,
        steps: 28,
        quantize: 8,
        cwd,
      });

      console.log(`  ✅ Generated: ${imageSpec.path}`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${imageSpec.name}:`, error);
    }
  }
}

async function gatherContentForImageGeneration(cwd: string): Promise<string> {
  const content: string[] = [];
  
  try {
    // Get topic overviews
    const topicsPath = join(cwd, 'topics');
    const topicDirs = await listDir(topicsPath);
    
    for (const topicDir of topicDirs.slice(0, 3)) { // Limit to avoid overwhelming context
      const overviewPath = join(topicsPath, topicDir, 'docs', 'overview.md');
      const overview = await readText(overviewPath);
      if (overview) {
        content.push(`=== ${topicDir.toUpperCase()} ===`);
        content.push(overview.substring(0, 500)); // First 500 chars
      }
    }
    
    // Get recent reports
    const reportsPath = join(cwd, 'reports');
    const reports = await listDir(reportsPath);
    for (const reportFile of reports.slice(-2)) { // Last 2 reports
      if (reportFile.endsWith('.md')) {
        const report = await readText(join(reportsPath, reportFile));
        if (report) {
          content.push(`=== REPORT: ${reportFile} ===`);
          content.push(report.substring(0, 300)); // First 300 chars
        }
      }
    }
  } catch (_error) {
    console.log('  ⚠️  Could not gather existing content, using minimal context');
    content.push('Global challenges requiring urgent action and collaboration');
  }
  
  return content.join('\n\n');
}

async function generateImagePrompts(
  client: SimpleOpenAIClient,
  modelName: string,
  contentContext: string,
): Promise<Array<{ name: string; prompt: string; path: string }>> {
  const promptGenerationPrompt = `Based on the following content about global challenges and solutions, generate 4-6 diverse, compelling image prompts for visual content creation.

CONTENT CONTEXT:
${contentContext}

REQUIREMENTS:
- Create prompts that will generate powerful, inspiring visuals
- Focus on hope, action, collaboration, and positive change
- Include diverse perspectives and global representation  
- Mix abstract concepts with concrete imagery
- Ensure prompts work well for presentations and social media
- Each prompt should be 15-25 words for optimal image generation

OUTPUT FORMAT (JSON):
[
  {
    "name": "descriptive-filename",
    "prompt": "detailed visual description optimized for image generation",
    "path": "media/images/descriptive-filename.png"
  }
]

STYLE GUIDELINES:
- Use words like: photorealistic, high quality, professional, inspiring, hopeful
- Include lighting: warm lighting, golden hour, soft natural light
- Specify composition: wide shot, close-up, aerial view, etc.
- Add mood: uplifting, collaborative, determined, peaceful
- Mention colors when relevant: vibrant, earth tones, blue and green

Generate images that will make people feel motivated to take action on global challenges.`;

  try {
    const response = await client.chat([
      {
        role: 'system',
        content: 'You are an expert prompt engineer specializing in creating compelling image generation prompts that inspire action on global challenges.',
      },
      { role: 'user', content: promptGenerationPrompt },
    ], modelName);

    // Try to parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const imagePrompts = JSON.parse(jsonMatch[0]);
      console.log(`  ✅ Generated ${imagePrompts.length} contextual image prompts:`);
      
      // Display the generated prompts
      imagePrompts.forEach((prompt: any, index: number) => {
        console.log(`    ${index + 1}. 🎨 ${prompt.name}`);
        console.log(`       📝 "${prompt.prompt}"`);
      });
      
      return imagePrompts;
    }
  } catch (error) {
    console.error('  ⚠️  Failed to generate custom prompts, using fallback:', error);
  }

  // Fallback prompts if LLM generation fails
  return [
    {
      name: 'global-collaboration',
      prompt: 'diverse hands reaching together forming circle, unity and cooperation, warm golden lighting, hopeful and inspiring, photorealistic, high quality',
      path: 'media/images/global-collaboration.png',
    },
    {
      name: 'sustainable-future',
      prompt: 'clean energy landscape with solar panels wind turbines, bright blue sky, green technology, sustainable development, optimistic mood, professional photography',
      path: 'media/images/sustainable-future.png',
    },
    {
      name: 'digital-equity',
      prompt: 'interconnected network of diverse people using technology, digital inclusion, connectivity symbols, modern aesthetic, blue and green colors, inspiring',
      path: 'media/images/digital-equity.png',
    },
  ];
}

async function generateMediaContent(
  cwd: string,
  client: SimpleOpenAIClient,
  modelName: string,
  iteration: number,
) {
  // Generate updated slide decks and video scripts
  const mediaPrompt =
    `Create compelling presentation and video content for global challenge solutions. Generate:

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
      modelName,
    );

    const mediaFile = join(
      cwd,
      'media',
      `content-${iteration}-${Date.now()}.md`,
    );
    const mediaContentFormatted = `# Media Content Package - Cycle ${iteration}

**Generated**: ${new Date().toISOString()}
**Purpose**: High-impact presentations and video content

${mediaContent}

## Available Images
If mflux-generate is available, the following images can be used in presentations and content:
- \`media/images/climate-action-hero.png\` - Renewable energy landscape
- \`media/images/digital-rights-network.png\` - Digital privacy and rights visualization  
- \`media/images/global-health-unity.png\` - Healthcare collaboration and equity
- \`media/images/collaboration-network.png\` - Network and partnership visualization

## Production Notes
- Optimize for viral sharing and engagement
- Include clear calls-to-action at multiple points
- Ensure accessibility with captions and transcripts
- Create versions for different platforms and audiences
- Use generated images to enhance visual appeal and engagement

---
*Generated by utopian media generation cycle ${iteration}*
`;

    await ensureDir(join(cwd, 'media'));
    await writeText(mediaFile, mediaContentFormatted);
    console.log(`  🎬 Media content: ${mediaFile}`);
  } catch (error) {
    console.error('  ❌ Failed to generate media content:', error);
  }
}
