/**
 * /agent command - Switch between coding agents
 */

import { Context } from 'telegraf';
import { getOrCreateSession, saveUserSession } from '../../session/manager.js';
import { getAllAgentStatuses } from '../../agents/router.js';
import { AgentType } from '../../agents/types.js';

export async function agentCommand(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('❌ Unable to identify user');
    return;
  }

  const args = ctx.message && 'text' in ctx.message
    ? ctx.message.text.split(' ').slice(1)
    : [];

  const session = getOrCreateSession(userId);

  // No args - show current agent and status
  if (args.length === 0) {
    const currentAgent = session.agent || 'auto';
    const statuses = getAllAgentStatuses();

    await ctx.reply(
      `🤖 *Current Agent:* \`${currentAgent}\`\n\n` +
      `*Available Agents:*\n` +
      `${statuses}\n\n` +
      `*Commands:*\n` +
      `/agent gemini - Best quality (100/day)\n` +
      `/agent qwen - Workhorse (2000/day)\n` +
      `/agent aider - Unlimited fallback\n` +
      `/agent auto - Smart selection (default)\n` +
      `/agent status - Show quota usage`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const command = args[0].toLowerCase();

  // Show status
  if (command === 'status') {
    const statuses = getAllAgentStatuses();
    await ctx.reply(`📊 *Agent Status:*\n\n${statuses}`, { parse_mode: 'Markdown' });
    return;
  }

  // Switch agent
  const validAgents: Array<AgentType | 'auto'> = ['gemini', 'qwen', 'aider', 'auto'];

  if (!validAgents.includes(command as any)) {
    await ctx.reply(
      `❌ Invalid agent. Use: gemini, qwen, aider, or auto`
    );
    return;
  }

  session.agent = command as AgentType | 'auto';
  saveUserSession(userId, session);

  await ctx.reply(
    `✅ Switched to **${command}** agent\n\n` +
    `Send me a coding task to try it out!`,
    { parse_mode: 'Markdown' }
  );
}
