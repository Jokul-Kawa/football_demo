# 足球助手

面向中国大陆用户的综合足球赛事 App MVP。产品从 2026 美加墨世界杯专题起步，后续扩展到英超、德甲、西甲、意甲、法甲、欧冠、中超等主流赛事。

当前仓库包含：

- `apps/api`：可运行的 Node.js REST/SSE 服务，提供赛程、实时比分、资讯、官方直播入口、提醒偏好和运营后台 API。
- `apps/mobile`：Flutter 双端 App 源码骨架，安装 Flutter SDK 后可补齐平台壳运行。
- `docs`：项目计划、数据源、AI 预测、卡牌玩法和合规说明。

当前实现仍以世界杯赛程 MVP 为基础；新的多赛事、AI 前瞻预测、赛前对比、抽卡集卡和球星合成功能已进入计划书。

## 快速开始

```powershell
npm test
npm start
```

默认 API 地址为 `http://localhost:3000`。

常用接口：

- `GET /health`
- `GET /matches`
- `GET /matches/{id}`
- `GET /live/matches`
- `GET /news`
- `GET /broadcast-links`
- `POST /notification-preferences`

运营接口需要请求头 `x-admin-token`，默认开发 token 是 `dev-admin-token`：

- `POST /admin/matches/{id}/status`
- `POST /admin/matches/{id}/events`
- `POST /admin/news`
- `POST /admin/broadcast-links`

## 移动端

本机当前未检测到 Flutter SDK。安装 Flutter 后：

```powershell
cd apps/mobile
flutter create --platforms=android,ios .
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

iOS 模拟器或真机运行时，将 `API_BASE_URL` 改成可访问 API 的局域网地址。

## 合规边界

未获得书面授权前：

- 不内嵌比赛视频。
- 不使用 FIFA、UEFA、英超、德甲等官方徽标、吉祥物、奖杯图形或未经授权素材。
- 不在 App 名称、页面文案或商店材料中暗示官方授权。
- 视频入口仅配置为官方持权平台的授权链接或公开可跳转入口。
- AI 预测仅供娱乐和观赛参考，不构成投注建议。
- 抽卡、集卡和球星合成不开放充值、交易、提现或现金等价物兑换。

