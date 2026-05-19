const GROUPS = 'ABCDEFGHIJKL'.split('');
const STADIUMS = [
  'Mexico City Stadium',
  'Guadalajara Stadium',
  'Monterrey Stadium',
  'Toronto Stadium',
  'Vancouver Stadium',
  'Los Angeles Stadium',
  'San Francisco Bay Area Stadium',
  'Seattle Stadium',
  'Dallas Stadium',
  'Houston Stadium',
  'Kansas City Stadium',
  'Atlanta Stadium',
  'Miami Stadium',
  'Boston Stadium',
  'Philadelphia Stadium',
  'New York New Jersey Stadium'
];

const HOST_TEAMS = {
  A1: '墨西哥',
  B1: '加拿大',
  D1: '美国'
};

const STAGES = {
  group: '小组赛',
  round32: '32强赛',
  round16: '16强赛',
  quarterFinal: '四分之一决赛',
  semiFinal: '半决赛',
  thirdPlace: '三四名决赛',
  final: '决赛'
};

export function createSeedData(now = new Date()) {
  const teams = createTeams();
  const matches = createMatches(teams);

  return {
    generatedAt: now.toISOString(),
    teams,
    matches,
    articles: createArticles(now),
    broadcastLinks: createBroadcastLinks(),
    notificationPreferences: new Map(),
    sseClients: new Map()
  };
}

function createTeams() {
  return GROUPS.flatMap((group) =>
    [1, 2, 3, 4].map((seed) => {
      const slot = `${group}${seed}`;
      return {
        id: slot.toLowerCase(),
        slot,
        group,
        name: HOST_TEAMS[slot] ?? `${slot} 待定`,
        countryCode: HOST_TEAMS[slot] ? slot : null,
        qualified: Boolean(HOST_TEAMS[slot])
      };
    })
  );
}

function createMatches(teams) {
  const bySlot = Object.fromEntries(teams.map((team) => [team.slot, team]));
  const matches = [];
  let id = 1;

  for (const group of GROUPS) {
    const pairings = [
      [1, 2],
      [3, 4],
      [1, 3],
      [2, 4],
      [4, 1],
      [2, 3]
    ];

    for (const [homeSeed, awaySeed] of pairings) {
      matches.push(
        createMatch({
          id: id++,
          stage: 'group',
          group,
          homeTeam: bySlot[`${group}${homeSeed}`],
          awayTeam: bySlot[`${group}${awaySeed}`]
        })
      );
    }
  }

  for (let i = 0; i < 16; i++) {
    matches.push(
      createMatch({
        id: id++,
        stage: 'round32',
        homePlaceholder: `32强赛 ${i + 1} 主队`,
        awayPlaceholder: `32强赛 ${i + 1} 客队`
      })
    );
  }

  for (let i = 0; i < 8; i++) {
    matches.push(
      createMatch({
        id: id++,
        stage: 'round16',
        homePlaceholder: `16强赛 ${i + 1} 主队`,
        awayPlaceholder: `16强赛 ${i + 1} 客队`
      })
    );
  }

  for (let i = 0; i < 4; i++) {
    matches.push(
      createMatch({
        id: id++,
        stage: 'quarterFinal',
        homePlaceholder: `四分之一决赛 ${i + 1} 主队`,
        awayPlaceholder: `四分之一决赛 ${i + 1} 客队`
      })
    );
  }

  for (let i = 0; i < 2; i++) {
    matches.push(
      createMatch({
        id: id++,
        stage: 'semiFinal',
        homePlaceholder: `半决赛 ${i + 1} 主队`,
        awayPlaceholder: `半决赛 ${i + 1} 客队`
      })
    );
  }

  matches.push(
    createMatch({
      id: id++,
      stage: 'thirdPlace',
      homePlaceholder: '三四名决赛主队',
      awayPlaceholder: '三四名决赛客队'
    })
  );

  matches.push(
    createMatch({
      id: id++,
      stage: 'final',
      homePlaceholder: '决赛主队',
      awayPlaceholder: '决赛客队',
      venue: 'New York New Jersey Stadium',
      kickoffUtc: '2026-07-19T19:00:00.000Z'
    })
  );

  return matches;
}

function createMatch({ id, stage, group = null, homeTeam, awayTeam, homePlaceholder, awayPlaceholder, venue, kickoffUtc }) {
  const generatedKickoffUtc = kickoffUtc ?? getKickoffForMatch(id);
  const match = {
    id: String(id),
    fifaMatchNumber: id,
    stage,
    stageName: STAGES[stage],
    group,
    venue: venue ?? STADIUMS[(id - 1) % STADIUMS.length],
    kickoffUtc: generatedKickoffUtc,
    beijingKickoff: formatBeijingTime(generatedKickoffUtc),
    status: 'scheduled',
    clockMinute: null,
    lastUpdatedAt: new Date().toISOString(),
    homeScore: null,
    awayScore: null,
    homeTeam: serializeMatchTeam(homeTeam, homePlaceholder),
    awayTeam: serializeMatchTeam(awayTeam, awayPlaceholder),
    events: [],
    broadcastLinkIds: ['cctv5', 'yangshipin']
  };

  return match;
}

function serializeMatchTeam(team, placeholder) {
  if (team) {
    return {
      id: team.id,
      name: team.name,
      slot: team.slot,
      group: team.group,
      placeholder: false
    };
  }

  return {
    id: null,
    name: placeholder,
    slot: null,
    group: null,
    placeholder: true
  };
}

function getKickoffForMatch(matchNumber) {
  const stageStart = matchNumber <= 72 ? '2026-06-11' : matchNumber <= 88 ? '2026-06-28' : matchNumber <= 96 ? '2026-07-04' : matchNumber <= 100 ? '2026-07-09' : matchNumber <= 102 ? '2026-07-14' : '2026-07-18';
  const start = new Date(`${stageStart}T16:00:00.000Z`);
  const dayOffset = Math.floor((matchNumber - 1) / 4);
  const timeSlots = [16, 19, 22, 1];
  const hour = timeSlots[(matchNumber - 1) % timeSlots.length];
  const kickoff = new Date(start);
  kickoff.setUTCDate(start.getUTCDate() + dayOffset);
  kickoff.setUTCHours(hour, 0, 0, 0);
  return kickoff.toISOString();
}

export function formatBeijingTime(isoString) {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(date).replace(/\//g, '-');
}

function createArticles(now) {
  return [
    {
      id: 'launch-guide',
      title: '世足2026助手 MVP 启动',
      summary: '赛程、提醒、实时比分、文字直播和官方直播入口将作为首版核心能力。',
      category: '公告',
      sourceName: '运营编辑',
      imageUrl: null,
      publishedAt: now.toISOString()
    },
    {
      id: 'compliance-note',
      title: '视频观看将跳转官方持权平台',
      summary: '未获得书面授权前，本应用不内嵌比赛视频，不抓取转播流。',
      category: '合规',
      sourceName: '运营编辑',
      imageUrl: null,
      publishedAt: now.toISOString()
    }
  ];
}

function createBroadcastLinks() {
  return [
    {
      id: 'cctv5',
      label: 'CCTV-5 官方直播入口',
      provider: 'CMG/CCTV',
      url: 'https://tv.cctv.com/live/cctv5/',
      type: 'external',
      authorized: true,
      note: '上线前需由运营确认具体赛事版权页面。'
    },
    {
      id: 'yangshipin',
      label: '央视频入口',
      provider: '央视频',
      url: 'https://www.yangshipin.cn/',
      type: 'external',
      authorized: true,
      note: '仅作官方平台跳转，不内嵌视频。'
    }
  ];
}

