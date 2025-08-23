# 儿童视频智能筛选器

基于 Tauri + React + TypeScript 开发的跨平台桌面应用，使用 AI 技术智能筛选适合儿童观看的视频内容。

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Rust 1.70+
- Tauri CLI 2.0+

### 安装和运行

```bash
# 1. 安装依赖
npm run setup

# 2. 前端开发模式（推荐开始）
cd frontend && npm run dev
# 访问: http://localhost:1420

# 3. 完整桌面应用
cargo tauri dev
```

## 🏗️ 项目结构

```
kid_videos_app/
├── frontend/              # 前端应用 (React + Vite)
│   ├── src/
│   │   ├── services/      # API服务层
│   │   ├── components/    # React组件
│   │   ├── pages/        # 页面组件
│   │   └── stores/       # 状态管理
│   └── package.json
├── src-tauri/            # 后端应用 (Rust + Tauri)
│   ├── src/
│   │   ├── commands/     # Tauri命令
│   │   ├── services/     # 业务逻辑
│   │   ├── database/     # 数据库操作
│   │   └── models/       # 数据模型
│   └── Cargo.toml
├── Cargo.toml            # Rust工作区
├── tauri.conf.json       # Tauri配置
└── package.json          # 主项目脚本
```

## ⚡ 开发模式

### 🎨 前端独立开发
- 使用Mock数据
- 热重载，启动极快
- 无需Rust环境

### 🦀 后端独立测试
- 专注Rust逻辑开发
- 数据库操作验证
- 独立单元测试

### 🔗 完整桌面应用
- 前后端完整集成
- 真实用户体验
- 端到端测试

## 🎯 核心功能

- **🤖 AI智能筛选** - OpenAI GPT + Anthropic Claude
- **📺 多平台搜索** - YouTube + YouTube Kids
- **🛡️ 安全过滤** - 多维度内容分析
- **❤️ 收藏管理** - 本地SQLite存储
- **🎨 儿童友好** - 专为儿童设计的UI

## 📄 许可证

MIT License