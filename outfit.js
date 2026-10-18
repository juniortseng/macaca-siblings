/* MACACA 圖中穿搭 v0.8.2(2026-10-18 示意,未發布;看這件不反白、滑過/按到字加粗約20%;三語;桌機正方形用本頁照片、手機方型小卡;一頁可多件;標題只留「圖中穿搭」;位置由 pairs.json)
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
      '.mc-outfit-img{display:block;width:100%;aspect-ratio:1/1;background:#f3f3f3;overflow:hidden}' +   // 桌機正方形
      '.mc-outfit-img picture{display:block;width:100%;height:100%}' +
      '.mc-outfit-img img{width:100%;height:100%;display:block;object-fit:cover;object-position:var(--mc-pos,50% 20%)}' +
      '.mc-outfit-body{display:block;padding:16px 12px 0}' +
      '.mc-outfit-title{display:block;font-size:17px;line-height:1.4;margin:0 0 4px}' +
      '.mc-outfit-meta{display:block;font-size:14px;color:#777;margin:0 0 6px}' +
      '.mc-outfit-price{display:block;font-size:17px;font-weight:600;margin:0 0 14px}' +
      '.mc-outfit-price s{color:#aaa;font-weight:400;margin-left:8px;font-size:14px}' +
      '.mc-outfit-cta{display:inline-block;font-size:14px;padding:10px 28px;border:1px solid #222;border-radius:4px;letter-spacing:.06em}' +
      '.mc-outfit-soldout .mc-outfit-cta{border-color:#bbb;color:#999}' +
      // 宏鈞 10/18:滑鼠經過或手指按到時,「看這件」字變粗約 20%(用描邊加粗,按鈕寬度不會跳動;不反白)
      '.mc-outfit-cta{transition:-webkit-text-stroke-width .12s ease}' +
      '.mc-outfit-card:hover .mc-outfit-cta,.mc-outfit-card:active .mc-outfit-cta,.mc-outfit-card:focus-visible .mc-outfit-cta,.mc-outfit-card.mc-touch .mc-outfit-cta{-webkit-text-stroke:.3px currentColor;text-stroke:.3px currentColor}' +
      '.mc-outfit-multi .mc-outfit-cards{display:grid;gap:24px;grid-template-columns:repeat(2,minmax(0,1fr))}' +
      '.mc-outfit-n3 .mc-outfit-cards{grid-template-columns:repeat(3,minmax(0,1fr))}' +
      '.mc-outfit-n4 .mc-outfit-cards{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}' +
      '.mc-outfit-multi .mc-outfit-title{font-size:16px}' +
      '.mc-outfit-badge{display:inline-block;font-size:11px;color:#b55;border:1px solid #e3b4b4;border-radius:3px;padding:0 5px;margin-left:6px;vertical-align:middle}' +
      // 手機(宏鈞 10/18):方型小卡——正方形縮圖在左(圖片置中裁切)、品名/顏色/價格在右、「看這件 ›」小字在右下;整張可點
      '@media (max-width:767px){' +
        '.mc-outfit{margin:20px 0 24px;text-align:left}' +
        '.mc-outfit-multi .mc-outfit-cards{display:flex;flex-direction:column;gap:10px}' +
        '.mc-outfit-head{margin:0 0 8px}' +
        '.mc-outfit-card{display:flex;align-items:stretch;gap:12px;border:1px solid #e8e8e8;border-radius:8px;padding:10px;background:#fff}' +
        '.mc-outfit-img{flex:0 0 96px;width:96px;height:96px;aspect-ratio:auto;border-radius:6px}' +
        '.mc-outfit-img img{width:100%;height:100%;object-fit:cover;object-position:50% 25%}' +
        '.mc-outfit-body{flex:1 1 auto;min-width:0;padding:2px 0 0;display:flex;flex-direction:column;justify-content:center}' +
        '.mc-outfit-title{font-size:15px;line-height:1.3;margin:0 0 2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
        '.mc-outfit-meta{font-size:12px;margin:0 0 4px}' +
        '.mc-outfit-price{font-size:15px;margin:0 0 4px}' +
        '.mc-outfit-cta{display:inline-block;align-self:flex-end;font-size:12px;padding:0;border:0;letter-spacing:.04em;color:#555;text-decoration:underline;text-underline-offset:2px}' +
      '}';
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
  // 一頁可以有多件(宏鈞 10/18:EYE7383 照片裡有兩件上身都要顯示)。
  // pairs.json 每筆可寫成舊格式 {item, photo} 或新格式 {items:[{item, photo}, ...]}。
  function entries(p) {
    if (p && p.items && p.items.length) return p.items.filter(function (e) { return e && e.item; });
    return p && p.item ? [{ item: p.item, photo: p.photo }] : [];
  }
  function card(data, e, L, T) {
    var it = e.item, ph = e.photo;
    var title = (it.title_i18n && it.title_i18n[L]) || it.title;
    var price = it.price_sale ? '<span class="mc-outfit-price">' + esc(it.price_sale) + '<s>' + esc(it.price) + '</s></span>' : '<span class="mc-outfit-price">' + esc(it.price) + '</span>';
    var a = document.createElement('a');
    a.className = 'mc-outfit-card' + (it.soldout ? ' mc-outfit-soldout' : '');
    a.href = it.url; a.setAttribute('data-mc-outfit-sku', it.sku || '');
    // 桌機:本商品頁的照片(ph.media)正方形裁切,ph.pos 決定裁哪一段;沒指定就用對方商品封面。手機:方型小卡用對方商品封面(<picture> 切換)。
    a.innerHTML = '<span class="mc-outfit-img"><picture>' +
        '<source media="(max-width:767px)" srcset="' + img(data.mid, it.cover, '300x') + '">' +
        '<img loading="lazy" alt="' + esc(title) + '" style="--mc-pos:' + esc((ph && ph.pos) || '50% 20%') + '"' +
        ' src="' + img(data.mid, (ph && ph.media) || it.cover, '1200x') + '"></picture></span>' +
      '<span class="mc-outfit-body"><span class="mc-outfit-title">' + esc(title) + (it.soldout ? '<span class="mc-outfit-badge">' + esc(T.sold) + '</span>' : '') + '</span>' +
      '<span class="mc-outfit-meta">' + esc(T.color) + esc(it.color) + '</span>' + price +
      '<span class="mc-outfit-cta">' + esc(it.soldout ? T.ctaSold : T.cta) + '</span></span>';
    // 手機:iOS 的 :active 不一定觸發,用 touchstart/touchend 補一個 class
    a.addEventListener('touchstart', function () { a.classList.add('mc-touch'); }, { passive: true });
    a.addEventListener('touchend', function () { setTimeout(function () { a.classList.remove('mc-touch'); }, 180); }, { passive: true });
    a.addEventListener('touchcancel', function () { a.classList.remove('mc-touch'); }, { passive: true });
    a.addEventListener('click', function () {
      try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'mc_outfit_click', outfit_from: pid(), outfit_to: it.id, outfit_sku: it.sku }); } catch (err) {}
    });
    return a;
  }
  function render(data, p) {
    var L = lang(), T = I18N[L], list = entries(p);
    var box = document.createElement('div');
    box.className = 'mc-outfit' + (list.length > 1 ? ' mc-outfit-multi mc-outfit-n' + Math.min(list.length, 4) : '');
    box.setAttribute(CFG.mark, '1'); box.setAttribute('lang', L);
    // 宏鈞 10/18:標題只留「圖中穿搭」
    box.innerHTML = '<p class="mc-outfit-head">' + esc(T.head) + '</p><div class="mc-outfit-cards"></div>';
    var wrap = box.querySelector('.mc-outfit-cards');
    for (var i = 0; i < list.length && i < 4; i++) wrap.appendChild(card(data, list[i], L, T));
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
    if (!entries(p).length) return true;                           // 這件沒有配對 → 不做事(回 true 表示不用再等)
    if (document.querySelector('[' + CFG.mark + ']')) return true;
    var pos = window.__mcOutfitPos || data.position || 'origin';
    var box = render(data, p); box.setAttribute('data-mc-outfit-pos', pos);
    if (pos === 'gallery') {
      var gal = firstVisible('.ProductDetail-product-gallery');
      if (!gal) return false;
      gal.appendChild(box);
    } else if (pos === 'lookbook') {
      var lb = firstVisible('.ProductDetail-gallery');
      if (lb) { lb.parentNode.insertBefore(box, lb); }
      else {                                                      // 這款沒有「了解更多」圖庫 → 放描述最後
        var desc2 = firstVisible('.ProductDetail-description');
        if (!desc2) return false;
        desc2.appendChild(box);
      }
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
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'mc_outfit_shown', outfit_from: pid(), outfit_to: entries(p).map(function (e) { return e.item.id; }).join(','), outfit_sku: entries(p).map(function (e) { return e.item.sku; }).join(','), outfit_count: entries(p).length }); } catch (e) {}
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
