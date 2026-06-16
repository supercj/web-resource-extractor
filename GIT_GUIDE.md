# Git 提交指南

## 📋 提交前准备

### 1. 初始化 Git 仓库

```bash
cd web-resource-extractor
git init
git add .
git commit -m "feat: initial commit - PRISM 棱镜 v1.1.0"
```

### 2. 在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 仓库名称：`prism` 或 `web-resource-extractor`
3. 描述：网页资源提取器 - 支持懒加载、SPA、批量导出
4. 选择：Public（公开）
5. **不要**勾选 "Add a README file"（我们已有 README.md）
6. **不要**勾选 "Add .gitignore"（我们已有 .gitignore）
7. 选择 License：MIT（或不选，我们已有 LICENSE）
8. 点击 "Create repository"

### 3. 关联远程仓库并推送

```bash
# 添加远程仓库（替换 your-username 为你的 GitHub 用户名）
git remote add origin https://github.com/your-username/prism.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 📝 提交信息规范

使用 [约定式提交](https://www.conventionalcommits.org/zh-hans/) 格式：

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

### 类型（Type）

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构代码
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具配置

### 示例

```bash
git commit -m "feat: 添加动态资源监听功能"
git commit -m "fix: 修复后缀筛选清空按钮无效问题"
git commit -m "docs: 更新 README 添加 v1.1.0 功能说明"
git commit -m "perf: 优化 MutationObserver 防抖时间"
```

---

## 🔄 后续更新提交

```bash
# 1. 查看修改文件
git status

# 2. 添加修改的文件
git add .

# 3. 提交
git commit -m "fix: 修复后缀筛选问题"

# 4. 推送到 GitHub
git push origin main
```

---

## 🏷️ 版本标签

发布新版本时打标签：

```bash
# 打标签
git tag -a v1.1.0 -m "Release v1.1.0 - 动态监听功能"

# 推送标签
git push origin v1.1.0

# 或推送所有标签
git push origin --tags
```

---

## 🌿 分支管理（推荐）

### 开发新功能

```bash
# 创建功能分支
git checkout -b feature/lazy-load-optimization

# 开发完成后合并到 main
git checkout main
git merge feature/lazy-load-optimization

# 删除功能分支
git branch -d feature/lazy-load-optimization
```

### 修复 Bug

```bash
# 创建修复分支
git checkout -b fix/filter-bug

# 修复完成后合并
git checkout main
git merge fix/filter-bug
```

---

## 📦 创建 Release

在 GitHub 上创建 Release：

1. 访问仓库页面
2. 点击右侧 "Releases" → "Create a new release"
3. 选择标签：v1.1.0
4. Release 标题：`v1.1.0 - 动态监听优化`
5. 描述内容：

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

## 📥 下载

请从以下渠道安装：
- Chrome Web Store（审核中）
- Edge Add-ons（审核中）
- 或手动下载源码加载
```

6. 上传 ZIP 包（可选）
7. 点击 "Publish release"

---

## 🔍 检查提交内容

### 提交前检查

```bash
# 查看将要提交的文件
git diff --cached

# 查看提交历史
git log --oneline

# 查看某个文件的修改历史
git log -p popup/popup.js
```

### 忽略文件检查

确保 .gitignore 正确配置，不提交以下内容：
- ❌ 开发文档（TEST.md, IMPLEMENTATION.md, FIX.md）
- ❌ 构建产物（*.zip, *.crx）
- ❌ 编辑器配置（.vscode/, .idea/）
- ❌ 操作系统文件（.DS_Store, Thumbs.db）

---

## 📂 推荐的文件结构（提交到 GitHub）

```
✅ 应该提交：
├── manifest.json
├── README.md
├── PRIVACY.md
├── LICENSE
├── .gitignore
├── popup/
├── content/
├── background/
├── options/
├── themes/
├── icons/
└── lib/

❌ 不应该提交：
├── .git/
├── .vscode/
├── node_modules/
├── *.log
├── *.zip
├── TEST.md
├── IMPLEMENTATION.md
├── FIX.md
└── CHANGELOG.md
```

---

## 🚨 常见问题

### Q: 不小心提交了敏感文件怎么办？

```bash
# 从 Git 历史中删除文件
git rm --cached sensitive-file.txt
git commit -m "chore: 移除敏感文件"
git push origin main
```

### Q: 想撤销最后一次提交？

```bash
# 保留修改，撤销提交
git reset --soft HEAD~1

# 完全撤销（危险！）
git reset --hard HEAD~1
```

### Q: 修改了已提交的 commit 信息？

```bash
# 修改最后一次提交信息
git commit --amend -m "新的提交信息"

# 强制推送（如果已推送到远程）
git push origin main --force
```

---

## ✅ 提交清单

在推送前确认：

- [ ] 代码已测试，无明显 Bug
- [ ] README.md 已更新
- [ ] PRIVACY.md 链接已更新
- [ ] manifest.json 版本号已更新
- [ ] 敏感信息已移除
- [ ] .gitignore 配置正确
- [ ] 提交信息清晰明确
- [ ] 所有文件语法正确

---

## 🎉 完成！

推送成功后，你的仓库地址为：
```
https://github.com/your-username/prism
```

记得在以下文件中更新仓库链接：
- README.md
- PRIVACY.md
- manifest.json（如果有 homepage_url）
- STORE_CHECKLIST.md
