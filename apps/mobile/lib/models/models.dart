class OperationsDashboard {
  const OperationsDashboard({
    required this.generatedAt,
    required this.leagueTotal,
    required this.activeLeagues,
    required this.admissionTotal,
    required this.matchOperationTotal,
    required this.venueInspectionTotal,
    required this.openRiskAlerts,
    required this.upcomingTasks,
  });

  final String generatedAt;
  final int leagueTotal;
  final int activeLeagues;
  final int admissionTotal;
  final int matchOperationTotal;
  final int venueInspectionTotal;
  final List<RiskAlert> openRiskAlerts;
  final List<WorkflowTask> upcomingTasks;

  factory OperationsDashboard.fromJson(Map<String, dynamic> json) {
    return OperationsDashboard(
      generatedAt: json['generatedAt'] as String,
      leagueTotal: (json['leagues'] as Map<String, dynamic>)['total'] as int,
      activeLeagues: (json['leagues'] as Map<String, dynamic>)['active'] as int,
      admissionTotal: (json['admissions'] as Map<String, dynamic>)['total'] as int,
      matchOperationTotal: (json['matchOperations'] as Map<String, dynamic>)['total'] as int,
      venueInspectionTotal: (json['venueInspections'] as Map<String, dynamic>)['total'] as int,
      openRiskAlerts: (json['openRiskAlerts'] as List<dynamic>? ?? const [])
          .map((item) => RiskAlert.fromJson(item as Map<String, dynamic>))
          .toList(),
      upcomingTasks: (json['upcomingTasks'] as List<dynamic>? ?? const [])
          .map((item) => WorkflowTask.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class League {
  const League({
    required this.id,
    required this.name,
    required this.season,
    required this.status,
    required this.clubCount,
  });

  final String id;
  final String name;
  final String season;
  final String status;
  final int clubCount;

  factory League.fromJson(Map<String, dynamic> json) {
    return League(
      id: json['id'] as String,
      name: json['name'] as String,
      season: json['season'] as String,
      status: json['status'] as String,
      clubCount: json['clubCount'] as int,
    );
  }
}

class ClubAdmission {
  const ClubAdmission({
    required this.id,
    required this.season,
    required this.leagueId,
    required this.clubId,
    required this.status,
    required this.currentReviewer,
    required this.aiFindings,
  });

  final String id;
  final String season;
  final String leagueId;
  final String clubId;
  final String status;
  final String currentReviewer;
  final List<String> aiFindings;

  factory ClubAdmission.fromJson(Map<String, dynamic> json) {
    return ClubAdmission(
      id: json['id'] as String,
      season: json['season'] as String,
      leagueId: json['leagueId'] as String,
      clubId: json['clubId'] as String,
      status: json['status'] as String,
      currentReviewer: json['currentReviewer'] as String? ?? '未指定',
      aiFindings: (json['aiFindings'] as List<dynamic>? ?? const []).map((item) => item.toString()).toList(),
    );
  }
}

class MatchOperation {
  const MatchOperation({
    required this.id,
    required this.leagueId,
    required this.round,
    required this.homeClubId,
    required this.awayClubId,
    required this.status,
    required this.riskLevel,
    required this.tasks,
  });

  final String id;
  final String leagueId;
  final int round;
  final String homeClubId;
  final String awayClubId;
  final String status;
  final String riskLevel;
  final List<WorkflowTask> tasks;

  factory MatchOperation.fromJson(Map<String, dynamic> json) {
    return MatchOperation(
      id: json['id'] as String,
      leagueId: json['leagueId'] as String,
      round: json['round'] as int,
      homeClubId: json['homeClubId'] as String,
      awayClubId: json['awayClubId'] as String,
      status: json['status'] as String,
      riskLevel: json['riskLevel'] as String,
      tasks: (json['tasks'] as List<dynamic>? ?? const [])
          .map((item) => WorkflowTask.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class VenueInspection {
  const VenueInspection({
    required this.id,
    required this.venueName,
    required this.status,
    required this.score,
  });

  final String id;
  final String venueName;
  final String status;
  final int score;

  factory VenueInspection.fromJson(Map<String, dynamic> json) {
    return VenueInspection(
      id: json['id'] as String,
      venueName: json['venueName'] as String,
      status: json['status'] as String,
      score: json['score'] as int,
    );
  }
}

class AiReport {
  const AiReport({
    required this.id,
    required this.reportType,
    required this.title,
    required this.summary,
    required this.reviewStatus,
  });

  final String id;
  final String reportType;
  final String title;
  final String summary;
  final String reviewStatus;

  factory AiReport.fromJson(Map<String, dynamic> json) {
    return AiReport(
      id: json['id'] as String,
      reportType: json['reportType'] as String,
      title: json['title'] as String,
      summary: json['summary'] as String,
      reviewStatus: json['reviewStatus'] as String,
    );
  }
}

class RiskAlert {
  const RiskAlert({
    required this.id,
    required this.severity,
    required this.title,
    required this.description,
  });

  final String id;
  final String severity;
  final String title;
  final String description;

  factory RiskAlert.fromJson(Map<String, dynamic> json) {
    return RiskAlert(
      id: json['id'] as String,
      severity: json['severity'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
    );
  }
}

class WorkflowTask {
  const WorkflowTask({
    required this.id,
    required this.title,
    required this.status,
    this.area,
    this.ownerRole,
    this.dueAt,
  });

  final String id;
  final String title;
  final String status;
  final String? area;
  final String? ownerRole;
  final String? dueAt;

  factory WorkflowTask.fromJson(Map<String, dynamic> json) {
    return WorkflowTask(
      id: json['id'] as String,
      title: json['title'] as String,
      status: json['status'] as String,
      area: json['area'] as String?,
      ownerRole: json['ownerRole'] as String?,
      dueAt: json['dueAt'] as String?,
    );
  }
}
