/**
 * Main Message Handler
 *
 * Core message processing with Codex integration and streaming
 * Reference: telegram_bot.py lines 452-674
 */

import { Context } from 'telegraf';
import { getOrCreateSession, saveUserSession } from '../../session/manager.js';
import { runWithAgent } from '../../agents/router.js';
import { sendLongMessage } from '../utils/message-splitter.js';

/**
 * Handle incoming text messages from users
 *
 * Main workflow:
 * 1. Load or create user session
 * 2. Get or create Codex thread
 * 3. Build enhanced prompt with frontend verification
 * 4. Stream Codex response
 * 5. Send messages to Telegram in real-time
 * 6. Send screenshots after completion
 * 7. Save updated session
 */
export async function handleMessage(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('❌ Unable to identify user');
    return;
  }

  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  if (!messageText || messageText.trim() === '') {
    return;
  }

  try {
    // 1. Load or create session
    const session = getOrCreateSession(userId);
    const cwd = session.cwd;
    const agentType = session.agent || 'auto';

    console.log(`Processing message from user ${userId} in ${cwd} with ${agentType} agent`);

    // 2. Send typing indicator
    await ctx.sendChatAction('typing');

    let lastTypingUpdate = Date.now();
    const typingInterval = 5000;

    try {
      // 3. Stream agent response
      for await (const event of runWithAgent(agentType, messageText, cwd)) {
        console.log('[Agent Event]', event);

        // Update typing indicator periodically
        const now = Date.now();
        if (now - lastTypingUpdate > typingInterval) {
          await ctx.sendChatAction('typing');
          lastTypingUpdate = now;
        }

        // Handle different event types
        if (event.type === 'error') {
          console.error('Agent error:', event.message);
          await ctx.reply(`⚠️ ${event.message}`);
          continue;
        }

        if (event.type === 'turn.failed') {
          console.error('Turn failed:', event.error?.message);
          await ctx.reply(`❌ ${event.error?.message || 'Task failed'}\n\nTry again or use /reset`);
          break;
        }

        if (event.type === 'text' && event.content) {
          await sendLongMessage(ctx, event.content);
        }

        if (event.type === 'turn.completed') {
          console.log('Turn completed successfully');
          // Save session
          session.last_updated = new Date().toISOString();
          saveUserSession(userId, session);
          break;
        }
      }
    } catch (error: any) {
      console.error('Error processing agent:', error);
      await ctx.reply(
        `❌ Error: ${error.message}\n\nTry again or use /reset if the issue persists.`
      );
    }

  } catch (error: any) {
    console.error('Error in message handler:', error);
    await ctx.reply(
      `❌ Something went wrong: ${error.message}\n\nPlease try again or use /reset`
    );
  }
}
