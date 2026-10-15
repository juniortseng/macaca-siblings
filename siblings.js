/* MACACA 同款不同色色票 v2(2026-10-15)
 * 作用:商品分類頁/列表的卡片、商品頁的「顏色」列,補上同款其他顏色的色票;點了跳到那個顏色的商品頁。
 * 資料:siblings.json(每晚由 build_style_siblings.py 產生,放在 CFG.url;enabled=false 為總開關)。
 * 色票圖:有「規格選項圖片」用它(新季);沒有的用商品封面 60×60 縮圖(舊季,宏鈞 10/15 選 a)。
 * 版型差異:
 *   新季卡片已有 product-list-variation-selector → 接在後面;舊季卡片沒有 → 自己在價格下方建一列(同樣 class)。
 *   新季商品頁有 .Variation-container(圖片選項)→ 接在後面;舊季是文字標籤 → 在 .select-box 後面自己建一列。
 * 安全:找不到預期元素就什麼都不做;try/catch 包住;重複注入用 data-mc-sib 防呆。
 */
(function () {
  'use strict';
  var CFG = {
    url: 'https://juniortseng.github.io/macaca-siblings/siblings.json', // ← GitHub Pages 網址
    mark: 'data-mc-sib'
  };
  if (!/macaca\.com\.tw$/.test(location.hostname)) return;
  try { if (localStorage.getItem('mcSibOff') === '1') return; } catch (e) {}
  if (window.__mcSiblingsLoaded) return;
  window.__mcSiblingsLoaded = true;

  function thumb(mid, s) { var m = s.swatch || s.cover; return m ? 'https://shoplineimg.com/' + mid + '/' + m + '/60x60.webp?source_format=jpg' : ''; }
  function cover(mid, s) { return s.cover ? 'https://shoplineimg.com/' + mid + '/' + s.cover + '/750x.webp?source_format=jpg' : ''; }
  function esc(s) { return String(s || '').replace(/"/g, '&quot;'); }

  /* ---------- 列表卡 ---------- */
  function plpItem(mid, s, isSelf) {
    var a = document.createElement('a');
    a.className = 'product-list-variant-selector-item mc-sib-item' + (isSelf ? ' selected-variation mc-sib-self' : '') + (s.soldout ? ' mc-sib-soldout' : '');
    a.href = isSelf ? 'javascript:void(0);' : s.url;
    a.title = s.color + (s.soldout ? '(售完)' : '');
    a.innerHTML = '<div class="product-list-variant-selector-image"><img loading="lazy" alt="' + esc(s.color) + '" src="' + thumb(mid, s) + '"></div>';
    return a;
  }
  function decoratePLP(data) {
    // 新季:已有原生色票列
    var sels = document.querySelectorAll('product-list-variation-selector[product_id]');
    for (var i = 0; i < sels.length; i++) {
      var sel = sels[i];
      if (sel.hasAttribute(CFG.mark)) continue;
      var pid = sel.getAttribute('product_id'), k = data.by_id[pid];
      if (!k) continue;
      var scroll = sel.querySelector('.product-list-variant-selector-scrollable');
      if (!scroll || !sel.querySelector('a.product-list-variant-selector-item')) continue;
      sel.setAttribute(CFG.mark, '1');
      var list = sel.querySelector('.product-list-variant-selector-list'); if (list) list.style.maxWidth = '100%';
      appendSiblings(data, k, pid, scroll, sel.closest('.product-item'), false);
    }
    // 舊季:卡片沒有色票列,自己建
    var tiles = document.querySelectorAll('.product-item product-item[product-id]');
    for (var j = 0; j < tiles.length; j++) {
      var pi = tiles[j], wrap = pi.closest('.product-item');
      if (!wrap || wrap.hasAttribute(CFG.mark) || wrap.querySelector('product-list-variation-selector')) continue;
      var pid2 = pi.getAttribute('product-id'), k2 = data.by_id[pid2];
      if (!k2) continue;
      var anchor = wrap.querySelector('.quick-cart-price') || wrap.querySelector('.info-box-inner-wrapper .title');
      if (!anchor) continue;
      wrap.setAttribute(CFG.mark, '1');
      var row = document.createElement('div');
      row.className = 'product-list-variant-selector-container mc-sib-row';
      row.innerHTML = '<div class="product-list-variant-selector-wrapper"><div class="product-list-variant-selector-list" style="max-width:100%"><div class="product-list-variant-selector-scrollable"></div></div></div>';
      anchor.parentNode.insertBefore(row, anchor.nextSibling);
      appendSiblings(data, k2, pid2, row.querySelector('.product-list-variant-selector-scrollable'), wrap, true);
    }
  }
  function appendSiblings(data, k, pid, scroll, tile, includeSelf) {
    var mainImg = tile ? findMainImg(tile) : null;
    var sibs = data.styles[k] || [];
    for (var j = 0; j < sibs.length; j++) {
      var s = sibs[j];
      if (s.id === pid && !includeSelf) continue;
      if (!s.swatch && !s.cover) continue;
      var a = plpItem(data.mid, s, s.id === pid);
      if (s.id !== pid && mainImg && s.cover) bindHover(a, mainImg, cover(data.mid, s));
      scroll.appendChild(a);
    }
  }
  function findMainImg(tile) {
    var imgs = tile.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) if (imgs[i].clientWidth > 100) return imgs[i];
    // SHOPLINE 舊版型用 background-image(.boxify-image)
    return tile.querySelector('.boxify-image') || null;
  }
  function bindHover(a, el, src) {
    var isImg = el.tagName === 'IMG';
    a.addEventListener('mouseenter', function () {
      if (!el.getAttribute('data-mc-orig')) el.setAttribute('data-mc-orig', isImg ? el.src : el.style.backgroundImage);
      if (isImg) { el.removeAttribute('srcset'); el.src = src; } else { el.style.backgroundImage = 'url("' + src + '")'; }
    });
    a.addEventListener('mouseleave', function () {
      var o = el.getAttribute('data-mc-orig'); if (!o) return;
      if (isImg) el.src = o; else el.style.backgroundImage = o;
    });
  }

  /* ---------- 商品頁 ---------- */
  function pdpItem(mid, s, isSelf) {
    var a = document.createElement('a');
    a.className = 'Variation-wrap mc-sib-item' + (isSelf ? ' mc-sib-self' : '') + (s.soldout ? ' mc-sib-soldout' : '');
    a.href = isSelf ? 'javascript:void(0);' : s.url;
    a.title = s.color + (s.soldout ? '(售完)' : '');
    a.setAttribute('data-original-title', s.color);
    a.innerHTML = '<div class="Variation-border' + (isSelf ? ' selected' : '') + '"></div><div class="Variation-thumb" style="background-image:url(\'' + thumb(mid, s) + '\')"></div>';
    return a;
  }
  function decoratePDP(data) {
    var pid = (window.mainConfig && window.mainConfig.trackerEventData && window.mainConfig.trackerEventData['Product ID']) || '';
    var k = data.by_id[pid];
    if (!k) return;
    var root = document.querySelector('[sl-component-begin="variation-selector"]');
    if (!root || root.hasAttribute(CFG.mark) || root.closest('.quick-cart')) return;
    var sibs = data.styles[k] || [];
    var container = root.querySelector('.Variation-container');
    if (container && root.querySelector('.Variation-wrap')) {
      // 新季:接在原生色票後面
      root.setAttribute(CFG.mark, '1');
      for (var j = 0; j < sibs.length; j++) if (sibs[j].id !== pid && (sibs[j].swatch || sibs[j].cover)) container.appendChild(pdpItem(data.mid, sibs[j], false));
    } else {
      // 舊季:文字標籤,自己在下面建一列(含自己這色,打勾)
      var box = root.querySelector('.select-box');
      if (!box) return;
      root.setAttribute(CFG.mark, '1');
      var row = document.createElement('div');
      row.className = 'Variation-container mc-sib-row';
      for (var m = 0; m < sibs.length; m++) if (sibs[m].swatch || sibs[m].cover) row.appendChild(pdpItem(data.mid, sibs[m], sibs[m].id === pid));
      box.parentNode.insertBefore(row, box.nextSibling);
    }
    // 宏鈞 10/15 最終(GTM 版本 43):「➤ 更多顏色選擇」連結保留,不隱藏
  }

  function injectCSS() {
    var css = '.mc-sib-item{display:inline-block;cursor:pointer}' +
      '.mc-sib-self{cursor:default}' +
      '.mc-sib-row.product-list-variant-selector-container{margin-top:6px}' +
      '.mc-sib-row .product-list-variant-selector-item{display:inline-block}' +
      '.mc-sib-row.Variation-container{margin:6px 0 10px}' +
      // 舊季商品頁沒有圖片選項的 CSS,自己補(尺寸照新季原生:38px 外框、30px 圓圖)
      '.mc-sib-row .Variation-wrap{display:inline-block;width:38px;height:38px;position:relative;margin:0 2px 0 0;vertical-align:top}' +
      '.mc-sib-row .Variation-thumb{position:absolute;left:4px;top:4px;width:30px;height:30px;border-radius:50%;background-size:cover;background-position:center}' +
      '.mc-sib-row .Variation-border{position:absolute;left:0;top:0;width:38px;height:38px;border-radius:50%;border:1px solid transparent;box-sizing:border-box}' +
      '.mc-sib-row .Variation-border.selected{border-color:#333}' +
      '.mc-sib-soldout .product-list-variant-selector-image img,.mc-sib-soldout .Variation-thumb{opacity:.35}' +
      '.mc-sib-soldout{position:relative}' +
      '.mc-sib-soldout:after{content:"";position:absolute;left:18%;right:18%;top:50%;height:1px;background:#999;transform:rotate(-45deg)}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }

  function run(data) {
    if (!data || data.enabled !== true || !data.by_id || !data.styles) return;
    injectCSS();
    var tick = function () { try { decoratePLP(data); decoratePDP(data); } catch (e) { if (window.__mcSiblingsDebug) console.log('[mc-sib]', e); } };
    tick();
    var mo = new MutationObserver(function () { clearTimeout(mo._t); mo._t = setTimeout(tick, 150); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  function start() {
    var data = window.__mcSiblingsData; // 測試用:直接塞資料就不抓網路
    if (data) return run(data);
    fetch(CFG.url, { cache: 'default', credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(run).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
