# 🌍 Utopian CLI

**A powerful CLI for creating and managing decentralized Utopia nodes that
tackle global challenges through AI-powered collaboration.**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Deno](https://img.shields.io/badge/deno-v2.x-green.svg)](https://deno.land/)

## 🚀 Quick Start

Run the Utopian CLI from any directory:

```bash
deno run --allow-read=. --allow-write=. --allow-net --allow-env --allow-run=lms,python3,bash https://deno.land/x/utopian/mod.ts
```

Or clone and run locally:

```bash
git clone https://github.com/core-nexus/utopian.git
cd utopian
deno task start
```

This command will:

- **In a fresh directory**: Create a new Utopia node from scratch
- **In an existing utopia-node repo**: Enhance and expand the existing node

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

Utopian creates **decentralized nodes** that collaborate to address global
challenges like climate change, digital rights, and health equity. Each node:

- 🎯 **Focuses on critical global issues** with AI-generated research and
  solutions
- 🤖 **Leverages AI** for continuous content generation and discovery
- 🕸️ **Builds trust networks** with other nodes and organizations
- 📊 **Generates comprehensive reports** with data-driven insights
- 🎬 **Creates media content** including presentations and video scripts
- 🎨 **Generates images** automatically with mflux for visual content
  (auto-setup)
- 🔄 **Operates continuously** to discover new challenges and opportunities

## ✨ Features

### 🏗️ **Node Initialization**

- Creates structured directories for goals, foundations, trust networks, and
  topics
- Initializes with critical global challenges (climate, digital rights, health
  equity)
- Generates foundational documents and reports

### 🧠 **AI-Powered Content Generation**

- **Research Reports**: Deep analysis of global challenges with statistics and
  solutions
- **Trust Network Expansion**: Discovery of credible organizations and
  collaborators
- **Topic Discovery**: Identification of emerging critical challenges
- **Media Creation**: Presentation slides (Marp-compatible) and video scripts
- **Image Generation**: Automatic creation of contextual visuals using mflux
- **Content Synthesis**: Cross-topic analysis and strategic insights

### 🔄 **Continuous Generation Engine**

- Runs fully automated cycles of content creation and research
- Automatically discovers new topics and expands existing ones
- Builds comprehensive knowledge bases over time
- Creates actionable reports and media content without manual intervention

### 🤝 **Flexible AI Integration**

- **OpenAI API**: Use GPT models with your API key
- **Local Models**: LM Studio integration for privacy and cost control
- **Auto-detection**: Automatically chooses the best available option

## 📦 Installation

### Direct Usage (Recommended)

```bash
deno run --allow-read=. --allow-write=. --allow-net --allow-env --allow-run=lms,python3,bash https://deno.land/x/utopian/mod.ts
```

### Requirements

- **Deno**: >= 2.x
- **Python 3**: For automatic image generation (auto-installed in virtual
  environment)
- **Optional**: LM Studio for local AI models
- **Optional**: OpenAI API key for GPT models

## 🖥️ Usage

### Basic Usage

```bash
# Create or enhance a Utopia node
deno task start

# Use with specific AI model
deno run --allow-read=. --allow-write=. --allow-net --allow-env --allow-run=lms,python3,bash mod.ts --model gpt-4

# Use custom OpenAI-compatible endpoint
deno run --allow-read=. --allow-write=. --allow-net --allow-env --allow-run=lms,python3,bash mod.ts --base https://your-api.com/v1 --model your-model
```

### Command Options

| Option           | Description                    | Default       |
| ---------------- | ------------------------------ | ------------- |
| `--base <url>`   | OpenAI-compatible API base URL | Auto-detected |
| `--model <name>` | Model name to use              | Auto-detected |

### AI Model Selection

The CLI automatically selects the best available AI option:

1. **OpenAI API** (if `OPENAI_API_KEY` set): Uses `gpt-5` by default
2. **LM Studio** (local): Uses `openai/gpt-oss-20b` and auto-starts server
3. **Custom endpoint**: Specify with `--base` and `--model` flags

## ⚙️ Configuration

### Environment Variables

```bash
# OpenAI API (recommended for best results)
OPENAI_API_KEY=your_openai_api_key

# LM Studio (for local/private usage)
LMSTUDIO_BASE_URL=http://localhost:1234/v1
LMSTUDIO_MODEL=your_preferred_model
```

### LM Studio Setup

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Load a compatible model (e.g., Qwen, Llama, Mistral)
3. Start the local server (auto-started by CLI)
4. Run the deno command above - it will automatically detect and use LM Studio

## 📁 Project Structure

After initialization, your Utopia node will have this structure:

```
utopia-node/
├── goals/
│   └── README.md              # Node objectives and vision
├── foundations/
│   └── index.yaml             # Core principles and values
├── trust/
│   ├── known_nodes.yaml       # Trusted organizations and nodes
│   └── expanded-network-*.yaml # AI-discovered trust networks
├── topics/                    # Global challenges and solutions
│   ├── climate-action/
│   │   ├── docs/overview.md   # Topic analysis
│   │   ├── slides/presentation.md  # Marp slides
│   │   ├── video/script.md    # Video content
│   │   └── reports/           # Research reports
│   ├── digital-rights/
│   └── global-health-equity/
├── reports/                   # Synthesis and analysis reports
├── media/                     # Generated presentations and scripts
│   └── images/                # AI-generated visual content
├── tmp/
│   └── mflux/                 # Image generation environment
│       └── .venv/             # Python virtual environment
└── dist/                      # Compiled presentations
```

## 🤖 AI Models

### Recommended Models

**For Local/Free:**

- **GPT-OSS-20B**: Good balance of performance and resource usage

**For Production:**

- **GPT-5** (OpenAI): Good quality and reasoning
- **Claude 3** (Anthropic): Excellent for research and analysis

### Model Performance Tips

- **Larger models** (70B+) produce better research and insights
- **Local models** provide privacy and cost control
- Agent runs automatically without manual intervention

## 🛠️ Development

### Setup

```bash
git clone https://github.com/core-nexus/utopian.git
cd utopian

# Install pre-commit hooks (optional)
pip install pre-commit
pre-commit install
```

### Scripts

```bash
deno task dev         # Run in development mode
deno lint             # Check code style
deno fmt              # Format code
deno task test        # Run tests
```

### Project Commands

```bash
# Test locally
deno task start --help

# Check formatting and linting
deno fmt --check
deno lint
```

## 🤝 Contributing

We welcome contributions! Please see our [contribution guidelines](AGENTS.md)
and:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting (`deno fmt`)
- Write tests for new functionality (`deno test`)
- Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## 🌐 Related Projects

- **[utopia-node](https://github.com/core-nexus/utopia-node)**: Reference
  implementation of a Utopia node
- **[CoreNexus](https://core.nexus)**: Core Utopia ecosystem projects

## 📄 License

This project is licensed under the Apache License 2.0 - see the
[LICENSE](LICENSE) file for details.

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/core-nexus/utopian/issues)
- **Discussions**:
  [GitHub Discussions](https://github.com/core-nexus/utopian/discussions)
- **Documentation**: [Project Wiki](https://github.com/core-nexus/utopian/wiki)

---

**Ready to build the future?** Start your Utopia node today:

```bash
deno run --allow-read=. --allow-write=. --allow-net --allow-env --allow-run=lms,python3,bash https://deno.land/x/utopian/mod.ts
```

_Together, we can tackle global challenges through decentralized collaboration
and AI-powered solutions._
