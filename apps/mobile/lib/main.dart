import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'services/api_client.dart';
import 'state/app_state.dart';
import 'ui/home_page.dart';

void main() {
  const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  runApp(WorldCupAssistantApp(apiBaseUrl: apiBaseUrl));
}

class WorldCupAssistantApp extends StatelessWidget {
  const WorldCupAssistantApp({super.key, required this.apiBaseUrl});

  final String apiBaseUrl;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(ApiClient(apiBaseUrl))..loadInitialData(),
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: '世足2026助手',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff006d77)),
          useMaterial3: true,
        ),
        home: const HomePage(),
      ),
    );
  }
}

