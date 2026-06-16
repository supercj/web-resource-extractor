@echo off
REM PRISM 棱镜 - GitHub 推送脚本
REM 使用方法：双击运行此文件

echo ================================
echo PRISM 棱镜 - GitHub 推送
echo ================================
echo.

echo [1/4] 检查 Git 状态...
git status
echo.

echo [2/4] 设置主分支为 main...
git branch -M main
echo.

echo [3/4] 推送到 GitHub...
echo 正在推送到: https://github.com/supercj/web-resource-extractor.git
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================
    echo ✅ 推送成功！
    echo ================================
    echo.
    echo 📋 下一步：
    echo 1. 访问仓库: https://github.com/supercj/web-resource-extractor
    echo 2. 创建版本标签:
    echo    git tag -a v1.1.0 -m "Release v1.1.0 - 动态监听优化"
    echo    git push origin v1.1.0
    echo.
    echo 3. 在 GitHub 上创建 Release
    echo.
) else (
    echo.
    echo ================================
    echo ❌ 推送失败
    echo ================================
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题（检查代理或VPN）
    echo 2. GitHub 认证问题（需要配置 Git 凭据）
    echo 3. 仓库不存在或无权限
    echo.
    echo 💡 解决方案：
    echo 1. 检查网络连接
    echo 2. 配置 Git 凭据：
    echo    git config --global user.name "Your Name"
    echo    git config --global user.email "your-email@example.com"
    echo 3. 使用 GitHub Desktop 或 Git GUI 工具
    echo.
)

echo [4/4] 查看提交历史...
git log --oneline -5
echo.

pause
