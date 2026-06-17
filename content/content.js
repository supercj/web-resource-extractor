/**
 * Content Script - 资源提取核心
 * 注入到目标页面，遍历 DOM + Performance API 提取所有资源
 */

(function () {
  'use strict';

  // 避免重复注入
  if (window.__WRE_INJECTED__) {
    console.log('[WRE] Content script already injected, skipping...');
    return;
  }
  window.__WRE_INJECTED__ = true;
  console.log('[WRE] Content script injected into:', window.location.href);

  // ── 工具函数 ──────────────────────────────────────

  function getAbsoluteUrl(url) {
    try {
      return new URL(url, document.baseURI).href;
    } catch {
      return url;
    }
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  function isExternal(url) {
    try {
      return new URL(url).hostname !== location.hostname;
    } catch {
      return false;
    }
  }

  function getFileExtension(url) {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
      return match ? match[1].toLowerCase() : '';
    } catch {
      return '';
    }
  }

  function guessTypeFromExt(ext) {
    const map = {
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
      webp: 'image', svg: 'image', bmp: 'image', ico: 'image', avif: 'image',
      js: 'script', mjs: 'script',
      css: 'style',
      mp4: 'video', webm: 'video', ogg: 'video', avi: 'video', mov: 'video',
      mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', oga: 'audio',
      woff: 'font', woff2: 'font', ttf: 'font', otf: 'font', eot: 'font',
    };
    return map[ext] || 'other';
  }

  // ── Performance API 资源数据 ──────────────────────

  function getPerformanceData() {
    const data = {};
    if (window.performance && performance.getEntriesByType) {
      const entries = performance.getEntriesByType('resource');
      entries.forEach(entry => {
        data[entry.name] = {
          transferSize: entry.transferSize || 0,
          encodedBodySize: entry.encodedBodySize || 0,
          decodedBodySize: entry.decodedBodySize || 0,
          duration: Math.round(entry.duration * 100) / 100,
          startTime: Math.round(entry.startTime * 100) / 100,
          initiatorType: entry.initiatorType || ''
        };
      });
    }
    return data;
  }

  // ── 提取各类资源 ──────────────────────────────────

  function extractImages(perfData) {
    const images = [];
    const seen = new Set();

    // <img> 标签
    document.querySelectorAll('img').forEach(img => {
      const src = img.currentSrc || img.src;
      if (src && !src.startsWith('data:') && !seen.has(src)) {
        seen.add(src);
        const url = getAbsoluteUrl(src);
        const perf = perfData[url] || {};
        images.push({
          type: 'image',
          url,
          domain: getDomain(url),
          external: isExternal(url),
          ext: getFileExtension(url),
          size: perf.transferSize || 0,
          decodedSize: perf.decodedBodySize || 0,
          duration: perf.duration || 0,
          startTime: perf.startTime || 0,
          alt: img.alt || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          tag: 'img'
        });
      }
    });

    // CSS 背景图 — 从样式表规则中提取，避免遍历所有 DOM 元素
    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules || [];
          for (const rule of rules) {
            if (rule.style) {
              const bg = rule.style.backgroundImage || rule.style.background || '';
              if (bg && bg !== 'none') {
                const urls = bg.match(/url\(["']?(.*?)["']?\)/g) || [];
                urls.forEach(u => {
                  const match = u.match(/url\(["']?(.*?)["']?\)/);
                  if (match && match[1] && !match[1].startsWith('data:') && !seen.has(match[1])) {
                    seen.add(match[1]);
                    const url = getAbsoluteUrl(match[1]);
                    const perf = perfData[url] || {};
                    images.push({
                      type: 'image',
                      url,
                      domain: getDomain(url),
                      external: isExternal(url),
                      ext: getFileExtension(url),
                      size: perf.transferSize || 0,
                      decodedSize: perf.decodedBodySize || 0,
                      duration: perf.duration || 0,
                      startTime: perf.startTime || 0,
                      width: 0,
                      height: 0,
                      tag: 'css-background'
                    });
                  }
                });
              }
            }
          }
        } catch (e) {
          // 跨域样式表无法读取
        }
      }
    } catch (e) {
      console.warn('[WRE] 提取 CSS 背景图失败:', e);
    }

    // <picture> <source>
    document.querySelectorAll('picture source').forEach(source => {
      const srcset = source.srcset;
      if (srcset) {
        srcset.split(',').forEach(s => {
          const url = s.trim().split(/\s+/)[0];
          if (url && !url.startsWith('data:') && !seen.has(url)) {
            seen.add(url);
            const absUrl = getAbsoluteUrl(url);
            const perf = perfData[absUrl] || {};
            images.push({
              type: 'image',
              url: absUrl,
              domain: getDomain(absUrl),
              external: isExternal(absUrl),
              ext: getFileExtension(absUrl),
              size: perf.transferSize || 0,
              decodedSize: perf.decodedBodySize || 0,
              duration: perf.duration || 0,
              startTime: perf.startTime || 0,
              width: 0,
              height: 0,
              tag: 'picture-source'
            });
          }
        });
      }
    });

    // Favicon
    document.querySelectorAll('link[rel*="icon"]').forEach(link => {
      const href = link.href;
      if (href && !seen.has(href)) {
        seen.add(href);
        const perf = perfData[href] || {};
        images.push({
          type: 'image',
          url: href,
          domain: getDomain(href),
          external: isExternal(href),
          ext: getFileExtension(href),
          size: perf.transferSize || 0,
          decodedSize: perf.decodedBodySize || 0,
          duration: perf.duration || 0,
          startTime: perf.startTime || 0,
          width: 0,
          height: 0,
          tag: 'favicon'
        });
      }
    });

    // <img> srcset 属性
    document.querySelectorAll('img[srcset]').forEach(img => {
      const srcset = img.srcset;
      if (srcset) {
        srcset.split(',').forEach(s => {
          const url = s.trim().split(/\s+/)[0];
          if (url && !url.startsWith('data:') && !seen.has(url)) {
            seen.add(url);
            const absUrl = getAbsoluteUrl(url);
            const perf = perfData[absUrl] || {};
            images.push({
              type: 'image',
              url: absUrl,
              domain: getDomain(absUrl),
              external: isExternal(absUrl),
              ext: getFileExtension(absUrl),
              size: perf.transferSize || 0,
              decodedSize: perf.decodedBodySize || 0,
              duration: perf.duration || 0,
              startTime: perf.startTime || 0,
              width: 0,
              height: 0,
              tag: 'img-srcset'
            });
          }
        });
      }
    });

    // SVG
    document.querySelectorAll('svg image').forEach(img => {
      const href = img.getAttribute('href') || img.getAttribute('xlink:href');
      if (href && !href.startsWith('data:') && !seen.has(href)) {
        seen.add(href);
        const url = getAbsoluteUrl(href);
        const perf = perfData[url] || {};
        images.push({
          type: 'image',
          url,
          domain: getDomain(url),
          external: isExternal(url),
          ext: 'svg',
          size: perf.transferSize || 0,
          decodedSize: perf.decodedBodySize || 0,
          duration: perf.duration || 0,
          startTime: perf.startTime || 0,
          width: 0,
          height: 0,
          tag: 'svg-image'
        });
      }
    });

    return images;
  }

  function extractMetaImages(perfData) {
    const images = [];
    const seen = new Set();

    // OpenGraph 图片
    document.querySelectorAll('meta[property="og:image"], meta[property="og:image:url"]')
      .forEach(meta => {
        const url = meta.content;
        if (url && !seen.has(url)) {
          seen.add(url);
          const absUrl = getAbsoluteUrl(url);
          const perf = perfData[absUrl] || {};
          images.push({
            type: 'image',
            url: absUrl,
            domain: getDomain(absUrl),
            external: isExternal(absUrl),
            ext: getFileExtension(absUrl),
            size: perf.transferSize || 0,
            decodedSize: perf.decodedBodySize || 0,
            duration: perf.duration || 0,
            startTime: perf.startTime || 0,
            width: 0,
            height: 0,
            tag: 'og:image'
          });
        }
      });

    // Twitter Card 图片
    document.querySelectorAll('meta[name="twitter:image"], meta[name="twitter:image:src"]')
      .forEach(meta => {
        const url = meta.content;
        if (url && !seen.has(url)) {
          seen.add(url);
          const absUrl = getAbsoluteUrl(url);
          const perf = perfData[absUrl] || {};
          images.push({
            type: 'image',
            url: absUrl,
            domain: getDomain(absUrl),
            external: isExternal(absUrl),
            ext: getFileExtension(absUrl),
            size: perf.transferSize || 0,
            decodedSize: perf.decodedBodySize || 0,
            duration: perf.duration || 0,
            startTime: perf.startTime || 0,
            width: 0,
            height: 0,
            tag: 'twitter:image'
          });
        }
      });

    return images;
  }

  function extractScripts(perfData) {
    const scripts = [];
    const seen = new Set();

    document.querySelectorAll('script[src]').forEach(script => {
      const src = getAbsoluteUrl(script.src);
      if (!seen.has(src)) {
        seen.add(src);
        const perf = perfData[src] || {};
        scripts.push({
          type: 'script',
          url: src,
          domain: getDomain(src),
          external: isExternal(src),
          ext: getFileExtension(src),
          size: perf.transferSize || 0,
          decodedSize: perf.decodedBodySize || 0,
          duration: perf.duration || 0,
          startTime: perf.startTime || 0,
          async: script.async,
          defer: script.defer,
          module: script.type === 'module'
        });
      }
    });

    // 统计内联脚本
    let inlineCount = 0;
    document.querySelectorAll('script:not([src])').forEach(() => inlineCount++);

    return { scripts, inlineCount };
  }

  function extractStyles(perfData) {
    const styles = [];
    const seen = new Set();

    // 外部样式表
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = getAbsoluteUrl(link.href);
      if (!seen.has(href)) {
        seen.add(href);
        const perf = perfData[href] || {};
        styles.push({
          type: 'style',
          url: href,
          domain: getDomain(href),
          external: isExternal(href),
          ext: getFileExtension(href),
          size: perf.transferSize || 0,
          decodedSize: perf.decodedBodySize || 0,
          duration: perf.duration || 0,
          startTime: perf.startTime || 0
        });
      }
    });

    // 内联样式统计
    let inlineCount = 0;
    document.querySelectorAll('style').forEach(() => inlineCount++);

    // @font-face 提取
    const fonts = [];
    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules || [];
          for (const rule of rules) {
            if (rule instanceof CSSFontFaceRule) {
              const src = rule.style.getPropertyValue('src');
              const fontUrls = (src.match(/url\(["']?(.*?)["']?\)/g) || []).map(u => {
                const m = u.match(/url\(["']?(.*?)["']?\)/);
                return m ? m[1] : '';
              }).filter(Boolean);

              fontUrls.forEach(fu => {
                const fontUrl = getAbsoluteUrl(fu);
                if (!seen.has(fontUrl)) {
                  seen.add(fontUrl);
                  const perf = perfData[fontUrl] || {};
                  fonts.push({
                    type: 'font',
                    url: fontUrl,
                    domain: getDomain(fontUrl),
                    external: isExternal(fontUrl),
                    ext: getFileExtension(fontUrl),
                    size: perf.transferSize || 0,
                    decodedSize: perf.decodedBodySize || 0,
                    duration: perf.duration || 0,
                    startTime: perf.startTime || 0,
                    fontFamily: rule.style.getPropertyValue('font-family') || ''
                  });
                }
              });
            }
          }
        } catch (e) {
          // 跨域样式表无法读取
        }
      }
    } catch (e) {
      // ignore
    }

    return { styles, inlineCount, fonts };
  }

  function extractMedia(perfData) {
    const videos = [];
    const audios = [];
    const seen = new Set();

    // <video poster>
    document.querySelectorAll('video[poster]').forEach(video => {
      const poster = video.poster;
      if (poster && !poster.startsWith('data:') && !seen.has(poster)) {
        seen.add(poster);
        const url = getAbsoluteUrl(poster);
        const perf = perfData[url] || {};
        videos.push({
          type: 'image',
          url,
          domain: getDomain(url),
          external: isExternal(url),
          ext: getFileExtension(url),
          size: perf.transferSize || 0,
          decodedSize: perf.decodedBodySize || 0,
          duration: perf.duration || 0,
          startTime: perf.startTime || 0,
          tag: 'video-poster'
        });
      }
    });

    // <video>
    document.querySelectorAll('video').forEach(video => {
      const src = video.src || video.currentSrc;
      if (src && !seen.has(src)) {
        seen.add(src);
        const url = getAbsoluteUrl(src);
        const perf = perfData[url] || {};
        videos.push({
          type: 'video',
          url,
          domain: getDomain(url),
          external: isExternal(url),
          ext: getFileExtension(url),
          size: perf.transferSize || 0,
          decodedSize: perf.decodedBodySize || 0,
          duration: perf.duration || 0,
          startTime: perf.startTime || 0,
          videoWidth: video.videoWidth || 0,
          videoHeight: video.videoHeight || 0
        });
      }
      // <source> in <video>
      video.querySelectorAll('source').forEach(s => {
        const sSrc = getAbsoluteUrl(s.src);
        if (sSrc && !seen.has(sSrc)) {
          seen.add(sSrc);
          const perf = perfData[sSrc] || {};
          videos.push({
            type: 'video',
            url: sSrc,
            domain: getDomain(sSrc),
            external: isExternal(sSrc),
            ext: getFileExtension(sSrc),
            size: perf.transferSize || 0,
            decodedSize: perf.decodedBodySize || 0,
            duration: perf.duration || 0,
            startTime: perf.startTime || 0,
            videoWidth: 0,
            videoHeight: 0
          });
        }
      });
    });

    // <audio>
    document.querySelectorAll('audio').forEach(audio => {
      const src = audio.src || audio.currentSrc;
      if (src && !seen.has(src)) {
        seen.add(src);
        const url = getAbsoluteUrl(src);
        const perf = perfData[url] || {};
        audios.push({
          type: 'audio',
          url,
          domain: getDomain(url),
          external: isExternal(url),
          ext: getFileExtension(url),
          size: perf.transferSize || 0,
          decodedSize: perf.decodedBodySize || 0,
          duration: perf.duration || 0,
          startTime: perf.startTime || 0
        });
      }
    });

    // <embed> <object> (嵌入媒体)
    document.querySelectorAll('embed[src], object[data]').forEach(el => {
      const src = getAbsoluteUrl(el.src || el.data);
      if (src && !seen.has(src)) {
        seen.add(src);
        const perf = perfData[src] || {};
        const ext = getFileExtension(src);
        const type = guessTypeFromExt(ext);
        const target = type === 'video' ? videos : (type === 'audio' ? audios : videos);
        target.push({
          type,
          url: src,
          domain: getDomain(src),
          external: isExternal(src),
          ext,
          size: perf.transferSize || 0,
          decodedSize: perf.decodedBodySize || 0,
          duration: perf.duration || 0,
          startTime: perf.startTime || 0
        });
      }
    });

    return { videos, audios };
  }

  function extractLinks() {
    const links = [];
    const seen = new Set();

    document.querySelectorAll('a[href]').forEach(a => {
      const href = getAbsoluteUrl(a.href);
      if (href && !href.startsWith('javascript:') && !seen.has(href)) {
        seen.add(href);
        links.push({
          type: 'link',
          url: href,
          domain: getDomain(href),
          external: isExternal(href),
          text: (a.textContent || '').trim().substring(0, 100),
          target: a.target || '_self'
        });
      }
    });

    return links;
  }

  function extractThirdParty(perfData) {
    const thirdParty = [];
    if (window.performance && performance.getEntriesByType) {
      const entries = performance.getEntriesByType('resource');
      entries.forEach(entry => {
        if (isExternal(entry.name)) {
          const ext = getFileExtension(entry.name);
          const type = guessTypeFromExt(ext);
          thirdParty.push({
            type: 'third-party',
            url: entry.name,
            domain: getDomain(entry.name),
            resourceType: type,
            ext,
            size: entry.transferSize || 0,
            decodedSize: entry.decodedBodySize || 0,
            duration: Math.round(entry.duration * 100) / 100,
            startTime: Math.round(entry.startTime * 100) / 100,
            initiatorType: entry.initiatorType || ''
          });
        }
      });
    }
    return thirdParty;
  }

  // ── 主提取函数 ────────────────────────────────────

  function extractAll() {
    const perfData = getPerformanceData();

    const images = extractImages(perfData);
    const metaImages = extractMetaImages(perfData);
    const { scripts, inlineCount: scriptInlineCount } = extractScripts(perfData);
    const { styles, inlineCount: styleInlineCount, fonts } = extractStyles(perfData);
    const { videos, audios } = extractMedia(perfData);
    const links = extractLinks();
    const thirdParty = extractThirdParty(perfData);

    // 合并图片和元数据图片
    const allImages = [...images, ...metaImages];

    // 所有带 performance 数据的资源（用于瀑布图）
    const allPerfEntries = [];
    if (window.performance && performance.getEntriesByType) {
      performance.getEntriesByType('resource').forEach(entry => {
        allPerfEntries.push({
          name: entry.name,
          domain: getDomain(entry.name),
          initiatorType: entry.initiatorType || '',
          transferSize: entry.transferSize || 0,
          encodedBodySize: entry.encodedBodySize || 0,
          decodedBodySize: entry.decodedBodySize || 0,
          duration: Math.round(entry.duration * 100) / 100,
          startTime: Math.round(entry.startTime * 100) / 100,
          responseEnd: Math.round(entry.responseEnd * 100) / 100
        });
      });
    }

    return {
      pageTitle: document.title,
      pageUrl: location.href,
      timestamp: Date.now(),
      images: allImages,
      scripts,
      scriptInlineCount,
      styles,
      styleInlineCount,
      fonts,
      videos,
      audios,
      links,
      thirdParty,
      allPerfEntries,
      stats: {
        totalImages: allImages.length,
        totalScripts: scripts.length,
        scriptInlineCount,
        totalStyles: styles.length,
        styleInlineCount,
        totalFonts: fonts.length,
        totalVideos: videos.length,
        totalAudios: audios.length,
        totalLinks: links.length,
        totalThirdParty: thirdParty.length,
        totalResources: allImages.length + scripts.length + styles.length + fonts.length + videos.length + audios.length
      }
    };
  }

  // ── 提取页面内特定区域的资源 ──────────────────────

  function extractFromElement(element) {
    const images = [];
    const links = [];
    const seen = new Set();

    // 区域内图片
    element.querySelectorAll('img').forEach(img => {
      const src = img.currentSrc || img.src;
      if (src && !src.startsWith('data:') && !seen.has(src)) {
        seen.add(src);
        images.push({
          type: 'image',
          url: getAbsoluteUrl(src),
          domain: getDomain(src),
          alt: img.alt || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0
        });
      }
    });

    // 区域内链接
    element.querySelectorAll('a[href]').forEach(a => {
      const href = getAbsoluteUrl(a.href);
      if (href && !href.startsWith('javascript:') && !seen.has(href)) {
        seen.add(href);
        links.push({
          type: 'link',
          url: href,
          domain: getDomain(href),
          text: (a.textContent || '').trim().substring(0, 100)
        });
      }
    });

    return { images, links };
  }

  // ── 消息监听 ──────────────────────────────────────

  // 全局监听控制器实例
  let monitorController = null;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[WRE] 收到消息:', request.action);

    if (request.action === 'extractAll') {
      try {
        const data = extractAll();
        console.log('[WRE] 提取结果:', data.stats);

        // 初始化监听控制器
        if (!monitorController) {
          monitorController = new ResourceMonitorController();
          monitorController.initialize(data).then(() => {
            // 默认启动监听
            monitorController.startMonitoring();
          });
        }

        sendResponse({ success: true, data });
      } catch (err) {
        console.error('[WRE] 提取失败:', err);
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (request.action === 'startMonitoring') {
      try {
        if (!monitorController) {
          monitorController = new ResourceMonitorController();
        }
        monitorController.startMonitoring();
        sendResponse({ success: true, status: monitorController.getStatus() });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (request.action === 'stopMonitoring') {
      try {
        if (monitorController) {
          monitorController.stopMonitoring();
        }
        sendResponse({ success: true, status: monitorController ? monitorController.getStatus() : null });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (request.action === 'getMonitorStatus') {
      try {
        const status = monitorController ? monitorController.getStatus() : { isRunning: false, stats: null };
        sendResponse({ success: true, status });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (request.action === 'extractFromElement') {
      try {
        // 用 CSS 选择器定位元素
        const el = document.querySelector(request.selector);
        if (el) {
          const data = extractFromElement(el);
          sendResponse({ success: true, data });
        } else {
          sendResponse({ success: false, error: chrome.i18n.getMessage('elementNotFound') || 'Element not found' });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (request.action === 'ping') {
      sendResponse({ success: true, message: 'pong' });
      return true;
    }
  });

  console.log('[WRE] Content script ready, listening for messages...');

  // ── 动态监听：ResourceCache 类 ────────────────────

  /**
   * 资源缓存管理器 - 统一的去重和存储
   */
  class ResourceCache {
    constructor() {
      this.seenUrls = new Set();           // URL 去重
      this.resources = {                    // 分类存储
        images: [],
        scripts: [],
        styles: [],
        fonts: [],
        videos: [],
        audios: [],
        links: [],
        thirdParty: []
      };
      this.urlMap = new Map();              // URL → 资源对象映射
    }

    has(url) {
      return this.seenUrls.has(url);
    }

    findByUrl(url) {
      return this.urlMap.get(url);
    }

    addResources(newResources) {
      const added = {
        images: [],
        scripts: [],
        styles: [],
        fonts: [],
        videos: [],
        audios: [],
        links: [],
        thirdParty: [],
        totalCount: 0
      };

      // 遍历各类资源
      Object.keys(newResources).forEach(type => {
        const items = newResources[type] || [];
        items.forEach(item => {
          const url = item.url;

          // 去重
          if (this.seenUrls.has(url)) return;

          this.seenUrls.add(url);
          this.resources[type] = this.resources[type] || [];
          this.resources[type].push(item);
          this.urlMap.set(url, item);
          added[type].push(item);
          added.totalCount++;
        });
      });

      return added;
    }

    getAll() {
      return this.resources;
    }

    getStats() {
      return {
        totalImages: this.resources.images.length,
        totalScripts: this.resources.scripts.length,
        totalStyles: this.resources.styles.length,
        totalFonts: this.resources.fonts.length,
        totalVideos: this.resources.videos.length,
        totalAudios: this.resources.audios.length,
        totalLinks: this.resources.links.length,
        totalThirdParty: this.resources.thirdParty.length,
        totalResources: this.seenUrls.size
      };
    }

    clear() {
      this.seenUrls.clear();
      this.urlMap.clear();
      Object.keys(this.resources).forEach(key => {
        this.resources[key] = [];
      });
    }
  }

  // ── 动态监听：MessageBridge 类 ────────────────────

  /**
   * 消息通信桥接器 - 节流批量发送增量更新
   */
  class MessageBridge {
    constructor() {
      this.updateThrottle = null;
      this.pendingUpdates = [];
    }

    sendUpdate(update) {
      this.pendingUpdates.push(update);

      // 节流：每 1 秒最多发送 1 次
      if (!this.updateThrottle) {
        this.updateThrottle = setTimeout(() => {
          this.flushUpdates();
          this.updateThrottle = null;
        }, 1000);
      }
    }

    flushUpdates() {
      if (this.pendingUpdates.length === 0) return;

      // 合并所有待发送的更新
      const merged = this.mergeUpdates(this.pendingUpdates);
      this.pendingUpdates = [];

      // 发送到 popup
      chrome.runtime.sendMessage({
        action: 'incrementalUpdate',
        data: merged
      }).catch(err => {
        // Popup 可能未打开，忽略错误
        console.log('[WRE] Failed to send update (popup may be closed):', err.message);
      });
    }

    mergeUpdates(updates) {
      const merged = {
        images: [],
        scripts: [],
        styles: [],
        fonts: [],
        videos: [],
        audios: [],
        links: [],
        thirdParty: []
      };

      updates.forEach(update => {
        Object.keys(merged).forEach(key => {
          if (update[key]) {
            merged[key].push(...update[key]);
          }
        });
      });

      return merged;
    }

    clear() {
      clearTimeout(this.updateThrottle);
      this.updateThrottle = null;
      this.pendingUpdates = [];
    }
  }

  // ── 动态监听：MutationMonitor 类 ────────────────────

  /**
   * DOM 变化监听器 - 捕获动态添加的资源
   */
  class MutationMonitor {
    constructor(cache, bridge) {
      this.cache = cache;
      this.bridge = bridge;
      this.observer = null;
      this.pendingMutations = [];
      this.debounceTimer = null;
      this.isProcessing = false;
    }

    start() {
      this.observer = new MutationObserver((mutations) => {
        // 批量收集变化
        this.pendingMutations.push(...mutations);

        // 防抖：300ms 内只处理一次
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.processMutations();
        }, 300);
      });

      // 只监听 body，避免 head 中频繁的脚本插入
      this.observer.observe(document.body, {
        childList: true,   // 子节点增删
        subtree: true,     // 递归监听所有后代
        attributes: false  // 不监听属性（避免过度触发）
      });

      console.log('[WRE Monitor] MutationObserver started');
    }

    processMutations() {
      if (this.isProcessing) return;
      this.isProcessing = true;

      const mutations = this.pendingMutations.splice(0);
      const addedNodes = [];

      // 收集所有新增节点
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element 节点
            addedNodes.push(node);
          }
        });
      });

      if (addedNodes.length > 0) {
        this.extractFromNodes(addedNodes);
      }

      this.isProcessing = false;
    }

    extractFromNodes(nodes) {
      const newResources = {
        images: [],
        scripts: [],
        styles: [],
        videos: [],
        audios: [],
        links: []
      };

      nodes.forEach(node => {
        // 图片：<img>
        if (node.tagName === 'IMG') {
          const resource = this.extractImage(node);
          if (resource) newResources.images.push(resource);
        }

        // 递归查找子节点中的资源
        if (node.querySelectorAll) {
          node.querySelectorAll('img').forEach(img => {
            const resource = this.extractImage(img);
            if (resource) newResources.images.push(resource);
          });

          // 脚本：<script src>
          if (node.tagName === 'SCRIPT' && node.src) {
            const resource = this.extractScript(node);
            if (resource) newResources.scripts.push(resource);
          }
          node.querySelectorAll('script[src]').forEach(script => {
            const resource = this.extractScript(script);
            if (resource) newResources.scripts.push(resource);
          });

          // 样式：<link rel="stylesheet">
          if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
            const resource = this.extractStyle(node);
            if (resource) newResources.styles.push(resource);
          }
          node.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const resource = this.extractStyle(link);
            if (resource) newResources.styles.push(resource);
          });

          // 视频/音频
          if (node.tagName === 'VIDEO') {
            const resource = this.extractVideo(node);
            if (resource) newResources.videos.push(resource);
          }
          if (node.tagName === 'AUDIO') {
            const resource = this.extractAudio(node);
            if (resource) newResources.audios.push(resource);
          }
          node.querySelectorAll('video').forEach(video => {
            const resource = this.extractVideo(video);
            if (resource) newResources.videos.push(resource);
          });
          node.querySelectorAll('audio').forEach(audio => {
            const resource = this.extractAudio(audio);
            if (resource) newResources.audios.push(resource);
          });

          // 链接
          if (node.tagName === 'A' && node.href) {
            const resource = this.extractLink(node);
            if (resource) newResources.links.push(resource);
          }
          node.querySelectorAll('a[href]').forEach(a => {
            const resource = this.extractLink(a);
            if (resource) newResources.links.push(resource);
          });
        }
      });

      // 去重并通知更新
      const deduplicated = this.cache.addResources(newResources);
      if (deduplicated.totalCount > 0) {
        console.log('[WRE Monitor] Found', deduplicated.totalCount, 'new resources from DOM mutations');
        this.bridge.sendUpdate(deduplicated);
      }
    }

    extractImage(img) {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith('data:')) return null;

      const url = getAbsoluteUrl(src);
      if (this.cache.has(url)) return null;

      return {
        type: 'image',
        url,
        domain: getDomain(url),
        external: isExternal(url),
        ext: getFileExtension(url),
        alt: img.alt || '',
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
        tag: 'img',
        dynamicLoad: true
      };
    }

    extractScript(script) {
      const src = getAbsoluteUrl(script.src);
      if (!src || this.cache.has(src)) return null;

      return {
        type: 'script',
        url: src,
        domain: getDomain(src),
        external: isExternal(src),
        ext: getFileExtension(src),
        async: script.async,
        defer: script.defer,
        module: script.type === 'module',
        dynamicLoad: true
      };
    }

    extractStyle(link) {
      const href = getAbsoluteUrl(link.href);
      if (!href || this.cache.has(href)) return null;

      return {
        type: 'style',
        url: href,
        domain: getDomain(href),
        external: isExternal(href),
        ext: getFileExtension(href),
        dynamicLoad: true
      };
    }

    extractVideo(video) {
      const src = video.src || video.currentSrc;
      if (!src || this.cache.has(src)) return null;

      const url = getAbsoluteUrl(src);
      return {
        type: 'video',
        url,
        domain: getDomain(url),
        external: isExternal(url),
        ext: getFileExtension(url),
        videoWidth: video.videoWidth || 0,
        videoHeight: video.videoHeight || 0,
        dynamicLoad: true
      };
    }

    extractAudio(audio) {
      const src = audio.src || audio.currentSrc;
      if (!src || this.cache.has(src)) return null;

      const url = getAbsoluteUrl(src);
      return {
        type: 'audio',
        url,
        domain: getDomain(url),
        external: isExternal(url),
        ext: getFileExtension(url),
        dynamicLoad: true
      };
    }

    extractLink(a) {
      const href = getAbsoluteUrl(a.href);
      if (!href || href.startsWith('javascript:') || this.cache.has(href)) return null;

      return {
        type: 'link',
        url: href,
        domain: getDomain(href),
        external: isExternal(href),
        text: (a.textContent || '').trim().substring(0, 100),
        target: a.target || '_self',
        dynamicLoad: true
      };
    }

    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      clearTimeout(this.debounceTimer);
    }
  }

  // ── 动态监听：PerformanceMonitor 类 ────────────────────

  /**
   * 网络资源监听器 - 捕获动态加载的网络请求
   */
  class PerformanceMonitor {
    constructor(cache, bridge) {
      this.cache = cache;
      this.bridge = bridge;
      this.observer = null;
      this.processedEntries = new Set();
    }

    start() {
      // 检查浏览器支持
      if (!window.PerformanceObserver) {
        console.warn('[WRE Monitor] PerformanceObserver not supported');
        return;
      }

      try {
        this.observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.processEntries(entries);
        });

        // 监听 resource 类型
        this.observer.observe({
          type: 'resource',
          buffered: true // 包含已存在的条目
        });

        console.log('[WRE Monitor] PerformanceObserver started');
      } catch (e) {
        console.error('[WRE Monitor] Failed to start PerformanceObserver:', e);
      }
    }

    processEntries(entries) {
      const updates = {
        images: [],
        scripts: [],
        styles: [],
        fonts: [],
        videos: [],
        audios: [],
        thirdParty: []
      };

      entries.forEach(entry => {
        // 避免重复处理
        const entryKey = `${entry.name}_${entry.startTime}`;
        if (this.processedEntries.has(entryKey)) return;
        this.processedEntries.add(entryKey);

        const url = entry.name;
        const perfData = {
          transferSize: entry.transferSize || 0,
          encodedBodySize: entry.encodedBodySize || 0,
          decodedBodySize: entry.decodedBodySize || 0,
          duration: Math.round(entry.duration * 100) / 100,
          startTime: Math.round(entry.startTime * 100) / 100,
          initiatorType: entry.initiatorType || ''
        };

        // 尝试关联现有资源，补充性能数据
        const existingResource = this.cache.findByUrl(url);
        if (existingResource) {
          // 更新性能数据
          Object.assign(existingResource, {
            size: perfData.transferSize,
            decodedSize: perfData.decodedBodySize,
            duration: perfData.duration,
            startTime: perfData.startTime
          });
          return;
        }

        // 新资源：根据 initiatorType 推断类型
        const ext = getFileExtension(url);
        const type = this.guessType(ext, entry.initiatorType);

        const resource = {
          type,
          url,
          domain: getDomain(url),
          external: isExternal(url),
          ext,
          size: perfData.transferSize,
          decodedSize: perfData.decodedBodySize,
          duration: perfData.duration,
          startTime: perfData.startTime,
          initiatorType: entry.initiatorType,
          dynamicLoad: true,
          fromPerformance: true
        };

        // 分类添加
        switch (type) {
          case 'image':
            updates.images.push(resource);
            break;
          case 'script':
            updates.scripts.push(resource);
            break;
          case 'style':
            updates.styles.push(resource);
            break;
          case 'font':
            updates.fonts.push(resource);
            break;
          case 'video':
            updates.videos.push(resource);
            break;
          case 'audio':
            updates.audios.push(resource);
            break;
          default:
            // 跨域资源归入第三方
            if (isExternal(url)) {
              resource.type = 'third-party';
              resource.resourceType = type;
              updates.thirdParty.push(resource);
            }
        }
      });

      // 去重并通知
      const deduplicated = this.cache.addResources(updates);
      if (deduplicated.totalCount > 0) {
        console.log('[WRE Monitor] Found', deduplicated.totalCount, 'new resources from Performance API');
        this.bridge.sendUpdate(deduplicated);
      }
    }

    guessType(ext, initiatorType) {
      // 优先根据后缀判断
      const extMap = {
        jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
        webp: 'image', svg: 'image', avif: 'image', bmp: 'image', ico: 'image',
        js: 'script', mjs: 'script',
        css: 'style',
        woff: 'font', woff2: 'font', ttf: 'font', otf: 'font', eot: 'font',
        mp4: 'video', webm: 'video', ogg: 'video',
        mp3: 'audio', wav: 'audio', flac: 'audio'
      };

      if (extMap[ext]) return extMap[ext];

      // 根据 initiatorType 推断
      const typeMap = {
        img: 'image',
        script: 'script',
        link: 'style',
        css: 'style',
        xmlhttprequest: 'xhr',
        fetch: 'xhr'
      };

      return typeMap[initiatorType] || 'other';
    }

    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  }

  // ── 动态监听：SPARouterMonitor 类 ────────────────────

  /**
   * SPA 路由监听器 - 捕获路由切换后的新资源
   */
  class SPARouterMonitor {
    constructor(cache, bridge) {
      this.cache = cache;
      this.bridge = bridge;
      this.currentRoute = location.href;
      this.debounceTimer = null;
      this.originalPushState = null;
      this.originalReplaceState = null;
      this.handleRouteChangeBound = this.handleRouteChange.bind(this);
    }

    start() {
      // 监听 hash 变化
      window.addEventListener('hashchange', this.handleRouteChangeBound);

      // 监听 popstate（浏览器前进后退）
      window.addEventListener('popstate', this.handleRouteChangeBound);

      // 拦截 History API
      this.interceptHistoryAPI();

      console.log('[WRE Monitor] SPA Router monitoring started');
    }

    interceptHistoryAPI() {
      const self = this;

      // 保存原始方法
      this.originalPushState = history.pushState;
      this.originalReplaceState = history.replaceState;

      // 拦截 pushState
      history.pushState = function(...args) {
        self.originalPushState.apply(history, args);
        self.handleRouteChange();
      };

      // 拦截 replaceState
      history.replaceState = function(...args) {
        self.originalReplaceState.apply(history, args);
        self.handleRouteChange();
      };
    }

    handleRouteChange() {
      const newRoute = location.href;

      // 路由未变化，忽略
      if (newRoute === this.currentRoute) return;

      console.log('[WRE Monitor] Route changed:', this.currentRoute, '→', newRoute);
      this.currentRoute = newRoute;

      // 防抖：500ms 后触发扫描
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.scanForNewResources();
      }, 500);
    }

    scanForNewResources() {
      console.log('[WRE Monitor] Scanning for new resources after route change...');

      // 重新执行轻量级扫描（不包括 Performance API，避免重复）
      const newResources = {
        images: this.scanImages(),
        scripts: this.scanScripts(),
        styles: this.scanStyles(),
        videos: this.scanVideos(),
        audios: this.scanAudios(),
        links: this.scanLinks()
      };

      const deduplicated = this.cache.addResources(newResources);
      if (deduplicated.totalCount > 0) {
        console.log('[WRE Monitor] Found', deduplicated.totalCount, 'new resources after SPA route change');
        this.bridge.sendUpdate(deduplicated);
      }
    }

    scanImages() {
      const images = [];
      document.querySelectorAll('img').forEach(img => {
        const src = img.currentSrc || img.src;
        if (src && !src.startsWith('data:')) {
          const url = getAbsoluteUrl(src);
          if (!this.cache.has(url)) {
            images.push({
              type: 'image',
              url,
              domain: getDomain(url),
              external: isExternal(url),
              ext: getFileExtension(url),
              alt: img.alt || '',
              width: img.naturalWidth || 0,
              height: img.naturalHeight || 0,
              tag: 'img',
              fromSPARoute: true
            });
          }
        }
      });
      return images;
    }

    scanScripts() {
      const scripts = [];
      document.querySelectorAll('script[src]').forEach(script => {
        const src = getAbsoluteUrl(script.src);
        if (!this.cache.has(src)) {
          scripts.push({
            type: 'script',
            url: src,
            domain: getDomain(src),
            external: isExternal(src),
            ext: getFileExtension(src),
            async: script.async,
            defer: script.defer,
            module: script.type === 'module',
            fromSPARoute: true
          });
        }
      });
      return scripts;
    }

    scanStyles() {
      const styles = [];
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = getAbsoluteUrl(link.href);
        if (!this.cache.has(href)) {
          styles.push({
            type: 'style',
            url: href,
            domain: getDomain(href),
            external: isExternal(href),
            ext: getFileExtension(href),
            fromSPARoute: true
          });
        }
      });
      return styles;
    }

    scanVideos() {
      const videos = [];
      document.querySelectorAll('video').forEach(video => {
        const src = video.src || video.currentSrc;
        if (src && !this.cache.has(src)) {
          const url = getAbsoluteUrl(src);
          videos.push({
            type: 'video',
            url,
            domain: getDomain(url),
            external: isExternal(url),
            ext: getFileExtension(url),
            videoWidth: video.videoWidth || 0,
            videoHeight: video.videoHeight || 0,
            fromSPARoute: true
          });
        }
      });
      return videos;
    }

    scanAudios() {
      const audios = [];
      document.querySelectorAll('audio').forEach(audio => {
        const src = audio.src || audio.currentSrc;
        if (src && !this.cache.has(src)) {
          const url = getAbsoluteUrl(src);
          audios.push({
            type: 'audio',
            url,
            domain: getDomain(url),
            external: isExternal(url),
            ext: getFileExtension(url),
            fromSPARoute: true
          });
        }
      });
      return audios;
    }

    scanLinks() {
      const links = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = getAbsoluteUrl(a.href);
        if (href && !href.startsWith('javascript:') && !this.cache.has(href)) {
          links.push({
            type: 'link',
            url: href,
            domain: getDomain(href),
            external: isExternal(href),
            text: (a.textContent || '').trim().substring(0, 100),
            target: a.target || '_self',
            fromSPARoute: true
          });
        }
      });
      return links;
    }

    stop() {
      window.removeEventListener('hashchange', this.handleRouteChangeBound);
      window.removeEventListener('popstate', this.handleRouteChangeBound);

      // 恢复原始 History API
      if (this.originalPushState) {
        history.pushState = this.originalPushState;
      }
      if (this.originalReplaceState) {
        history.replaceState = this.originalReplaceState;
      }

      clearTimeout(this.debounceTimer);
    }
  }

  // ── 动态监听：LazyLoadMonitor 类 ────────────────────

  /**
   * 懒加载监听器 - 捕获懒加载的图片资源
   */
  class LazyLoadMonitor {
    constructor(cache, bridge) {
      this.cache = cache;
      this.bridge = bridge;
      this.observer = null;
      this.observedElements = new WeakSet();
      this.mutationObserver = null;
    }

    start() {
      // IntersectionObserver 配置
      const options = {
        root: null, // 视口
        rootMargin: '50px', // 提前 50px 触发
        threshold: 0.01 // 1% 可见即触发
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.handleLazyLoad(entry.target);
          }
        });
      }, options);

      // 监听现有的懒加载图片
      this.observeExistingLazyImages();

      // 监听新增的懒加载图片
      this.startMutationWatch();

      console.log('[WRE Monitor] LazyLoad monitoring started');
    }

    observeExistingLazyImages() {
      // 1. loading="lazy" 的图片
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        this.observeElement(img);
      });

      // 2. 常见懒加载属性
      document.querySelectorAll('img[data-src], img[data-lazy-src], img[data-original]').forEach(img => {
        this.observeElement(img);
      });

      // 3. 没有 src 但有懒加载属性的图片
      document.querySelectorAll('img:not([src])').forEach(img => {
        if (img.dataset.src || img.dataset.lazySrc || img.dataset.original) {
          this.observeElement(img);
        }
      });
    }

    observeElement(element) {
      if (this.observedElements.has(element)) return;
      this.observedElements.add(element);
      this.observer.observe(element);
    }

    handleLazyLoad(img) {
      // 取消观察
      this.observer.unobserve(img);

      // 等待图片加载完成（懒加载库可能延迟设置 src）
      setTimeout(() => {
        const src = img.currentSrc || img.src ||
                    img.dataset.src || img.dataset.lazySrc || img.dataset.original;

        if (!src || src.startsWith('data:')) return;

        const url = getAbsoluteUrl(src);
        if (this.cache.has(url)) return;

        const resource = {
          type: 'image',
          url,
          domain: getDomain(url),
          external: isExternal(url),
          ext: getFileExtension(url),
          alt: img.alt || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          tag: 'img',
          lazyLoaded: true
        };

        const added = this.cache.addResources({ images: [resource] });
        if (added.totalCount > 0) {
          console.log('[WRE Monitor] Found lazy-loaded image:', url);
          this.bridge.sendUpdate(added);
        }
      }, 100);
    }

    startMutationWatch() {
      // 监听新增的懒加载图片
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.tagName === 'IMG') {
                if (this.isLazyImage(node)) {
                  this.observeElement(node);
                }
              }
              // 递归查找子节点
              if (node.querySelectorAll) {
                node.querySelectorAll('img').forEach(img => {
                  if (this.isLazyImage(img)) {
                    this.observeElement(img);
                  }
                });
              }
            }
          });
        });
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    isLazyImage(img) {
      return img.loading === 'lazy' ||
             img.dataset.src ||
             img.dataset.lazySrc ||
             img.dataset.original;
    }

    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
    }
  }

  // ── 动态监听：ResourceMonitorController 主控制器 ────────────────────

  /**
   * 资源监听主控制器 - 统一管理所有监听器
   */
  class ResourceMonitorController {
    constructor() {
      this.cache = new ResourceCache();
      this.bridge = new MessageBridge();
      this.monitors = {
        mutation: null,
        performance: null,
        router: null,
        lazyLoad: null
      };
      this.isRunning = false;
    }

    async initialize(initialData) {
      // 填充初始缓存
      this.cache.addResources(initialData);
      console.log('[WRE Monitor] Initialized cache with', this.cache.getStats().totalResources, 'resources');
    }

    startMonitoring() {
      if (this.isRunning) {
        console.log('[WRE Monitor] Already running');
        return;
      }

      console.log('[WRE Monitor] Starting all monitors...');

      // 启动各个监听器
      this.monitors.mutation = new MutationMonitor(this.cache, this.bridge);
      this.monitors.mutation.start();

      this.monitors.performance = new PerformanceMonitor(this.cache, this.bridge);
      this.monitors.performance.start();

      this.monitors.router = new SPARouterMonitor(this.cache, this.bridge);
      this.monitors.router.start();

      this.monitors.lazyLoad = new LazyLoadMonitor(this.cache, this.bridge);
      this.monitors.lazyLoad.start();

      this.isRunning = true;
      console.log('[WRE Monitor] All monitors started successfully');
    }

    stopMonitoring() {
      if (!this.isRunning) {
        console.log('[WRE Monitor] Not running');
        return;
      }

      console.log('[WRE Monitor] Stopping all monitors...');

      // 停止各个监听器
      if (this.monitors.mutation) {
        this.monitors.mutation.stop();
        this.monitors.mutation = null;
      }
      if (this.monitors.performance) {
        this.monitors.performance.stop();
        this.monitors.performance = null;
      }
      if (this.monitors.router) {
        this.monitors.router.stop();
        this.monitors.router = null;
      }
      if (this.monitors.lazyLoad) {
        this.monitors.lazyLoad.stop();
        this.monitors.lazyLoad = null;
      }

      this.bridge.clear();
      this.isRunning = false;
      console.log('[WRE Monitor] All monitors stopped');
    }

    getStatus() {
      return {
        isRunning: this.isRunning,
        stats: this.cache.getStats()
      };
    }
  }

  // ── 提取页面内特定区域的资源 ──────────────────────

  function extractFromElement(element) {
    const images = [];
    const links = [];
    const seen = new Set();

    // 区域内图片
    element.querySelectorAll('img').forEach(img => {
      const src = img.currentSrc || img.src;
      if (src && !src.startsWith('data:') && !seen.has(src)) {
        seen.add(src);
        images.push({
          type: 'image',
          url: getAbsoluteUrl(src),
          domain: getDomain(src),
          alt: img.alt || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0
        });
      }
    });

    // 区域内链接
    element.querySelectorAll('a[href]').forEach(a => {
      const href = getAbsoluteUrl(a.href);
      if (href && !href.startsWith('javascript:') && !seen.has(href)) {
        seen.add(href);
        links.push({
          type: 'link',
          url: href,
          domain: getDomain(href),
          text: (a.textContent || '').trim().substring(0, 100)
        });
      }
    });

    return { images, links };
  }


  console.log('[WRE] Content script ready, listening for messages...');

})();
