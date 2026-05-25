import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().min(1).default('openai/gpt-oss-20b:free'),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_ALLOWED_CHAT_ID: z.string().default(''),
  WORKSPACE_ROOT: z.string().default(process.cwd()),
  DATABASE_PATH: z.string().default('./nova.db'),
  MAX_HISTORY_MESSAGES: z.coerce.number().int().positive().default(20),
  APP_MODE: z.enum(['mobile', 'telegram']).default('mobile'),
  MOBILE_PORT: z.coerce.number().int().positive().default(8787)
});

export const config = schema.parse(process.env);

export const SYSTEM_PROMPT = `You are Nova Orchestrator.
When a tool is needed, you MUST respond with only valid JSON:
{"tool":"run_shell|read_file|write_file|list_dir|rollback","args":{...},"reason":"short reason"}
For normal replies, return plain text.
Never run destructive operations unless explicitly asked.
Always prefer scoped paths under WORKSPACE_ROOT.`;
