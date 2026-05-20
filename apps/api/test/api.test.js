import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

const adminHeaders = {
  'content-type': 'application/json',
  'x-admin-token': 'dev-admin-token',
  'x-actor-id': 'tester-1',
  'x-actor-name': 'test-reviewer',
  'x-actor-role': 'cfl_admin'
};

before(async () => {
  server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('CFL intelligent operations API', () => {
  it('returns health status for the CFL operations service', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.service, 'cfl-intelligent-operations-api');
  });

  it('returns an operations dashboard with risks and workflow tasks', async () => {
    const response = await fetch(`${baseUrl}/dashboard/operations`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.ok(body.data.leagues.total >= 4);
    assert.ok(body.data.admissions.total >= 2);
    assert.ok(body.data.openRiskAlerts.length >= 1);
    assert.ok(body.data.upcomingTasks.length >= 1);
  });

  it('lists leagues, clubs, and filtered club admissions', async () => {
    const leaguesResponse = await fetch(`${baseUrl}/leagues`);
    const leaguesBody = await leaguesResponse.json();
    assert.equal(leaguesResponse.status, 200);
    assert.ok(leaguesBody.data.some((league) => league.id === 'csl'));

    const clubsResponse = await fetch(`${baseUrl}/clubs?leagueId=csl`);
    const clubsBody = await clubsResponse.json();
    assert.equal(clubsResponse.status, 200);
    assert.ok(clubsBody.total >= 2);

    const admissionsResponse = await fetch(`${baseUrl}/club-admissions?status=under_review`);
    const admissionsBody = await admissionsResponse.json();
    assert.equal(admissionsResponse.status, 200);
    assert.ok(admissionsBody.data.every((item) => item.status === 'under_review'));
  });

  it('requires admin token for creating sensitive workflow records', async () => {
    const response = await fetch(`${baseUrl}/club-admissions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ season: '2026', leagueId: 'csl', clubId: 'nanjing-city' })
    });
    assert.equal(response.status, 401);
  });

  it('creates and reviews a club admission case with audit logging', async () => {
    const createResponse = await fetch(`${baseUrl}/club-admissions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        season: '2026',
        leagueId: 'cl1',
        clubId: 'nanjing-city',
        materials: [{ id: 'license', name: '主体文件', status: 'submitted' }]
      })
    });
    const createBody = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createBody.data.status, 'submitted');

    const reviewResponse = await fetch(`${baseUrl}/club-admissions/${createBody.data.id}/review`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        status: 'needs_supplement',
        currentReviewer: '中足联准入组',
        reviewNote: '补充薪酬清偿证明'
      })
    });
    const reviewBody = await reviewResponse.json();
    assert.equal(reviewResponse.status, 200);
    assert.equal(reviewBody.data.status, 'needs_supplement');

    const auditResponse = await fetch(`${baseUrl}/audit-logs`, { headers: adminHeaders });
    const auditBody = await auditResponse.json();
    assert.ok(auditBody.data.some((item) => item.entityId === createBody.data.id && item.action === 'review'));
  });

  it('tracks match-day incidents and escalates risk', async () => {
    const response = await fetch(`${baseUrl}/match-operations/match-op-2026-csl-001/incidents`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        type: 'security',
        severity: 'high',
        description: '客队球迷入口短时拥堵'
      })
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.data.severity, 'high');

    const detailResponse = await fetch(`${baseUrl}/match-operations/match-op-2026-csl-001`);
    const detailBody = await detailResponse.json();
    assert.equal(detailBody.data.riskLevel, 'high');
    assert.ok(detailBody.data.incidents.some((item) => item.type === 'security'));
  });

  it('creates venue inspection records for rectification loops', async () => {
    const response = await fetch(`${baseUrl}/venue-inspections`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        venueId: 'test-venue',
        venueName: '测试体育场',
        leagueId: 'cl2',
        score: 78,
        status: 'rectification_required',
        checklist: [{ id: 'lighting', title: '灯光照度', status: 'warning', note: '需复测' }]
      })
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.data.venueName, '测试体育场');
  });

  it('protects player registrations and discipline cases behind admin access', async () => {
    const publicResponse = await fetch(`${baseUrl}/player-registrations`);
    assert.equal(publicResponse.status, 401);

    const protectedResponse = await fetch(`${baseUrl}/player-registrations`, { headers: adminHeaders });
    const protectedBody = await protectedResponse.json();
    assert.equal(protectedResponse.status, 200);
    assert.ok(protectedBody.total >= 2);

    const disciplineResponse = await fetch(`${baseUrl}/discipline-cases`, { headers: adminHeaders });
    assert.equal(disciplineResponse.status, 200);
  });

  it('generates AI reports with traceability and human review status', async () => {
    const response = await fetch(`${baseUrl}/ai/reports/generate`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        reportType: 'admission_summary',
        relatedType: 'clubAdmission',
        relatedId: 'admission-2026-shandong-taishan'
      })
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.data.reviewStatus, 'pending_human_review');
    assert.equal(body.data.relatedId, 'admission-2026-shandong-taishan');
    assert.match(body.data.disclaimer, /不能替代人工审核/);
    assert.ok(body.data.inputDataVersion.includes('clubAdmission'));
  });
});
