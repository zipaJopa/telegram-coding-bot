/**
 * Aider Agent
 *
 * Uses Aider CLI with OpenRouter free models
 * - Unlimited calls (using free tier models)
 * - Fallback when Gemini/Qwen quotas exhausted
 */

import { spawn } from 'child_process';
import { Agent, AgentEvent, AgentType } from './types.js';

export class AiderAgent implements Agent {
  name: AgentType = 'aider';
  quota = {
    daily: 999999, // Effectively unlimited
    used: 0,
    reset: new Date(new Date().setHours(24, 0, 0, 0)),
  };

  private openrouterKey: string;

  constructor(openrouterKey: string = '') {
    this.openrouterKey = openrouterKey || process.env.OPENROUTER_API_KEY || '';
  }

  isAvailable(): boolean {
    return !!this.openrouterKey;
  }

  getStatus(): string {
    if (!this.openrouterKey) {
      return 'Aider: Not configured (set OPENROUTER_API_KEY)';
    }
    return `Aider: Unlimited (OpenRouter free models)`;
  }

  async *run(prompt: string, workingDirectory: string): AsyncIterableIterator<AgentEvent> {
    if (!this.isAvailable()) {
      yield {
        type: 'error',
        message: 'Aider not configured. Set OPENROUTER_API_KEY in .env'
      };
      return;
    }

    console.log(`[Aider] Running in ${workingDirectory}`);

    try {
      // Run Aider with OpenRouter
      const aider = spawn('aider', [
        '--yes-always',              // Auto-approve
        '--no-git',                  // Don't require git
        '--model', 'openrouter/qwen/qwen3-coder:free',
        '--openrouter-api-key', this.openrouterKey,
        '--message', prompt
      ], {
        cwd: workingDirectory,
        shell: true,
      });

      let buffer = '';

      for await (const chunk of aider.stdout) {
        const text = chunk.toString();
        buffer += text;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            yield {
              type: 'text',
              content: line
            };
          }
        }
      }

      if (buffer.trim()) {
        yield {
          type: 'text',
          content: buffer
        };
      }

      const exitCode = await new Promise<number>((resolve) => {
        aider.on('close', (code) => resolve(code || 0));
      });

      if (exitCode === 0) {
        yield { type: 'turn.completed' };
      } else {
        yield {
          type: 'turn.failed',
          error: { message: `Aider exited with code ${exitCode}` }
        };
      }

    } catch (error: any) {
      yield {
        type: 'error',
        message: `Aider error: ${error.message}`
      };
      yield {
        type: 'turn.failed',
        error: { message: error.message }
      };
    }
  }
}
