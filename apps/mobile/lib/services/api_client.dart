import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/models.dart';

class ApiClient {
  ApiClient(this.baseUrl);

  final String baseUrl;

  Future<List<MatchSummary>> fetchMatches({String? stage}) async {
    final uri = Uri.parse('$baseUrl/matches').replace(
      queryParameters: {
        if (stage != null && stage.isNotEmpty) 'stage': stage,
      },
    );
    final json = await _get(uri);
    return (json['data'] as List<dynamic>)
        .map((item) => MatchSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<MatchSummary>> fetchLiveMatches() async {
    final json = await _get(Uri.parse('$baseUrl/live/matches'));
    return (json['data'] as List<dynamic>)
        .map((item) => MatchSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<Article>> fetchNews() async {
    final json = await _get(Uri.parse('$baseUrl/news'));
    return (json['data'] as List<dynamic>)
        .map((item) => Article.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<BroadcastLink>> fetchBroadcastLinks() async {
    final json = await _get(Uri.parse('$baseUrl/broadcast-links'));
    return (json['data'] as List<dynamic>)
        .map((item) => BroadcastLink.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> saveNotificationPreferences({
    required String deviceId,
    required List<String> favoriteTeamIds,
    required List<int> reminderMinutes,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/notification-preferences'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({
        'deviceId': deviceId,
        'favoriteTeamIds': favoriteTeamIds,
        'reminderMinutes': reminderMinutes,
      }),
    );

    if (response.statusCode >= 400) {
      throw ApiException('提醒偏好保存失败：${response.statusCode}');
    }
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

