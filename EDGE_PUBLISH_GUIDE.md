# 📦 Microsoft Edge Add-ons 完整发布流程

## 📋 准备工作清单

### 1. 必需材料

#### ✅ 已准备好的文件
- [x] 扩展代码（已完成）
- [x] manifest.json（Manifest V3）
- [x] 隐私政策文档（PRIVACY.md）
- [x] README.md
- [x] 图标文件（16x16, 48x48, 128x128）

#### ⏳ 待准备的材料
- [ ] 商店截图 3-5 张（1280x800 或 640x400）
- [ ] 扩展 ZIP 包
- [ ] 宣传图（可选）

---

## 第一步：注册 Microsoft Partner Center 账号

### 1.1 访问注册页面
访问：https://partner.microsoft.com/dashboard/microsoftedge/public/login

### 1.2 创建账号
- 使用 Microsoft 账号登录（Outlook、Hotmail 等）
- 如果没有账号，点击「创建账号」
- **免费注册**，无需支付费用（与 Chrome Web Store 不同）

### 1.3 同意协议
- 阅读并同意「Microsoft Partner Center 协议」
- 阅读并同意「Edge 加载项商店开发者协议」

---

## 第二步：准备扩展 ZIP 包

### 2.1 打包前检查

```bash
cd "D:/work/Claude/web-resource-extractor"

# 检查必需文件
ls manifest.json README.md PRIVACY.md LICENSE

# 检查图标文件
ls icons/icon16.png icons/icon48.png icons/icon128.png

# 测试语法
node -c content/content.js
node -c popup/popup.js
```

### 2.2 创建 ZIP 包

#### 方法 1：使用命令行（推荐）

**Windows PowerShell：**
```powershell
cd "D:\work\Claude\web-resource-extractor"

# 压缩为 ZIP（排除 .git 和开发文件）
Compress-Archive -Path * -DestinationPath prism-v1.1.0.zip -Force
```

**Windows 命令提示符：**
```bash
cd "D:\work\Claude\web-resource-extractor"

# 使用 7-Zip
7z a -tzip prism-v1.1.0.zip * -x!.git -x!.gitignore -x!*.md
```

#### 方法 2：使用资源管理器

1. 选中以下文件和文件夹：
   - manifest.json
   - popup/
   - content/
   - background/
   - options/
   - themes/
   - icons/
   - lib/
   - LICENSE
   - README.md
   - PRIVACY.md

2. 右键 → 发送到 → 压缩(zipped)文件夹
3. 重命名为 `prism-v1.1.0.zip`

### 2.3 验证 ZIP 包

#### 解压测试
```bash
# 创建测试目录
mkdir test-unzip
cd test-unzip

# 解压
unzip ../prism-v1.1.0.zip

# 在 Edge 中加载测试
# edge://extensions/ → 开发者模式 → 加载解压的扩展
```

#### 检查清单
- [ ] manifest.json 在根目录
- [ ] 所有必需文件都存在
- [ ] 没有 .git 目录
- [ ] 没有开发文档（.md 除外必需的）
- [ ] ZIP 文件大小合理（< 10MB）

---

## 第三步：准备商店截图

### 3.1 截图要求

**尺寸要求：**
- 推荐：1280x800（16:10 比例）
- 最小：640x400
- 格式：PNG 或 JPEG

**数量：**
- 最少 1 张
- 推荐 3-5 张

### 3.2 推荐截图内容

#### 截图 1：主界面
- 打开任意网站（如 https://www.bing.com）
- 点击扩展图标
- 截取弹窗界面，显示资源列表
- **突出显示**：分类 Tab、搜索框、资源列表

#### 截图 2：瀑布图
- 点击「瀑布图」按钮
- 截取瀑布图界面
- **突出显示**：时间线、资源加载顺序

#### 截图 3：筛选功能
- 使用搜索框筛选
- 勾选「外部资源」
- 展开后缀筛选下拉
- **突出显示**：筛选选项

#### 截图 4：统计面板
- 点击「统计」按钮
- 截取统计面板
- **突出显示**：资源总数、大小、类型分布

#### 截图 5：主题切换
- 点击主题按钮
- 显示 4 种主题切换
- **突出显示**：不同主题效果

### 3.3 截图工具

**Windows：**
- Win + Shift + S（系统截图工具）
- Snipping Tool
- ShareX（免费）

**截图后处理：**
- 调整尺寸为 1280x800
- 添加边框和阴影（可选）
- 压缩文件大小

---

## 第四步：提交到 Edge Add-ons

### 4.1 登录开发者中心

访问：https://partner.microsoft.com/dashboard/microsoftedge/overview

### 4.2 创建新加载项

1. 点击左侧菜单「概述」→「新加载项」
2. 或点击「+ 新加载项」按钮

### 4.3 上传扩展包

#### 包信息
1. 点击「上传包」
2. 选择 `prism-v1.1.0.zip`
3. 等待上传和验证

**验证通过后显示：**
- ✅ 包名称：PRISM 棱镜
- ✅ 版本：1.0.0
- ✅ Manifest 版本：3

**如果验证失败：**
- 检查 manifest.json 格式
- 确认所有文件路径正确
- 查看错误详情并修复

### 4.4 填写可用性信息

#### 市场和定价
- **市场**：选择「所有市场」或指定地区
  - 推荐：选择「所有市场」（包括中国、美国、欧洲等）
- **定价**：免费
- **可见性**：
  - ☑️ 在 Microsoft Edge 加载项中公开此扩展

#### 属性
- **类别**：开发人员工具
- **隐私政策 URL**：
  ```
  https://github.com/supercj/web-resource-extractor/blob/main/PRIVACY.md
  ```
- **许可协议**：MIT License
  ```
  https://github.com/supercj/web-resource-extractor/blob/main/LICENSE
  ```

### 4.5 填写商品信息

#### 产品列表 - 中文（简体）

**名称：**（必需，不超过 45 个字符）
```
PRISM 棱镜 - 网页资源提取器
```

**摘要：**（必需，不超过 132 个字符）
```
一键提取网页所有资源：图片、脚本、样式、字体、视频、音频。支持懒加载、SPA 路由监听、批量导出。
```

**简短描述：**（必需，不超过 800 个字符）
```
PRISM 棱镜是一款功能强大的网页资源提取和分析工具，帮助开发者、设计师和内容创作者快速获取和分析网页资源。

核心功能：
• 全面提取：自动识别图片、脚本、样式表、字体、视频、音频、链接等
• 智能监听：支持懒加载图片、SPA 路由切换、动态脚本注入的实时捕获
• 性能分析：显示资源大小、加载时间、瀑布图可视化
• 高级筛选：按类型、域名、大小、速度、后缀等多维度筛选
• 批量导出：支持单个下载、批量导出、ZIP 打包
• 多种主题：内置 4 套精美主题

隐私承诺：
• 完全免费，无广告
• 不收集任何个人信息
• 不向任何第三方发送数据
• 本地运行，数据安全

适用场景：前端开发、UI/UX 设计、内容创作、性能优化、学习研究
```

**完整描述：**（可选，不超过 10000 个字符）
```
# PRISM 棱镜 - 网页资源提取器

像棱镜分解光谱一样，将网页分解为各类资源，帮助你快速获取和分析网页内容。

## 核心功能

### 🔍 全面提取
- 自动识别并提取图片、脚本、样式表、字体、视频、音频、链接等所有资源
- 支持 OpenGraph 和 Twitter Card 元数据图片提取
- 识别 CSS 背景图、Favicon、Srcset 等特殊资源

### ⚡ 智能监听
- **懒加载捕获**：自动识别并捕获懒加载图片（IntersectionObserver）
- **SPA 路由监听**：支持 React/Vue/Angular 等 SPA 应用的路由切换监听
- **动态脚本监听**：实时捕获动态注入的脚本和样式
- **DOM 变化监听**：自动发现新增的资源（MutationObserver）

### 📊 性能分析
- 显示每个资源的大小、加载时间、域名等详细信息
- 瀑布图可视化展示资源加载时序
- 快速定位慢加载资源和性能瓶颈
- 统计面板展示资源总数、总大小、类型分布

### 🔎 高级筛选
- 关键词搜索：按 URL、域名、文本内容搜索
- 类型筛选：8 大分类 Tab 快速切换
- 后缀筛选：按文件后缀过滤
- 智能筛选：外部资源、大文件（>100KB）、慢加载（>500ms）

### 📥 灵活导出
- 单个下载：点击即可下载任意资源
- 批量选择：勾选多个资源批量下载
- ZIP 打包：将选中资源打包为 ZIP 下载
- 多种格式：JSON、CSV、Markdown

### 🎨 精美主题
- ☀️ 默认主题
- 🌙 暗黑主题
- 🌊 海洋蓝主题
- 🌸 樱花粉主题

### 🖱️ 右键菜单
- 快速提取页面所有图片
- 快速提取页面所有链接
- 提取选区内的资源

## 适用场景

### 前端开发
- 分析竞品网站的资源结构
- 调试和优化资源加载
- 学习优秀网站的技术架构

### UI/UX 设计
- 提取设计素材和参考图片
- 分析配色方案和字体使用
- 收集设计灵感

### 内容创作
- 批量下载图片和媒体资源
- 提取文章链接和引用
- 素材收集和整理

### 性能优化
- 分析资源加载瓶颈
- 识别大文件和慢加载资源
- 优化网站性能

### 学习研究
- 了解网站的技术架构
- 学习资源加载策略
- 分析性能优化技巧

## 技术特性

- **Manifest V3**：符合最新浏览器扩展标准
- **高性能**：防抖节流优化，CPU 占用 < 10%
- **智能去重**：自动过滤重复资源
- **跨域支持**：通过 Service Worker 代理下载跨域资源
- **本地运行**：所有数据仅存储在本地，不上传到服务器

## 隐私承诺

✅ 不收集任何个人信息
✅ 不向任何第三方发送数据
✅ 不注入广告或追踪代码
✅ 仅申请运行所必需的最小权限
✅ 完全免费，无任何隐藏费用

## 权限说明

- `activeTab`：访问当前活动标签页，提取资源信息
- `scripting`：注入内容脚本到目标页面
- `storage`：保存用户主题偏好和设置
- `contextMenus`：注册右键菜单
- `downloads`：用户主动下载资源时使用
- `<all_urls>`：代理下载跨域资源（仅在用户触发导出时）

## 系统要求

- Microsoft Edge 120 或更高版本
- 或 Google Chrome 120 或更高版本

## 支持与反馈

- GitHub：https://github.com/supercj/web-resource-extractor
- Issues：https://github.com/supercj/web-resource-extractor/issues

## 开源项目

本项目基于 MIT License 开源，欢迎贡献代码和提出建议。
```

**截图：**
1. 上传 3-5 张截图（按顺序）
2. 为每张截图添加简短描述：
   - 截图 1：主界面 - 资源列表和分类展示
   - 截图 2：瀑布图 - 资源加载时序分析
   - 截图 3：筛选功能 - 多维度筛选资源
   - 截图 4：统计面板 - 资源统计和分布
   - 截图 5：主题切换 - 4 套精美主题

**YouTube 视频 URL：**（可选）
- 如果有演示视频，填写 YouTube 链接

#### 产品列表 - English（可选但推荐）

**Display Name:**
```
PRISM - Web Resource Extractor
```

**Summary:**
```
Extract all web resources: images, scripts, styles, fonts, videos, audios. Support lazy-load, SPA routing, batch export.
```

**Short Description:**
```
PRISM is a powerful web resource extraction and analysis tool for developers, designers, and content creators.

Key Features:
• Comprehensive Extraction: Automatically identify images, scripts, styles, fonts, videos, audios, links, etc.
• Smart Monitoring: Support lazy-load images, SPA routing, dynamic script injection
• Performance Analysis: Display resource size, load time, waterfall chart
• Advanced Filtering: Filter by type, domain, size, speed, extension
• Batch Export: Single download, batch selection, ZIP packaging
• Multiple Themes: 4 beautiful themes included

Privacy Commitment:
• Completely free, no ads
• No personal information collected
• No data sent to any third party
• Run locally, data security

Use Cases: Frontend development, UI/UX design, content creation, performance optimization, learning and research
```

### 4.6 审核笔记（可选）

**供审核人员查看的信息：**
```
感谢审核！

测试说明：
1. 访问任意网站（推荐 https://www.bing.com）
2. 点击扩展图标打开弹窗
3. 查看提取的资源列表
4. 可以测试筛选、导出、主题切换等功能

特殊说明：
- <all_urls> 权限仅用于代理下载跨域资源，不会主动访问用户数据
- 所有数据仅在本地处理，不上传到任何服务器
- 隐私政策：https://github.com/supercj/web-resource-extractor/blob/main/PRIVACY.md

如有任何问题，请通过 GitHub Issues 联系我们。
```

### 4.7 提交审核

1. 检查所有信息是否填写完整
2. 点击「提交」或「发布」按钮
3. 确认提交

---

## 第五步：等待审核

### 5.1 审核时间

- **通常**：1-5 个工作日
- **高峰期**：可能需要 1-2 周

### 5.2 审核状态

#### 可以查看的状态：
1. **审核中**（In review）
   - 正在审核，请耐心等待

2. **需要更多信息**（More information needed）
   - 审核人员有疑问，需要你补充说明
   - 查看审核笔记，按要求修改并重新提交

3. **已发布**（Published）
   - 🎉 恭喜！扩展已上架
   - 可以在商店搜索到

4. **被拒绝**（Rejected）
   - 未通过审核
   - 查看拒绝原因，修改后重新提交

### 5.3 常见拒绝原因

#### 1. 权限过度
**问题**：`<all_urls>` 权限未充分说明
**解决**：在审核笔记中明确说明用途

#### 2. 隐私政策不完整
**问题**：隐私政策链接无效或内容不完整
**解决**：确认链接可访问，内容详细

#### 3. 功能描述不清
**问题**：审核人员不理解扩展功能
**解决**：在审核笔记中提供详细测试步骤

#### 4. 截图不符合要求
**问题**：截图尺寸错误或内容不清晰
**解决**：重新制作符合要求的截图

#### 5. 商标或版权问题
**问题**：名称或图标涉及版权
**解决**：使用原创名称和图标

---

## 第六步：发布成功

### 6.1 验证发布

访问商店页面：
```
https://microsoftedge.microsoft.com/addons/search/PRISM
```

搜索你的扩展，确认可以找到并安装。

### 6.2 获取商店链接

发布成功后，你会获得一个商店链接：
```
https://microsoftedge.microsoft.com/addons/detail/[扩展ID]
```

### 6.3 更新 README.md

在 GitHub 仓库的 README.md 中添加商店徽章：

```markdown
[![Microsoft Edge Add-ons](https://img.shields.io/badge/Edge-Add--ons-blue?logo=microsoft-edge)](商店链接)
```

### 6.4 宣传推广

- 在 GitHub 仓库添加商店链接
- 在社交媒体分享
- 在相关社区推广

---

## 后续维护

### 更新扩展

1. 修改代码
2. 更新 `manifest.json` 中的 `version`
3. 重新打包 ZIP
4. 登录开发者中心
5. 点击扩展 → 更新
6. 上传新的 ZIP 包
7. 提交审核

### 响应用户反馈

- 及时回复用户评论
- 修复用户报告的 Bug
- 考虑用户建议的新功能

---

## 📝 检查清单

### 提交前
- [ ] 代码测试通过，无明显 Bug
- [ ] manifest.json 版本号正确
- [ ] 准备好 ZIP 包
- [ ] 准备好 3-5 张截图
- [ ] 隐私政策链接可访问
- [ ] 确认所有信息填写完整

### 提交后
- [ ] 查看审核状态
- [ ] 响应审核人员的问题
- [ ] 发布成功后验证商店页面
- [ ] 更新 GitHub README
- [ ] 宣传推广

---

## 🆘 需要帮助？

### 官方文档
- Microsoft Edge 扩展文档：https://docs.microsoft.com/microsoft-edge/extensions-chromium/
- 发布指南：https://docs.microsoft.com/microsoft-edge/extensions-chromium/publish/publish-extension

### 常见问题
- Edge 扩展论坛：https://techcommunity.microsoft.com/t5/edge-extensions/ct-p/edge-extensions

---

**祝发布顺利！** 🚀
