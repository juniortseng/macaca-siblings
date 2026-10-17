/* MACACA 圖中穿搭 v0.2(2026-10-17 示意,未發布;三語)
 * 作用:商品頁在「加入購物車」按鈕下方,顯示照片裡搭配的另一件(上身頁顯示「圖中下身」、下身頁顯示「圖中上身」),點了跳到那件的商品頁。
 * 資料:pairs.json(GitHub Pages;示意版只有 非夏哲學美背bratop ↔ 非夏哲學瑜伽寬褲 同色 8 組;正式版每晚由共用照片比對+人工核對表產生)。
 * 安全:找不到預期元素就不動;JSON enabled=false 或 localStorage mcOutfitOff=1 即關閉;GTM 暫停=全站關閉。
 * 測試:window.__mcOutfitData = {...} 可直接塞資料不抓網路。
 */
(function () {
  'use strict';
  var CFG = { url: 'https://juniortseng.github.io/macaca-siblings/pairs.json', mark: 'data-mc-outfit' };
  if (!/macaca\.com\.tw$/.test(location.hostname)) return;
  try { if (localStorage.getItem('mcOutfitOff') === '1') return; } catch (e) {}
  if (window.__mcOutfitLoaded) return;
  window.__mcOutfitLoaded = true;

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function img(mid, m, size) { return m ? 'https://shoplineimg.com/' + mid + '/' + m + '/' + (size || '300x') + '.webp?source_format=jpg' : ''; }
  function pid() { try { return window.mainConfig.trackerEventData['Product ID'] || ''; } catch (e) { return ''; } }

  function injectCSS() {
    var css = '.mc-outfit{margin:18px 0 6px;padding:14px;border:1px solid #e8e8e8;border-radius:8px;background:#fff}' +
      '.mc-outfit-head{font-size:12px;letter-spacing:.12em;color:#888;margin:0 0 10px}' +
      '.mc-outfit-card{display:flex;align-items:center;gap:14px;text-decoration:none;color:#222}' +
      '.mc-outfit-card:hover{text-decoration:none;color:#222}' +
      '.mc-outfit-img{flex:0 0 72px;width:72px;height:96px;border-radius:6px;overflow:hidden;background:#f3f3f3}' +
      '.mc-outfit-img img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.mc-outfit-body{flex:1 1 auto;min-width:0}' +
      '.mc-outfit-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:15px;line-height:1.35;margin:0 0 2px;overflow:hidden}' +   // 英日品名較長,允許兩行
      '.mc-outfit-meta{display:block;font-size:13px;color:#777;margin:0 0 6px}' +
      '.mc-outfit-price{display:block;font-size:15px;font-weight:600}' +
      '.mc-outfit-price s{color:#aaa;font-weight:400;margin-left:6px;font-size:13px}' +
      '.mc-outfit-cta{flex:0 0 auto;font-size:13px;padding:8px 14px;border:1px solid #222;border-radius:4px;white-space:nowrap}' +
      '.mc-outfit-card:hover .mc-outfit-cta{background:#222;color:#fff}' +
      '.mc-outfit-soldout .mc-outfit-cta{border-color:#bbb;color:#999}' +
      '.mc-outfit-badge{display:inline-block;font-size:11px;color:#b55;border:1px solid #e3b4b4;border-radius:3px;padding:0 5px;margin-left:6px;vertical-align:middle}' +
      '@media (max-width:767px){.mc-outfit{margin:14px 0 4px}.mc-outfit-cta{padding:7px 10px}}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }

  // 三語介面文字:跟著官網目前語言(html lang = zh-hant / en / ja)。品名用商品的 title_translations;顏色名官網英日版也是中文,照官網。
  var I18N = {
    'zh-hant': { head: '圖中穿搭', bottom: '圖中下身', top: '圖中上身', color: '顏色:', cta: '看這件 ›', ctaSold: '看這件', sold: '售完' },
    'en':      { head: 'Shop the look', bottom: 'Bottom in this photo', top: 'Top in this photo', color: 'Color: ', cta: 'View ›', ctaSold: 'View', sold: 'Sold out' },
    'ja':      { head: '着用アイテム', bottom: '写真のボトムス', top: '写真のトップス', color: 'カラー：', cta: '詳細を見る ›', ctaSold: '詳細を見る', sold: '完売' }
  };
  function lang() {
    var l = String(document.documentElement.lang || '').toLowerCase();
    if (l.indexOf('en') === 0) return 'en';
    if (l.indexOf('ja') === 0) return 'ja';
    return 'zh-hant';
  }
  function render(data, p) {
    var it = p.item, L = lang(), T = I18N[L];
    var title = (it.title_i18n && it.title_i18n[L]) || it.title;
    var roleLabel = it.role === 'top' ? T.top : T.bottom;
    var price = it.price_sale ? '<span class="mc-outfit-price">' + esc(it.price_sale) + '<s>' + esc(it.price) + '</s></span>' : '<span class="mc-outfit-price">' + esc(it.price) + '</span>';
    var box = document.createElement('div');
    box.className = 'mc-outfit' + (it.soldout ? ' mc-outfit-soldout' : '');
    box.setAttribute(CFG.mark, '1'); box.setAttribute('lang', L);
    box.innerHTML = '<p class="mc-outfit-head">' + esc(T.head) + ' · ' + esc(roleLabel) + '</p>' +
      '<a class="mc-outfit-card" href="' + esc(it.url) + '" data-mc-outfit-sku="' + esc(it.sku) + '">' +
      '<span class="mc-outfit-img"><img loading="lazy" alt="' + esc(title) + '" src="' + img(data.mid, it.cover) + '"></span>' +
      '<span class="mc-outfit-body"><span class="mc-outfit-title">' + esc(title) + (it.soldout ? '<span class="mc-outfit-badge">' + esc(T.sold) + '</span>' : '') + '</span>' +
      '<span class="mc-outfit-meta">' + esc(T.color) + esc(it.color) + '</span>' + price + '</span>' +
      '<span class="mc-outfit-cta">' + esc(it.soldout ? T.ctaSold : T.cta) + '</span></a>';
    box.querySelector('a').addEventListener('click', function () {
      try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'mc_outfit_click', outfit_from: pid(), outfit_to: it.id, outfit_sku: it.sku }); } catch (e) {}
    });
    return box;
  }

  function place(data) {
    var p = data.pairs && data.pairs[pid()];
    if (!p || !p.item) return true;                               // 這件沒有配對 → 不做事(回 true 表示不用再等)
    var detail = document.querySelector('.ProductDetail-product-info .variation-detail, .js-product-info .variation-detail');
    if (!detail || detail.closest('.quick-cart')) return false;
    if (detail.querySelector('[' + CFG.mark + ']')) return true;
    // 桌機版 .variation-detail 裡還有一個藏在「加價購摘要」(addon-promotion-summary.ng-hide)內的同名按鈕容器,要挑直接子層、看得見的那個
    var btns = detail.querySelector(':scope > .product-detail-button-container');
    if (!btns) {
      var all = detail.querySelectorAll('.product-detail-button-container');
      for (var i = 0; i < all.length; i++) if (all[i].offsetParent !== null) { btns = all[i]; break; }
    }
    if (!btns) return false;
    var after = btns.nextElementSibling && /wishlist/i.test(btns.nextElementSibling.className) ? btns.nextElementSibling : btns;
    after.parentNode.insertBefore(render(data, p), after.nextSibling);
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'mc_outfit_shown', outfit_from: pid(), outfit_to: p.item.id, outfit_sku: p.item.sku }); } catch (e) {}
    return true;
  }

  function run(data) {
    if (!data || data.enabled !== true || !data.pairs) return;
    if (!/^\/products\//.test(location.pathname)) return;
    injectCSS();
    if (place(data)) return;
    var mo = new MutationObserver(function () { if (place(data)) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 10000);
  }
  function start() {
    var data = window.__mcOutfitData;
    if (data) return run(data);
    fetch(CFG.url, { cache: 'default', credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(run).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
