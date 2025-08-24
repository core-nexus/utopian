# 🌍 Utopian CLI

**Create and manage decentralized Utopia nodes that tackle global challenges through AI-powered collaboration.**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## 🚀 Quick Start

```bash
npx utopian
```

Creates a new Utopia node or enhances an existing one with AI-generated content for critical global challenges.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [AI Models](#-ai-models)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

Utopian creates decentralized nodes that collaborate to address global challenges. Each node:

- 🎯 Focuses on critical issues with AI-generated research
- 🕸️ Builds trust networks with organizations
- 📊 Generates comprehensive reports and insights  
- 🎬 Creates presentations and video content
- 🔄 Operates continuously to discover new challenges

## ✨ Features

- **Node Initialization**: Creates structured directories for goals, foundations, trust networks, and topics
- **AI Content Generation**: Research reports, trust network expansion, topic discovery, and media creation  
- **Continuous Engine**: Runs unlimited cycles of content creation and research
- **Flexible AI**: OpenAI API, local models via LM Studio, or custom endpoints with auto-detection

## 📦 Installation

```bash
npx utopian@latest
```

**Requirements**: Node.js >= 18.0.0  
**Optional**: OpenAI API key or LM Studio for local models

## 🖥️ Usage

```bash
npx utopian                                              # Auto-detect AI model
npx utopian --model gpt-5 --auto                       # Specific model, skip confirmations  
npx utopian --base https://api.com/v1 --model custom   # Custom endpoint
```

| Option | Description | Default |
|--------|-------------|---------|
| `--base <url>` | OpenAI-compatible API base URL | Auto-detected |
| `--model <name>` | Model name | Auto-detected |
| `--auto` | Skip confirmations | `false` |

**AI Model Selection**: Auto-selects OpenAI API (if `OPENAI_API_KEY` set) using `gpt-5`, otherwise LM Studio with `openai/gpt-oss-20b`

## ⚙️ Configuration

```bash
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# LM Studio (optional)
LMSTUDIO_BASE_URL=http://localhost:1234/v1
LMSTUDIO_MODEL=your_preferred_model
```

**LM Studio Setup**: Download [LM Studio](https://lmstudio.ai/), load a model, and run `npx utopian` - it auto-detects and starts the server.

## 📁 Project Structure

```
utopia-node/
├── goals/README.md            # Node objectives and vision  
├── foundations/index.yaml     # Core principles and values
├── trust/known_nodes.yaml     # Trusted organizations  
├── topics/                    # Global challenges and solutions
│   ├── climate-action/
│   ├── digital-rights/        
│   └── global-health-equity/  # Each with docs/, slides/, video/, reports/
├── reports/                   # Synthesis reports
└── media/                     # Generated content
```

## 🤖 AI Models

**Local**: GPT-OSS-20B (good performance/resource balance)  
**Cloud**: GPT-5 (OpenAI) or Claude 3 (Anthropic) for best results  
**Tip**: Larger models (70B+) produce better insights; use `--auto` for unattended operation

## 🛠️ Development

```bash
git clone https://github.com/core-nexus/utopian.git
cd utopian && pnpm install

pnpm dev          # Run in development mode
pnpm build        # Build for production  
pnpm lint         # Check code style
```

## 🤝 Contributing

See [contribution guidelines](AGENTS.md). Use TypeScript, follow existing formatting, write tests, and use conventional commits.

## 🌐 Related Projects

- **[utopia-node](https://github.com/core-nexus/utopia-node)**: Reference Utopia node implementation

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

[Issues](https://github.com/core-nexus/utopian/issues) • [Discussions](https://github.com/core-nexus/utopian/discussions)

---

**Ready to build the future?**

```bash
npx utopian
```
