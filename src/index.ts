import { config } from './config.js';
import { MemoryStore } from './memory.js';
import { CheckpointManager } from './checkpoint.js';
import { ToolRuntime } from './tools.js';
import { Orchestrator } from './orchestrator.js';
import { startTelegram } from './telegram.js';
import { startMobileServer } from './mobile-server.js';

const memory = new MemoryStore(config.DATABASE_PATH);
const checkpoints = new CheckpointManager(config.WORKSPACE_ROOT);
const tools = new ToolRuntime(config.WORKSPACE_ROOT, checkpoints);
const orchestrator = new Orchestrator(
  config.OPENROUTER_API_KEY,
  config.OPENROUTER_MODEL,
  memory,
  tools,
  config.MAX_HISTORY_MESSAGES
);

if (config.APP_MODE === 'mobile') {
  startMobileServer(config.MOBILE_PORT, orchestrator);
} else {
  if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_ALLOWED_CHAT_ID) {
    throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_ALLOWED_CHAT_ID are required in telegram mode');
  }
  startTelegram(config.TELEGRAM_BOT_TOKEN, config.TELEGRAM_ALLOWED_CHAT_ID, orchestrator);
}

console.log(`Nova AI OS started in ${config.APP_MODE} mode.`);
