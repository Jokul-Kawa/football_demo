# 世足2026助手

面向中国大陆用户的 2026 美加墨世界杯公益型 App MVP。

当前仓库包含：

- `apps/api`：可运行的 Node.js REST/SSE 服务，提供赛程、实时比分、资讯、官方直播入口、提醒偏好和运营后台 API。
- `apps/mobile`：Flutter 双端 App 源码骨架，安装 Flutter SDK 后可补齐平台壳运行。
- `docs`：项目计划、合规和数据源说明。

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
- 不使用 FIFA 官方徽标、吉祥物、奖杯图形或未经授权素材。
- 不在 App 名称、页面文案或商店材料中暗示官方授权。
- 视频入口仅配置为官方持权平台的授权链接或公开可跳转入口。

