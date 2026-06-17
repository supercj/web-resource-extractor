@echo off
REM PRISM 棱镜 - Edge 发布快速准备脚本
REM 使用方法：双击运行此文件

echo ================================
echo PRISM 棱镜 - Edge 发布准备
echo ================================
echo.

REM 1. 检查必需文件
echo [1/4] 检查必需文件...

set missing=0

if exist "manifest.json" (echo   ✅ manifest.json) else (echo   ❌ manifest.json - 缺失 & set /a missing+=1)
if exist "README.md" (echo   ✅ README.md) else (echo   ❌ README.md - 缺失 & set /a missing+=1)
if exist "PRIVACY.md" (echo   ✅ PRIVACY.md) else (echo   ❌ PRIVACY.md - 缺失 & set /a missing+=1)
if exist "LICENSE" (echo   ✅ LICENSE) else (echo   ❌ LICENSE - 缺失 & set /a missing+=1)
if exist "icons\icon16.png" (echo   ✅ icons\icon16.png) else (echo   ❌ icons\icon16.png - 缺失 & set /a missing+=1)
if exist "icons\icon48.png" (echo   ✅ icons\icon48.png) else (echo   ❌ icons\icon48.png - 缺失 & set /a missing+=1)
if exist "icons\icon128.png" (echo   ✅ icons\icon128.png) else (echo   ❌ icons\icon128.png - 缺失 & set /a missing+=1)

echo.

if %missing% GTR 0 (
    echo ❌ 缺少 %missing% 个必需文件，请先补充
    pause
    exit /b 1
)

echo ✅ 所有必需文件都存在
echo.

REM 2. 创建 ZIP 包
echo [2/4] 创建 ZIP 包...
echo.
echo 请手动创建 ZIP 包：
echo.
echo 方法 1 - 使用资源管理器：
echo   1. 选中以下文件和文件夹：
echo      - manifest.json
echo      - popup/
echo      - content/
echo      - background/
echo      - options/
echo      - themes/
echo      - icons/
echo      - lib/
echo      - LICENSE
echo      - README.md
echo      - PRIVACY.md
echo.
echo   2. 右键 → 发送到 → 压缩(zipped)文件夹
echo   3. 重命名为: prism-v1.1.0.zip
echo.
echo 方法 2 - 使用 PowerShell：
echo   powershell -Command "Compress-Archive -Path popup,content,background,options,themes,icons,lib,manifest.json,LICENSE,README.md,PRIVACY.md -DestinationPath prism-v1.1.0.zip -Force"
echo.

pause
echo.

REM 3. 检查 ZIP 是否创建
echo [3/4] 检查 ZIP 包...

if exist "prism-v1.1.0.zip" (
    echo   ✅ 发现 prism-v1.1.0.zip
    for %%A in (prism-v1.1.0.zip) do echo   文件大小: %%~zA 字节
) else (
    echo   ❌ 未找到 prism-v1.1.0.zip
    echo.
    echo 请先创建 ZIP 包后再继续
    pause
    exit /b 1
)

echo.

REM 4. 显示下一步
echo [4/4] 准备完成！
echo.
echo ================================
echo 📦 发布包已准备好
echo ================================
echo.
echo 文件位置: %CD%\prism-v1.1.0.zip
echo.
echo 📋 下一步操作：
echo.
echo 1. 准备商店截图 (3-5张，1280x800)
echo    - 主界面
echo    - 瀑布图
echo    - 筛选功能
echo    - 统计面板
echo    - 主题切换
echo.
echo 2. 注册 Microsoft Partner Center
echo    https://partner.microsoft.com/dashboard/microsoftedge
echo.
echo 3. 创建新加载项并上传 prism-v1.1.0.zip
echo.
echo 4. 填写产品信息：
echo    - 名称: PRISM 棱镜 - 网页资源提取器
echo    - 隐私政策: https://github.com/supercj/web-resource-extractor/blob/main/PRIVACY.md
echo    - 许可协议: MIT License
echo.
echo 5. 上传截图并提交审核
echo.
echo 📖 详细指南:
echo    打开 EDGE_PUBLISH_GUIDE.md 查看完整流程
echo.
echo ================================
echo.

pause
