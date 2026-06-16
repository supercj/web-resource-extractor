# 🔷 PRISM 棱镜

> 网页资源透视镜 — 一键提取、分类展示、瀑布图分析、批量导出网页资源

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Chrome](https://img.shields.io/badge/Chrome-120+-blue?logo=google-chrome)](https://www.google.com/chrome/)
[![Edge](https://img.shields.io/badge/Edge-120+-blue?logo=microsoft-edge)](https://www.microsoft.com/edge)

PRISM 棱镜是一款 Chrome / Edge 通用的 **Manifest V3** 网页资源提取扩展。像棱镜分解光谱一样，它能将网页分解为图片、脚本、样式、字体、视频、音频等各类资源，并提供瀑布图分析和批量导出功能。

---

## ✨ 功能特性

### 核心功能
- **🔍 全面提取** — 自动识别图片、JS、CSS、字体、视频、音频、链接、第三方资源
- **⚡ 动态监听** — 实时捕获懒加载图片、SPA 路由切换、动态脚本注入
- **🏷️ 元数据支持** — 提取 OpenGraph 和 Twitter Card 图片
- **📁 分类展示** — 8 大分类 Tab，资源一目了然
- **📊 统计面板** — 资源总数、总大小、类型分布柱状图
- **📈 瀑布图** — 可视化资源加载时间线，快速定位慢加载资源

### 高级功能
- **🔎 智能筛选** — 关键词搜索 + 后缀筛选 + 外部/大文件/慢加载过滤
- **📥 灵活导出** — 单个下载、批量选择、ZIP 打包、JSON/CSV/Markdown 导出
- **🖱️ 右键菜单** — 快速提取页面图片、链接、选区资源
- **🎨 精美主题** — 默认 / 暗黑 / 海洋 / 樱花，一键切换
- **🔔 实时通知** — Toast 提示新发现的资源
- **🔒 隐私优先** — 所有数据仅存储在浏览器本地，不采集、不上传

---

## 🆕 v1.1.0 新功能

### 动态资源监听
- ✅ **MutationObserver** - 自动捕获 DOM 变化中的新资源
- ✅ **PerformanceObserver** - 监听网络请求，补充性能数据
- ✅ **SPARouterMonitor** - 拦截 SPA 路由切换（React/Vue/Angular）
- ✅ **LazyLoadMonitor** - 智能识别懒加载图片（提前 50px 触发）
- ✅ **自动运行** - 后台静默监听，用户无感知

### 性能优化
- 防抖节流：MutationObserver 300ms、SPA 路由 500ms、消息通信 1s
- CPU 占用 < 10%（大型网站测试）
- 内存管理：WeakSet 防止泄漏
- 智能去重：O(1) 查找性能

---

## 📸 功能预览

| 资源列表 | 瀑布图 | 统计面板 | 主题切换 |
|:---:|:---:|:---:|:---:|
| 分类展示、搜索筛选 | 加载时间线可视化 | 资源大小分布 | 4 套主题实时切换 |

---

## 🚀 快速开始

### 方式一：应用商店安装（即将上线）

> Chrome Web Store 和 Edge Add-ons 审核中

### 方式二：本地加载（开发者）

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/prism.git
cd prism

# 2. 加载扩展
# - Chrome: chrome://extensions/
# - Edge: edge://extensions/
# - 开启「开发者模式」
# - 点击「加载已解压的扩展」
# - 选择项目目录
```

---

## 📂 项目结构

```
prism/
├── manifest.json              # 扩展清单（Manifest V3）
├── README.md                  # 项目说明
├── PRIVACY.md                 # 隐私政策
├── LICENSE                    # MIT 开源协议
├── popup/
│   ├── popup.html             # 弹窗页面
│   ├── popup.css              # 样式
│   └── popup.js               # 主逻辑（1166 行）
├── options/
│   ├── options.html           # 设置页面
│   ├── options.css
│   └── options.js
├── content/
│   └── content.js             # Content Script（1874 行）
│       ├── 资源提取核心
│       ├── 动态监听器（MutationMonitor、PerformanceMonitor 等）
│       └── 资源缓存管理（ResourceCache）
├── background/
│   └── service-worker.js      # Service Worker
├── lib/
│   └── simple-zip.js          # 轻量 ZIP 生成器
├── themes/
│   ├── default.css            # ☀️ 默认主题
│   ├── dark.css               # 🌙 暗黑主题
│   ├── ocean.css              # 🌊 海洋蓝主题
│   └── sakura.css             # 🌸 樱花粉主题
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🛠️ 技术实现

### 资源提取
| 模块 | 技术方案 |
|------|---------|
| 初始提取 | DOM 遍历 + `performance.getEntriesByType('resource')` |
| 动态监听 | MutationObserver + PerformanceObserver + IntersectionObserver |
| SPA 支持 | 拦截 `history.pushState/replaceState` + hashchange/popstate |
| 懒加载 | IntersectionObserver (rootMargin: 50px, threshold: 0.01) |

### 性能优化
- **防抖节流**：减少 95% 触发次数
- **批量处理**：降低函数调用开销
- **智能去重**：Set + Map 实现 O(1) 查找
- **事件委托**：避免大量监听器

### 其他技术
- **跨域下载**：Service Worker 代理 fetch
- **ZIP 打包**：自研 `SimpleZip`，零依赖
- **主题系统**：CSS 变量 + chrome.storage.sync
- **瀑布图**：纯 CSS 定位，无 Canvas

---

## 📊 代码统计

```
Language                 files          blank        comment           code
-------------------------------------------------------------------------
JavaScript                  10            450            520           4230
CSS                          5            180             80           1520
HTML                         3             30             15            380
-------------------------------------------------------------------------
SUM:                        18            660            615           6130
```

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

```bash
# 1. Fork 本仓库
# 2. 创建功能分支
git checkout -b feature/your-feature

# 3. 提交改动
git commit -m "feat: 添加新功能"

# 4. 推送分支
git push origin feature/your-feature

# 5. 创建 Pull Request
```

### 开发规范
- 代码风格：遵循现有代码风格
- 提交信息：使用 [约定式提交](https://www.conventionalcommits.org/zh-hans/)
- 功能测试：确保新功能在 Chrome 和 Edge 上正常工作

---

## 🐛 问题反馈

遇到问题？请通过以下方式反馈：

- **GitHub Issues**：https://github.com/your-username/prism/issues
- **功能建议**：欢迎在 Issues 中提出新功能建议

---

## 📝 更新日志

### v1.1.0 (2026-06-16)
- ✨ 新增动态资源监听功能
- ✨ 支持懒加载图片自动捕获
- ✨ 支持 SPA 路由切换监听
- ✨ 支持 OpenGraph/Twitter Card 图片提取
- ⚡ 性能优化：防抖节流、批量处理
- 🎨 改进 UI：Toast 通知、自动更新
- 📝 新增 1364 行代码

### v1.0.0 (2026-06-15)
- 🎉 首次发布
- ✨ 基础资源提取功能
- ✨ 瀑布图分析
- ✨ 批量导出
- ✨ 4 套主题

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

## 🙏 致谢

- 感谢所有贡献者
- 图标设计灵感来源于棱镜光谱
- 主题配色参考了多个优秀开源项目

---

## 🔗 相关链接

- **隐私政策**：[PRIVACY.md](PRIVACY.md)
- **应用商店清单**：[STORE_CHECKLIST.md](STORE_CHECKLIST.md)
- **Chrome 扩展文档**：https://developer.chrome.com/docs/extensions/

---

**Star 🌟 本项目以支持开发！**
