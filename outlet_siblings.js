/* MACACA OUTLET 同款不同色色票 v1(2026-11-09:由主站 siblings.js v3.3 加固版複製,只改 ①網域 macacaoutlet.com ②資料檔 outlet_siblings.json ③網址白名單收百分比編碼的中文 handle ④window 旗標改名,其餘邏輯與主站相同)
 * OUTLET 商品沒有規格選項圖片:有主站核准色碼 → 純色圓點;沒有 → 封面 60×60 縮圖。列表卡與商品頁都走「舊季」路徑(自己建色票列)。
/* MACACA 同款不同色色票 v3.3(2026-10-31 資安加固:siblings.json 一律當不可信資料,id/圖片 id/色碼/連結逐筆白名單檢查,不合格的那一色不畫;色票改用 DOM 屬性寫入,不再拼 HTML)
 * v3.2(2026-10-20:修 Mac 上商品頁色票列重複出現;舊版 Safari 改用 jpg;分類頁滑過色票時主圖與滑入圖一起換)
 * v3.1(2026-10-19:沒有規格的配件頁也建一列「顏色 : X」+ 色票)
 * 作用:商品分類頁/列表的卡片、商品頁的「顏色」列,補上同款其他顏色的色票;點了跳到那個顏色的商品頁。
 * 資料:siblings.json(每晚由 build_style_siblings.py 產生,放在 CFG.url;enabled=false 為總開關)。
 * 色票:①有「規格選項圖片」用它(新季) ②沒有但 colour_codes.json 有核准色碼 → 純色圓點(hex) ③都沒有 → 商品封面 60×60 縮圖。
 * 版型差異:
 *   新季卡片已有 product-list-variation-selector → 接在後面;舊季卡片沒有 → 自己在價格下方建一列(同樣 class)。
 *   新季商品頁有 .Variation-container(圖片選項)→ 接在後面;舊季是文字標籤 → 在 .select-box 後面自己建一列。
 * 安全:找不到預期元素就什麼都不做;try/catch 包住;重複注入用 data-mc-sib 防呆。
 *       10/31:JSON 先過 clean() 才用——連結只收 /products/英數-、id 只收 24 位小寫 hex、色碼只收 #RRGGBB;測試資料 __mcOutletSiblingsData 也一樣要過。
 */
(function () {
  'use strict';
  var CFG = {
    url: 'https://juniortseng.github.io/macaca-siblings/outlet_siblings.json', // ← GitHub Pages 網址
    mark: 'data-mc-sib'
  };
  if (!/macacaoutlet\.com$/.test(location.hostname)) return;
  try { if (localStorage.getItem('mcSibOff') === '1') return; } catch (e) {}
  if (window.__mcOutletSiblingsLoaded) return;
  window.__mcOutletSiblingsLoaded = true;

  // 10/20:SHOPLINE 對 Safari 15.6 以下給 jpg(mainConfig.webpSupported 不是 true),照它切換,否則舊 Mac 色票是空白
  var EXT = (window.mainConfig && window.mainConfig.webpSupported !== true) ? '.jpg' : '.webp?source_format=jpg';
  // OUTLET 11/9:PNG 上傳的封面,CDN 的 .jpg 會 403 → 用 .png(builder 從原檔副檔名判,寫在 png 欄位)
  function ext(s) { return s.png ? '.png' : EXT; }
  function thumb(mid, s) { var m = s.swatch || (!s.hex && s.cover); return m ? 'https://shoplineimg.com/' + mid + '/' + m + '/60x60' + ext(s) : ''; }
  function cover(mid, s) { return s.cover ? 'https://shoplineimg.com/' + mid + '/' + s.cover + '/750x' + ext(s) : ''; }
  function hasThumb(s) { return !!(s.swatch || s.hex || s.cover); }
  function useDot(s) { return !s.swatch && !!s.hex; }   // 沒有選項圖片、但有核准色碼 → 純色圓點

  /* ---------- 資料檢查(10/31 資安)----------
   * 格式對過 10/31 線上資料:1,411 色全部符合。不合格的那一色直接丟掉,整份格式不對就整個不做事。 */
  var RE_ID = /^[0-9a-f]{24}$/,                       // 商品 id、圖片 id、商店 mid
    RE_HEX = /^#[0-9a-fA-F]{6}$/,                      // 核准色碼
    RE_URL = /^\/products\/[A-Za-z0-9%_-]{1,400}$/,    // 只收站內商品頁相對路徑(OUTLET 網址含中文 → 百分比編碼,所以多收 %)
    RE_KEY = /^[A-Za-z0-9_-]{1,40}$/,                  // 款號(EYE008)
    RE_BADTXT = /[<>"'&`]/;                            // 色名會進 data-original-title(tooltip),不收 HTML 符號;線上色名沒有這些字
  var own = Object.prototype.hasOwnProperty;
  function opt(v, re) { return v === undefined || v === '' ? '' : (typeof v === 'string' && re.test(v) ? v : null); }   // 空字串 OK、格式錯回 null
  function cleanSib(s) {
    if (!s || typeof s !== 'object') return null;
    var sw = opt(s.swatch, RE_ID), cv = opt(s.cover, RE_ID), hx = opt(s.hex, RE_HEX);
    if (typeof s.id !== 'string' || !RE_ID.test(s.id) || typeof s.url !== 'string' || !RE_URL.test(s.url)) return null;
    if (typeof s.color !== 'string' || s.color.length > 40 || RE_BADTXT.test(s.color) || sw === null || cv === null || hx === null) return null;
    return { id: s.id, url: s.url, color: s.color, swatch: sw, cover: cv, hex: hx, png: s.png === true, soldout: s.soldout === true };
  }
  function clean(raw) {
    if (!raw || raw.enabled !== true || typeof raw.mid !== 'string' || !RE_ID.test(raw.mid)) return null;
    if (!raw.by_id || typeof raw.by_id !== 'object' || !raw.styles || typeof raw.styles !== 'object') return null;
    var styles = Object.create(null), byId = Object.create(null), k, i;
    for (k in raw.styles) {
      if (!own.call(raw.styles, k) || !RE_KEY.test(k) || !Array.isArray(raw.styles[k])) continue;
      var list = [];
      for (i = 0; i < raw.styles[k].length; i++) { var s = cleanSib(raw.styles[k][i]); if (s) list.push(s); }
      if (list.length) styles[k] = list;
    }
    for (k in raw.by_id) if (own.call(raw.by_id, k) && RE_ID.test(k) && typeof raw.by_id[k] === 'string' && styles[raw.by_id[k]]) byId[k] = raw.by_id[k];
    return { mid: raw.mid, by_id: byId, styles: styles };
  }

  /* ---------- 列表卡 ---------- */
  function plpItem(mid, s, isSelf) {
    var a = document.createElement('a');
    a.className = 'product-list-variant-selector-item mc-sib-item' + (isSelf ? ' selected-variation mc-sib-self' : '') + (s.soldout ? ' mc-sib-soldout' : '');
    a.href = isSelf ? 'javascript:void(0);' : s.url;
    a.title = s.color + (s.soldout ? '(售完)' : '');
    var box = document.createElement('div');
    box.className = 'product-list-variant-selector-image';
    if (useDot(s)) {
      var dot = document.createElement('div');
      dot.className = 'mc-sib-dot'; dot.title = s.color; dot.style.background = s.hex;
      box.appendChild(dot);
    } else {
      var im = document.createElement('img');
      im.setAttribute('loading', 'lazy'); im.alt = s.color; im.src = thumb(mid, s);
      box.appendChild(im);
    }
    a.appendChild(box);
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
    var mains = tile ? findMainImgs(tile) : [];
    var sibs = data.styles[k] || [];
    for (var j = 0; j < sibs.length; j++) {
      var s = sibs[j];
      if (s.id === pid && !includeSelf) continue;
      if (!hasThumb(s)) continue;
      var a = plpItem(data.mid, s, s.id === pid);
      if (s.id !== pid && s.cover) for (var q = 0; q < mains.length; q++) bindHover(a, mains[q], cover(data.mid, s));
      scroll.appendChild(a);
    }
  }
  // 10/20:卡片有兩張圖(主圖 + 滑鼠移入時蓋上來的第二張),只換主圖會被第二張蓋住 → 全部一起換
  function findMainImgs(tile) {
    var out = [], imgs = tile.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) if (imgs[i].clientWidth > 100) out.push(imgs[i]);
    if (out.length) return out;
    // SHOPLINE 版型用 background-image(.boxify-image)
    var bx = tile.querySelectorAll('.boxify-image');
    for (var j = 0; j < bx.length; j++) out.push(bx[j]);
    return out;
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
    var border = document.createElement('div'), th = document.createElement('div');
    border.className = 'Variation-border' + (isSelf ? ' selected' : '');
    th.className = 'Variation-thumb' + (useDot(s) ? ' mc-sib-dot' : '');
    if (useDot(s)) th.style.backgroundColor = s.hex; else th.style.backgroundImage = 'url("' + thumb(mid, s) + '")';
    a.appendChild(border); a.appendChild(th);
    return a;
  }
  function decoratePDP(data) {
    var pid = (window.mainConfig && window.mainConfig.trackerEventData && window.mainConfig.trackerEventData['Product ID']) || '';
    var k = data.by_id[pid];
    if (!k) return;
    var root = document.querySelector('[sl-component-begin="variation-selector"]');
    if (!root) { decorateNoOption(data, k, pid); return; }
    // 10/20:規格選單比較晚出現時,先前誤判成「沒有規格」補的那列要拿掉(Mac 上曾出現兩排色票)
    var stray = document.querySelectorAll('.mc-sib-noopt');
    for (var x = 0; x < stray.length; x++) stray[x].parentNode.removeChild(stray[x]);
    var actsMarked = document.querySelectorAll('.product-detail-actions[' + CFG.mark + ']');
    for (var y = 0; y < actsMarked.length; y++) actsMarked[y].removeAttribute(CFG.mark);
    if (root.hasAttribute(CFG.mark) || root.closest('.quick-cart')) return;
    var sibs = data.styles[k] || [];
    var container = root.querySelector('.Variation-container');
    if (container && root.querySelector('.Variation-wrap')) {
      // 新季:接在原生色票後面
      root.setAttribute(CFG.mark, '1');
      for (var j = 0; j < sibs.length; j++) if (sibs[j].id !== pid && hasThumb(sibs[j])) container.appendChild(pdpItem(data.mid, sibs[j], false));
    } else {
      // 舊季:文字標籤,自己在下面建一列(含自己這色,打勾)
      var box = root.querySelector('.select-box');
      if (!box) return;
      root.setAttribute(CFG.mark, '1');
      var row = document.createElement('div');
      row.className = 'Variation-container mc-sib-row';
      for (var m = 0; m < sibs.length; m++) if (hasThumb(sibs[m])) row.appendChild(pdpItem(data.mid, sibs[m], sibs[m].id === pid));
      box.parentNode.insertBefore(row, box.nextSibling);
    }
    // 宏鈞 10/15 最終(GTM 版本 43):「➤ 更多顏色選擇」連結保留,不隱藏
  }

  // 10/19:完全沒有規格的商品(配件,例 綿雲髮飾圈圈)頁面沒有選擇區 → 在購買區、數量上方自己建「顏色 : X」+ 色票列
  function decorateNoOption(data, k, pid) {
    // 10/20:等頁面完全載入 1.5 秒後才判斷「沒有規格」,避免規格選單還沒畫出來就誤判
    if (!pageSettled) return;
    var acts = document.querySelector('.ProductDetail-product-info .product-detail-actions');
    if (!acts || acts.hasAttribute(CFG.mark) || acts.closest('.quick-cart')) return;
    var sibs = data.styles[k] || [], self = null;
    for (var i = 0; i < sibs.length; i++) if (sibs[i].id === pid) self = sibs[i];
    acts.setAttribute(CFG.mark, '1');
    var lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    var wrap = document.createElement('div'); wrap.className = 'mc-sib-noopt';
    var label = document.createElement('div'); label.className = 'variation_title mc-sib-label';
    label.textContent = (lang.indexOf('ja') === 0 ? 'カラー' : lang.indexOf('en') === 0 ? 'Color' : '顏色') + ' : ' + ((self && self.color) || '');
    var row = document.createElement('div'); row.className = 'Variation-container mc-sib-row';
    for (var m = 0; m < sibs.length; m++) if (hasThumb(sibs[m])) row.appendChild(pdpItem(data.mid, sibs[m], sibs[m].id === pid));
    wrap.appendChild(label); wrap.appendChild(row);
    var anchor = acts.querySelector('.product-variation-dropdown') || acts.querySelector('.quantity');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor); else acts.insertBefore(wrap, acts.firstChild);
  }

  function injectCSS() {
    var css = '.mc-sib-item{display:inline-block;cursor:pointer}' +
      // 純色圓點:列表卡沿用選項圖片的容器尺寸;商品頁沿用 .Variation-thumb 的尺寸;都加一圈淡邊讓淺色也看得到
      '.product-list-variant-selector-image .mc-sib-dot{display:block;width:100%;height:100%;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.14)}' +
      '.Variation-thumb.mc-sib-dot{box-shadow:inset 0 0 0 1px rgba(0,0,0,.14)}' +
      '.mc-sib-self{cursor:default}' +
      '.mc-sib-row.product-list-variant-selector-container{margin-top:6px}' +
      '.mc-sib-row .product-list-variant-selector-item{display:inline-block}' +
      // OUTLET:封面是直式模特照,60x60 會縮成 38x60 留白 → 置中裁切填滿,看得到衣服的顏色
      '.mc-sib-row .product-list-variant-selector-image img{width:100%;height:100%;object-fit:cover;object-position:center 35%}' +
      '.mc-sib-row.Variation-container{margin:6px 0 10px}' +
      '.mc-sib-noopt{margin:4px 0 12px}.mc-sib-noopt .mc-sib-label{font-size:13px;color:#999}' +
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

  var pageSettled = false, tickRef = null;
  function settle() { setTimeout(function () { pageSettled = true; if (tickRef) tickRef(); }, 1500); }
  if (document.readyState === 'complete') settle(); else window.addEventListener('load', settle);

  function run(raw) {
    var data = clean(raw);
    if (!data) return;
    injectCSS();
    var tick = tickRef = function () { try { decoratePLP(data); decoratePDP(data); } catch (e) { if (window.__mcOutletSiblingsDebug) console.log('[mc-sib]', e); } };
    tick();
    var mo = new MutationObserver(function () { clearTimeout(mo._t); mo._t = setTimeout(tick, 150); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  function start() {
    var data = window.__mcOutletSiblingsData; // 測試用:直接塞資料就不抓網路
    if (data) return run(data);
    fetch(CFG.url, { cache: 'default', credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(run).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
