#!/bin/bash

# PRISM 棱镜 - Edge 发布快速准备脚本
# 使用方法：bash prepare-edge-publish.sh

echo "================================"
echo "PRISM 棱镜 - Edge 发布准备"
echo "================================"
echo ""

# 1. 检查必需文件
echo "[1/4] 检查必需文件..."
files=("manifest.json" "README.md" "PRIVACY.md" "LICENSE" "icons/icon16.png" "icons/icon48.png" "icons/icon128.png")
missing=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - 缺失"
    missing=$((missing + 1))
  fi
done

if [ $missing -gt 0 ]; then
  echo ""
  echo "❌ 缺少 $missing 个必需文件，请先补充"
  exit 1
fi

echo ""
echo "✅ 所有必需文件都存在"
echo ""

# 2. 创建 ZIP 包
echo "[2/4] 创建 ZIP 包..."
version=$(grep '"version"' manifest.json | sed 's/.*: "\(.*\)".*/\1/')
zip_name="prism-v${version}.zip"

# 删除旧的 ZIP
rm -f prism-*.zip

# 创建新的 ZIP（排除不需要的文件）
zip -r "$zip_name" . \
  -x "*.git*" \
  -x "*.md" \
  -x "*.sh" \
  -x "*.bat" \
  -x "prism-*.zip" \
  > /dev/null 2>&1

# 添加必需的 .md 文件
zip "$zip_name" README.md PRIVACY.md > /dev/null 2>&1

if [ -f "$zip_name" ]; then
  size=$(du -h "$zip_name" | cut -f1)
  echo "  ✅ 已创建: $zip_name ($size)"
else
  echo "  ❌ 创建失败"
  exit 1
fi

echo ""

# 3. 验证 ZIP 包
echo "[3/4] 验证 ZIP 包..."
unzip -l "$zip_name" | grep -E "manifest.json|popup/|content/|background/" > /dev/null

if [ $? -eq 0 ]; then
  echo "  ✅ ZIP 包结构正确"
else
  echo "  ❌ ZIP 包结构异常"
  exit 1
fi

echo ""

# 4. 显示下一步
echo "[4/4] 准备完成！"
echo ""
echo "================================"
echo "📦 发布包已准备好"
echo "================================"
echo ""
echo "文件位置: $(pwd)/$zip_name"
echo "文件大小: $size"
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 准备商店截图 (3-5张，1280x800)"
echo "   - 主界面"
echo "   - 瀑布图"
echo "   - 筛选功能"
echo "   - 统计面板"
echo "   - 主题切换"
echo ""
echo "2. 注册 Microsoft Partner Center"
echo "   https://partner.microsoft.com/dashboard/microsoftedge"
echo ""
echo "3. 创建新加载项并上传 $zip_name"
echo ""
echo "4. 填写产品信息："
echo "   - 名称: PRISM 棱镜 - 网页资源提取器"
echo "   - 隐私政策: https://github.com/supercj/web-resource-extractor/blob/main/PRIVACY.md"
echo "   - 许可协议: MIT License"
echo ""
echo "5. 上传截图并提交审核"
echo ""
echo "📖 详细指南: cat EDGE_PUBLISH_GUIDE.md"
echo ""
echo "================================"
