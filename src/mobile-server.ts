import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Orchestrator } from './orchestrator.js';

export function startMobileServer(port: number, orchestrator: Orchestrator): void {
  const publicDir = path.resolve('public');

  const server = http.createServer(async (req, res) => {
    if (!req.url) return;

    if (req.method === 'POST' && req.url === '/api/chat') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body) as { chatId?: string; message?: string };
          if (!parsed.chatId || !parsed.message) {
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ error: 'chatId and message are required' }));
            return;
          }
          const reply = await orchestrator.handle(parsed.chatId, parsed.message);
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ reply }));
        } catch (error) {
          res.writeHead(500, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      });
      return;
    }

    const target = req.url === '/' ? 'index.html' : req.url.slice(1);
    const filePath = path.join(publicDir, target);
    if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const data = fs.readFileSync(filePath);
    const contentType = filePath.endsWith('.html') ? 'text/html' : 'text/plain';
    res.writeHead(200, { 'content-type': contentType });
    res.end(data);
  });

  server.listen(port, () => {
    console.log(`Nova mobile server listening on http://0.0.0.0:${port}`);
  });
}
