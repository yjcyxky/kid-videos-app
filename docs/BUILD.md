# 多架构构建指南

本文档说明如何为不同的 macOS 架构编译儿童视频应用。

## 📋 目录

- [支持的架构](#支持的架构)
- [快速开始](#快速开始)
- [详细说明](#详细说明)
- [构建方法](#构建方法)
- [常见问题](#常见问题)

---

## 🎯 支持的架构

### 1. Intel (x86_64)
- **目标平台**: 2020 年之前的 Intel Mac
- **Rust Target**: `x86_64-apple-darwin`
- **最小系统**: macOS 10.15 (Catalina)

### 2. Apple Silicon (aarch64/ARM64)
- **目标平台**: M1/M2/M3 Mac
- **Rust Target**: `aarch64-apple-darwin`
- **最小系统**: macOS 11.0 (Big Sur)

### 3. Universal Binary
- **目标平台**: 所有 Mac（Intel + Apple Silicon）
- **优点**: 一个文件支持所有架构
- **缺点**: 文件体积约为单架构的 2 倍

---

## 🚀 快速开始

### 方法 1: 使用自动化脚本（推荐）

```bash
# 运行交互式构建脚本
./build-all.sh
```

脚本会提供菜单选择：
1. 只构建 Intel 版本
2. 只构建 Apple Silicon 版本
3. 构建 Universal Binary（推荐）
4. 构建所有版本
5. 退出

### 方法 2: 使用 npm 命令

```bash
# 构建 Intel (x86_64) 版本
npm run build:intel

# 构建 Apple Silicon (ARM64) 版本
npm run build:m1

# 构建 Universal Binary（推荐）
npm run build:universal

# 构建所有 macOS 版本
npm run build:all-macos
```

---

## 📖 详细说明

### 环境准备

#### 1. 安装 Rust Targets

```bash
# Intel Mac
rustup target add x86_64-apple-darwin

# Apple Silicon Mac
rustup target add aarch64-apple-darwin

# 查看已安装的 targets
rustup target list --installed
```

#### 2. 验证工具链

```bash
# 检查 Rust 版本
rustc --version

# 检查 Tauri CLI
npm list @tauri-apps/cli

# 检查 Xcode Command Line Tools
xcode-select -p
```

---

## 🛠️ 构建方法

### 方法 A: 使用 Tauri CLI（推荐）

#### 构建 Intel 版本

```bash
# 1. 构建前端
npm run build:frontend

# 2. 构建 Intel 版本
cd src-tauri
cargo tauri build --target x86_64-apple-darwin
```

**输出位置**:
- DMG: `src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/`
- APP: `src-tauri/target/x86_64-apple-darwin/release/bundle/macos/`

#### 构建 Apple Silicon 版本

```bash
# 1. 构建前端
npm run build:frontend

# 2. 构建 ARM64 版本
cd src-tauri
cargo tauri build --target aarch64-apple-darwin
```

**输出位置**:
- DMG: `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/`
- APP: `src-tauri/target/aarch64-apple-darwin/release/bundle/macos/`

#### 构建 Universal Binary

```bash
# 使用 Tauri CLI 直接构建（Tauri 2.0+）
npm run build:universal
```

或手动创建：

```bash
# 1. 先构建两个架构
npm run build:intel
npm run build:m1

# 2. 使用 lipo 合并
lipo -create \
  src-tauri/target/x86_64-apple-darwin/release/kid-videos-app \
  src-tauri/target/aarch64-apple-darwin/release/kid-videos-app \
  -output src-tauri/target/universal-apple-darwin/release/kid-videos-app

# 3. 验证 Universal Binary
lipo -info src-tauri/target/universal-apple-darwin/release/kid-videos-app
```

预期输出：
```
Architectures in the fat file: kid-videos-app are: x86_64 arm64
```

### 方法 B: 使用 Cargo 直接构建

```bash
# Intel
cargo build --release --target x86_64-apple-darwin

# Apple Silicon
cargo build --release --target aarch64-apple-darwin
```

**注意**: 这种方法只构建二进制文件，不创建 .app 或 .dmg 包。

---

## 📦 构建输出

### 文件结构

```
src-tauri/target/
├── x86_64-apple-darwin/
│   └── release/
│       ├── bundle/
│       │   ├── dmg/
│       │   │   └── KidVideosApp_1.0.0_x64.dmg
│       │   └── macos/
│       │       └── KidVideosApp.app
│       └── kid-videos-app (二进制文件)
├── aarch64-apple-darwin/
│   └── release/
│       ├── bundle/
│       │   ├── dmg/
│       │   │   └── KidVideosApp_1.0.0_aarch64.dmg
│       │   └── macos/
│       │       └── KidVideosApp.app
│       └── kid-videos-app (二进制文件)
└── universal-apple-darwin/
    └── release/
        └── kid-videos-app (Universal Binary)
```

### 文件说明

- **DMG 文件**: 用于分发的磁盘镜像
- **APP 文件**: macOS 应用程序包
- **二进制文件**: 可执行文件（位于 release/ 目录）

---

## 🔍 验证构建

### 检查架构

```bash
# 检查二进制文件架构
lipo -info src-tauri/target/x86_64-apple-darwin/release/kid-videos-app
# 输出: Non-fat file: ... is architecture: x86_64

lipo -info src-tauri/target/aarch64-apple-darwin/release/kid-videos-app
# 输出: Non-fat file: ... is architecture: arm64

lipo -info src-tauri/target/universal-apple-darwin/release/kid-videos-app
# 输出: Architectures in the fat file: ... are: x86_64 arm64
```

### 检查文件大小

```bash
# 查看各架构文件大小
ls -lh src-tauri/target/*/release/kid-videos-app

# Universal Binary 应该约等于两个单架构文件之和
```

### 测试运行

```bash
# 直接运行二进制文件
./src-tauri/target/x86_64-apple-darwin/release/kid-videos-app

# 或打开 .app
open src-tauri/target/x86_64-apple-darwin/release/bundle/macos/KidVideosApp.app
```

---

## ⚙️ 配置说明

### tauri.conf.json

```json
{
  "build": {
    "targets": "all"  // 支持所有目标架构
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "app"],  // 生成 DMG 和 APP
    "macOS": {
      "minimumSystemVersion": "10.15"  // 最低支持 macOS 10.15
    }
  }
}
```

### package.json 脚本

```json
{
  "scripts": {
    "build:intel": "npm run build:frontend && tauri build --target x86_64-apple-darwin",
    "build:m1": "npm run build:frontend && tauri build --target aarch64-apple-darwin",
    "build:universal": "npm run build:frontend && tauri build --target universal-apple-darwin",
    "build:all-macos": "npm run build:intel && npm run build:m1"
  }
}
```

---

## 💡 最佳实践

### 1. 推荐的构建策略

**开发阶段**:
- 只构建当前机器的架构以节省时间
```bash
npm run build  # 自动检测当前架构
```

**生产发布**:
- 构建 Universal Binary 以支持所有用户
```bash
npm run build:universal
```

### 2. 性能优化

**减小文件大小**:
```bash
# 在 Cargo.toml 中启用 LTO（链接时优化）
[profile.release]
lto = true
codegen-units = 1
strip = true  # 移除调试符号
```

**并行构建**:
```bash
# 利用多核 CPU
export CARGO_BUILD_JOBS=8
npm run build:all-macos
```

### 3. 交叉编译注意事项

- **在 Intel Mac 上构建 ARM64**: 需要 Xcode 12.2+
- **在 M1/M2 Mac 上构建 x86_64**: 完全支持，无需额外配置
- **依赖项兼容性**: 某些原生依赖可能不支持交叉编译

---

## 🐛 常见问题

### Q1: 构建失败：找不到 target

**错误信息**:
```
error: Can't find 'x86_64-apple-darwin' target
```

**解决方案**:
```bash
rustup target add x86_64-apple-darwin
```

### Q2: 在 M1 Mac 上构建 Intel 版本失败

**可能原因**: 缺少 x86_64 工具链

**解决方案**:
```bash
# 确保安装了 Rosetta 2
softwareupdate --install-rosetta

# 添加 Intel target
rustup target add x86_64-apple-darwin
```

### Q3: Universal Binary 无法创建

**错误信息**:
```
lipo: can't open input file
```

**解决方案**: 确保两个架构都已成功构建
```bash
# 检查文件是否存在
ls src-tauri/target/x86_64-apple-darwin/release/kid-videos-app
ls src-tauri/target/aarch64-apple-darwin/release/kid-videos-app
```

### Q4: DMG 签名失败

**错误信息**:
```
code signing failed
```

**解决方案**:
```bash
# 开发模式下可以跳过签名
export TAURI_PRIVATE_KEY=""
export TAURI_KEY_PASSWORD=""
```

生产环境需要:
1. Apple Developer 账号
2. 有效的代码签名证书
3. 配置 `tauri.conf.json` 中的签名设置

### Q5: SQLite 编译错误

**错误信息**:
```
error: failed to build sqlx
```

**解决方案**:
```bash
# 确保安装了构建工具
xcode-select --install

# 或安装 SQLite 开发包
brew install sqlite3
```

---

## 📊 构建时间参考

基于 M1 Max MacBook Pro (32GB RAM):

| 构建类型 | 时间 | 文件大小 |
|---------|------|---------|
| Intel (x86_64) | ~3-5 分钟 | ~15 MB |
| Apple Silicon (ARM64) | ~2-3 分钟 | ~12 MB |
| Universal Binary | ~6-8 分钟 | ~27 MB |

**注意**: 首次构建会更慢（需要下载和编译依赖）

---

## 🔗 相关资源

- [Tauri 官方文档](https://tauri.app/v1/guides/building/)
- [Rust 交叉编译指南](https://rust-lang.github.io/rustup/cross-compilation.html)
- [Apple Developer - Universal Binaries](https://developer.apple.com/documentation/apple-silicon/building-a-universal-macos-binary)
- [macOS 代码签名](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

---

## 📝 更新日志

- **v1.0.0** (2025-01-21): 初始版本，支持 Intel、Apple Silicon 和 Universal Binary
