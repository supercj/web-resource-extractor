/**
 * Service Worker - 后台服务
 * 负责：消息中转、右键菜单、下载管理
 */

// ── 右键菜单 ──────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  // 主菜单
  chrome.contextMenus.create({
    id: 'wre-main',
    title: 'Web Resource Extractor',
    contexts: ['all']
  });

  // 提取页面所有图片
  chrome.contextMenus.create({
    id: 'wre-extract-images',
    parentId: 'wre-main',
    title: '🖼️ 提取页面所有图片',
    contexts: ['all']
  });

  // 提取页面所有链接
  chrome.contextMenus.create({
    id: 'wre-extract-links',
    parentId: 'wre-main',
    title: '🔗 提取页面所有链接',
    contexts: ['all']
  });

  // 提取选中区域资源
  chrome.contextMenus.create({
    id: 'wre-extract-selection',
    parentId: 'wre-main',
    title: '📦 提取选中区域的资源',
    contexts: ['selection']
  });

  // 提取右键元素资源
  chrome.contextMenus.create({
    id: 'wre-extract-element',
    parentId: 'wre-main',
    title: '🎯 提取此元素的资源',
    contexts: ['image', 'video', 'audio', 'link']
  });

  // 提取所有资源
  chrome.contextMenus.create({
    id: 'wre-extract-all',
    parentId: 'wre-main',
    title: '📊 提取页面所有资源',
    contexts: ['all']
  });
});

// ── 右键菜单点击处理 ──────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  try {
    // 确保 content script 已注入
    await ensureContentScript(tab.id);

    switch (info.menuItemId) {
      case 'wre-extract-images':
        await extractAndOpen(tab.id, 'images');
        break;
      case 'wre-extract-links':
        await extractAndOpen(tab.id, 'links');
        break;
      case 'wre-extract-selection':
        await extractSelection(tab.id);
        break;
      case 'wre-extract-element':
        await extractElement(tab.id, info);
        break;
      case 'wre-extract-all':
        await extractAndOpen(tab.id, 'all');
        break;
    }
  } catch (err) {
    console.error('Context menu action failed:', err);
  }
});

// ── 确保 Content Script 已注入 ────────────────────

async function ensureContentScript(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    if (response && response.success) return;
  } catch (e) {
    // 未注入，需要注入
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content.js']
    });
    // 等待脚本执行
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (e) {
    console.error('Failed to inject content script:', e);
    throw e;
  }
}

// ── 提取并打开结果 ─────────────────────────────────

async function extractAndOpen(tabId, filterType) {
  const response = await chrome.tabs.sendMessage(tabId, { action: 'extractAll' });
  if (response && response.success) {
    // 存储结果
    await chrome.storage.local.set({
      lastExtractResult: response.data,
      lastExtractFilter: filterType,
      lastExtractTime: Date.now()
    });

    // 打开 popup 或新标签页展示结果
    // 通过打开扩展 popup 的方式
    chrome.action.openPopup();
  }
}

async function extractSelection(tabId) {
  // 先获取选中区域的 CSS 选择器
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === 1 ? container : container.parentElement;
        if (element) {
          // 生成一个简单选择器
          const id = element.id;
          const cls = element.className;
          if (id) return `#${id}`;
          if (cls) return `.${cls.split(' ')[0]}`;
          return element.tagName.toLowerCase();
        }
      }
      return null;
    }
  });

  const selector = results && results[0] && results[0].result;
  if (selector) {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'extractFromElement',
      selector
    });
    if (response && response.success) {
      await chrome.storage.local.set({
        lastExtractResult: response.data,
        lastExtractFilter: 'selection',
        lastExtractTime: Date.now()
      });
      chrome.action.openPopup();
    }
  }
}

async function extractElement(tabId, info) {
  const srcUrl = info.srcUrl || info.linkUrl;
  if (srcUrl) {
    await chrome.storage.local.set({
      lastExtractResult: {
        focusedResource: srcUrl,
        pageTitle: info.pageUrl
      },
      lastExtractFilter: 'focused',
      lastExtractTime: Date.now()
    });
    chrome.action.openPopup();
  }
}

// ── 消息监听（来自 popup）─────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadResource') {
    chrome.downloads.download({
      url: request.url,
      saveAs: request.saveAs || false
    }).then(id => {
      sendResponse({ success: true, downloadId: id });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  if (request.action === 'downloadBatch') {
    // 批量下载
    const urls = request.urls || [];
    const results = [];
    let completed = 0;

    urls.forEach((url, index) => {
      chrome.downloads.download({ url }).then(id => {
        results[index] = { success: true, downloadId: id };
      }).catch(err => {
        results[index] = { success: false, error: err.message };
      }).finally(() => {
        completed++;
        if (completed === urls.length) {
          sendResponse({ success: true, results });
        }
      });
    });

    return true;
  }

  // 代理 fetch — 解决 CORS 问题
  if (request.action === 'fetchResource') {
    fetch(request.url)
      .then(async response => {
        if (!response.ok) {
          sendResponse({ success: false, error: `HTTP ${response.status}` });
          return;
        }
        const blob = await response.blob();
        // 转为 ArrayBuffer 再转为数组传递
        const buffer = await blob.arrayBuffer();
        const array = Array.from(new Uint8Array(buffer));
        sendResponse({ success: true, data: array, type: blob.type });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
    return true; // 保持消息通道
  }
});

// ── 持久化存储管理 ─────────────────────────────────

// 初始化默认设置
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(['theme', 'settings']);
  if (!existing.theme) {
    await chrome.storage.sync.set({ theme: 'default' });
  }
  if (!existing.settings) {
    await chrome.storage.sync.set({
      settings: {
        slowThreshold: 1000,   // 慢资源阈值（ms）
        showSize: true,
        showDuration: true,
        defaultTab: 'images',
        exportFormat: 'zip'
      }
    });
  }
});
