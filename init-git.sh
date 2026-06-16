#!/bin/bash

# PRISM 棱镜 - Git 初始化脚本
# 使用方法：bash init-git.sh your-github-username

set -e  # 遇到错误立即退出

# 检查参数
if [ -z "$1" ]; then
  echo "❌ 错误：请提供 GitHub 用户名"
  echo "使用方法：bash init-git.sh your-github-username"
  exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="prism"

echo "🚀 开始初始化 Git 仓库..."
echo ""

# 1. 检查是否已经是 Git 仓库
if [ -d ".git" ]; then
  echo "⚠️  警告：已经是 Git 仓库，跳过初始化"
else
  echo "📦 初始化 Git 仓库..."
  git init
  echo "✅ Git 仓库初始化完成"
fi

echo ""

# 2. 添加所有文件
echo "📝 添加文件到 Git..."
git add .
echo "✅ 文件添加完成"

echo ""

# 3. 创建初始提交
echo "💾 创建初始提交..."
git commit -m "feat: initial commit - PRISM 棱镜 v1.1.0

- 全面的资源提取功能
- 动态监听（懒加载、SPA、动态脚本）
- 瀑布图分析
- 批量导出（ZIP、JSON、CSV、Markdown）
- 4 套精美主题
- 隐私优先，本地运行"

echo "✅ 初始提交完成"

echo ""

# 4. 设置主分支名称
echo "🌿 设置主分支为 main..."
git branch -M main
echo "✅ 主分支设置完成"

echo ""

# 5. 添加远程仓库
REMOTE_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
echo "🔗 添加远程仓库：${REMOTE_URL}"

# 检查远程仓库是否已存在
if git remote | grep -q "^origin$"; then
  echo "⚠️  警告：远程仓库 origin 已存在，跳过添加"
else
  git remote add origin ${REMOTE_URL}
  echo "✅ 远程仓库添加完成"
fi

echo ""

# 6. 提示用户
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Git 初始化完成！"
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 在 GitHub 创建仓库："
echo "   👉 访问 https://github.com/new"
echo "   👉 仓库名称：${REPO_NAME}"
echo "   👉 描述：网页资源提取器 - 支持懒加载、SPA、批量导出"
echo "   👉 选择 Public"
echo "   👉 不要勾选任何初始化选项"
echo "   👉 点击 'Create repository'"
echo ""
echo "2. 推送代码到 GitHub："
echo "   $ git push -u origin main"
echo ""
echo "3. 创建版本标签："
echo "   $ git tag -a v1.1.0 -m \"Release v1.1.0 - 动态监听优化\""
echo "   $ git push origin v1.1.0"
echo ""
echo "4. 更新文件中的 GitHub 链接："
echo "   - README.md"
echo "   - PRIVACY.md"
echo "   - STORE_CHECKLIST.md"
echo "   将 'your-username' 替换为 '${GITHUB_USERNAME}'"
echo ""
echo "5. 提交链接更新："
echo "   $ git add README.md PRIVACY.md STORE_CHECKLIST.md"
echo "   $ git commit -m \"docs: 更新 GitHub 仓库链接\""
echo "   $ git push origin main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 详细说明请查看 GIT_GUIDE.md"
echo ""
