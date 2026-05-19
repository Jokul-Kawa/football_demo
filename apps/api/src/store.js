import { createSeedData, formatBeijingTime } from './seed.js';

export function createStore(seed = createSeedData()) {
  const state = seed;

  function listMatches(filters = {}) {
    return state.matches.filter((match) => {
      if (filters.stage && match.stage !== filters.stage) {
        return false;
      }

      if (filters.date && !match.beijingKickoff.startsWith(filters.date)) {
        return false;
      }

      if (filters.venue && !match.venue.toLowerCase().includes(filters.venue.toLowerCase())) {
        return false;
      }

      if (filters.teamId) {
        const teamId = filters.teamId.toLowerCase();
        return match.homeTeam.id === teamId || match.awayTeam.id === teamId || match.homeTeam.slot?.toLowerCase() === teamId || match.awayTeam.slot?.toLowerCase() === teamId;
      }

      return true;
    });
  }

  function getMatch(matchId) {
    return state.matches.find((match) => match.id === String(matchId));
  }

  function listLiveMatches() {
    return state.matches.filter((match) => ['live', 'halftime', 'extraTime', 'penalties'].includes(match.status));
  }

  function listNews() {
    return [...state.articles].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  function addArticle(article) {
    const now = new Date().toISOString();
    const next = {
      id: article.id ?? `article-${cryptoRandomId()}`,
      title: requiredString(article.title, 'title'),
      summary: requiredString(article.summary, 'summary'),
      category: article.category ?? '即时资讯',
      sourceName: article.sourceName ?? '运营编辑',
      imageUrl: article.imageUrl ?? null,
      publishedAt: article.publishedAt ?? now
    };
    state.articles.push(next);
    return next;
  }

  function updateMatchStatus(matchId, patch) {
    const match = getMatch(matchId);
    if (!match) {
      return null;
    }

    const nextStatus = patch.status ?? match.status;
    assertAllowed(nextStatus, ['scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled', 'extraTime', 'penalties'], 'status');

    match.status = nextStatus;
    match.clockMinute = patch.clockMinute ?? match.clockMinute;
    match.homeScore = patch.homeScore ?? match.homeScore;
    match.awayScore = patch.awayScore ?? match.awayScore;
    match.lastUpdatedAt = new Date().toISOString();
    if (patch.kickoffUtc) {
      match.kickoffUtc = patch.kickoffUtc;
      match.beijingKickoff = formatBeijingTime(patch.kickoffUtc);
    }

    return match;
  }

  function addMatchEvent(matchId, event) {
    const match = getMatch(matchId);
    if (!match) {
      return null;
    }

    const next = {
      id: event.id ?? `event-${cryptoRandomId()}`,
      matchId: String(matchId),
      minute: event.minute ?? null,
      type: requiredString(event.type, 'type'),
      teamId: event.teamId ?? null,
      playerName: event.playerName ?? null,
      description: requiredString(event.description, 'description'),
      createdAt: new Date().toISOString()
    };

    match.events.push(next);
    match.lastUpdatedAt = next.createdAt;
    return next;
  }

  function saveNotificationPreference(payload) {
    const deviceId = requiredString(payload.deviceId, 'deviceId');
    const preference = {
      deviceId,
      favoriteTeamIds: Array.isArray(payload.favoriteTeamIds) ? payload.favoriteTeamIds.map(String) : [],
      reminderMinutes: normalizeReminderMinutes(payload.reminderMinutes),
      quietHours: payload.quietHours ?? { enabled: true, start: '23:30', end: '07:30' },
      updatedAt: new Date().toISOString()
    };
    state.notificationPreferences.set(deviceId, preference);
    return preference;
  }

  function getNotificationPreference(deviceId) {
    return state.notificationPreferences.get(deviceId) ?? null;
  }

  function upsertBroadcastLink(payload) {
    const id = requiredString(payload.id, 'id');
    const link = {
      id,
      label: requiredString(payload.label, 'label'),
      provider: requiredString(payload.provider, 'provider'),
      url: requiredString(payload.url, 'url'),
      type: payload.type ?? 'external',
      authorized: payload.authorized !== false,
      note: payload.note ?? '仅作官方平台跳转。'
    };
    const index = state.broadcastLinks.findIndex((item) => item.id === id);
    if (index >= 0) {
      state.broadcastLinks[index] = link;
    } else {
      state.broadcastLinks.push(link);
    }
    return link;
  }

  function addSseClient(matchId, response) {
    const key = String(matchId);
    const clients = state.sseClients.get(key) ?? new Set();
    clients.add(response);
    state.sseClients.set(key, clients);
    return () => {
      clients.delete(response);
      if (clients.size === 0) {
        state.sseClients.delete(key);
      }
    };
  }

  function broadcastMatch(matchId, payload) {
    const clients = state.sseClients.get(String(matchId));
    if (!clients) {
      return;
    }

    for (const client of clients) {
      client.write(`event: match-update\n`);
      client.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  return {
    state,
    listMatches,
    getMatch,
    listLiveMatches,
    listNews,
    addArticle,
    updateMatchStatus,
    addMatchEvent,
    saveNotificationPreference,
    getNotificationPreference,
    upsertBroadcastLink,
    addSseClient,
    broadcastMatch
  };
}

function normalizeReminderMinutes(value) {
  const allowed = new Set([15, 60, 1440]);
  const values = Array.isArray(value) ? value : [1440, 60, 15];
  return values.map(Number).filter((item) => allowed.has(item));
}

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InputError(`${field} is required`);
  }
  return value.trim();
}

function assertAllowed(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new InputError(`${field} must be one of: ${allowed.join(', ')}`);
  }
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2, 10);
}

export class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputError';
    this.statusCode = 400;
  }
}

