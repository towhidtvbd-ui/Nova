import OpenAI from 'openai';
import { z } from 'zod';
import { MemoryStore } from './memory.js';
import { ToolRuntime } from './tools.js';
import { SYSTEM_PROMPT } from './config.js';

const toolRequestSchema = z.object({
  tool: z.enum(['run_shell', 'read_file', 'write_file', 'list_dir', 'rollback']),
  args: z.record(z.any()).default({}),
  reason: z.string().optional()
});

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class Orchestrator {
  private client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
    private readonly memory: MemoryStore,
    private readonly tools: ToolRuntime,
    private readonly maxHistoryMessages: number
  ) {
    this.client = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' });
  }

  async handle(chatId: string, userInput: string): Promise<string> {
    this.memory.addMessage(chatId, 'user', userInput);

    const history = this.memory.getRecent(chatId, this.maxHistoryMessages);
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content as string }))
    ];

    for (let i = 0; i < 4; i += 1) {
      const answer = await this.complete(messages);
      const toolRequest = this.tryParseToolRequest(answer);

      if (!toolRequest) {
        this.memory.addMessage(chatId, 'assistant', answer);
        return answer;
      }

      const toolResult = this.executeTool(toolRequest.tool, toolRequest.args);
      messages.push({ role: 'assistant', content: answer });
      messages.push({
        role: 'user',
        content: `Tool result for ${toolRequest.tool}: ${JSON.stringify(toolResult)}`
      });
    }

    const fallback = 'I stopped after multiple tool iterations to stay safe. Please refine the request.';
    this.memory.addMessage(chatId, 'assistant', fallback);
    return fallback;
  }

  private async complete(messages: ChatMessage[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages
    });
    return completion.choices[0]?.message?.content?.trim() ?? 'No response from model.';
  }

  private tryParseToolRequest(text: string) {
    try {
      return toolRequestSchema.parse(JSON.parse(text));
    } catch {
      return null;
    }
  }

  private executeTool(tool: string, args: Record<string, unknown>) {
    switch (tool) {
      case 'run_shell':
        return this.tools.runShell(String(args.command ?? ''));
      case 'read_file':
        return this.tools.readFile(String(args.path ?? ''));
      case 'write_file':
        return this.tools.writeFile(String(args.path ?? ''), String(args.content ?? ''));
      case 'list_dir':
        return this.tools.listDir(String(args.path ?? '.'));
      case 'rollback':
        return this.tools.rollback(
          String(args.checkpointPath ?? ''),
          String(args.targetPath ?? '')
        );
      default:
        return { ok: false, error: `Unknown tool: ${tool}` };
    }
  }
}
