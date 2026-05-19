class MatchSummary {
  const MatchSummary({
    required this.id,
    required this.stageName,
    required this.venue,
    required this.beijingKickoff,
    required this.status,
    required this.homeTeam,
    required this.awayTeam,
    this.clockMinute,
    this.homeScore,
    this.awayScore,
    this.events = const [],
    this.broadcastLinks = const [],
  });

  final String id;
  final String stageName;
  final String venue;
  final String beijingKickoff;
  final String status;
  final MatchTeam homeTeam;
  final MatchTeam awayTeam;
  final int? clockMinute;
  final int? homeScore;
  final int? awayScore;
  final List<LiveEvent> events;
  final List<BroadcastLink> broadcastLinks;

  factory MatchSummary.fromJson(Map<String, dynamic> json) {
    return MatchSummary(
      id: json['id'] as String,
      stageName: json['stageName'] as String,
      venue: json['venue'] as String,
      beijingKickoff: json['beijingKickoff'] as String,
      status: json['status'] as String,
      clockMinute: json['clockMinute'] as int?,
      homeScore: json['homeScore'] as int?,
      awayScore: json['awayScore'] as int?,
      homeTeam: MatchTeam.fromJson(json['homeTeam'] as Map<String, dynamic>),
      awayTeam: MatchTeam.fromJson(json['awayTeam'] as Map<String, dynamic>),
      events: (json['events'] as List<dynamic>? ?? const [])
          .map((item) => LiveEvent.fromJson(item as Map<String, dynamic>))
          .toList(),
      broadcastLinks: (json['broadcastLinks'] as List<dynamic>? ?? const [])
          .map((item) => BroadcastLink.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class MatchTeam {
  const MatchTeam({
    required this.name,
    this.id,
    this.slot,
    this.group,
    this.placeholder = false,
  });

  final String? id;
  final String name;
  final String? slot;
  final String? group;
  final bool placeholder;

  factory MatchTeam.fromJson(Map<String, dynamic> json) {
    return MatchTeam(
      id: json['id'] as String?,
      name: json['name'] as String,
      slot: json['slot'] as String?,
      group: json['group'] as String?,
      placeholder: json['placeholder'] as bool? ?? false,
    );
  }
}

class LiveEvent {
  const LiveEvent({
    required this.id,
    required this.type,
    required this.description,
    required this.createdAt,
    this.minute,
    this.playerName,
  });

  final String id;
  final String type;
  final String description;
  final String createdAt;
  final int? minute;
  final String? playerName;

  factory LiveEvent.fromJson(Map<String, dynamic> json) {
    return LiveEvent(
      id: json['id'] as String,
      type: json['type'] as String,
      description: json['description'] as String,
      createdAt: json['createdAt'] as String,
      minute: json['minute'] as int?,
      playerName: json['playerName'] as String?,
    );
  }
}

class Article {
  const Article({
    required this.id,
    required this.title,
    required this.summary,
    required this.category,
    required this.sourceName,
    required this.publishedAt,
  });

  final String id;
  final String title;
  final String summary;
  final String category;
  final String sourceName;
  final String publishedAt;

  factory Article.fromJson(Map<String, dynamic> json) {
    return Article(
      id: json['id'] as String,
      title: json['title'] as String,
      summary: json['summary'] as String,
      category: json['category'] as String,
      sourceName: json['sourceName'] as String,
      publishedAt: json['publishedAt'] as String,
    );
  }
}

class BroadcastLink {
  const BroadcastLink({
    required this.id,
    required this.label,
    required this.provider,
    required this.url,
    required this.authorized,
    required this.note,
  });

  final String id;
  final String label;
  final String provider;
  final String url;
  final bool authorized;
  final String note;

  factory BroadcastLink.fromJson(Map<String, dynamic> json) {
    return BroadcastLink(
      id: json['id'] as String,
      label: json['label'] as String,
      provider: json['provider'] as String,
      url: json['url'] as String,
      authorized: json['authorized'] as bool? ?? false,
      note: json['note'] as String? ?? '',
    );
  }
}

