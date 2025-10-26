# Telegram Coding Bot (Free CLI Agents)

Remote autonomous coding via Telegram using **FREE** CLI agents - no ChatGPT Plus subscription required!

## Overview

This Telegram bot provides conversational coding assistance from anywhere, using free CLI-based coding agents instead of OpenAI Codex SDK. Features:

- **100% Free**: No subscription costs - uses free CLI tools and API tiers
- **Remote Coding**: Code from your phone or any Telegram client
- **Per-User Sessions**: Isolated sessions for each user
- **Working Directory Management**: Switch between projects seamlessly
- **Multi-Agent Support**: Gemini CLI, QwenCode CLI, and Aider with smart fallback
- **Real-Time Streaming**: See agent responses as they're generated
- **OAuth Authentication**: Secure Google/Alibaba authentication for CLI tools

## Features

✅ **Three Free Coding Agents**
- **Gemini CLI**: 100 calls/day, highest quality, Google OAuth
- **QwenCode CLI**: 2000 calls/day, coding workhorse, Alibaba OAuth
- **Aider**: Unlimited via OpenRouter free models
- **Smart Router**: Auto-fallback when quotas exceeded

✅ **Agent Management**
- `/agent` - Show current agent and status
- `/agent gemini` - Switch to Gemini CLI
- `/agent qwen` - Switch to QwenCode CLI
- `/agent aider` - Switch to Aider
- `/agent auto` - Auto-select best available (default)
- `/agent status` - Check quota usage

✅ **Smart Session Management**
- JSON-based user sessions
- Per-user working directory tracking
- Agent preference persistence
- Session restoration across restarts

✅ **Telegram Commands**
- `/start` - Welcome and quick start
- `/help` - Command reference
- `/agent` - Agent selection and status
- `/setcwd` - Set working directory
- `/getcwd` - Show current directory
- `/searchcwd` - Find directories
- `/reset` - Clear conversation (preserves directory)

## Prerequisites

- **pnpm** (Node.js package manager)
- **Telegram Bot Token** (from [@BotFather](https://t.me/BotFather))
- **OpenRouter API Key** (free from [openrouter.ai](https://openrouter.ai))
- **Gemini CLI** (optional - 100 free calls/day)
- **QwenCode CLI** (optional - 2000 free calls/day)

## Quick Start

### 1. Create Telegram Bot

```bash
# In Telegram, message @BotFather
/newbot
# Follow prompts to get your bot token
```

### 2. Get OpenRouter API Key (Free!)

1. Visit [openrouter.ai](https://openrouter.ai)
2. Sign up (free account)
3. Copy your API key

### 3. Install CLI Agents (Optional)

#### Gemini CLI (100 calls/day)
```bash
pnpm add -g @google/gemini-cli
gemini auth login  # Opens browser for Google OAuth
```

#### QwenCode CLI (2000 calls/day)
```bash
pnpm add -g qwen-code
qwencode auth login  # Opens browser for Alibaba OAuth
```

**Note**: Aider is always available as unlimited fallback via OpenRouter free models!

### 4. Configure Environment

```bash
cd telegram-coding-bot
cp .env.example .env
# Edit .env with your tokens
```

Required variables:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
OPENROUTER_API_KEY=your_openrouter_key
```

### 5. Install and Run

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Production build
pnpm build
pnpm start
```

## OAuth Setup

See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for complete authentication guide covering:
- Gemini CLI OAuth setup
- QwenCode CLI OAuth setup
- Credential storage and security
- Docker deployment considerations
- Troubleshooting authentication issues

**TL;DR**:
```bash
# Authenticate Gemini
gemini auth login

# Authenticate QwenCode
qwencode auth login

# Verify
gemini chat "Hello"
qwencode chat "Hello"
```

## Usage Examples

### Basic Coding

```
You: Create a Python function to calculate fibonacci numbers

Bot: 🤖 Using gemini agent...
[Creates fibonacci.py with implementation]
✅ File created: fibonacci.py
```

### Agent Switching

```
You: /agent status

Bot: 📊 Agent Status:

🟢 gemini: 87/100 quota remaining
🟢 qwen: 1842/2000 quota remaining
🟢 aider: Unlimited (free models)

You: /agent qwen

Bot: ✅ Switched to qwen agent
Send me a coding task to try it out!
```

### Working Directory Management

```
You: /setcwd /workspace/my-react-app
Bot: ✅ Working directory set to: /workspace/my-react-app

You: Add a login form component
Bot: [Creates component in correct directory]
```

### Auto-Fallback in Action

```
You: (Using gemini after hitting quota)

Bot: 🤖 Using qwen agent... (gemini quota exceeded)
[Task continues seamlessly with QwenCode]
```

## Architecture

### Agent System

Three coding agents with automatic fallback:

1. **GeminiAgent** (`src/agents/gemini-agent.ts`)
   - Spawns `gemini -y` CLI subprocess
   - 100 calls/day quota with daily reset
   - Saves quota to `./data/gemini-quota.json`
   - OAuth credentials: `~/.gemini/credentials.json`

2. **QwenAgent** (`src/agents/qwen-agent.ts`)
   - Spawns `qwencode -y` CLI subprocess
   - 2000 calls/day quota with daily reset
   - Saves quota to `./data/qwen-quota.json`
   - OAuth credentials: `~/.qwen/credentials.json`

3. **AiderAgent** (`src/agents/aider-agent.ts`)
   - Spawns `aider` with OpenRouter integration
   - Unlimited via `qwen/qwen3-coder:free` model
   - No quota tracking needed

### Agent Router (`src/agents/router.ts`)

Smart routing logic:
```typescript
function getBestAgent(): Agent {
  if (gemini.isAvailable()) return gemini;
  if (qwen.isAvailable()) return qwen;
  if (aider.isAvailable()) return aider;
  throw new Error('No agents available');
}
```

### Session Management

Each user gets isolated sessions:

```json
{
  "user_id": 12345,
  "cwd": "/workspace/project",
  "agent": "auto",
  "created_at": "2025-10-26T...",
  "last_updated": "2025-10-26T..."
}
```

### Event Flow

```
User Message → Telegram
    ↓
Load/Create Session
    ↓
Select Agent (auto or user preference)
    ↓
Stream CLI Agent Response
    ↓
Process Events (text, error, completion)
    ↓
Send to Telegram
    ↓
Save Session & Update Quota
```

## Project Structure

```
telegram-coding-bot/
├── src/
│   ├── agents/
│   │   ├── types.ts           # Common agent interfaces
│   │   ├── gemini-agent.ts    # Gemini CLI integration
│   │   ├── qwen-agent.ts      # QwenCode CLI integration
│   │   ├── aider-agent.ts     # Aider integration
│   │   └── router.ts          # Smart routing & fallback
│   ├── bot/
│   │   ├── commands/          # Telegram commands
│   │   │   ├── start.ts
│   │   │   ├── help.ts
│   │   │   ├── agent.ts       # NEW: Agent management
│   │   │   ├── setcwd.ts
│   │   │   ├── getcwd.ts
│   │   │   ├── searchcwd.ts
│   │   │   └── reset.ts
│   │   ├── handlers/
│   │   │   └── message.ts     # UPDATED: Uses agent router
│   │   └── utils/
│   ├── session/               # Session management
│   ├── config/                # Environment config
│   └── index.ts               # Entry point
├── data/                      # Quota tracking (gitignored)
├── telegram_sessions/         # User sessions (gitignored)
├── workspace/                 # Your projects (gitignored)
├── OAUTH_SETUP.md             # Authentication guide
├── MIGRATION_STATUS.md        # Migration progress
└── README.md
```

## Quota Management

Daily quotas reset at midnight (local time):

```typescript
// Check if quota expired
if (new Date() > quota.reset) {
  quota.used = 0;
  quota.reset = new Date();
  quota.reset.setHours(24, 0, 0, 0); // Next midnight
}
```

Quota persistence in `./data/`:
- `gemini-quota.json` - Gemini CLI usage
- `qwen-quota.json` - QwenCode CLI usage

## Troubleshooting

### "Authentication failed" Error

**Gemini CLI:**
```bash
gemini auth logout
gemini auth login
```

**QwenCode CLI:**
```bash
qwencode auth logout
qwencode auth login
```

### "Quota exceeded" Error

Bot automatically falls back:
1. Try Gemini (100/day)
2. Fall back to QwenCode (2000/day)
3. Final fallback to Aider (unlimited)

Check quotas: `/agent status`

### CLI Not Found Error

```bash
# Install missing CLI
pnpm add -g @google/gemini-cli
pnpm add -g qwen-code
pnpm add -g aider-chat

# Verify installation
which gemini
which qwencode
which aider
```

## Security Notes

- ✅ OAuth tokens stored locally (not in repo)
- ✅ Credentials auto-refresh via OAuth
- ✅ No API keys in code
- ⚠️ Don't commit `.gemini/`, `.qwen/`, or `data/` directories
- ⚠️ Use `.gitignore` to exclude credentials

## Comparison to Codex SDK

| Feature | Codex SDK | This Bot |
|---------|-----------|----------|
| **Cost** | $20/mo (ChatGPT Plus) | 100% Free |
| **Quota** | Unlimited | 2100+/day combined |
| **Quality** | Excellent | Excellent (Gemini CLI) |
| **Setup** | Complex auth | Simple OAuth |
| **Fallback** | None | 3-tier system |
| **OAuth** | Token-based | Google/Alibaba |

## Migration Status

See [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) for complete migration tracking from Codex SDK to CLI agents.

**Current Status**: ✅ Complete and ready for deployment!

## Contributing

This is a personal project forked from [coleam00/codex-telegram-coding-assistant](https://github.com/coleam00/codex-telegram-coding-assistant).

Key changes:
- Replaced `@openai/codex-sdk` with free CLI agents
- Added multi-agent support with smart routing
- Implemented quota tracking and auto-fallback
- Added OAuth authentication guide
- Maintained Cole's excellent session/thread architecture

## License

MIT
