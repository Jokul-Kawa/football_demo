import { createSeedData } from './seed.js';

export function createStore(seed = createSeedData()) {
  const state = seed;

  function getDashboardOperations() {
    return {
      generatedAt: new Date().toISOString(),
      leagues: {
        total: state.leagues.length,
        active: state.leagues.filter((league) => league.status === 'active').length
      },
      admissions: countByStatus(state.clubAdmissions),
      matchOperations: countByStatus(state.matchOperations),
      venueInspections: countByStatus(state.venueInspections),
      playerRegistrations: countByStatus(state.playerRegistrations),
      disciplineCases: countByStatus(state.disciplineCases),
      openRiskAlerts: state.riskAlerts.filter((alert) => alert.status === 'open'),
      upcomingTasks: [...state.workflowTasks]
        .filter((task) => task.status !== 'done')
        .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
        .slice(0, 5)
    };
  }

  function list(collectionName, filters = {}) {
    const items = state[collectionName] ?? [];
    return items.filter((item) => matchesFilters(item, filters));
  }

  function getById(collectionName, id) {
    return (state[collectionName] ?? []).find((item) => item.id === String(id)) ?? null;
  }

  function createClubAdmission(payload, actor) {
    const now = new Date().toISOString();
    const admission = {
      id: payload.id ?? `admission-${cryptoRandomId()}`,
      season: requiredString(payload.season, 'season'),
      leagueId: requiredString(payload.leagueId, 'leagueId'),
      clubId: requiredString(payload.clubId, 'clubId'),
      status: payload.status ?? 'submitted',
      submittedAt: payload.submittedAt ?? now,
      updatedAt: now,
      currentReviewer: payload.currentReviewer ?? '地方会员协会初审',
      debtClearance: payload.debtClearance ?? {
        status: 'pending',
        playerSalaryConfirmed: false,
        staffSalaryConfirmed: false,
        internationalDebtCaseConfirmed: false,
        publicNoticeStatus: 'not_started',
        complaints: 0
      },
      materials: normalizeArray(payload.materials),
      aiFindings: normalizeArray(payload.aiFindings)
    };
    state.clubAdmissions.push(admission);
    audit(actor, 'create', 'clubAdmission', admission.id, '创建俱乐部准入申请');
    return admission;
  }

  function updateAdmissionStatus(id, payload, actor) {
    const admission = getById('clubAdmissions', id);
    if (!admission) {
      return null;
    }
    const status = requiredString(payload.status, 'status');
    assertAllowed(status, ['submitted', 'under_review', 'needs_supplement', 'approved', 'rejected', 'public_notice'], 'status');
    admission.status = status;
    admission.currentReviewer = payload.currentReviewer ?? admission.currentReviewer;
    admission.reviewNote = payload.reviewNote ?? admission.reviewNote;
    admission.updatedAt = new Date().toISOString();
    audit(actor, 'review', 'clubAdmission', admission.id, `准入状态更新为 ${status}`);
    return admission;
  }

  function createMatchOperation(payload, actor) {
    const now = new Date().toISOString();
    const operation = {
      id: payload.id ?? `match-op-${cryptoRandomId()}`,
      season: requiredString(payload.season, 'season'),
      leagueId: requiredString(payload.leagueId, 'leagueId'),
      round: Number(payload.round ?? 1),
      homeClubId: requiredString(payload.homeClubId, 'homeClubId'),
      awayClubId: requiredString(payload.awayClubId, 'awayClubId'),
      venueId: requiredString(payload.venueId, 'venueId'),
      kickoffAt: requiredString(payload.kickoffAt, 'kickoffAt'),
      status: payload.status ?? 'pre_match',
      riskLevel: payload.riskLevel ?? 'low',
      supervisor: payload.supervisor ?? null,
      updatedAt: now,
      tasks: normalizeArray(payload.tasks),
      incidents: normalizeArray(payload.incidents)
    };
    state.matchOperations.push(operation);
    audit(actor, 'create', 'matchOperation', operation.id, '创建比赛日运营任务');
    return operation;
  }

  function addMatchIncident(id, payload, actor) {
    const operation = getById('matchOperations', id);
    if (!operation) {
      return null;
    }
    const incident = {
      id: payload.id ?? `incident-${cryptoRandomId()}`,
      type: requiredString(payload.type, 'type'),
      severity: payload.severity ?? 'medium',
      description: requiredString(payload.description, 'description'),
      reportedBy: actor.name,
      reportedAt: new Date().toISOString(),
      status: payload.status ?? 'open'
    };
    operation.incidents.push(incident);
    operation.status = payload.operationStatus ?? operation.status;
    operation.riskLevel = escalateRisk(operation.riskLevel, incident.severity);
    operation.updatedAt = incident.reportedAt;
    audit(actor, 'create', 'matchIncident', incident.id, `比赛日事件上报：${incident.type}`);
    return incident;
  }

  function createVenueInspection(payload, actor) {
    const now = new Date().toISOString();
    const inspection = {
      id: payload.id ?? `inspection-${cryptoRandomId()}`,
      venueId: requiredString(payload.venueId, 'venueId'),
      venueName: requiredString(payload.venueName, 'venueName'),
      leagueId: requiredString(payload.leagueId, 'leagueId'),
      inspector: payload.inspector ?? actor.name,
      status: payload.status ?? 'submitted',
      score: Number(payload.score ?? 0),
      inspectedAt: payload.inspectedAt ?? now,
      checklist: normalizeArray(payload.checklist),
      evidence: normalizeArray(payload.evidence)
    };
    state.venueInspections.push(inspection);
    audit(actor, 'create', 'venueInspection', inspection.id, '提交场馆巡检记录');
    return inspection;
  }

  function createPlayerRegistration(payload, actor) {
    const now = new Date().toISOString();
    const registration = {
      id: payload.id ?? `registration-${cryptoRandomId()}`,
      playerName: requiredString(payload.playerName, 'playerName'),
      clubId: requiredString(payload.clubId, 'clubId'),
      leagueId: requiredString(payload.leagueId, 'leagueId'),
      type: payload.type ?? 'domestic_registration',
      status: payload.status ?? 'submitted',
      submittedAt: payload.submittedAt ?? now,
      updatedAt: now,
      checks: normalizeArray(payload.checks)
    };
    state.playerRegistrations.push(registration);
    audit(actor, 'create', 'playerRegistration', registration.id, '提交球员注册/转会材料');
    return registration;
  }

  function createDisciplineCase(payload, actor) {
    const now = new Date().toISOString();
    const disciplineCase = {
      id: payload.id ?? `discipline-${cryptoRandomId()}`,
      leagueId: requiredString(payload.leagueId, 'leagueId'),
      matchOperationId: payload.matchOperationId ?? null,
      subject: requiredString(payload.subject, 'subject'),
      clubId: payload.clubId ?? null,
      status: payload.status ?? 'evidence_collection',
      severity: payload.severity ?? 'medium',
      openedAt: payload.openedAt ?? now,
      dueAt: payload.dueAt ?? null,
      evidence: normalizeArray(payload.evidence),
      aiDraftAvailable: Boolean(payload.aiDraftAvailable)
    };
    state.disciplineCases.push(disciplineCase);
    audit(actor, 'create', 'disciplineCase', disciplineCase.id, '创建纪律案件');
    return disciplineCase;
  }

  function generateAiReport(payload, actor) {
    const reportType = requiredString(payload.reportType, 'reportType');
    const relatedType = requiredString(payload.relatedType, 'relatedType');
    const relatedId = requiredString(payload.relatedId, 'relatedId');
    const source = findRelated(relatedType, relatedId);
    if (!source) {
      const error = new InputError('related resource not found');
      error.statusCode = 404;
      throw error;
    }

    const report = {
      id: `ai-report-${cryptoRandomId()}`,
      reportType,
      relatedType,
      relatedId,
      title: payload.title ?? createAiReportTitle(reportType, source),
      summary: payload.summary ?? createAiSummary(reportType, source),
      findings: payload.findings ?? createAiFindings(reportType, source),
      inputDataVersion: payload.inputDataVersion ?? `${relatedType}:${relatedId}:${source.updatedAt ?? source.openedAt ?? source.inspectedAt ?? state.generatedAt}`,
      reviewStatus: 'pending_human_review',
      generatedAt: new Date().toISOString(),
      generatedBy: actor.name,
      disclaimer: 'AI内容仅用于业务辅助研判，不能替代人工审核、纪律决定或正式审批。'
    };
    state.aiReports.push(report);
    audit(actor, 'generate', 'aiReport', report.id, `生成${reportType}报告`);
    return report;
  }

  function audit(actor, action, entityType, entityId, note) {
    state.auditLogs.push({
      id: `audit-${cryptoRandomId()}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      note,
      createdAt: new Date().toISOString()
    });
  }

  function findRelated(type, id) {
    const map = {
      clubAdmission: 'clubAdmissions',
      matchOperation: 'matchOperations',
      venueInspection: 'venueInspections',
      playerRegistration: 'playerRegistrations',
      disciplineCase: 'disciplineCases'
    };
    return getById(map[type], id);
  }

  return {
    state,
    getDashboardOperations,
    list,
    getById,
    createClubAdmission,
    updateAdmissionStatus,
    createMatchOperation,
    addMatchIncident,
    createVenueInspection,
    createPlayerRegistration,
    createDisciplineCase,
    generateAiReport
  };
}

function matchesFilters(item, filters) {
  return Object.entries(filters).every(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    return String(item[key] ?? '').toLowerCase() === String(value).toLowerCase();
  });
}

function countByStatus(items) {
  return items.reduce((acc, item) => {
    acc.total += 1;
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, { total: 0 });
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function escalateRisk(current, incoming) {
  const levels = ['low', 'medium', 'high', 'critical'];
  return levels.indexOf(incoming) > levels.indexOf(current) ? incoming : current;
}

function createAiReportTitle(reportType, source) {
  const titles = {
    admission_summary: '俱乐部准入智能摘要',
    match_risk: '比赛日运营风险提示',
    venue_rectification: '场馆整改建议',
    discipline_draft: '纪律案件文书草稿',
    annual_report: '联赛年度数据报告'
  };
  return `${titles[reportType] ?? 'AI业务报告'} - ${source.id}`;
}

function createAiSummary(reportType, source) {
  if (reportType === 'admission_summary') {
    const missing = (source.materials ?? []).filter((item) => item.status === 'missing');
    return missing.length > 0
      ? `发现${missing.length}项准入材料缺失，需要退回补正或人工复核。`
      : '准入材料完整，建议进入下一审核节点。';
  }
  if (reportType === 'match_risk') {
    return `当前比赛日风险等级为${source.riskLevel ?? 'unknown'}，需重点跟进未完成任务和现场事件。`;
  }
  if (reportType === 'venue_rectification') {
    return `场馆巡检得分${source.score ?? 0}，建议优先处理未通过项并留存整改证据。`;
  }
  return '已根据结构化业务数据生成摘要，等待人工审核。';
}

function createAiFindings(reportType, source) {
  if (reportType === 'admission_summary') {
    return [
      ...(source.aiFindings ?? []),
      `债务清偿状态：${source.debtClearance?.status ?? 'unknown'}`,
      `当前审核节点：${source.currentReviewer ?? '未指定'}`
    ];
  }
  if (reportType === 'match_risk') {
    const pendingTasks = (source.tasks ?? []).filter((task) => task.status !== 'done');
    return pendingTasks.map((task) => `待办：${task.title}`);
  }
  if (reportType === 'venue_rectification') {
    return (source.checklist ?? [])
      .filter((item) => item.status !== 'pass')
      .map((item) => `${item.title}：${item.note}`);
  }
  return ['请业务人员核对报告事实、措辞和结论。'];
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

