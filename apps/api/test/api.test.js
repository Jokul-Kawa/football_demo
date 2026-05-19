import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('World Cup assistant API', () => {
  it('returns health status', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
  });

  it('returns 104 seeded matches with Beijing time', async () => {
    const response = await fetch(`${baseUrl}/matches`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.total, 104);
    assert.match(body.data[0].beijingKickoff, /^2026-/);
  });

  it('filters matches by stage and team slot', async () => {
    const stageResponse = await fetch(`${baseUrl}/matches?stage=group`);
    const stageBody = await stageResponse.json();
    assert.equal(stageBody.total, 72);

    const teamResponse = await fetch(`${baseUrl}/matches?teamId=a1`);
    const teamBody = await teamResponse.json();
    assert.ok(teamBody.total >= 3);
    assert.ok(teamBody.data.every((match) => match.homeTeam.slot === 'A1' || match.awayTeam.slot === 'A1'));
  });

  it('requires admin token for match updates', async () => {
    const response = await fetch(`${baseUrl}/admin/matches/1/status`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'live', homeScore: 1, awayScore: 0 })
    });
    assert.equal(response.status, 401);
  });

  it('updates live score and exposes live match', async () => {
    const updateResponse = await fetch(`${baseUrl}/admin/matches/1/status`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': 'dev-admin-token'
      },
      body: JSON.stringify({ status: 'live', homeScore: 1, awayScore: 0, clockMinute: 32 })
    });
    const updateBody = await updateResponse.json();
    assert.equal(updateResponse.status, 200);
    assert.equal(updateBody.data.status, 'live');
    assert.equal(updateBody.data.homeScore, 1);

    const liveResponse = await fetch(`${baseUrl}/live/matches`);
    const liveBody = await liveResponse.json();
    assert.equal(liveResponse.status, 200);
    assert.ok(liveBody.data.some((match) => match.id === '1'));
  });

  it('adds match events and news articles', async () => {
    const eventResponse = await fetch(`${baseUrl}/admin/matches/1/events`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': 'dev-admin-token'
      },
      body: JSON.stringify({ minute: 33, type: 'goal', teamId: 'a1', playerName: '测试球员', description: 'A1 先进一球' })
    });
    assert.equal(eventResponse.status, 201);

    const matchResponse = await fetch(`${baseUrl}/matches/1`);
    const matchBody = await matchResponse.json();
    assert.equal(matchBody.data.events.length, 1);

    const newsResponse = await fetch(`${baseUrl}/admin/news`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': 'dev-admin-token'
      },
      body: JSON.stringify({ title: '测试战报', summary: '比分更新测试', category: '战报' })
    });
    assert.equal(newsResponse.status, 201);

    const listResponse = await fetch(`${baseUrl}/news`);
    const listBody = await listResponse.json();
    assert.ok(listBody.data.some((article) => article.title === '测试战报'));
  });

  it('saves notification preferences', async () => {
    const response = await fetch(`${baseUrl}/notification-preferences`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'device-1',
        favoriteTeamIds: ['a1', 'd1'],
        reminderMinutes: [1440, 60, 15]
      })
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.deepEqual(body.data.reminderMinutes, [1440, 60, 15]);

    const readResponse = await fetch(`${baseUrl}/notification-preferences?deviceId=device-1`);
    assert.equal(readResponse.status, 200);
  });
});

