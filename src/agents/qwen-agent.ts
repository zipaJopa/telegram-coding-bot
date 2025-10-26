/**
 * QwenCode CLI Agent
 *
 * Uses QwenCode CLI (fork of Gemini CLI by Alibaba)
 * - 2000 calls/day FREE
 * - Built for coding tasks
 */

import { spawn } from 'child_process';
import { Agent, AgentEvent, AgentType } from './types.js';

export class QwenAgent implements Agent {
  name: AgentType = 'qwen';
  quota = {
    daily: 2000,
    used: 0,
    reset: new Date(new Date().setHours(24, 0, 0, 0)),
  };

  private quotaFile = './data/qwen-quota.json';

  constructor() {
    this.loadQuota();
  }

  private loadQuota() {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.quotaFile)) {
        const data = JSON.parse(fs.readFileSync(this.quotaFile, 'utf-8'));
        const resetDate = new Date(data.reset);

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
      console.warn('Failed to load Qwen quota:', error);
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
      console.warn('Failed to save Qwen quota:', error);
    }
  }

  isAvailable(): boolean {
    return this.quota.used < this.quota.daily;
  }

  getStatus(): string {
    const remaining = this.quota.daily - this.quota.used;
    const hours = Math.floor((this.quota.reset.getTime() - Date.now()) / (1000 * 60 * 60));
    return `QwenCode CLI: ${remaining}/${this.quota.daily} calls remaining (resets in ${hours}h)`;
  }

  async *run(prompt: string, workingDirectory: string): AsyncIterableIterator<AgentEvent> {
    if (!this.isAvailable()) {
      yield {
        type: 'error',
        message: `QwenCode quota exceeded (${this.quota.used}/${this.quota.daily}). Try /agent aider`
      };
      return;
    }

    console.log(`[QwenCode] Running in ${workingDirectory}`);

    this.quota.used++;
    this.saveQuota();

    try {
      // QwenCode uses same interface as Gemini CLI
      const qwen = spawn('qwencode', ['-y'], {
        cwd: workingDirectory,
        shell: true,
      });

      qwen.stdin.write(prompt + '\n');
      qwen.stdin.end();

      let buffer = '';

      for await (const chunk of qwen.stdout) {
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
        qwen.on('close', (code) => resolve(code || 0));
      });

      if (exitCode === 0) {
        yield { type: 'turn.completed' };
      } else {
        yield {
          type: 'turn.failed',
          error: { message: `QwenCode CLI exited with code ${exitCode}` }
        };
      }

    } catch (error: any) {
      yield {
        type: 'error',
        message: `QwenCode CLI error: ${error.message}`
      };
      yield {
        type: 'turn.failed',
        error: { message: error.message }
      };
    }
  }
}
