export function createSeedData(now = new Date()) {
  const generatedAt = now.toISOString();
  const leagues = createLeagues();
  const clubs = createClubs();

  return {
    generatedAt,
    leagues,
    clubs,
    clubAdmissions: createClubAdmissions(generatedAt),
    matchOperations: createMatchOperations(generatedAt),
    venueInspections: createVenueInspections(generatedAt),
    playerRegistrations: createPlayerRegistrations(generatedAt),
    disciplineCases: createDisciplineCases(generatedAt),
    commercialAssets: createCommercialAssets(generatedAt),
    workflowTasks: createWorkflowTasks(generatedAt),
    riskAlerts: createRiskAlerts(generatedAt),
    aiReports: [],
    auditLogs: []
  };
}

function createLeagues() {
  return [
    {
      id: 'csl',
      name: '中超联赛',
      level: 1,
      season: '2026',
      operator: '中国足球职业联赛联合会',
      clubCount: 16,
      status: 'active'
    },
    {
      id: 'cl1',
      name: '中甲联赛',
      level: 2,
      season: '2026',
      operator: '中国足球职业联赛联合会',
      clubCount: 16,
      status: 'active'
    },
    {
      id: 'cl2',
      name: '中乙联赛',
      level: 3,
      season: '2026',
      operator: '中国足球职业联赛联合会',
      clubCount: 24,
      status: 'active'
    },
    {
      id: 'elite-u21',
      name: 'U21精英联赛',
      level: 4,
      season: '2026',
      operator: '中国足球职业联赛联合会',
      clubCount: 20,
      status: 'planning'
    }
  ];
}

function createClubs() {
  return [
    {
      id: 'shanghai-harbor',
      name: '上海海港足球俱乐部',
      shortName: '上海海港',
      leagueId: 'csl',
      province: '上海',
      homeVenueId: 'saic-pudong-arena',
      complianceGrade: 'A',
      operatingStatus: 'normal'
    },
    {
      id: 'shandong-taishan',
      name: '山东泰山足球俱乐部',
      shortName: '山东泰山',
      leagueId: 'csl',
      province: '山东',
      homeVenueId: 'jinan-olympic',
      complianceGrade: 'B',
      operatingStatus: 'watch'
    },
    {
      id: 'nanjing-city',
      name: '南京城市足球俱乐部',
      shortName: '南京城市',
      leagueId: 'cl1',
      province: '江苏',
      homeVenueId: 'wutaishan-stadium',
      complianceGrade: 'B',
      operatingStatus: 'normal'
    },
    {
      id: 'hubei-youth-star',
      name: '湖北青年星足球俱乐部',
      shortName: '湖北青年星',
      leagueId: 'cl2',
      province: '湖北',
      homeVenueId: 'hankou-cultural',
      complianceGrade: 'C',
      operatingStatus: 'rectification'
    }
  ];
}

function createClubAdmissions(now) {
  return [
    {
      id: 'admission-2026-shanghai-harbor',
      season: '2026',
      leagueId: 'csl',
      clubId: 'shanghai-harbor',
      status: 'approved',
      submittedAt: '2026-01-08T02:00:00.000Z',
      updatedAt: now,
      currentReviewer: '中足联准入组',
      debtClearance: {
        status: 'cleared',
        playerSalaryConfirmed: true,
        staffSalaryConfirmed: true,
        internationalDebtCaseConfirmed: true,
        publicNoticeStatus: 'completed',
        complaints: 0
      },
      materials: [
        createMaterial('license', '营业执照及俱乐部主体文件', 'verified'),
        createMaterial('salary-confirmation', '球员及工作人员薪酬支付确认表', 'verified'),
        createMaterial('youth-teams', '梯队建设证明材料', 'verified')
      ],
      aiFindings: ['材料完整，债务清偿证明已交叉校验。']
    },
    {
      id: 'admission-2026-shandong-taishan',
      season: '2026',
      leagueId: 'csl',
      clubId: 'shandong-taishan',
      status: 'under_review',
      submittedAt: '2026-01-10T03:30:00.000Z',
      updatedAt: now,
      currentReviewer: '地方会员协会初审',
      debtClearance: {
        status: 'pending',
        playerSalaryConfirmed: true,
        staffSalaryConfirmed: false,
        internationalDebtCaseConfirmed: true,
        publicNoticeStatus: 'open',
        complaints: 1
      },
      materials: [
        createMaterial('license', '营业执照及俱乐部主体文件', 'verified'),
        createMaterial('salary-confirmation', '工作人员薪酬支付确认表', 'missing'),
        createMaterial('youth-teams', '梯队建设证明材料', 'submitted')
      ],
      aiFindings: ['工作人员薪酬确认表缺失。', '公示期存在1条投诉，建议进入人工复核。']
    }
  ];
}

function createMatchOperations(now) {
  return [
    {
      id: 'match-op-2026-csl-001',
      season: '2026',
      leagueId: 'csl',
      round: 1,
      homeClubId: 'shanghai-harbor',
      awayClubId: 'shandong-taishan',
      venueId: 'saic-pudong-arena',
      kickoffAt: '2026-03-01T11:35:00.000Z',
      status: 'pre_match',
      riskLevel: 'medium',
      supervisor: '赛事监督A',
      updatedAt: now,
      tasks: [
        createTask('task-security-plan', '安保方案确认', 'security', 'done'),
        createTask('task-broadcast-check', '转播机位与信号测试', 'broadcast', 'in_progress'),
        createTask('task-media-zone', '媒体区动线复核', 'media', 'todo')
      ],
      incidents: []
    }
  ];
}

function createVenueInspections(now) {
  return [
    {
      id: 'inspection-saic-pudong-2026-001',
      venueId: 'saic-pudong-arena',
      venueName: '上汽浦东足球场',
      leagueId: 'csl',
      inspector: '场馆巡检员A',
      status: 'rectification_required',
      score: 86,
      inspectedAt: now,
      checklist: [
        createInspectionItem('grass', '草坪质量', 'pass', '草坪平整度达标。'),
        createInspectionItem('lighting', '灯光照度', 'pass', '主转播机位照度达标。'),
        createInspectionItem('security', '安保通道', 'fail', '客队球迷隔离通道标识不足。'),
        createInspectionItem('broadcast', '转播条件', 'warning', '备用链路需赛前复测。')
      ],
      evidence: [
        {
          type: 'photo',
          url: 'placeholder://venue/saic-pudong/security-corridor',
          note: '客队球迷隔离通道现场图'
        }
      ]
    }
  ];
}

function createPlayerRegistrations(now) {
  return [
    {
      id: 'reg-2026-001',
      playerName: '示例球员A',
      clubId: 'shanghai-harbor',
      leagueId: 'csl',
      type: 'domestic_registration',
      status: 'approved',
      submittedAt: '2026-02-01T02:00:00.000Z',
      updatedAt: now,
      checks: [
        createCheck('identity', '身份信息核验', 'pass'),
        createCheck('contract', '合同材料核验', 'pass'),
        createCheck('quota', '报名名额校验', 'pass')
      ]
    },
    {
      id: 'transfer-2026-002',
      playerName: '示例外援B',
      clubId: 'shandong-taishan',
      leagueId: 'csl',
      type: 'international_transfer',
      status: 'needs_supplement',
      submittedAt: '2026-02-05T07:20:00.000Z',
      updatedAt: now,
      checks: [
        createCheck('itc', '国际转会证明', 'pending'),
        createCheck('contract', '合同材料核验', 'pass'),
        createCheck('quota', '外援名额校验', 'warning')
      ]
    }
  ];
}

function createDisciplineCases(now) {
  return [
    {
      id: 'discipline-2026-001',
      leagueId: 'csl',
      matchOperationId: 'match-op-2026-csl-001',
      subject: '赛后发布会迟到',
      clubId: 'shandong-taishan',
      status: 'evidence_collection',
      severity: 'low',
      openedAt: now,
      dueAt: '2026-03-04T10:00:00.000Z',
      evidence: ['比赛监督报告', '媒体区签到记录'],
      aiDraftAvailable: true
    }
  ];
}

function createCommercialAssets(now) {
  return [
    {
      id: 'asset-csl-title-2026',
      leagueId: 'csl',
      name: '中超冠名权益交付',
      sponsor: '示例赞助商',
      status: 'tracking',
      fulfillmentRate: 72,
      updatedAt: now
    }
  ];
}

function createWorkflowTasks(now) {
  return [
    {
      id: 'workflow-admission-review',
      title: '复核山东泰山准入补充材料',
      ownerRole: 'league_admission_officer',
      status: 'in_progress',
      dueAt: '2026-01-18T10:00:00.000Z',
      relatedType: 'clubAdmission',
      relatedId: 'admission-2026-shandong-taishan',
      updatedAt: now
    },
    {
      id: 'workflow-venue-rectification',
      title: '跟进上汽浦东足球场隔离通道整改',
      ownerRole: 'venue_manager',
      status: 'todo',
      dueAt: '2026-02-20T10:00:00.000Z',
      relatedType: 'venueInspection',
      relatedId: 'inspection-saic-pudong-2026-001',
      updatedAt: now
    }
  ];
}

function createRiskAlerts(now) {
  return [
    {
      id: 'risk-admission-complaint',
      type: 'admission',
      severity: 'high',
      title: '准入公示投诉待处理',
      description: '山东泰山准入公示期存在投诉，建议由中足联准入组人工复核。',
      relatedType: 'clubAdmission',
      relatedId: 'admission-2026-shandong-taishan',
      status: 'open',
      createdAt: now
    },
    {
      id: 'risk-broadcast-backup',
      type: 'match_operation',
      severity: 'medium',
      title: '转播备用链路需复测',
      description: '中超第1轮重点比赛备用链路未完成赛前复测。',
      relatedType: 'matchOperation',
      relatedId: 'match-op-2026-csl-001',
      status: 'open',
      createdAt: now
    }
  ];
}

function createMaterial(id, name, status) {
  return {
    id,
    name,
    status,
    uploadedAt: status === 'missing' ? null : '2026-01-08T02:00:00.000Z'
  };
}

function createTask(id, title, area, status) {
  return {
    id,
    title,
    area,
    status,
    updatedAt: new Date().toISOString()
  };
}

function createInspectionItem(id, title, status, note) {
  return {
    id,
    title,
    status,
    note
  };
}

function createCheck(id, title, status) {
  return {
    id,
    title,
    status
  };
}

