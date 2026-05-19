import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

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
      const ScheduleView(),
      const LiveView(),
      const NewsView(),
      const SettingsView(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('世足2026助手'),
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
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: '首页'),
          NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: '赛程'),
          NavigationDestination(icon: Icon(Icons.sports_soccer_outlined), selectedIcon: Icon(Icons.sports_soccer), label: '实时'),
          NavigationDestination(icon: Icon(Icons.article_outlined), selectedIcon: Icon(Icons.article), label: '资讯'),
          NavigationDestination(icon: Icon(Icons.notifications_outlined), selectedIcon: Icon(Icons.notifications), label: '提醒'),
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

        return RefreshIndicator(
          onRefresh: state.loadInitialData,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const SectionTitle(title: '今日与近期比赛'),
              ...state.todayMatches.map((match) => MatchCard(match: match)),
              const SizedBox(height: 20),
              const SectionTitle(title: '正在直播'),
              if (state.liveMatches.isEmpty) const EmptyState(text: '当前暂无进行中的比赛'),
              ...state.liveMatches.map((match) => MatchCard(match: match, compact: true)),
              const SizedBox(height: 20),
              const SectionTitle(title: '最新资讯'),
              ...state.articles.take(3).map((article) => ArticleTile(article: article)),
            ],
          ),
        );
      },
    );
  }
}

class ScheduleView extends StatefulWidget {
  const ScheduleView({super.key});

  @override
  State<ScheduleView> createState() => _ScheduleViewState();
}

class _ScheduleViewState extends State<ScheduleView> {
  String? stage;

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        final matches = stage == null ? state.matches : state.matches.where((match) => _stageOf(match) == stage).toList();
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ChoiceChip(label: const Text('全部'), selected: stage == null, onSelected: (_) => setState(() => stage = null)),
                ChoiceChip(label: const Text('小组赛'), selected: stage == '小组赛', onSelected: (_) => setState(() => stage = '小组赛')),
                ChoiceChip(label: const Text('淘汰赛'), selected: stage == '淘汰赛', onSelected: (_) => setState(() => stage = '淘汰赛')),
              ],
            ),
            const SizedBox(height: 12),
            ...matches.map((match) => MatchCard(match: match)),
          ],
        );
      },
    );
  }

  String _stageOf(MatchSummary match) {
    return match.stageName == '小组赛' ? '小组赛' : '淘汰赛';
  }
}

class LiveView extends StatelessWidget {
  const LiveView({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        if (state.liveMatches.isEmpty) {
          return const EmptyState(text: '暂无实时比赛。开赛后会展示比分、事件流和最后更新时间。');
        }

        return ListView(
          padding: const EdgeInsets.all(16),
          children: state.liveMatches.map((match) => MatchCard(match: match)).toList(),
        );
      },
    );
  }
}

class NewsView extends StatelessWidget {
  const NewsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: state.articles.map((article) => ArticleTile(article: article)).toList(),
        );
      },
    );
  }
}

class SettingsView extends StatelessWidget {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) {
        final teams = state.matches
            .expand((match) => [match.homeTeam, match.awayTeam])
            .where((team) => team.id != null)
            .fold<Map<String, MatchTeam>>({}, (acc, team) {
          acc[team.id!] = team;
          return acc;
        }).values.toList();

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SectionTitle(title: '关注球队'),
            ...teams.take(12).map(
                  (team) => CheckboxListTile(
                    value: state.favoriteTeamIds.contains(team.id),
                    onChanged: (_) => state.toggleFavoriteTeam(team.id),
                    title: Text(team.name),
                    subtitle: Text(team.slot ?? ''),
                  ),
                ),
            const SizedBox(height: 12),
            const SectionTitle(title: '赛前提醒'),
            for (final minute in [1440, 60, 15])
              CheckboxListTile(
                value: state.reminderMinutes.contains(minute),
                onChanged: (_) => state.toggleReminderMinute(minute),
                title: Text(minute == 1440 ? '赛前 24 小时' : '赛前 $minute 分钟'),
              ),
            const SizedBox(height: 12),
            FilledButton.icon(
              icon: const Icon(Icons.save_outlined),
              label: const Text('保存提醒设置'),
              onPressed: () async {
                await state.savePreferences();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('提醒设置已保存')));
                }
              },
            ),
          ],
        );
      },
    );
  }
}

class MatchCard extends StatelessWidget {
  const MatchCard({super.key, required this.match, this.compact = false});

  final MatchSummary match;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final score = match.homeScore == null || match.awayScore == null ? 'vs' : '${match.homeScore} - ${match.awayScore}';
    return Card(
      child: Padding(
        padding: EdgeInsets.all(compact ? 12 : 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Chip(label: Text(match.stageName)),
                const Spacer(),
                Text(match.beijingKickoff, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: Text(match.homeTeam.name, style: Theme.of(context).textTheme.titleMedium)),
                Text(score, style: Theme.of(context).textTheme.titleLarge),
                Expanded(child: Text(match.awayTeam.name, textAlign: TextAlign.end, style: Theme.of(context).textTheme.titleMedium)),
              ],
            ),
            const SizedBox(height: 8),
            Text('${match.venue} · ${_statusText(match)}'),
            if (match.events.isNotEmpty) ...[
              const Divider(),
              ...match.events.take(3).map((event) => Text('${event.minute ?? '-'}′ ${event.description}')),
            ],
            if (match.broadcastLinks.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: match.broadcastLinks.map((link) => OutlinedButton.icon(
                      icon: const Icon(Icons.open_in_new),
                      label: Text(link.label),
                      onPressed: () => launchUrl(Uri.parse(link.url), mode: LaunchMode.externalApplication),
                    )).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _statusText(MatchSummary match) {
    if (match.status == 'live') {
      return '${match.clockMinute ?? 0}′ 进行中';
    }
    if (match.status == 'finished') {
      return '已结束';
    }
    return '未开始';
  }
}

class ArticleTile extends StatelessWidget {
  const ArticleTile({super.key, required this.article});

  final Article article;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.article_outlined),
        title: Text(article.title),
        subtitle: Text('${article.category} · ${article.summary}'),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
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

