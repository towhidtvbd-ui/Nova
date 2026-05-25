import TelegramBot from 'node-telegram-bot-api';
import { Orchestrator } from './orchestrator.js';

export function startTelegram(
  token: string,
  allowedChatId: string,
  orchestrator: Orchestrator
): void {
  const bot = new TelegramBot(token, { polling: true });

  bot.on('message', async (msg) => {
    const chatId = String(msg.chat.id);
    if (chatId !== allowedChatId) return;
    const input = msg.text?.trim();
    if (!input) return;

    try {
      await bot.sendMessage(chatId, '🧠 Thinking...');
      const out = await orchestrator.handle(chatId, input);
      await bot.sendMessage(chatId, out.slice(0, 3900));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await bot.sendMessage(chatId, `❌ Error: ${message}`);
    }
  });
}
