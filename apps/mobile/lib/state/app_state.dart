import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/api_client.dart';

class AppState extends ChangeNotifier {
  AppState(this.apiClient);

  final ApiClient apiClient;

  bool loading = false;
  String? errorMessage;
  List<MatchSummary> matches = [];
  List<MatchSummary> liveMatches = [];
  List<Article> articles = [];
  List<BroadcastLink> broadcastLinks = [];
  final Set<String> favoriteTeamIds = <String>{};
  final Set<int> reminderMinutes = <int>{1440, 60, 15};

  List<MatchSummary> get todayMatches {
    return matches.take(6).toList();
  }

  Future<void> loadInitialData() async {
    loading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        apiClient.fetchMatches(),
        apiClient.fetchLiveMatches(),
        apiClient.fetchNews(),
        apiClient.fetchBroadcastLinks(),
      ]);
      matches = results[0] as List<MatchSummary>;
      liveMatches = results[1] as List<MatchSummary>;
      articles = results[2] as List<Article>;
      broadcastLinks = results[3] as List<BroadcastLink>;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> savePreferences() async {
    await apiClient.saveNotificationPreferences(
      deviceId: 'local-demo-device',
      favoriteTeamIds: favoriteTeamIds.toList(),
      reminderMinutes: reminderMinutes.toList()..sort(),
    );
  }

  void toggleFavoriteTeam(String? teamId) {
    if (teamId == null) {
      return;
    }

    if (favoriteTeamIds.contains(teamId)) {
      favoriteTeamIds.remove(teamId);
    } else {
      favoriteTeamIds.add(teamId);
    }
    notifyListeners();
  }

  void toggleReminderMinute(int minute) {
    if (reminderMinutes.contains(minute)) {
      reminderMinutes.remove(minute);
    } else {
      reminderMinutes.add(minute);
    }
    notifyListeners();
  }
}

