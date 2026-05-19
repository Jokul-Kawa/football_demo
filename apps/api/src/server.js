import http from 'node:http';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

const server = http.createServer(createApp());

server.listen(port, host, () => {
  console.log(`World Cup 2026 assistant API listening on http://${host}:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

