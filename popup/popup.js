/**
 * Popup 主逻辑
 * 处理：资源展示、搜索筛选、下载导出、统计面板、瀑布图、主题切换
 */

(function () {
  'use strict';

  // ── i18n 辅助函数 ──────────────────────────────────────
  const i18n = (key, substitutions) => chrome.i18n.getMessage(key, substitutions);

  // ── 全局状态 ──────────────────────────────────────

  let currentData = null;
  let currentTab = 'images';
  let selectedItems = new Set();
  let currentTheme = 'default';
  let selectedExts = new Set(); // 选中的后缀
  let availableExts = []; // 当前可用的后缀列表
  let settings = {
    slowThreshold: 1000,
    showSize: true,
    showDuration: true,
    defaultTab: 'images'
  };

  // ── DOM 引用 ──────────────────────────────────────

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    pageInfo: $('#page-info'),
    pageUrl: $('#page-url'),
    searchInput: $('#search-input'),
    filterExternal: $('#filter-external'),
    filterLarge: $('#filter-large'),
    filterSlow: $('#filter-slow'),
    tabs: $('#tabs'),
    batchBar: $('#batch-bar'),
    selectedCount: $('#selected-count'),
    resourceList: $('#resource-list'),
    loading: $('#loading'),
    emptyState: $('#empty-state'),
    listContent: $('#list-content'),
    statsOverlay: $('#stats-overlay'),
    statsBody: $('#stats-body'),
    waterfallOverlay: $('#waterfall-overlay'),
    waterfallBody: $('#waterfall-body'),
    themeDropdown: $('#theme-dropdown'),
    languageDropdown: $('#language-dropdown'),
    toastContainer: $('#toast-container')
  };

  // ── 初始化 ───────────────────────────────────────

  async function init() {
    // 加载主题
    const stored = await chrome.storage.sync.get(['theme', 'settings']);
    if (stored.theme) {
      currentTheme = stored.theme;
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
    if (stored.settings) {
      settings = { ...settings, ...stored.settings };
    }

    // 绑定事件
    bindEvents();

    // 提取资源
    await extractResources();
  }

  // ── 事件绑定 ──────────────────────────────────────

  function bindEvents() {
    // 刷新
    $('#btn-refresh').addEventListener('click', () => extractResources());

    // 统计面板
    $('#btn-stats').addEventListener('click', () => showStatsPanel());

    // 瀑布图
    $('#btn-waterfall').addEventListener('click', () => showWaterfallPanel());

    // 主题切换
    $('#btn-theme').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleThemeDropdown();
    });

    // 语言切换
    $('#btn-language').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLanguageDropdown();
    });

    // 设置页
    $('#btn-options').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });

    // 关闭覆盖层
    $$('.panel-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-close');
        $(`#${targetId}`).style.display = 'none';
      });
    });

    // 点击覆盖层背景关闭
    $$('.overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    });

    // Tab 切换
    dom.tabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (tab) {
        $$('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        selectedItems.clear();
        selectedExts.clear(); // 切换 Tab 时重置后缀筛选
        updateExtFilterUI();
        updateBatchBar();
        renderResourceList();
      }
    });

    // 搜索
    dom.searchInput.addEventListener('input', debounce(() => renderResourceList(), 200));

    // 筛选
    dom.filterExternal.addEventListener('change', () => renderResourceList());
    dom.filterLarge.addEventListener('change', () => renderResourceList());
    dom.filterSlow.addEventListener('change', () => renderResourceList());

    // 后缀筛选
    $('#btn-ext-filter').addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = $('#ext-dropdown');
      dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
    });

    $('#ext-select-all').addEventListener('click', () => {
      selectedExts.clear(); // 清空 = 全选（不过滤任何后缀）
      updateExtFilterUI();
      renderResourceList();
    });

    $('#ext-deselect-all').addEventListener('click', () => {
      // 清空并选中所有后缀（相当于全部取消，不显示任何内容）
      selectedExts.clear();
      availableExts.forEach(item => selectedExts.add(item.ext));
      // 然后清空（这样会导致 applyFilters 中过滤掉所有）
      // 实际上应该是：选中所有后缀，然后在下一步取消所有
      // 但这个逻辑很奇怪，改为：添加一个特殊标记表示"全部不选"

      // 更简单的方式：添加一个不存在的后缀
      selectedExts.clear();
      selectedExts.add('__NONE__'); // 特殊标记：不显示任何内容
      updateExtFilterUI();
      renderResourceList();
    });

    // 点击其他地方关闭后缀下拉
    document.addEventListener('click', (e) => {
      const wrapper = $('.ext-filter-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        $('#ext-dropdown').style.display = 'none';
      }
    });

    // 批量操作
    $('#btn-select-all').addEventListener('click', selectAll);
    $('#btn-deselect-all').addEventListener('click', deselectAll);
    $('#btn-download-selected').addEventListener('click', downloadSelected);
    $('#btn-export-zip').addEventListener('click', exportZip);

    // 主题选项
    $$('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const theme = opt.dataset.themeValue;
        if (theme) {
          applyTheme(theme);
          dom.themeDropdown.style.display = 'none';
        }
        const language = opt.dataset.languageValue;
        if (language) {
          switchLanguage(language);
          dom.languageDropdown.style.display = 'none';
        }
      });
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (!dom.themeDropdown.contains(e.target) && e.target !== $('#btn-theme')) {
        dom.themeDropdown.style.display = 'none';
      }
      if (!dom.languageDropdown.contains(e.target) && e.target !== $('#btn-language')) {
        dom.languageDropdown.style.display = 'none';
      }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dom.statsOverlay.style.display = 'none';
        dom.waterfallOverlay.style.display = 'none';
        dom.themeDropdown.style.display = 'none';
        dom.languageDropdown.style.display = 'none';
      }
    });
  }

  // ── 资源提取 ──────────────────────────────────────

  async function extractResources() {
    dom.loading.style.display = 'flex';
    dom.emptyState.style.display = 'none';
    dom.listContent.innerHTML = '';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showError(i18n('cannotGetCurrentTab'));
        return;
      }

      // 检查是否是受限页面
      const url = tab.url || '';
      if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
          url.startsWith('edge://') || url.startsWith('about:') ||
          url.startsWith('chrome.google.com/webstore') ||
          url.startsWith('https://chrome.google.com/webstore')) {
        showError(i18n('cannotUseOnInternalPage'));
        return;
      }

      dom.pageUrl.textContent = url;
      dom.pageUrl.title = url;

      // 先注入 content script（确保是最新的）
      let injected = false;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        injected = true;
        console.log('[WRE] Content script injected');
      } catch (e) {
        console.log('[WRE] Script injection failed (可能已注入):', e.message);
      }

      // 等待脚本就绪
      await new Promise(r => setTimeout(r, 200));

      // 先 ping 一下确认 content script 已加载
      try {
        const pingResponse = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        console.log('[WRE] Ping 响应:', pingResponse);
      } catch (pingErr) {
        console.log('[WRE] Ping 失败，content script 可能未加载');
      }

      // 发送提取请求（带重试）
      let response;
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          response = await chrome.tabs.sendMessage(tab.id, { action: 'extractAll' });
          console.log('[WRE] 收到响应 (attempt ' + attempt + '):', response);
          break; // 成功就跳出循环
        } catch (sendErr) {
          console.log('[WRE] 发送消息失败 (attempt ' + attempt + '):', sendErr.message);
          if (attempt < maxRetries) {
            // 重新注入 content script
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content/content.js']
              });
            } catch (injectErr) {
              console.log('[WRE] 重新注入失败:', injectErr.message);
            }
            await new Promise(r => setTimeout(r, 300 * attempt)); // 递增等待
          } else {
            showError(i18n('cannotConnectPage'));
            return;
          }
        }
      }

      if (response && response.success) {
        currentData = response.data;
        updateTabCounts();
        renderResourceList();
        showToast(i18n('extractSuccess'), 'success');
      } else {
        showError(response?.error || i18n('extractFailedRefresh'));
      }
    } catch (err) {
      console.error('[WRE] 提取错误:', err);
      showError(i18n('cannotConnectPage') + ': ' + err.message);
    } finally {
      dom.loading.style.display = 'none';
    }
  }

  // ── Tab 计数更新 ──────────────────────────────────

  function updateTabCounts() {
    if (!currentData) return;
    const s = currentData.stats;
    $('#count-images').textContent = s.totalImages;
    $('#count-scripts').textContent = s.totalScripts + (s.scriptInlineCount ? `+${s.scriptInlineCount}` : '');
    $('#count-styles').textContent = s.totalStyles + (s.styleInlineCount ? `+${s.styleInlineCount}` : '');
    $('#count-fonts').textContent = s.totalFonts;
    $('#count-videos').textContent = s.totalVideos;
    $('#count-audios').textContent = s.totalAudios;
    $('#count-links').textContent = s.totalLinks;
    $('#count-third-party').textContent = s.totalThirdParty;
  }

  // ── 收集可用后缀 ──────────────────────────────────

  function collectExtensions(resources) {
    const extCount = {};
    resources.forEach(item => {
      const ext = item.ext || 'unknown';
      extCount[ext] = (extCount[ext] || 0) + 1;
    });
    // 按数量降序排列
    return Object.entries(extCount)
      .sort((a, b) => b[1] - a[1])
      .map(([ext, count]) => ({ ext, count }));
  }

  function updateExtDropdown() {
    const resources = getResourcesForTab(currentTab);
    availableExts = collectExtensions(resources);
    const extList = $('#ext-list');

    if (availableExts.length === 0) {
      extList.innerHTML = `<div style="padding:8px;color:var(--text-tertiary);font-size:12px;">${i18n('noExtensionData')}</div>`;
      return;
    }

    extList.innerHTML = availableExts.map(({ ext, count }) => {
      // selectedExts 为空 = 全选（不过滤）
      // selectedExts 只有 '__NONE__' = 全部不选
      // selectedExts 有其他值 = 只勾选选中的
      const isNoneMode = selectedExts.has('__NONE__');
      const isChecked = !isNoneMode && (selectedExts.size === 0 || selectedExts.has(ext));
      return `
        <label class="ext-item">
          <input type="checkbox" data-ext="${ext}" ${isChecked ? 'checked' : ''}>
          <span class="ext-item-label">.${ext}</span>
          <span class="ext-item-count">${count}</span>
        </label>
      `;
    }).join('');

    // 绑定事件
    extList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const ext = e.target.dataset.ext;

        // 如果之前是"全部不选"模式，先清除
        if (selectedExts.has('__NONE__')) {
          selectedExts.clear();
        }

        if (e.target.checked) {
          // 勾选一个后缀
          if (selectedExts.size === 0) {
            // 之前是全选状态，现在只选择这一个
            selectedExts.add(ext);
          } else {
            // 之前已有筛选，添加这个后缀
            selectedExts.add(ext);
            // 如果全部都选中了，清空表示回到全选
            if (selectedExts.size === availableExts.length) {
              selectedExts.clear();
            }
          }
        } else {
          // 取消勾选一个后缀
          if (selectedExts.size === 0) {
            // 之前是全选状态，现在取消一个 → 选中其他所有
            availableExts.forEach(item => {
              if (item.ext !== ext) {
                selectedExts.add(item.ext);
              }
            });
          } else {
            // 之前有筛选，删除这个后缀
            selectedExts.delete(ext);
            // 如果全部取消，标记为"全部不选"
            if (selectedExts.size === 0) {
              selectedExts.add('__NONE__');
            }
          }
        }

        updateExtFilterUI();
        renderResourceList();
      });
    });
  }

  function updateExtFilterUI() {
    const btn = $('#btn-ext-filter');
    const isNoneMode = selectedExts.has('__NONE__');
    const hasFilter = selectedExts.size > 0 && !isNoneMode;
    btn.classList.toggle('has-filter', hasFilter || isNoneMode);
    const label = btn.querySelector('span:first-child');
    if (isNoneMode) {
      label.textContent = '📁 已清空';
    } else if (hasFilter) {
      label.textContent = `📁 ${selectedExts.size} 个后缀`;
    } else {
      label.textContent = '📁 后缀筛选';
    }
  }

  // ── 资源列表渲染 ──────────────────────────────────

  function renderResourceList() {
    if (!currentData) return;

    const resources = getResourcesForTab(currentTab);
    const filtered = applyFilters(resources);

    // 更新后缀下拉
    updateExtDropdown();

    if (filtered.length === 0) {
      dom.emptyState.style.display = 'flex';
      dom.listContent.innerHTML = '';
      return;
    }

    dom.emptyState.style.display = 'none';

    // 限制渲染数量，避免 DOM 节点过多
    const maxRender = 500;
    const toRender = filtered.slice(0, maxRender);
    dom.listContent.innerHTML = toRender.map((item, index) => renderResourceItem(item, index)).join('');

    if (filtered.length > maxRender) {
      dom.listContent.innerHTML += `<div class="resource-item" style="justify-content:center;color:var(--text-tertiary);padding:16px;">
        显示前 ${maxRender} 条，共 ${filtered.length} 条资源
      </div>`;
    }

    // 事件委托（只绑定一次）
    if (!dom.listContent._bound) {
      bindListDelegatedEvents();
      dom.listContent._bound = true;
    }
  }

  function getResourcesForTab(tab) {
    if (!currentData) return [];
    switch (tab) {
      case 'images': return currentData.images || [];
      case 'scripts': return currentData.scripts || [];
      case 'styles': return currentData.styles || [];
      case 'fonts': return currentData.fonts || [];
      case 'videos': return currentData.videos || [];
      case 'audios': return currentData.audios || [];
      case 'links': return currentData.links || [];
      case 'third-party': return currentData.thirdParty || [];
      default: return [];
    }
  }

  function applyFilters(resources) {
    let result = [...resources];
    const query = dom.searchInput.value.trim().toLowerCase();

    // 搜索过滤
    if (query) {
      result = result.filter(item =>
        (item.url && item.url.toLowerCase().includes(query)) ||
        (item.domain && item.domain.toLowerCase().includes(query)) ||
        (item.text && item.text.toLowerCase().includes(query)) ||
        (item.alt && item.alt.toLowerCase().includes(query))
      );
    }

    // 外部资源过滤
    if (dom.filterExternal.checked) {
      result = result.filter(item => item.external);
    }

    // 大文件过滤
    if (dom.filterLarge.checked) {
      result = result.filter(item => item.size > 100 * 1024);
    }

    // 慢加载过滤
    if (dom.filterSlow.checked) {
      result = result.filter(item => item.duration > settings.slowThreshold);
    }

    // 后缀过滤
    if (selectedExts.size > 0) {
      result = result.filter(item => {
        const ext = item.ext || 'unknown';
        return selectedExts.has(ext);
      });
    }

    return result;
  }

  function renderResourceItem(item, index) {
    const typeTag = getTypeTag(item);
    const icon = getTypeIcon(item.type || currentTab);
    const isSelected = selectedItems.has(index);
    const sizeStr = formatSize(item.size || item.transferSize || 0);
    const durationStr = item.duration ? `${Math.round(item.duration)}ms` : '';
    const isSlow = item.duration > settings.slowThreshold;

    let thumbHtml = '';
    if (item.type === 'image' || currentTab === 'images') {
      thumbHtml = `<img class="resource-thumb" src="${escapeHtml(item.url)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div class="resource-thumb-placeholder" style="display:none;">${icon}</div>`;
    } else {
      thumbHtml = `<div class="resource-thumb-placeholder">${icon}</div>`;
    }

    let extraHtml = '';
    if (currentTab === 'links') {
      extraHtml = item.text ? `<span class="link-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text)}</span>` : '';
    }

    return `
      <div class="resource-item ${isSelected ? 'selected' : ''} ${currentTab === 'links' ? 'link-item' : ''}" data-index="${index}">
        <input type="checkbox" class="resource-checkbox" ${isSelected ? 'checked' : ''} data-index="${index}">
        ${thumbHtml}
        <div class="resource-info">
          <span class="resource-url" title="${escapeHtml(item.url || '')}">${escapeHtml(getShortUrl(item.url || ''))}</span>
          <div class="resource-meta">
            <span class="resource-tag tag-${typeTag}">${typeTag}</span>
            ${sizeStr ? `<span class="resource-size">${sizeStr}</span>` : ''}
            ${durationStr ? `<span class="resource-duration ${isSlow ? 'slow' : ''}">${durationStr}</span>` : ''}
            ${item.domain ? `<span class="resource-domain">${escapeHtml(item.domain)}</span>` : ''}
            ${extraHtml}
          </div>
        </div>
        <div class="resource-actions">
          <button class="action-btn btn-copy" data-url="${escapeHtml(item.url || '')}" title="${i18n('copyUrl')}">📋</button>
          <button class="action-btn btn-open" data-url="${escapeHtml(item.url || '')}" title="${i18n('openInNewTab')}">🔗</button>
          <button class="action-btn btn-download" data-url="${escapeHtml(item.url || '')}" title="${i18n('download')}">📥</button>
        </div>
      </div>
    `;
  }

  // 事件委托 — 只绑定一次，处理所有列表项事件
  function bindListDelegatedEvents() {
    dom.listContent.addEventListener('click', (e) => {
      const target = e.target;

      // 复选框
      if (target.classList.contains('resource-checkbox')) {
        const index = parseInt(target.dataset.index);
        if (target.checked) {
          selectedItems.add(index);
        } else {
          selectedItems.delete(index);
        }
        target.closest('.resource-item').classList.toggle('selected', target.checked);
        updateBatchBar();
        return;
      }

      // 操作按钮
      const actionBtn = target.closest('.action-btn');
      if (actionBtn) {
        e.stopPropagation();
        const url = actionBtn.dataset.url;

        if (actionBtn.classList.contains('btn-copy')) {
          copyToClipboard(url);
        } else if (actionBtn.classList.contains('btn-open')) {
          chrome.tabs.create({ url });
        } else if (actionBtn.classList.contains('btn-download')) {
          downloadResource(url);
        }
      }
    });
  }

  // ── 批量操作 ──────────────────────────────────────

  function updateBatchBar() {
    dom.selectedCount.textContent = selectedItems.size;
    dom.batchBar.style.display = selectedItems.size > 0 ? 'flex' : 'none';
  }

  function selectAll() {
    const resources = getResourcesForTab(currentTab);
    const filtered = applyFilters(resources);
    filtered.forEach((_, i) => selectedItems.add(i));
    renderResourceList();
    updateBatchBar();
  }

  function deselectAll() {
    selectedItems.clear();
    renderResourceList();
    updateBatchBar();
  }

  async function downloadSelected() {
    const resources = getResourcesForTab(currentTab);
    const filtered = applyFilters(resources);
    const urls = [...selectedItems].map(i => filtered[i]?.url).filter(Boolean);

    if (urls.length === 0) {
      showToast(i18n('noResourceSelected'), 'info');
      return;
    }

    try {
      await chrome.runtime.sendMessage({ action: 'downloadBatch', urls });
      showToast(i18n('downloadingResources', String(urls.length)), 'success');
    } catch (err) {
      showToast(i18n('downloadFailed') + ': ' + err.message, 'error');
    }
  }

  async function exportZip() {
    const resources = getResourcesForTab(currentTab);
    const filtered = applyFilters(resources);
    const items = selectedItems.size > 0
      ? [...selectedItems].map(i => filtered[i]).filter(Boolean)
      : filtered;

    if (items.length === 0) {
      showToast(i18n('noResourcesToExport'), 'info');
      return;
    }

    showToast(i18n('packing'), 'info');

    try {
      const zip = new SimpleZip();
      let added = 0;
      const filenameCount = {}; // 用于处理同名文件

      // 通过 Service Worker 代理 fetch（解决 CORS 问题）
      const fetchViaSW = (url) => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: 'fetchResource', url },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              if (response && response.success) {
                const uint8 = new Uint8Array(response.data);
                resolve({ data: uint8, ok: true });
              } else {
                resolve({ ok: false, error: response?.error });
              }
            }
          );
        });
      };

      // 逐个获取资源内容
      const fetchPromises = items.map(async (item) => {
        try {
          const result = await fetchViaSW(item.url);
          if (result.ok) {
            let filename = getFilename(item.url);
            // 处理同名文件：添加域名前缀或序号
            if (filenameCount[filename]) {
              filenameCount[filename]++;
              const ext = filename.includes('.') ? '.' + filename.split('.').pop() : '';
              const name = ext ? filename.slice(0, -ext.length) : filename;
              filename = `${name}_${filenameCount[filename]}${ext}`;
            } else {
              filenameCount[filename] = 1;
            }
            // 添加到 ZIP（带子目录）
            zip.addFile(`${currentTab}/${filename}`, result.data);
            added++;
          } else {
            console.warn('[WRE] 获取失败:', item.url, result.error);
          }
        } catch (e) {
          console.warn('[WRE] Fetch 异常:', item.url, e.message);
        }
      });

      await Promise.all(fetchPromises);

      if (added === 0) {
        showToast(i18n('fallbackToUrlList'), 'info');
        const urlList = items.map(i => i.url).join('\n');
        const blob = new Blob([urlList], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        downloadBlob(url, `${currentTab}_urls.txt`);
        URL.revokeObjectURL(url);
        return;
      }

      const zipData = await zip.generate();
      const blob = new Blob([zipData], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      downloadBlob(url, `${currentTab}_resources.zip`);
      URL.revokeObjectURL(url);

      showToast(i18n('exportedResources', String(added)), 'success');
    } catch (err) {
      console.error('[WRE] 导出失败:', err);
      showToast(i18n('exportFailed') + ': ' + err.message, 'error');
    }
  }

  // ── 单个下载 ──────────────────────────────────────

  async function downloadResource(url) {
    try {
      await chrome.runtime.sendMessage({ action: 'downloadResource', url });
      showToast(i18n('downloadStarted'), 'success');
    } catch (err) {
      // 降级：在新标签页打开
      chrome.tabs.create({ url });
    }
  }

  // ── 统计面板 ──────────────────────────────────────

  function showStatsPanel() {
    if (!currentData) {
      showToast(i18n('pleaseExtractFirst'), 'info');
      return;
    }

    const s = currentData.stats;
    const perfEntries = currentData.allPerfEntries || [];

    // 计算总大小
    const totalSize = perfEntries.reduce((sum, e) => sum + (e.transferSize || 0), 0);
    const totalDuration = perfEntries.length > 0
      ? Math.max(...perfEntries.map(e => e.responseEnd || 0))
      : 0;

    // 按类型统计大小
    const sizeByType = {};
    perfEntries.forEach(e => {
      const ext = getFileExt(e.name);
      const type = guessType(ext, e.initiatorType);
      sizeByType[type] = (sizeByType[type] || 0) + (e.transferSize || 0);
    });

    const typeColors = {
      image: 'var(--tag-image)',
      script: 'var(--tag-script)',
      style: 'var(--tag-style)',
      video: 'var(--tag-video)',
      audio: 'var(--tag-audio)',
      font: 'var(--tag-font)',
      other: 'var(--text-tertiary)'
    };

    const maxTypeSize = Math.max(...Object.values(sizeByType), 1);

    dom.statsBody.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${s.totalResources}</div>
          <div class="stat-label">${i18n('statsTotalResources')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${formatSize(totalSize)}</div>
          <div class="stat-label">${i18n('statsTotalSize')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Math.round(totalDuration)}ms</div>
          <div class="stat-label">${i18n('pageLoad')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${s.totalImages}</div>
          <div class="stat-label">${i18n('tabImages')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${s.totalScripts}</div>
          <div class="stat-label">${i18n('tabScripts')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${s.totalStyles}</div>
          <div class="stat-label">${i18n('tabStyles')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${s.totalFonts}</div>
          <div class="stat-label">${i18n('tabFonts')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${s.totalVideos + s.totalAudios}</div>
          <div class="stat-label">${i18n('media')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${s.totalThirdParty}</div>
          <div class="stat-label">${i18n('tabThirdParty')}</div>
        </div>
      </div>

      <div class="stats-chart">
        <h3>📊 ${i18n('resourceSizeDistribution')}</h3>
        <div class="chart-bar-container">
          ${Object.entries(sizeByType).map(([type, size]) => `
            <div class="chart-bar-row">
              <span class="chart-bar-label">${type}</span>
              <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${(size / maxTypeSize * 100).toFixed(1)}%; background: ${typeColors[type] || typeColors.other};"></div>
              </div>
              <span class="chart-bar-value">${formatSize(size)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    dom.statsOverlay.style.display = 'flex';
  }

  // ── 瀑布图 ───────────────────────────────────────

  function showWaterfallPanel() {
    if (!currentData) {
      showToast(i18n('pleaseExtractFirst'), 'info');
      return;
    }

    const perfEntries = (currentData.allPerfEntries || [])
      .sort((a, b) => a.startTime - b.startTime);

    if (perfEntries.length === 0) {
      showToast(i18n('noPerformanceData'), 'info');
      return;
    }

    const maxTime = Math.max(...perfEntries.map(e => e.responseEnd || e.startTime + e.duration), 1);

    dom.waterfallBody.innerHTML = `
      <div class="waterfall-legend">
        <div class="waterfall-legend-item">
          <span class="waterfall-legend-color" style="background: var(--waterfall-bar);"></span>
          <span>正常</span>
        </div>
        <div class="waterfall-legend-item">
          <span class="waterfall-legend-color" style="background: var(--waterfall-bar-slow);"></span>
          <span>慢加载 (>${settings.slowThreshold}ms)</span>
        </div>
        <div class="waterfall-legend-item">
          <span>共 ${perfEntries.length} 个请求</span>
        </div>
      </div>
      <div class="waterfall-timeline">
        ${perfEntries.slice(0, 100).map(entry => {
          const left = (entry.startTime / maxTime * 100).toFixed(2);
          const width = Math.max((entry.duration / maxTime * 100), 0.5).toFixed(2);
          const isSlow = entry.duration > settings.slowThreshold;
          const name = getShortUrl(entry.name);
          return `
            <div class="waterfall-row" title="${escapeHtml(entry.name)}\n${i18n('waterfallStart')}: ${Math.round(entry.startTime)}ms\n${i18n('waterfallDuration')}: ${Math.round(entry.duration)}ms\n${i18n('waterfallSize')}: ${formatSize(entry.transferSize)}">
              <span class="waterfall-label">${escapeHtml(name)}</span>
              <div class="waterfall-bar-track">
                <div class="waterfall-bar ${isSlow ? 'slow' : 'normal'}" style="left: ${left}%; width: ${width}%;"></div>
              </div>
              <span class="waterfall-duration">${Math.round(entry.duration)}ms</span>
              <span class="waterfall-size">${formatSize(entry.transferSize)}</span>
            </div>
          `;
        }).join('')}
        ${perfEntries.length > 100 ? `<div class="waterfall-row"><span class="waterfall-label" style="color:var(--text-tertiary);">... ${i18n('moreRequests', String(perfEntries.length - 100))}</span></div>` : ''}
      </div>
    `;

    dom.waterfallOverlay.style.display = 'flex';
  }

  // ── 主题管理 ──────────────────────────────────────

  function toggleThemeDropdown() {
    const isVisible = dom.themeDropdown.style.display !== 'none';
    dom.themeDropdown.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      // 标记当前主题
      $$('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.themeValue === currentTheme);
      });
    }
  }

  async function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    await chrome.storage.sync.set({ theme });
    showToast(i18n('switchedToTheme', getThemeName(theme)), 'success');
  }

  function getThemeName(theme) {
    const key = 'theme' + theme.charAt(0).toUpperCase() + theme.slice(1);
    return i18n(key) || theme;
  }

  // ── 语言管理 ──────────────────────────────────────

  function toggleLanguageDropdown() {
    const isVisible = dom.languageDropdown.style.display !== 'none';
    dom.languageDropdown.style.display = isVisible ? 'none' : 'block';
  }

  async function switchLanguage(language) {
    await window.switchLanguage(language);
    showToast(i18n('languageChanged'), 'success');

    // 触发界面刷新 - 重新渲染当前数据
    if (currentData) {
      renderList();
      updateStats();
    }
  }

  // ── 工具函数 ──────────────────────────────────────

  function formatSize(bytes) {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getShortUrl(url) {
    try {
      const u = new URL(url);
      const path = u.pathname;
      const parts = path.split('/');
      const filename = parts[parts.length - 1] || path;
      return filename.length > 60 ? filename.substring(0, 57) + '...' : filename;
    } catch {
      return url.length > 60 ? url.substring(0, 57) + '...' : url;
    }
  }

  function getFilename(url) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/');
      const name = parts[parts.length - 1] || 'resource';
      return name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'resource';
    } catch {
      return 'resource';
    }
  }

  function getFileExt(url) {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
      return match ? match[1].toLowerCase() : '';
    } catch {
      return '';
    }
  }

  function guessType(ext, initiatorType) {
    const map = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
      webp: 'image', svg: 'image', avif: 'image', ico: 'image',
      js: 'script', mjs: 'script',
      css: 'style',
      mp4: 'video', webm: 'video', ogg: 'video',
      mp3: 'audio', wav: 'audio', flac: 'audio',
      woff: 'font', woff2: 'font', ttf: 'font', otf: 'font', eot: 'font'
    };
    return map[ext] || (initiatorType === 'xmlhttprequest' ? 'xhr' : 'other');
  }

  function getTypeTag(item) {
    const type = item.type || currentTab;
    const tagMap = {
      image: 'image', script: 'script', style: 'style',
      video: 'video', audio: 'audio', font: 'font',
      link: 'link', 'third-party': 'third-party'
    };
    return tagMap[type] || 'other';
  }

  function getTypeIcon(type) {
    const icons = {
      image: '🖼️', script: '📜', style: '🎨',
      video: '🎬', audio: '🔊', font: '🔤',
      link: '🔗', 'third-party': '📦'
    };
    return icons[type] || '📄';
  }

  // 优化：使用字符串替换代替创建 DOM 元素
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(i18n('copySuccess'), 'success');
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(i18n('copySuccess'), 'success');
    }
  }

  function downloadBlob(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function showError(message) {
    dom.emptyState.style.display = 'flex';
    dom.emptyState.querySelector('.empty-icon').textContent = '⚠️';
    dom.emptyState.querySelector('span:last-child').textContent = message;
  }

  // ── 动态监听：接收增量更新 ──────────────────────────────────────

  /**
   * 处理来自 content script 的增量更新
   */
  function handleIncrementalUpdate(newResources) {
    if (!currentData) return;

    let totalNewCount = 0;

    // 合并到现有数据
    Object.keys(newResources).forEach(type => {
      if (newResources[type] && newResources[type].length > 0) {
        currentData[type] = currentData[type] || [];
        currentData[type].push(...newResources[type]);
        totalNewCount += newResources[type].length;
      }
    });

    if (totalNewCount === 0) return;

    // 更新统计
    updateStats();

    // 如果当前 Tab 受影响，重新渲染
    renderResourceList();

    // 显示通知
    showToast(`🔍 发现 ${totalNewCount} 个新资源`, 'info');

    console.log('[WRE Popup] Received incremental update:', totalNewCount, 'new resources');
  }

  /**
   * 显示 Toast 通知
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 添加到容器
    if (!dom.toastContainer) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 10000;';
      document.body.appendChild(container);
      dom.toastContainer = container;
    }

    dom.toastContainer.appendChild(toast);

    // 动画显示
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    // 3秒后移除
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * 监听来自 content script 的消息
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'incrementalUpdate') {
      handleIncrementalUpdate(request.data);
      sendResponse({ success: true });
      return true;
    }
  });

  // ── 启动 ──────────────────────────────────────────

  init();

})();
