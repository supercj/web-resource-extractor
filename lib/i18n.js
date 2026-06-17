/**
 * i18n 工具函数
 * 用于加载和应用国际化文本
 */

// 翻译数据缓存
let currentLocale = null;
let translations = {};

// 内置翻译（当 chrome.i18n 不可用时的后备）
const builtinTranslations = {
  zh_CN: {},
  en: {}
};

// 获取当前语言
async function getCurrentLocale() {
  if (currentLocale) return currentLocale;

  // 优先使用用户选择的语言
  const stored = await chrome.storage.sync.get(['language']);
  if (stored.language) {
    currentLocale = stored.language;
    return currentLocale;
  }

  // 否则使用浏览器语言
  const uiLang = chrome.i18n.getUILanguage();
  currentLocale = uiLang.startsWith('zh') ? 'zh_CN' : 'en';
  return currentLocale;
}

// 加载翻译数据
async function loadTranslations(locale) {
  try {
    const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
    const data = await response.json();
    translations[locale] = data;
    return data;
  } catch (e) {
    console.warn('[i18n] Failed to load translations:', locale, e);
    return builtinTranslations[locale] || {};
  }
}

// 获取翻译文本
function i18n(key, substitutions) {
  const locale = currentLocale || 'zh_CN';

  // 优先使用 chrome.i18n API
  const chromeMsg = chrome.i18n.getMessage(key, substitutions);
  if (chromeMsg) return chromeMsg;

  // 否则使用加载的翻译数据
  const trans = translations[locale];
  if (trans && trans[key]) {
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
    }

    return message;
  }

  return key;
}

// 初始化页面所有 data-i18n 元素
function initI18n() {
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

// 在 DOM 加载完成后自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await getCurrentLocale();
    await loadTranslations(currentLocale);
    initI18n();
  });
} else {
  (async () => {
    await getCurrentLocale();
    await loadTranslations(currentLocale);
    initI18n();
  })();
}
