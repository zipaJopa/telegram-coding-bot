/**
 * Free Codex SDK Drop-in Replacement
 *
 * Mimics @openai/codex-sdk interface but uses OpenRouter free models
 * Compatible with Cole's existing code structure
 */

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

interface ThreadOptions {
  workingDirectory?: string;
  skipGitRepoCheck?: boolean;
}

interface AgentEvent {
  type: string;
  [key: string]: any;
}

/**
 * Thread implementation - maintains conversation context
 */
class Thread {
  public id: string;
  private workingDirectory: string;
  private openrouterKey: string;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(id: string, workingDirectory: string, openrouterKey: string) {
    this.id = id;
    this.workingDirectory = workingDirectory;
    this.openrouterKey = openrouterKey;
  }

  /**
   * Run prompt with streaming (async generator)
   */
  async runStreamed(prompt: string): Promise<{ events: AsyncIterableIterator<AgentEvent> }> {
    const events = this.streamResponse(prompt);
    return { events };
  }

  /**
   * Stream response using Aider as coding agent
   */
  private async *streamResponse(prompt: string): AsyncIterableIterator<AgentEvent> {
    try {
      yield { type: 'turn.started' };

      // Use Aider with OpenRouter free model (Qwen3-Coder - best free coding model)
      // Use direct python3 path - works on both Linux and WSL
      const aider = spawn('/bin/python3', [
        '-m', 'aider',
        '--yes-always',
        '--no-git',
        '--model', 'openrouter/qwen/qwen3-coder:free',
        '--openrouter-api-key', this.openrouterKey,
        '--message', prompt
      ], {
        cwd: this.workingDirectory,
      });

      let buffer = '';
      let hasContent = false;

      // Stream stdout
      for await (const chunk of aider.stdout) {
        const text = chunk.toString();
        buffer += text;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            hasContent = true;

            // Emit text content
            yield {
              type: 'item.completed',
              item: {
                type: 'message',
                role: 'assistant',
                content: [{ type: 'text', text: line }]
              }
            };
          }
        }
      }

      // Emit any remaining buffer
      if (buffer.trim()) {
        hasContent = true;
        yield {
          type: 'item.completed',
          item: {
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: buffer }]
          }
        };
      }

      // Wait for process to exit
      const exitCode = await new Promise<number>((resolve) => {
        aider.on('close', (code) => resolve(code || 0));
      });

      if (exitCode !== 0) {
        yield {
          type: 'turn.failed',
          error: {
            message: `Aider exited with code ${exitCode}`,
            code: 'AIDER_ERROR'
          }
        };
      } else {
        yield {
          type: 'turn.completed',
          usage: { total_tokens: 0 }
        };
      }

    } catch (error: any) {
      yield {
        type: 'turn.failed',
        error: {
          message: error.message,
          code: 'AGENT_ERROR'
        }
      };
    }
  }

  /**
   * Non-streaming run (buffers all events)
   */
  async run(prompt: string): Promise<any> {
    const items: any[] = [];
    const { events } = await this.runStreamed(prompt);

    for await (const event of events) {
      if (event.type === 'item.completed') {
        items.push(event.item);
      }
    }

    return {
      items,
      finalResponse: items
        .filter(item => item.type === 'message')
        .map(item => item.content.map((c: any) => c.text).join(''))
        .join('\n')
    };
  }
}

/**
 * Main Codex class - drop-in replacement for @openai/codex-sdk
 */
export class Codex {
  private openrouterKey: string;
  private sessionsDir: string;

  constructor() {
    // Get OpenRouter API key from environment
    this.openrouterKey = process.env.OPENROUTER_API_KEY || '';

    if (!this.openrouterKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    // Sessions directory (mimics ~/.codex/sessions)
    this.sessionsDir = join(homedir(), '.codex', 'sessions');
  }

  /**
   * Start a new thread
   */
  startThread(options: ThreadOptions = {}): Thread {
    const workingDirectory = options.workingDirectory || process.cwd();
    const threadId = randomUUID();

    return new Thread(threadId, workingDirectory, this.openrouterKey);
  }

  /**
   * Resume an existing thread
   */
  resumeThread(threadId: string, options: ThreadOptions = {}): Thread {
    const workingDirectory = options.workingDirectory || process.cwd();

    // In a full implementation, we'd load conversation history from disk
    // For now, just create a new thread with the same ID
    return new Thread(threadId, workingDirectory, this.openrouterKey);
  }
}
