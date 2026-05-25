import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { CheckpointManager } from './checkpoint.js';

const BLOCKED = ['rm -rf /', 'mkfs', 'shutdown', 'reboot', ':(){:|:&};:', 'dd if='];

export type ToolResult = { ok: true; output: unknown } | { ok: false; error: string };

export class ToolRuntime {
  constructor(
    private readonly workspaceRoot: string,
    private readonly checkpoints: CheckpointManager
  ) {}

  private resolveInWorkspace(input: string): string {
    const root = path.resolve(this.workspaceRoot);
    const full = path.resolve(root, input);
    const relative = path.relative(root, full);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Path outside WORKSPACE_ROOT: ${input}`);
    }
    return full;
  }

  runShell(command: string): ToolResult {
    try {
      if (BLOCKED.some((x) => command.includes(x))) {
        throw new Error('Command blocked by safety policy');
      }

      const output = execSync(command, {
        cwd: this.workspaceRoot,
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 20_000,
        maxBuffer: 1024 * 1024
      }).trim();

      return { ok: true, output };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  readFile(filePath: string): ToolResult {
    try {
      const safe = this.resolveInWorkspace(filePath);
      return { ok: true, output: fs.readFileSync(safe, 'utf-8') };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  writeFile(filePath: string, content: string): ToolResult {
    try {
      const safe = this.resolveInWorkspace(filePath);
      const checkpoint = this.checkpoints.snapshot(safe);
      fs.mkdirSync(path.dirname(safe), { recursive: true });
      fs.writeFileSync(safe, content, 'utf-8');
      return {
        ok: true,
        output: { message: 'file written', checkpoint: checkpoint ?? null, path: safe }
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  listDir(dirPath: string): ToolResult {
    try {
      const safe = this.resolveInWorkspace(dirPath);
      return { ok: true, output: fs.readdirSync(safe) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  rollback(checkpointPath: string, targetPath: string): ToolResult {
    try {
      const checkpointSafe = this.resolveInWorkspace(checkpointPath);
      const targetSafe = this.resolveInWorkspace(targetPath);
      this.checkpoints.rollback(checkpointSafe, targetSafe);
      return { ok: true, output: `Rolled back ${targetSafe}` };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
