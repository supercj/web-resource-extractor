# 🚀 GitHub 推送指南

## 当前状态

✅ **已完成**：
- Git 仓库已初始化
- 所有文件已添加
- 初始提交已创建
- 远程仓库已配置：`https://github.com/supercj/web-resource-extractor.git`
- GitHub 链接已更新（README.md, PRIVACY.md）

⏳ **待完成**：
- 推送代码到 GitHub

---

## 方式 1：使用脚本（推荐）

### Windows
```bash
# 双击运行
push-to-github.bat
```

### Linux/Mac
```bash
bash push-to-github.sh
```

---

## 方式 2：手动推送

### 步骤 1：确保仓库存在

访问 https://github.com/supercj/web-resource-extractor 检查仓库是否已创建。

如果不存在，请先创建：
1. 访问 https://github.com/new
2. 仓库名称：`web-resource-extractor`
3. 选择 Public
4. **不要**勾选任何初始化选项
5. 点击 "Create repository"

### 步骤 2：推送代码

```bash
cd "D:/work/Claude/web-resource-extractor"

# 推送到 main 分支
git push -u origin main
```

### 步骤 3：创建版本标签

```bash
# 创建 v1.1.0 标签
git tag -a v1.1.0 -m "Release v1.1.0 - 动态监听优化"

# 推送标签
git push origin v1.1.0
```

---

## 方式 3：使用 GitHub Desktop（最简单）

如果命令行推送失败，使用 GitHub Desktop：

### 下载并安装
https://desktop.github.com/

### 使用步骤
1. 打开 GitHub Desktop
2. 登录 GitHub 账号
3. File → Add Local Repository
4. 选择 `D:\work\Claude\web-resource-extractor`
5. 点击右上角 "Publish repository"
6. 勾选 "Keep this code private"（如果需要私有）
7. 点击 "Publish repository"

✅ 完成！代码会自动推送到 GitHub。

---

## 常见问题

### Q1: 推送时提示 "Connection reset" 或超时

**原因**：网络连接问题或被防火墙阻止

**解决方案**：

1. **检查网络连接**
   ```bash
   ping github.com
   ```

2. **使用代理**（如果有 VPN）
   ```bash
   git config --global http.proxy http://127.0.0.1:7890
   git config --global https.proxy https://127.0.0.1:7890
   ```

3. **使用 SSH 而非 HTTPS**
   ```bash
   # 删除现有远程仓库
   git remote remove origin
   
   # 使用 SSH
   git remote add origin git@github.com:supercj/web-resource-extractor.git
   git push -u origin main
   ```

4. **使用 GitHub CLI**
   ```bash
   # 安装 GitHub CLI: https://cli.github.com/
   gh auth login
   gh repo create web-resource-extractor --public --source=. --push
   ```

### Q2: 推送时提示认证失败

**解决方案**：

1. **配置 Git 用户信息**
   ```bash
   git config --global user.name "supercj"
   git config --global user.email "your-email@example.com"
   ```

2. **使用 Personal Access Token**
   
   a. 生成 Token：
   - 访问 https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 勾选 `repo` 权限
   - 生成并复制 Token

   b. 推送时使用 Token：
   ```bash
   git push https://YOUR_TOKEN@github.com/supercj/web-resource-extractor.git main
   ```

### Q3: 推送时提示仓库不存在

**解决方案**：

先在 GitHub 创建仓库：
```bash
# 使用 GitHub CLI
gh repo create web-resource-extractor --public

# 然后推送
git push -u origin main
```

---

## 推送成功后

### 1. 验证推送

访问 https://github.com/supercj/web-resource-extractor 查看代码是否已上传。

### 2. 创建 Release

1. 访问仓库页面
2. 点击右侧 "Releases" → "Create a new release"
3. Tag: `v1.1.0`
4. Title: `v1.1.0 - 动态监听优化`
5. 描述：

```markdown
## 🆕 新功能

- ✨ 动态资源监听（MutationObserver、PerformanceObserver）
- ✨ 懒加载图片自动捕获（IntersectionObserver）
- ✨ SPA 路由切换监听（History API 拦截）
- ✨ OpenGraph/Twitter Card 图片提取
- 🔔 Toast 实时通知

## ⚡ 性能优化

- 防抖节流优化（MutationObserver 300ms、消息通信 1s）
- 智能去重（O(1) 查找）
- CPU 占用 < 10%

## 🐛 Bug 修复

- 修复后缀筛选"清空"按钮无效问题
- 修复 content.js 语法错误

## 📊 代码统计

- 新增 1364 行代码
- 总计 6130 行代码
- 18 个文件

## 📥 安装

请从以下渠道安装：
- Chrome Web Store（即将上线）
- Edge Add-ons（即将上线）
- 或手动下载源码加载
```

6. 点击 "Publish release"

### 3. 设置仓库信息

1. 点击仓库右上角 ⚙️ Settings
2. 添加 Description：`🔷 网页资源提取器 - 一键提取图片、脚本、样式等资源，支持懒加载、SPA路由、批量导出`
3. 添加 Topics：
   - `chrome-extension`
   - `edge-extension`
   - `manifest-v3`
   - `resource-extractor`
   - `web-scraper`
   - `spa`
   - `lazy-load`
   - `performance-analysis`
   - `waterfall-chart`

---

## 📝 提交历史

查看提交历史：
```bash
git log --oneline
```

当前提交：
```
85eb2cc feat: initial commit - PRISM 棱镜 v1.1.0
```

---

## 📞 需要帮助？

如果推送遇到问题：

1. 检查错误信息
2. 参考上面的"常见问题"
3. 使用 GitHub Desktop
4. 在 GitHub Issues 提问：https://github.com/supercj/web-resource-extractor/issues

---

**祝推送顺利！🚀**
