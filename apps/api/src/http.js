import { InputError } from './store.js';

export async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new InputError('Request body must be valid JSON');
  }
}

export function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers
  });
  response.end(JSON.stringify(payload));
}

export function sendError(response, error) {
  const statusCode = error.statusCode ?? 500;
  sendJson(response, statusCode, {
    error: statusCode === 500 ? 'Internal Server Error' : error.message
  });
}

export function notFound(response) {
  sendJson(response, 404, { error: 'Not Found' });
}

export function methodNotAllowed(response) {
  sendJson(response, 405, { error: 'Method Not Allowed' });
}

export function requireAdmin(request) {
  const expected = process.env.ADMIN_TOKEN ?? 'dev-admin-token';
  const actual = request.headers['x-admin-token'];
  if (actual !== expected) {
    const error = new Error('Admin token required');
    error.statusCode = 401;
    throw error;
  }

  return {
    id: request.headers['x-actor-id'] ?? 'dev-admin',
    name: request.headers['x-actor-name'] ?? '开发管理员',
    role: request.headers['x-actor-role'] ?? 'cfl_admin'
  };
}

export function parseUrl(request) {
  return new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
}

export function sendSseHeaders(response) {
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });
}
