/**
 * Main Message Handler
 *
 * Core message processing with FREE Codex drop-in replacement
 * Uses OpenRouter + Aider instead of official Codex SDK
 */

import { Context } from 'telegraf';
import { getOrCreateSession, saveUserSession } from '../../session/manager.js';
import { getOrCreateThread, runStreaming } from '../../codex/client.js';
import { isItemCompleted, processItemCompleted } from '../../codex/events.js';
import { sendLongMessage } from '../utils/message-splitter.js';

/**
 * Handle incoming text messages from users
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

    console.log(`Processing message from user ${userId} in ${cwd}`);

    // 2. Get or create thread
    const thread = getOrCreateThread(session.thread_id, cwd);

    // Update session with thread ID
    if (thread.id !== session.thread_id) {
      session.thread_id = thread.id;
    }

    // 3. Send typing indicator
    await ctx.sendChatAction('typing');

    let lastTypingUpdate = Date.now();
    const typingInterval = 5000;

    try {
      // 4. Stream coding agent response
      const result = await runStreaming(thread, messageText);

      for await (const event of result.events) {
        console.log('[Codex Event]', event.type);

        // Update typing indicator periodically
        const now = Date.now();
        if (now - lastTypingUpdate > typingInterval) {
          await ctx.sendChatAction('typing');
          lastTypingUpdate = now;
        }

        // Handle item.completed events (messages from agent)
        if (isItemCompleted(event)) {
          const processed = processItemCompleted(event);

          if (processed && processed.content) {
            await sendLongMessage(ctx, processed.content);
          }
        }

        // Handle turn completion
        if (event.type === 'turn.completed') {
          console.log('Turn completed successfully');
          session.last_updated = new Date().toISOString();
          saveUserSession(userId, session);
          break;
        }

        // Handle turn failure
        if (event.type === 'turn.failed') {
          console.error('Turn failed:', event.error);
          await ctx.reply(
            `❌ ${event.error?.message || 'Task failed'}\n\nTry again or use /reset`
          );
          break;
        }
      }
    } catch (error: any) {
      console.error('Error processing message:', error);
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
