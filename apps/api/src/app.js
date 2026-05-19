import { createStore } from './store.js';
import { methodNotAllowed, notFound, parseUrl, readJson, requireAdmin, sendError, sendJson, sendSseHeaders } from './http.js';

export function createApp(options = {}) {
  const store = options.store ?? createStore();

  async function handler(request, response) {
    try {
      const url = parseUrl(request);
      const path = normalizePath(url.pathname);

      if (request.method === 'OPTIONS') {
        return sendJson(response, 204, null, corsHeaders());
      }

      if (request.method === 'GET' && path === '/health') {
        return sendJson(response, 200, {
          ok: true,
          service: 'world-cup-2026-assistant-api',
          generatedAt: store.state.generatedAt
        }, corsHeaders());
      }

      if (request.method === 'GET' && path === '/matches') {
        return sendJson(response, 200, {
          data: store.listMatches(Object.fromEntries(url.searchParams.entries())),
          total: store.listMatches(Object.fromEntries(url.searchParams.entries())).length
        }, corsHeaders());
      }

      const matchDetail = path.match(/^\/matches\/([^/]+)$/);
      if (request.method === 'GET' && matchDetail) {
        const match = store.getMatch(matchDetail[1]);
        if (!match) {
          return notFound(response);
        }
        return sendJson(response, 200, { data: hydrateMatch(match, store) }, corsHeaders());
      }

      if (request.method === 'GET' && path === '/live/matches') {
        return sendJson(response, 200, { data: store.listLiveMatches().map((match) => hydrateMatch(match, store)) }, corsHeaders());
      }

      if (request.method === 'GET' && path === '/news') {
        return sendJson(response, 200, { data: store.listNews() }, corsHeaders());
      }

      if (request.method === 'GET' && path === '/broadcast-links') {
        return sendJson(response, 200, { data: store.state.broadcastLinks }, corsHeaders());
      }

      if (request.method === 'POST' && path === '/notification-preferences') {
        const payload = await readJson(request);
        return sendJson(response, 201, { data: store.saveNotificationPreference(payload) }, corsHeaders());
      }

      if (request.method === 'GET' && path === '/notification-preferences') {
        const deviceId = url.searchParams.get('deviceId');
        const preference = deviceId ? store.getNotificationPreference(deviceId) : null;
        if (!preference) {
          return notFound(response);
        }
        return sendJson(response, 200, { data: preference }, corsHeaders());
      }

      const streamMatch = path.match(/^\/stream\/matches\/([^/]+)$/);
      if (request.method === 'GET' && streamMatch) {
        const match = store.getMatch(streamMatch[1]);
        if (!match) {
          return notFound(response);
        }

        sendSseHeaders(response);
        response.write(`event: snapshot\n`);
        response.write(`data: ${JSON.stringify(hydrateMatch(match, store))}\n\n`);
        const removeClient = store.addSseClient(match.id, response);
        request.on('close', removeClient);
        return;
      }

      const adminStatus = path.match(/^\/admin\/matches\/([^/]+)\/status$/);
      if (adminStatus) {
        if (request.method !== 'POST') {
          return methodNotAllowed(response);
        }
        requireAdmin(request);
        const payload = await readJson(request);
        const match = store.updateMatchStatus(adminStatus[1], payload);
        if (!match) {
          return notFound(response);
        }
        store.broadcastMatch(match.id, hydrateMatch(match, store));
        return sendJson(response, 200, { data: hydrateMatch(match, store) }, corsHeaders());
      }

      const adminEvent = path.match(/^\/admin\/matches\/([^/]+)\/events$/);
      if (adminEvent) {
        if (request.method !== 'POST') {
          return methodNotAllowed(response);
        }
        requireAdmin(request);
        const payload = await readJson(request);
        const event = store.addMatchEvent(adminEvent[1], payload);
        if (!event) {
          return notFound(response);
        }
        store.broadcastMatch(adminEvent[1], hydrateMatch(store.getMatch(adminEvent[1]), store));
        return sendJson(response, 201, { data: event }, corsHeaders());
      }

      if (path === '/admin/news') {
        if (request.method !== 'POST') {
          return methodNotAllowed(response);
        }
        requireAdmin(request);
        const payload = await readJson(request);
        return sendJson(response, 201, { data: store.addArticle(payload) }, corsHeaders());
      }

      if (path === '/admin/broadcast-links') {
        if (request.method !== 'POST') {
          return methodNotAllowed(response);
        }
        requireAdmin(request);
        const payload = await readJson(request);
        return sendJson(response, 201, { data: store.upsertBroadcastLink(payload) }, corsHeaders());
      }

      return notFound(response);
    } catch (error) {
      return sendError(response, error);
    }
  }

  handler.store = store;
  return handler;
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function hydrateMatch(match, store) {
  return {
    ...match,
    broadcastLinks: match.broadcastLinkIds
      .map((id) => store.state.broadcastLinks.find((link) => link.id === id))
      .filter(Boolean)
  };
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-admin-token'
  };
}

