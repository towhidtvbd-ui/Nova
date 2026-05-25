import fs from 'node:fs';
import path from 'node:path';

export class CheckpointManager {
  constructor(private readonly workspaceRoot: string) {}

  private get checkpointsDir(): string {
    return path.join(this.workspaceRoot, '.nova_checkpoints');
  }

  snapshot(filePath: string): string | null {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = path.basename(filePath).replace(/[^a-zA-Z0-9._-]/g, '_');
    fs.mkdirSync(this.checkpointsDir, { recursive: true });
    const checkpointPath = path.join(this.checkpointsDir, `${safeName}.${stamp}.bak`);
    fs.copyFileSync(filePath, checkpointPath);
    return checkpointPath;
  }

  rollback(checkpointPath: string, targetPath: string): void {
    if (!fs.existsSync(checkpointPath)) {
      throw new Error(`Checkpoint not found: ${checkpointPath}`);
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(checkpointPath, targetPath);
  }
}
