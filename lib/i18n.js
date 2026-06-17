/**
 * 完全自定义的 i18n 系统
 * 支持运行时动态切换语言
 */

// 当前语言
let currentLanguage = null;

// 翻译数据
let translations = {
  zh_CN: null,
  en: null
};

// 获取浏览器语言
function getBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  return lang.startsWith('zh') ? 'zh_CN' : 'en';
}

// 加载翻译文件
async function loadTranslations(lang) {
  if (translations[lang]) {
    return translations[lang];
  }

  try {
    const response = await fetch(chrome.runtime.getURL(`_locales/${lang}/messages.json`));
    const data = await response.json();
    translations[lang] = data;
    return data;
  } catch (e) {
    console.error('[i18n] Failed to load translations:', lang, e);
    return {};
  }
}

// 初始化语言
async function initLanguage() {
  // 优先使用用户保存的语言
  const stored = await chrome.storage.sync.get(['language']);
  if (stored.language) {
    currentLanguage = stored.language;
  } else {
    // 否则使用浏览器语言
    currentLanguage = getBrowserLanguage();
  }

  // 加载翻译
  await loadTranslations(currentLanguage);

  return currentLanguage;
}

// 获取翻译文本
function i18n(key, substitutions) {
  const lang = currentLanguage || 'zh_CN';
  const trans = translations[lang];

  if (!trans || !trans[key]) {
    console.warn('[i18n] Missing translation:', key, lang);
    return key;
  }

  let message = trans[key].message;

  // 处理占位符
  if (substitutions) {
    if (typeof substitutions === 'string') {
      message = message.replace(/\$1/g, substitutions);
    } else if (Array.isArray(substitutions)) {
      substitutions.forEach((sub, i) => {
        message = message.replace(new RegExp(`\\$${i + 1}`, 'g'), sub);
      });
    }
    // 处理命名占位符 $COUNT$ 等
    if (trans[key].placeholders) {
      Object.keys(trans[key].placeholders).forEach((name, idx) => {
        const placeholder = `$${name.toUpperCase()}$`;
        const value = Array.isArray(substitutions) ? substitutions[idx] : substitutions;
        message = message.replace(new RegExp(placeholder, 'g'), value);
      });
    }
  }

  return message;
}

// 应用翻译到页面
function applyTranslations() {
  // 翻译所有带 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = i18n(key);
    if (text) {
      if (el.tagName === 'INPUT' && el.type !== 'button' && el.type !== 'submit') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
  });

  // 翻译所有带 data-i18n-placeholder 属性的元素
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = i18n(key);
    if (text) {
      el.placeholder = text;
    }
  });

  // 翻译所有带 data-i18n-title 属性的元素
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const text = i18n(key);
    if (text) {
      el.title = text;
    }
  });

  // 翻译所有带 data-i18n-aria-label 属性的元素
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria-label');
    const text = i18n(key);
    if (text) {
      el.setAttribute('aria-label', text);
    }
  });
}

// 切换语言
async function switchLanguage(lang) {
  // 加载新语言的翻译
  await loadTranslations(lang);

  // 更新当前语言
  currentLanguage = lang;

  // 保存到存储
  await chrome.storage.sync.set({ language: lang });

  // 重新应用翻译
  applyTranslations();

  return lang;
}

// 获取当前语言
function getCurrentLanguage() {
  return currentLanguage;
}

// 在 DOM 加载完成后自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await initLanguage();
    applyTranslations();
  });
} else {
  (async () => {
    await initLanguage();
    applyTranslations();
  })();
}
