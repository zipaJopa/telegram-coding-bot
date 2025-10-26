/**
 * Agent Types
 *
 * Common interfaces for CLI-based coding agents
 */

export type AgentType = 'gemini' | 'qwen' | 'aider';

export interface AgentEvent {
  type: 'text' | 'tool' | 'thinking' | 'error' | 'turn.completed' | 'turn.failed';
  content?: string;
  message?: string;
  error?: {
    message: string;
    code?: string;
  };
}

export interface Agent {
  name: AgentType;
  quota: {
    daily: number;
    used: number;
    reset: Date;
  };

  /**
   * Run a coding prompt with streaming output
   */
  run(prompt: string, workingDirectory: string): AsyncIterableIterator<AgentEvent>;

  /**
   * Check if agent is available (quota not exceeded)
   */
  isAvailable(): boolean;

  /**
   * Get agent status info
   */
  getStatus(): string;
}

export interface ThreadData {
  id: string;
  workingDirectory: string;
  agent: AgentType;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}
