# 国际化（i18n）实现计划

## 方案选择

### 方案 1：Chrome Extension i18n API（推荐）
使用 Chrome 原生的 `chrome.i18n` API

**优点：**
- 官方标准，性能好
- 自动检测浏览器语言
- 无需额外库

**缺点：**
- 需要创建 _locales 目录结构
- 修改所有 HTML 文件

### 方案 2：自定义 JavaScript i18n
手动实现语言切换

**优点：**
- 灵活，容易控制
- 可以动态切换

**缺点：**
- 需要自己实现所有逻辑
- 性能略差

## 推荐实现：方案 1（Chrome i18n API）

## 实施步骤

### 1. 创建目录结构
```
_locales/
├── zh_CN/
│   └── messages.json
└── en/
    └── messages.json
```

### 2. 更新 manifest.json
```json
{
  "default_locale": "zh_CN",
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__"
}
```

### 3. 修改 HTML 文件
```html
<!-- 之前 -->
<h1>PRISM 棱镜</h1>

<!-- 之后 -->
<h1 data-i18n="extensionName"></h1>
```

### 4. 修改 JavaScript
```javascript
// 加载翻译
function loadI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = chrome.i18n.getMessage(key);
  });
}
```

### 5. 添加语言切换
- 在设置页面添加语言选项
- 使用 chrome.storage 保存用户选择

## 待翻译内容

### popup.html
- 标题、按钮、标签页
- 筛选选项
- 提示文本

### options.html  
- 设置项标题和描述
- 主题名称

### 文档
- README.md → README_EN.md
- PRIVACY.md → PRIVACY_EN.md

## 时间估算
- 创建翻译文件：30分钟
- 修改 HTML/JS：1小时
- 测试：30分钟

**总计：2小时**

---

由于这是一个较大的改动，建议分步实施。是否现在开始？
