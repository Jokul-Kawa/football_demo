import { createStore } from './store.js';
import { methodNotAllowed, notFound, parseUrl, readJson, requireAdmin, sendError, sendJson } from './http.js';

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
          service: 'cfl-intelligent-operations-api',
          generatedAt: store.state.generatedAt
        }, corsHeaders());
      }

      if (request.method === 'GET' && path === '/dashboard/operations') {
        return sendJson(response, 200, { data: store.getDashboardOperations() }, corsHeaders());
      }

      if (request.method === 'GET' && path === '/leagues') {
        return sendJson(response, 200, collectionPayload(store.list('leagues', query(url))), corsHeaders());
      }

      if (request.method === 'GET' && path === '/clubs') {
        return sendJson(response, 200, collectionPayload(store.list('clubs', query(url))), corsHeaders());
      }

      const collectionRoute = matchCollectionRoute(path, store);
      if (collectionRoute) {
        return await handleCollectionRoute(request, response, url, collectionRoute);
      }

      const detailRoute = matchDetailRoute(path);
      if (detailRoute) {
        if (detailRoute.sensitive) {
          requireAdmin(request);
        }
        const item = store.getById(detailRoute.collection, detailRoute.id);
        if (!item) {
          return notFound(response);
        }
        return sendJson(response, 200, { data: item }, corsHeaders());
      }

      const admissionReview = path.match(/^\/club-admissions\/([^/]+)\/review$/);
      if (admissionReview) {
        if (request.method !== 'POST') {
          return methodNotAllowed(response);
        }
        const actor = requireAdmin(request);
        const payload = await readJson(request);
        const admission = store.updateAdmissionStatus(admissionReview[1], payload, actor);
        if (!admission) {
          return notFound(response);
        }
        return sendJson(response, 200, { data: admission }, corsHeaders());
      }

      const matchIncident = path.match(/^\/match-operations\/([^/]+)\/incidents$/);
      if (matchIncident) {
        if (request.method !== 'POST') {
          return methodNotAllowed(response);
        }
        const actor = requireAdmin(request);
        const payload = await readJson(request);
        const incident = store.addMatchIncident(matchIncident[1], payload, actor);
        if (!incident) {
          return notFound(response);
        }
        return sendJson(response, 201, { data: incident }, corsHeaders());
      }

      if (path === '/ai/reports/generate') {
        if (request.method !== 'POST') {
          return methodNotAllowed(response);
        }
        const actor = requireAdmin(request);
        const payload = await readJson(request);
        return sendJson(response, 201, { data: store.generateAiReport(payload, actor) }, corsHeaders());
      }

      if (request.method === 'GET' && path === '/ai/reports') {
        return sendJson(response, 200, collectionPayload(store.list('aiReports', query(url))), corsHeaders());
      }

      if (request.method === 'GET' && path === '/audit-logs') {
        requireAdmin(request);
        return sendJson(response, 200, collectionPayload(store.list('auditLogs', query(url))), corsHeaders());
      }

      return notFound(response);
    } catch (error) {
      return sendError(response, error);
    }
  }

  async function handleCollectionRoute(request, response, url, route) {
    if (request.method === 'GET') {
      if (route.sensitive) {
        requireAdmin(request);
      }
      return sendJson(response, 200, collectionPayload(store.list(route.collection, query(url))), corsHeaders());
    }

    if (request.method !== 'POST') {
      return methodNotAllowed(response);
    }

    const actor = requireAdmin(request);
    const payload = await readJson(request);
    const data = route.create(payload, actor);
    return sendJson(response, 201, { data }, corsHeaders());
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

function query(url) {
  return Object.fromEntries(url.searchParams.entries());
}

function collectionPayload(data) {
  return {
    data,
    total: data.length
  };
}

function matchCollectionRoute(path, store) {
  const routes = {
    '/club-admissions': {
      collection: 'clubAdmissions',
      create: (payload, actor) => store.createClubAdmission(payload, actor)
    },
    '/match-operations': {
      collection: 'matchOperations',
      create: (payload, actor) => store.createMatchOperation(payload, actor)
    },
    '/venue-inspections': {
      collection: 'venueInspections',
      create: (payload, actor) => store.createVenueInspection(payload, actor)
    },
    '/player-registrations': {
      collection: 'playerRegistrations',
      sensitive: true,
      create: (payload, actor) => store.createPlayerRegistration(payload, actor)
    },
    '/discipline-cases': {
      collection: 'disciplineCases',
      sensitive: true,
      create: (payload, actor) => store.createDisciplineCase(payload, actor)
    }
  };

  const route = routes[path];
  if (!route) {
    return null;
  }

  return {
    ...route
  };
}

function matchDetailRoute(path) {
  const routes = [
    ['club-admissions', 'clubAdmissions', false],
    ['match-operations', 'matchOperations', false],
    ['venue-inspections', 'venueInspections', false],
    ['player-registrations', 'playerRegistrations', true],
    ['discipline-cases', 'disciplineCases', true]
  ];

  for (const [segment, collection, sensitive] of routes) {
    const match = path.match(new RegExp(`^/${segment}/([^/]+)$`));
    if (match) {
      return { collection, id: match[1], sensitive };
    }
  }

  return null;
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-admin-token,x-actor-id,x-actor-name,x-actor-role'
  };
}
