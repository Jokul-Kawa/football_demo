import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/models.dart';

class ApiClient {
  ApiClient(this.baseUrl);

  final String baseUrl;

  Future<OperationsDashboard> fetchDashboard() async {
    final json = await _get(Uri.parse('$baseUrl/dashboard/operations'));
    return OperationsDashboard.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<List<League>> fetchLeagues() async {
    final json = await _get(Uri.parse('$baseUrl/leagues'));
    return (json['data'] as List<dynamic>)
        .map((item) => League.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<ClubAdmission>> fetchClubAdmissions() async {
    final json = await _get(Uri.parse('$baseUrl/club-admissions'));
    return (json['data'] as List<dynamic>)
        .map((item) => ClubAdmission.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<MatchOperation>> fetchMatchOperations() async {
    final json = await _get(Uri.parse('$baseUrl/match-operations'));
    return (json['data'] as List<dynamic>)
        .map((item) => MatchOperation.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<VenueInspection>> fetchVenueInspections() async {
    final json = await _get(Uri.parse('$baseUrl/venue-inspections'));
    return (json['data'] as List<dynamic>)
        .map((item) => VenueInspection.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<AiReport>> fetchAiReports() async {
    final json = await _get(Uri.parse('$baseUrl/ai/reports'));
    return (json['data'] as List<dynamic>)
        .map((item) => AiReport.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> _get(Uri uri) async {
    final response = await http.get(uri);
    if (response.statusCode >= 400) {
      throw ApiException('请求失败：${response.statusCode}');
    }
    return jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
  }
}

class ApiException implements Exception {
  ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

