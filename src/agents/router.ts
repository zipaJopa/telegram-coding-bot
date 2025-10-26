/**
 * Agent Router
 *
 * Smart routing between Gemini, QwenCode, and Aider
 * Replaces Codex SDK with CLI-based agents
 */

import { GeminiAgent } from './gemini-agent.js';
import { QwenAgent } from './qwen-agent.js';
import { AiderAgent } from './aider-agent.js';
import { Agent, AgentType, AgentEvent } from './types.js';

// Singleton instances
let geminiInstance: GeminiAgent | null = null;
let qwenInstance: QwenAgent | null = null;
let aiderInstance: AiderAgent | null = null;

export function getGeminiAgent(): GeminiAgent {
  if (!geminiInstance) {
    geminiInstance = new GeminiAgent();
  }
  return geminiInstance;
}

export function getQwenAgent(): QwenAgent {
  if (!qwenInstance) {
    qwenInstance = new QwenAgent();
  }
  return qwenInstance;
}

export function getAiderAgent(openrouterKey?: string): AiderAgent {
  if (!aiderInstance) {
    aiderInstance = new AiderAgent(openrouterKey);
  }
  return aiderInstance;
}

/**
 * Get agent by name
 */
export function getAgent(agentType: AgentType): Agent {
  switch (agentType) {
    case 'gemini':
      return getGeminiAgent();
    case 'qwen':
      return getQwenAgent();
    case 'aider':
      return getAiderAgent();
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

/**
 * Get best available agent (smart fallback)
 */
export function getBestAgent(): Agent {
  const gemini = getGeminiAgent();
  const qwen = getQwenAgent();
  const aider = getAiderAgent();

  // Prefer Gemini (best quality)
  if (gemini.isAvailable()) {
    return gemini;
  }

  // Fallback to QwenCode (2000/day)
  if (qwen.isAvailable()) {
    return qwen;
  }

  // Final fallback to Aider (unlimited)
  if (aider.isAvailable()) {
    return aider;
  }

  throw new Error('No agents available. Configure OPENROUTER_API_KEY for Aider.');
}

/**
 * Get all agent statuses
 */
export function getAllAgentStatuses(): string {
  const gemini = getGeminiAgent();
  const qwen = getQwenAgent();
  const aider = getAiderAgent();

  return [
    gemini.getStatus(),
    qwen.getStatus(),
    aider.getStatus()
  ].join('\n');
}

/**
 * Run prompt with specified or best available agent
 * This is the main entry point that replaces Codex SDK
 */
export async function* runWithAgent(
  agentType: AgentType | 'auto',
  prompt: string,
  workingDirectory: string
): AsyncIterableIterator<AgentEvent> {
  let agent: Agent;

  if (agentType === 'auto') {
    agent = getBestAgent();
    console.log(`[Router] Auto-selected agent: ${agent.name}`);
  } else {
    agent = getAgent(agentType);
  }

  // Yield agent selection info
  yield {
    type: 'text',
    content: `🤖 Using ${agent.name} agent...\n`
  };

  // Run the agent
  yield* agent.run(prompt, workingDirectory);
}
