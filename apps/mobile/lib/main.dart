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

  runApp(CflOperationsApp(apiBaseUrl: apiBaseUrl));
}

class CflOperationsApp extends StatelessWidget {
  const CflOperationsApp({super.key, required this.apiBaseUrl});

  final String apiBaseUrl;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(ApiClient(apiBaseUrl))..loadInitialData(),
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: '中足联运营平台',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff0f766e)),
          useMaterial3: true,
        ),
        home: const HomePage(),
      ),
    );
  }
}

