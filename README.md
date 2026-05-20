# 中足联职业联赛智能运营平台

面向中国足球职业联赛联合会的职业联赛工作平台 MVP。项目已从球迷端足球 App 重构为中足联业务服务平台，重点覆盖准入审查、比赛日运营、场馆巡检、球员注册、纪律案件、AI 工作助手和审计留痕。

当前仓库包含：

- `apps/api`：可运行的 Node.js REST API，提供中足联业务工作台接口。
- `apps/mobile`：Flutter 移动端工作 App 源码骨架，安装 Flutter SDK 后可补齐平台壳运行。
- `docs`：预算提案、数据合规和实施说明。

## 快速开始

```powershell
npm test
npm start
```

默认 API 地址为 `http://localhost:3000`。

## 当前 API

公开读取接口：

- `GET /health`
- `GET /dashboard/operations`
- `GET /leagues`
- `GET /clubs`
- `GET /club-admissions`
- `GET /match-operations`
- `GET /venue-inspections`
- `GET /ai/reports`

需要管理员请求头 `x-admin-token: dev-admin-token` 的接口：

- `POST /club-admissions`
- `POST /club-admissions/{id}/review`
- `POST /match-operations`
- `POST /match-operations/{id}/incidents`
- `POST /venue-inspections`
- `GET/POST /player-registrations`
- `GET/POST /discipline-cases`
- `POST /ai/reports/generate`
- `GET /audit-logs`

可选审计身份请求头：

- `x-actor-id`
- `x-actor-name`
- `x-actor-role`

## 移动端

本机当前未检测到 Flutter SDK。安装 Flutter 后：

```powershell
cd apps/mobile
flutter create --platforms=android,ios .
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

iOS 模拟器或真机运行时，将 `API_BASE_URL` 改成可访问 API 的局域网地址。

## 项目边界

- 不再做世界杯球迷端、英超资讯、抽卡集卡、直播入口或 AI 赛果预测。
- AI 只做业务辅助研判，不替代准入审批、纪律决定或正式签发。
- 球员合同、薪酬债务、俱乐部经营资料和纪律案件证据必须按敏感数据处理。
- 裁判选派、评议和处罚不作为主功能，只预留比赛日协同和接口能力。

