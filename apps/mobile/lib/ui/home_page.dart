import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      const DashboardView(),
      const AdmissionsView(),
      const MatchOperationsView(),
      const VenueInspectionsView(),
      const AiReportsView(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('中足联运营平台'),
        actions: [
          IconButton(
            tooltip: '刷新',
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<AppState>().loadInitialData(),
          ),
        ],
      ),
      body: pages[selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) => setState(() => selectedIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: '驾驶舱'),
          NavigationDestination(icon: Icon(Icons.verified_user_outlined), selectedIcon: Icon(Icons.verified_user), label: '准入'),
          NavigationDestination(icon: Icon(Icons.event_note_outlined), selectedIcon: Icon(Icons.event_note), label: '比赛日'),
          NavigationDestination(icon: Icon(Icons.stadium_outlined), selectedIcon: Icon(Icons.stadium), label: '场馆'),
          NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), selectedIcon: Icon(Icons.auto_awesome), label: 'AI'),
        ],
      ),
    );
  }
}

class DashboardView extends StatelessWidget {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        if (state.loading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.errorMessage != null) {
          return ErrorState(message: state.errorMessage!);
        }
        final dashboard = state.dashboard;
        if (dashboard == null) {
          return const EmptyState(text: '暂无驾驶舱数据');
        }

        return RefreshIndicator(
          onRefresh: state.loadInitialData,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GridView.count(
                crossAxisCount: MediaQuery.of(context).size.width > 720 ? 4 : 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.6,
                children: [
                  MetricCard(label: '联赛', value: '${dashboard.activeLeagues}/${dashboard.leagueTotal}'),
                  MetricCard(label: '准入申请', value: '${dashboard.admissionTotal}'),
                  MetricCard(label: '比赛日任务', value: '${dashboard.matchOperationTotal}'),
                  MetricCard(label: '场馆巡检', value: '${dashboard.venueInspectionTotal}'),
                ],
              ),
              const SectionTitle(title: '开放风险'),
              ...dashboard.openRiskAlerts.map((alert) => RiskAlertTile(alert: alert)),
              const SectionTitle(title: '近期待办'),
              ...dashboard.upcomingTasks.map((task) => WorkflowTaskTile(task: task)),
            ],
          ),
        );
      },
    );
  }
}

class AdmissionsView extends StatelessWidget {
  const AdmissionsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionTitle(title: '俱乐部准入审查'),
          ...state.admissions.map((item) => BusinessCard(
                title: item.clubId,
                subtitle: '${item.season} · ${item.leagueId} · ${item.currentReviewer}',
                trailing: item.status,
                lines: item.aiFindings,
              )),
        ],
      ),
    );
  }
}

class MatchOperationsView extends StatelessWidget {
  const MatchOperationsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionTitle(title: '比赛日运营'),
          ...state.matchOperations.map((item) => BusinessCard(
                title: '${item.homeClubId} vs ${item.awayClubId}',
                subtitle: '${item.leagueId} 第 ${item.round} 轮 · 风险 ${item.riskLevel}',
                trailing: item.status,
                lines: item.tasks.map((task) => '${task.title}：${task.status}').toList(),
              )),
        ],
      ),
    );
  }
}

class VenueInspectionsView extends StatelessWidget {
  const VenueInspectionsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionTitle(title: '场馆巡检'),
          ...state.venueInspections.map((item) => BusinessCard(
                title: item.venueName,
                subtitle: '巡检得分 ${item.score}',
                trailing: item.status,
              )),
        ],
      ),
    );
  }
}

class AiReportsView extends StatelessWidget {
  const AiReportsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionTitle(title: 'AI 工作助手'),
          if (state.aiReports.isEmpty) const EmptyState(text: '暂无 AI 报告。可由后台生成准入摘要、比赛日风险和场馆整改建议。'),
          ...state.aiReports.map((item) => BusinessCard(
                title: item.title,
                subtitle: '${item.reportType} · ${item.reviewStatus}',
                trailing: '待复核',
                lines: [item.summary],
              )),
        ],
      ),
    );
  }
}

class MetricCard extends StatelessWidget {
  const MetricCard({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(value, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 4),
            Text(label),
          ],
        ),
      ),
    );
  }
}

class BusinessCard extends StatelessWidget {
  const BusinessCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.trailing,
    this.lines = const [],
  });

  final String title;
  final String subtitle;
  final String trailing;
  final List<String> lines;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(title, style: Theme.of(context).textTheme.titleMedium)),
                Chip(label: Text(trailing)),
              ],
            ),
            Text(subtitle),
            for (final line in lines.take(3)) Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(line),
            ),
          ],
        ),
      ),
    );
  }
}

class RiskAlertTile extends StatelessWidget {
  const RiskAlertTile({super.key, required this.alert});

  final RiskAlert alert;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.warning_amber_outlined),
      title: Text(alert.title),
      subtitle: Text(alert.description),
      trailing: Text(alert.severity),
    );
  }
}

class WorkflowTaskTile extends StatelessWidget {
  const WorkflowTaskTile({super.key, required this.task});

  final WorkflowTask task;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.task_alt),
      title: Text(task.title),
      subtitle: Text(task.ownerRole ?? task.area ?? ''),
      trailing: Text(task.status),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 8),
      child: Text(title, style: Theme.of(context).textTheme.titleLarge),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(child: Text(text)),
    );
  }
}

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(message, textAlign: TextAlign.center),
      ),
    );
  }
}

