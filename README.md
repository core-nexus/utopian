# 🌍 Utopian CLI

**Create and manage decentralized Utopia nodes that tackle global challenges through AI-powered collaboration.**

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## 🚀 Quick Start

```bash
npx utopian
```

Creates a new Utopia node in fresh directories or enhances existing ones.

## ✨ Features

- 🏗️ **Node Creation**: Structured directories for goals, foundations, trust networks, and global challenge topics
- 🧠 **AI Content Generation**: Research reports, trust network expansion, and media content (slides, videos)
- 🔄 **Continuous Operation**: Automated discovery of challenges and opportunities
- 🤝 **Flexible AI**: OpenAI API or local models (LM Studio) with auto-detection

## 📦 Requirements

- **Node.js**: >= 18.0.0
- **Optional**: OpenAI API key or LM Studio for local models

## 🖥️ Usage

```bash
npx utopian                    # Create or enhance a Utopia node
npx utopian --model gpt-4      # Use specific model
npx utopian --auto             # Skip confirmations
```

**Options:**
- `--base <url>`: Custom API endpoint
- `--model <name>`: Specific model name  
- `--auto`: Skip human-in-the-loop prompts

**AI Selection:** Automatically uses OpenAI API (if `OPENAI_API_KEY` set) or LM Studio for local models.

## ⚙️ Configuration

**Environment Variables:**
```bash
OPENAI_API_KEY=your_key        # For OpenAI models
LMSTUDIO_BASE_URL=http://...   # For LM Studio
LMSTUDIO_MODEL=model_name      # Preferred local model
```

**LM Studio Setup:** Install [LM Studio](https://lmstudio.ai/), load a model, and run `npx utopian`.

## 📁 Project Structure

```
utopia-node/
├── goals/README.md            # Node objectives
├── foundations/index.yaml     # Core principles  
├── trust/                     # Trusted networks
├── topics/                    # Global challenges
│   ├── climate-action/
│   ├── digital-rights/
│   └── global-health-equity/
├── reports/                   # Analysis reports
└── media/                     # Generated content
```

## 🤖 AI Models

**Recommended:**
- **Local**: GPT-OSS-20B (via LM Studio)
- **Cloud**: GPT-5 (OpenAI) or Claude 3 (Anthropic)

Larger models produce better research. Use `--auto` for unattended operation.

## 🛠️ Development

```bash
git clone https://github.com/core-nexus/utopian.git
cd utopian && pnpm install
pnpm dev          # Development mode
pnpm build        # Production build
pnpm lint         # Code style check
```

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/name`  
3. Commit: `git commit -m 'feat: description'`
4. Push and open PR

**Requirements:** TypeScript, Prettier formatting, conventional commits. See [AGENTS.md](AGENTS.md) for guidelines.

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) file.

## 🙋 Support

- [GitHub Issues](https://github.com/core-nexus/utopian/issues)
- [GitHub Discussions](https://github.com/core-nexus/utopian/discussions)

---

**Start your Utopia node:** `npx utopian`
