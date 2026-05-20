import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/api_client.dart';

class AppState extends ChangeNotifier {
  AppState(this.apiClient);

  final ApiClient apiClient;

  bool loading = false;
  String? errorMessage;
  OperationsDashboard? dashboard;
  List<League> leagues = [];
  List<ClubAdmission> admissions = [];
  List<MatchOperation> matchOperations = [];
  List<VenueInspection> venueInspections = [];
  List<AiReport> aiReports = [];

  Future<void> loadInitialData() async {
    loading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        apiClient.fetchDashboard(),
        apiClient.fetchLeagues(),
        apiClient.fetchClubAdmissions(),
        apiClient.fetchMatchOperations(),
        apiClient.fetchVenueInspections(),
        apiClient.fetchAiReports(),
      ]);
      dashboard = results[0] as OperationsDashboard;
      leagues = results[1] as List<League>;
      admissions = results[2] as List<ClubAdmission>;
      matchOperations = results[3] as List<MatchOperation>;
      venueInspections = results[4] as List<VenueInspection>;
      aiReports = results[5] as List<AiReport>;
    } catch (error) {
      errorMessage = error.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}

