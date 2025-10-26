/**
 * Gemini CLI Agent
 *
 * Uses Google's Gemini CLI for coding tasks
 * - 100 calls/day on Gemini 2.0 Pro (best quality)
 * - Automatically falls back to Flash after quota
 */

import { spawn } from 'child_process';
import { Agent, AgentEvent, AgentType } from './types.js';

export class GeminiAgent implements Agent {
  name: AgentType = 'gemini';
  quota = {
    daily: 100,
    used: 0,
    reset: new Date(new Date().setHours(24, 0, 0, 0)), // Next midnight
  };

  private quotaFile = './data/gemini-quota.json';

  constructor() {
    this.loadQuota();
  }

  private loadQuota() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.quotaFile)) {
        const data = JSON.parse(fs.readFileSync(this.quotaFile, 'utf-8'));
        const resetDate = new Date(data.reset);

        // Reset quota if it's a new day
        if (resetDate < new Date()) {
          this.quota.used = 0;
          this.quota.reset = new Date(new Date().setHours(24, 0, 0, 0));
          this.saveQuota();
        } else {
          this.quota.used = data.used;
          this.quota.reset = resetDate;
        }
      }
    } catch (error) {
      console.warn('Failed to load Gemini quota:', error);
    }
  }

  private saveQuota() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dir = path.dirname(this.quotaFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.quotaFile, JSON.stringify({
        used: this.quota.used,
        reset: this.quota.reset.toISOString()
      }));
    } catch (error) {
      console.warn('Failed to save Gemini quota:', error);
    }
  }

  isAvailable(): boolean {
    return this.quota.used < this.quota.daily;
  }

  getStatus(): string {
    const remaining = this.quota.daily - this.quota.used;
    const hours = Math.floor((this.quota.reset.getTime() - Date.now()) / (1000 * 60 * 60));
    return `Gemini CLI: ${remaining}/${this.quota.daily} calls remaining (resets in ${hours}h)`;
  }

  async *run(prompt: string, workingDirectory: string): AsyncIterableIterator<AgentEvent> {
    if (!this.isAvailable()) {
      yield {
        type: 'error',
        message: `Gemini quota exceeded (${this.quota.used}/${this.quota.daily}). Try /agent qwen or /agent aider`
      };
      return;
    }

    console.log(`[Gemini] Running in ${workingDirectory}`);

    // Increment quota
    this.quota.used++;
    this.saveQuota();

    try {
      // Run Gemini CLI with YOLO mode (-y) for auto-approval
      const gemini = spawn('gemini', ['-y'], {
        cwd: workingDirectory,
        shell: true,
      });

      // Send prompt via stdin
      gemini.stdin.write(prompt + '\n');
      gemini.stdin.end();

      let buffer = '';

      // Process stdout (Gemini's responses)
      for await (const chunk of gemini.stdout) {
        const text = chunk.toString();
        buffer += text;

        // Send text chunks to Telegram
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            yield {
              type: 'text',
              content: line
            };
          }
        }
      }

      // Send remaining buffer
      if (buffer.trim()) {
        yield {
          type: 'text',
          content: buffer
        };
      }

      // Wait for process to finish
      const exitCode = await new Promise<number>((resolve) => {
        gemini.on('close', (code) => resolve(code || 0));
      });

      if (exitCode === 0) {
        yield { type: 'turn.completed' };
      } else {
        yield {
          type: 'turn.failed',
          error: { message: `Gemini CLI exited with code ${exitCode}` }
        };
      }

    } catch (error: any) {
      yield {
        type: 'error',
        message: `Gemini CLI error: ${error.message}`
      };
      yield {
        type: 'turn.failed',
        error: { message: error.message }
      };
    }
  }
}
