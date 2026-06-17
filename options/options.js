/**
 * Options 页面逻辑
 * 主题选择 + 设置管理
 */

(function () {
  'use strict';

  // ── i18n 辅助函数 ──────────────────────────────────────
  const i18n = (key, substitutions) => {
    return window.i18n ? window.i18n(key, substitutions) : key;
  };

  const defaultSettings = {
    slowThreshold: 1000,
    showSize: true,
    showDuration: true,
    defaultTab: 'images',
    exportFormat: 'zip'
  };

  let currentTheme = 'default';
  let currentSettings = { ...defaultSettings };

  // ── 初始化 ───────────────────────────────────────

  async function init() {
    const stored = await chrome.storage.sync.get(['theme', 'settings']);
    currentTheme = stored.theme || 'default';
    currentSettings = { ...defaultSettings, ...(stored.settings || {}) };

    // 应用主题到页面
    document.documentElement.setAttribute('data-theme', currentTheme);

    // 更新 UI
    updateThemeCards();
    updateSettingsUI();

    // 绑定事件
    bindEvents();
  }

  // ── 事件绑定 ──────────────────────────────────────

  function bindEvents() {
    // 主题卡片点击
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.dataset.theme;
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeCards();
      });
    });

    // 保存按钮
    document.getElementById('btn-save').addEventListener('click', saveSettings);

    // 恢复默认按钮
    document.getElementById('btn-reset').addEventListener('click', resetSettings);
  }

  // ── 更新主题卡片选中状态 ──────────────────────────

  function updateThemeCards() {
    document.querySelectorAll('.theme-card').forEach(card => {
      const isActive = card.dataset.theme === currentTheme;
      card.classList.toggle('active', isActive);
      const check = card.querySelector('.theme-check');
      if (check) check.style.display = isActive ? 'flex' : 'none';
    });
  }

  // ── 更新设置 UI ───────────────────────────────────

  function updateSettingsUI() {
    document.getElementById('slow-threshold').value = currentSettings.slowThreshold;
    document.getElementById('default-tab').value = currentSettings.defaultTab;
    document.getElementById('export-format').value = currentSettings.exportFormat;
    document.getElementById('show-size').checked = currentSettings.showSize;
    document.getElementById('show-duration').checked = currentSettings.showDuration;
  }

  // ── 保存设置 ──────────────────────────────────────

  async function saveSettings() {
    const settings = {
      slowThreshold: parseInt(document.getElementById('slow-threshold').value) || 1000,
      showSize: document.getElementById('show-size').checked,
      showDuration: document.getElementById('show-duration').checked,
      defaultTab: document.getElementById('default-tab').value,
      exportFormat: document.getElementById('export-format').value
    };

    await chrome.storage.sync.set({
      theme: currentTheme,
      settings
    });

    currentSettings = settings;

    const status = document.getElementById('save-status');
    status.textContent = '✓ ' + i18n('settingsSaved');
    status.style.opacity = '1';
    setTimeout(() => { status.style.opacity = '0'; }, 2000);
  }

  // ── 恢复默认 ──────────────────────────────────────

  async function resetSettings() {
    if (!confirm(i18n('confirmReset'))) return;

    currentTheme = 'default';
    currentSettings = { ...defaultSettings };

    document.documentElement.setAttribute('data-theme', 'default');
    updateThemeCards();
    updateSettingsUI();

    await chrome.storage.sync.set({
      theme: 'default',
      settings: defaultSettings
    });

    const status = document.getElementById('save-status');
    status.textContent = '✓ ' + i18n('settingsReset');
    status.style.opacity = '1';
    setTimeout(() => { status.style.opacity = '0'; }, 2000);
  }

  // ── 启动 ──────────────────────────────────────────

  init();

})();
