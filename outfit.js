/* MACACA 圖中穿搭 v0.5(2026-10-17 示意,未發布;三語;大圖直式;位置可選 gallery/desc-top/origin/lookbook,預設 origin)
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
    var css = '.mc-outfit{max-width:1000px;margin:32px auto 40px;padding:0;background:#fff;text-align:center}' +
      '.mc-outfit-head{font-size:12px;letter-spacing:.14em;color:#888;margin:0 0 12px}' +
      '.mc-outfit-card{display:block;text-decoration:none;color:#222}' +
      '.mc-outfit-card:hover{text-decoration:none;color:#222}' +
      '.mc-outfit-img{display:block;width:100%;background:#f3f3f3;overflow:hidden}' +
      '.mc-outfit-img img{width:100%;height:auto;display:block}' +                                   // 原比例,不裁
      '.mc-outfit-body{display:block;padding:16px 12px 0}' +
      '.mc-outfit-title{display:block;font-size:17px;line-height:1.4;margin:0 0 4px}' +
      '.mc-outfit-meta{display:block;font-size:14px;color:#777;margin:0 0 6px}' +
      '.mc-outfit-price{display:block;font-size:17px;font-weight:600;margin:0 0 14px}' +
      '.mc-outfit-price s{color:#aaa;font-weight:400;margin-left:8px;font-size:14px}' +
      '.mc-outfit-cta{display:inline-block;font-size:14px;padding:10px 28px;border:1px solid #222;border-radius:4px;letter-spacing:.06em}' +
      '.mc-outfit-card:hover .mc-outfit-cta{background:#222;color:#fff}' +
      '.mc-outfit-soldout .mc-outfit-cta{border-color:#bbb;color:#999}' +
      '.mc-outfit-badge{display:inline-block;font-size:11px;color:#b55;border:1px solid #e3b4b4;border-radius:3px;padding:0 5px;margin-left:6px;vertical-align:middle}' +
      '@media (max-width:767px){.mc-outfit{margin:24px 0 28px}.mc-outfit-body{padding-top:12px}.mc-outfit-cta{display:block;margin:0 12px;padding:11px 0}}';   // 手機:圖滿版、按鈕滿寬
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
    // 版面(宏鈞 10/17):圖跟描述區的商品圖一樣寬(桌機 1000px、手機滿版),原比例不裁;品名/顏色/價格/按鈕在圖下方置中。桌機手機同一套。
    box.innerHTML = '<p class="mc-outfit-head">' + esc(T.head) + ' · ' + esc(roleLabel) + '</p>' +
      '<a class="mc-outfit-card" href="' + esc(it.url) + '" data-mc-outfit-sku="' + esc(it.sku) + '">' +
      '<span class="mc-outfit-img"><img loading="lazy" alt="' + esc(title) + '" src="' + img(data.mid, it.cover, '750x') + '" srcset="' + img(data.mid, it.cover, '750x') + ' 750w, ' + img(data.mid, it.cover, '1200x') + ' 1200w" sizes="(min-width:768px) 1000px, 100vw"></span>' +
      '<span class="mc-outfit-body"><span class="mc-outfit-title">' + esc(title) + (it.soldout ? '<span class="mc-outfit-badge">' + esc(T.sold) + '</span>' : '') + '</span>' +
      '<span class="mc-outfit-meta">' + esc(T.color) + esc(it.color) + '</span>' + price +
      '<span class="mc-outfit-cta">' + esc(it.soldout ? T.ctaSold : T.cta) + '</span></span></a>';
    box.querySelector('a').addEventListener('click', function () {
      try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'mc_outfit_click', outfit_from: pid(), outfit_to: it.id, outfit_sku: it.sku }); } catch (e) {}
    });
    return box;
  }

  // 位置(宏鈞 10/17):商品描述分頁裡「產地」標題的上方。描述是每件商品自己寫的 HTML,三語共用同一段(標題都是中文「產地」)。
  // 找法:描述區裡第一個文字以「產地」開頭的末端元素 → 往上找最近的區塊(div/p/h*),且該區塊文字很短(避免整段描述包在一個 div 裡時插到最上面)。
  // 找不到「產地」→ 退而放在描述最後面。
  function findOriginBlock(desc) {
    var all = desc.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.children.length) continue;
      if (!/^\s*產地/.test(e.textContent || '')) continue;
      var n = e;
      while (n && n !== desc) {
        var isBlock = /^(DIV|P|H[1-6]|LI|SECTION|TABLE)$/.test(n.tagName);
        if (isBlock && (n.textContent || '').trim().length <= 40) { var up = n; while (up.parentElement && up.parentElement !== desc && /^(DIV|P)$/.test(up.parentElement.tagName) && (up.parentElement.textContent || '').trim().length <= 40) up = up.parentElement; return up; }
        n = n.parentElement;
      }
      return e.parentElement || e;
    }
    return null;
  }
  // 位置選項(宏鈞 10/17 要比較三個位置):
  //   gallery  = 商品主圖正下方(桌機左欄圖庫下、手機輪播圖下、品名上)
  //   desc-top = 商品描述分頁最上方(「商品描述」標題下、第一段前)
  //   origin   = 描述裡「產地」上方(找不到就描述最後)
  //   lookbook = 「了解更多」穿搭圖庫上方(描述結束處)
  // 由 pairs.json 的 position 決定,測試可用 window.__mcOutfitPos 覆蓋;預設 origin。
  function firstVisible(sel) { var els = document.querySelectorAll(sel); for (var i = 0; i < els.length; i++) if (!els[i].closest('.quick-cart') && els[i].offsetParent !== null) return els[i]; return null; }
  function place(data) {
    var p = data.pairs && data.pairs[pid()];
    if (!p || !p.item) return true;                               // 這件沒有配對 → 不做事(回 true 表示不用再等)
    if (document.querySelector('[' + CFG.mark + ']')) return true;
    var pos = window.__mcOutfitPos || data.position || 'origin';
    var box = render(data, p); box.setAttribute('data-mc-outfit-pos', pos);
    if (pos === 'gallery') {
      var gal = firstVisible('.ProductDetail-product-gallery');
      if (!gal) return false;
      gal.appendChild(box);
    } else if (pos === 'lookbook') {
      var lb = firstVisible('.ProductDetail-gallery');
      if (!lb) return false;
      lb.parentNode.insertBefore(box, lb);
    } else {
      var desc = firstVisible('.ProductDetail-description');
      if (!desc) return false;
      if (pos === 'desc-top') {
        var first = desc.firstElementChild;
        var isHeading = first && (first.textContent || '').trim().length <= 12;   // 「商品描述 / Description / 商品の説明」標題
        if (isHeading) desc.insertBefore(box, first.nextSibling); else desc.insertBefore(box, first);
      } else {
        var origin = findOriginBlock(desc);
        if (origin) origin.parentNode.insertBefore(box, origin); else desc.appendChild(box);
      }
    }
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
