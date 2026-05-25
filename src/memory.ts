import Database from 'better-sqlite3';

export type Role = 'user' | 'assistant' | 'system';

export class MemoryStore {
  private db: Database.Database;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  addMessage(chatId: string, role: Role, content: string): void {
    this.db
      .prepare('INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)')
      .run(chatId, role, content);
  }

  getRecent(chatId: string, limit = 12): Array<{ role: Role; content: string }> {
    const rows = this.db
      .prepare(
        'SELECT role, content FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT ?'
      )
      .all(chatId, limit) as Array<{ role: Role; content: string }>;

    return rows.reverse();
  }
}
