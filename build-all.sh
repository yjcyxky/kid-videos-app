#!/bin/bash

# 儿童视频应用 - 多架构构建脚本
# 支持 Intel (x86_64) 和 Apple Silicon (aarch64) macOS

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="儿童视频应用"
APP_NAME="kid-videos-app"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ${PROJECT_NAME} - 多架构构建${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检测当前系统架构
CURRENT_ARCH=$(uname -m)
echo -e "${YELLOW}📋 当前系统架构: ${CURRENT_ARCH}${NC}"
echo ""

# 检查必要工具
check_dependencies() {
    echo -e "${YELLOW}🔍 检查构建依赖...${NC}"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi
    
    # 检查 Rust
    if ! command -v rustc &> /dev/null; then
        echo -e "${RED}❌ Rust 未安装${NC}"
        exit 1
    fi
    
    # 检查 Tauri CLI
    if ! command -v cargo-tauri &> /dev/null; then
        echo -e "${YELLOW}📦 安装 Tauri CLI...${NC}"
        cargo install tauri-cli
    fi
    
    echo -e "${GREEN}✅ 依赖检查完成${NC}"
    echo ""
}

# 函数：安装 Rust target
install_rust_target() {
    local target=$1
    echo -e "${YELLOW}🔧 检查 Rust target: ${target}${NC}"

    if rustup target list | grep -q "${target} (installed)"; then
        echo -e "${GREEN}✅ ${target} 已安装${NC}"
    else
        echo -e "${YELLOW}📦 安装 ${target}...${NC}"
        rustup target add ${target}
        echo -e "${GREEN}✅ ${target} 安装完成${NC}"
    fi
    echo ""
}

# 函数：清理构建缓存
clean_build() {
    echo -e "${YELLOW}🧹 清理构建缓存...${NC}"
    
    # 清理前端构建
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        echo -e "${GREEN}✅ 前端构建缓存已清理${NC}"
    fi
    
    # 清理 Rust 构建
    if [ -d "src-tauri/target" ]; then
        rm -rf src-tauri/target
        echo -e "${GREEN}✅ Rust 构建缓存已清理${NC}"
    fi
    
    echo ""
}

# 函数：构建前端
build_frontend() {
    echo -e "${YELLOW}🏗️  构建前端...${NC}"
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 安装依赖...${NC}"
        npm install
    fi
    
    # 构建前端
    npm run build:frontend
    
    echo -e "${GREEN}✅ 前端构建完成${NC}"
    echo ""
}

# 函数：构建指定架构
build_architecture() {
    local target=$1
    local arch_name=$2

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  构建 ${arch_name} 版本${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    echo -e "${YELLOW}🏗️  开始构建 ${arch_name}...${NC}"
    
    # 构建前端（如果还没构建）
    if [ ! -d "frontend/dist" ]; then
        build_frontend
    fi
    
    # 构建 Tauri 应用
    cd src-tauri
    cargo tauri build --target ${target}
    cd ..

    echo -e "${GREEN}✅ ${arch_name} 构建完成${NC}"
    echo -e "${GREEN}📦 输出目录: src-tauri/target/${target}/release/bundle/${NC}"
    echo ""
}

# 函数：创建 Universal Binary
create_universal_binary() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  创建 Universal Binary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    local intel_bin="src-tauri/target/x86_64-apple-darwin/release/${APP_NAME}"
    local arm_bin="src-tauri/target/aarch64-apple-darwin/release/${APP_NAME}"
    local universal_bin="src-tauri/target/universal-apple-darwin/release/${APP_NAME}"

    # 创建输出目录
    mkdir -p "src-tauri/target/universal-apple-darwin/release"

    if [ -f "${intel_bin}" ] && [ -f "${arm_bin}" ]; then
        echo -e "${YELLOW}🔗 合并 Intel 和 ARM 二进制文件...${NC}"
        lipo -create "${intel_bin}" "${arm_bin}" -output "${universal_bin}"

        echo -e "${GREEN}✅ Universal Binary 创建完成${NC}"
        echo -e "${GREEN}📦 输出: ${universal_bin}${NC}"

        # 验证 Universal Binary
        echo ""
        echo -e "${YELLOW}🔍 验证 Universal Binary:${NC}"
        lipo -info "${universal_bin}"
        echo ""
        
        # 创建 Universal Bundle
        create_universal_bundle
    else
        echo -e "${RED}❌ 缺少必要的二进制文件${NC}"
        echo -e "${RED}   请先运行 Intel 和 ARM 构建${NC}"
        exit 1
    fi
}

# 函数：创建 Universal Bundle
create_universal_bundle() {
    echo -e "${YELLOW}📦 创建 Universal Bundle...${NC}"
    
    local intel_bundle="src-tauri/target/x86_64-apple-darwin/release/bundle"
    local universal_bundle="src-tauri/target/universal-apple-darwin/release/bundle"
    
    if [ -d "${intel_bundle}" ]; then
        # 复制 Intel bundle 作为基础
        cp -r "${intel_bundle}" "${universal_bundle}"
        
        # 替换二进制文件为 Universal Binary
        local app_path="${universal_bundle}/macos/${APP_NAME}.app/Contents/MacOS/${APP_NAME}"
        if [ -f "${app_path}" ]; then
            cp "src-tauri/target/universal-apple-darwin/release/${APP_NAME}" "${app_path}"
            echo -e "${GREEN}✅ Universal Bundle 创建完成${NC}"
        fi
    fi
}

# 函数：显示构建结果
show_build_results() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}  ✅ 构建完成！${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    echo -e "${YELLOW}📂 构建输出位置:${NC}"
    
    # 检查各架构的构建结果
    if [ -d "src-tauri/target/x86_64-apple-darwin/release/bundle" ]; then
        echo "  Intel (x86_64):  src-tauri/target/x86_64-apple-darwin/release/bundle/"
        if [ -f "src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/${APP_NAME}_*.dmg" ]; then
            echo "    📀 DMG: $(ls src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/${APP_NAME}_*.dmg 2>/dev/null | head -1)"
        fi
    fi
    
    if [ -d "src-tauri/target/aarch64-apple-darwin/release/bundle" ]; then
        echo "  Apple Silicon:   src-tauri/target/aarch64-apple-darwin/release/bundle/"
        if [ -f "src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/${APP_NAME}_*.dmg" ]; then
            echo "    📀 DMG: $(ls src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/${APP_NAME}_*.dmg 2>/dev/null | head -1)"
        fi
    fi
    
    if [ -d "src-tauri/target/universal-apple-darwin/release/bundle" ]; then
        echo "  Universal:       src-tauri/target/universal-apple-darwin/release/bundle/"
        if [ -f "src-tauri/target/universal-apple-darwin/release/bundle/dmg/${APP_NAME}_*.dmg" ]; then
            echo "    📀 DMG: $(ls src-tauri/target/universal-apple-darwin/release/bundle/dmg/${APP_NAME}_*.dmg 2>/dev/null | head -1)"
        fi
    fi
    
    echo ""
    echo -e "${YELLOW}💡 使用提示:${NC}"
    echo "  - 推荐使用 Universal 版本，兼容所有 Mac 设备"
    echo "  - DMG 文件可直接分发给用户安装"
    echo "  - APP 文件位于 bundle/macos/ 目录下"
    echo ""
}

# 检查依赖
check_dependencies

# 主菜单
echo -e "${YELLOW}请选择构建选项:${NC}"
echo "1) 只构建 Intel (x86_64) 版本"
echo "2) 只构建 Apple Silicon (ARM64) 版本"
echo "3) 构建 Universal Binary (推荐)"
echo "4) 构建所有版本 (Intel + ARM + Universal)"
echo "5) 清理构建缓存"
echo "6) 退出"
echo ""
read -p "请输入选项 (1-6): " choice

case $choice in
    1)
        echo ""
        install_rust_target "x86_64-apple-darwin"
        build_architecture "x86_64-apple-darwin" "Intel (x86_64)"
        show_build_results
        ;;
    2)
        echo ""
        install_rust_target "aarch64-apple-darwin"
        build_architecture "aarch64-apple-darwin" "Apple Silicon (ARM64)"
        show_build_results
        ;;
    3)
        echo ""
        echo -e "${YELLOW}🎯 构建 Universal Binary 需要先编译两个架构${NC}"
        echo ""

        install_rust_target "x86_64-apple-darwin"
        install_rust_target "aarch64-apple-darwin"

        build_architecture "x86_64-apple-darwin" "Intel (x86_64)"
        build_architecture "aarch64-apple-darwin" "Apple Silicon (ARM64)"
        create_universal_binary
        show_build_results
        ;;
    4)
        echo ""
        install_rust_target "x86_64-apple-darwin"
        install_rust_target "aarch64-apple-darwin"

        build_architecture "x86_64-apple-darwin" "Intel (x86_64)"
        build_architecture "aarch64-apple-darwin" "Apple Silicon (ARM64)"
        create_universal_binary
        show_build_results
        ;;
    5)
        echo ""
        clean_build
        echo -e "${GREEN}✅ 构建缓存清理完成${NC}"
        ;;
    6)
        echo -e "${YELLOW}👋 退出构建${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ 无效选项${NC}"
        exit 1
        ;;
esac
