# 🚀 多架构构建 - 快速参考

## 📋 一行命令构建

### 🎯 推荐方式（Universal Binary - 支持所有 Mac）
```bash
npm run build:universal
```
✅ 一次构建，支持 Intel 和 Apple Silicon Mac

---

## 🛠️ 其他构建选项

### Intel Mac (x86_64)
```bash
npm run build:intel
```

### Apple Silicon Mac (M1/M2/M3)
```bash
npm run build:m1
```

### 所有架构（分别构建）
```bash
npm run build:all-macos
```

---

## 🎨 交互式构建（推荐新手）
```bash
./build-all.sh
```

会显示菜单让你选择：
1. 只构建 Intel 版本
2. 只构建 Apple Silicon 版本
3. 构建 Universal Binary（推荐）
4. 构建所有版本
5. 退出

---

## 📦 构建输出位置

### Intel 版本
```
src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/
src-tauri/target/x86_64-apple-darwin/release/bundle/macos/KidVideosApp.app
```

### Apple Silicon 版本
```
src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/
src-tauri/target/aarch64-apple-darwin/release/bundle/macos/KidVideosApp.app
```

### Universal Binary
```
src-tauri/target/universal-apple-darwin/release/kid-videos-app
```

---

## 🔧 首次构建准备

### 1. 安装 Rust targets（一次性）
```bash
# Intel
rustup target add x86_64-apple-darwin

# Apple Silicon
rustup target add aarch64-apple-darwin
```

### 2. 验证环境
```bash
# 检查 Rust
rustc --version

# 检查 Tauri
npm list @tauri-apps/cli

# 检查 Xcode
xcode-select -p
```

---

## 🎯 常用场景

### 场景 1: 开发测试（快速）
```bash
npm run dev
```
不构建，直接运行开发版本

### 场景 2: 本地测试构建
```bash
# 当前架构（最快）
npm run build

# 或指定架构
npm run build:m1  # 如果你用的是 M1 Mac
```

### 场景 3: 生产发布（完整）
```bash
# 推荐：Universal Binary（支持所有 Mac）
npm run build:universal

# 输出 DMG 文件可直接分发
```

---

## ⚡ 构建时间

| 构建类型 | 预计时间 | 输出大小 |
|---------|---------|---------|
| 单架构 | 2-5 分钟 | ~12-15 MB |
| Universal | 6-8 分钟 | ~27 MB |

**首次构建**: 需要额外 5-10 分钟下载依赖

---

## 🐛 快速问题解决

### 构建失败：找不到 target
```bash
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin
```

### 权限错误
```bash
chmod +x build-all.sh
```

### 清理重新构建
```bash
npm run clean
npm run setup
npm run build:universal
```

---

## 📚 详细文档

查看完整文档：[BUILD.md](./BUILD.md)

---

**🎉 完成！现在你可以为所有 Mac 用户构建应用了！**
