/* MACACA IG 穿搭牆 v0.4(2026-10-31 示意,未上線;要取代 Tagnology 的「相關產品上方」內容牆;v0.2/v0.3 照 Fable 兩輪審查修)
 * 作用:商品頁「您可能喜歡」上方,放跟這件有關的 IG 貼文(@macaca_official、@macaca_shops),點開看大圖和貼文裡的商品。
 * 資料:ugc/<商品id>.json(build_ugc.py 每天產;排序=標到本色 → 同系列其他色,新→舊,最多 12 則)。沒有檔的頁面不顯示。
 * 圖片(v0.4):存在 Google Drive,檔裡是 Drive 檔案 id;還沒上傳的是 IG 網址。Drive 圖先走 lh3,載不到改 Drive 縮圖網址再試一次。
 * 量測:dataLayer mc_ugc_shown / mc_ugc_open / mc_ugc_product_click;連結不加 UTM(避免蓋掉原本的流量來源)。
 * 安全:找不到「您可能喜歡」就放商品描述區後面,兩個都找不到就不動;localStorage mcUgcOff=1 關閉。
 * 測試:window.__mcUgcData = {...} 直接塞資料不抓網路;window.__mcUgcHideTagnology = true 同頁隱藏 Tagnology 牆。
 */
(function () {
  'use strict';
  var CFG = { base: 'https://juniortseng.github.io/macaca-siblings/ugc/', mid: '5f893ca8281f94002455640b', mark: 'data-mc-ugc' };
  if (!/macaca\.com\.tw$/.test(location.hostname)) return;
  try { if (localStorage.getItem('mcUgcOff') === '1') return; } catch (e) {}
  if (window.__mcUgcLoaded) return;
  window.__mcUgcLoaded = true;

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function img(m, size) { return m ? 'https://shoplineimg.com/' + CFG.mid + '/' + m + '/' + (size || '200x') + '.webp?source_format=jpg' : ''; }
  var LH3 = 'https://lh3.googleusercontent.com/d/';
  function pic(x, w) { return /^https?:/.test(x || '') ? x : LH3 + x + '=w' + w; }
  function retry(im) {   // lh3 載不到 → 同一張改走 Drive 縮圖網址(會轉址到 lh3,慢一點但比較穩);已換過就回 false
    var s = im.getAttribute('src') || '';
    if (s.indexOf(LH3) !== 0) return false;
    var a = s.slice(LH3.length).split('=w');
    im.src = 'https://drive.google.com/thumbnail?id=' + a[0] + '&sz=w' + (a[1] || 600);
    return true;
  }
  function pid() { try { return window.mainConfig.trackerEventData['Product ID'] || ''; } catch (e) { return ''; } }
  function price(n) { return n ? 'NT$' + Number(n).toLocaleString('en-US') : ''; }
  function push(o) { try { window.dataLayer = window.dataLayer || []; window.dataLayer.push(o); } catch (e) {} }

  function injectCSS() {
    var css = '.mc-ugc{max-width:1000px;margin:24px auto 40px;padding:0 0 4px}' +
      '.mc-ugc-head{font-size:12px;letter-spacing:.14em;color:#888;text-align:center;margin:0 0 14px}' +
      // minmax(0,…) 與 min-width:0:品名不換行,不加的話長品名會把那一格撐寬(手機橫滑每格大小不一)
      '.mc-ugc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}' +
      '.mc-ugc-tile{display:block;min-width:0;text-align:left;cursor:pointer;background:none;border:0;padding:0;font:inherit;color:#222}' +
      '.mc-ugc-tile:focus{outline:none}.mc-ugc-tile:focus-visible .mc-ugc-ph{outline:2px solid #ce715e;outline-offset:2px}' +
      '.mc-ugc-ph{position:relative;display:block;aspect-ratio:4/5;background:#f3f3f3;border-radius:8px;overflow:hidden}' +
      '.mc-ugc-ph img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.mc-ugc-acct{position:absolute;left:8px;bottom:8px;font-size:11px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}' +
      '.mc-ugc-play{position:absolute;right:8px;top:8px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.45)}' +
      '.mc-ugc-play:after{content:"";position:absolute;left:8px;top:6px;border-left:8px solid #fff;border-top:5px solid transparent;border-bottom:5px solid transparent}' +
      '.mc-ugc-prod{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:13px;line-height:1.35}' +
      '.mc-ugc-prod img{width:36px;height:36px;object-fit:cover;border-radius:4px;flex:none;background:#f3f3f3}' +
      '.mc-ugc-prod>span{flex:1;min-width:0}' +
      '.mc-ugc-prod span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.mc-ugc-prod b{font-weight:600}' +
      '.mc-ugc-more{display:block;margin:16px auto 0;background:none;border:1px solid #ccc;border-radius:4px;padding:8px 22px;font:inherit;font-size:13px;color:#555;cursor:pointer}' +
      '.mc-ugc-modal{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}' +
      '.mc-ugc-box{background:#fff;width:min(880px,94vw);max-height:90vh;overflow:auto;border-radius:10px;display:flex;position:relative}' +
      '.mc-ugc-box-ph{flex:1 1 55%;background:#111;display:flex;align-items:center;justify-content:center;position:relative}' +
      '.mc-ugc-box-ph img{width:100%;max-height:90vh;object-fit:contain;display:block}' +
      '.mc-ugc-nav{position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;border:0;background:rgba(255,255,255,.85);font-size:18px;cursor:pointer}' +
      '.mc-ugc-side{flex:1 1 45%;padding:20px 18px;font-size:14px;line-height:1.55;color:#333}' +
      '.mc-ugc-side-acct{font-weight:600;margin:0 0 4px}' +
      '.mc-ugc-side-cap{color:#666;font-size:13px;margin:0 0 14px;white-space:pre-line}' +
      '.mc-ugc-side-h{font-size:12px;letter-spacing:.12em;color:#888;margin:0 0 8px}' +
      '.mc-ugc-item{display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid #eee;text-decoration:none;color:#222}' +
      '.mc-ugc-item:hover{text-decoration:none;color:#222}' +
      '.mc-ugc-item img{width:56px;height:56px;object-fit:cover;border-radius:4px;flex:none;background:#f3f3f3}' +
      '.mc-ugc-item-t{flex:1;min-width:0}' +
      '.mc-ugc-item-t span{display:block}' +
      '.mc-ugc-item-go{font-size:13px;white-space:nowrap}' +
      '.mc-ugc-sold{color:#999;font-size:12px}' +
      '.mc-ugc-ig{display:inline-block;margin-top:12px;font-size:12px;color:#888}' +
      '.mc-ugc-x{position:absolute;right:10px;top:8px;border:0;background:none;font-size:26px;line-height:1;color:#888;cursor:pointer;z-index:2}' +
      '@media (max-width:767px){' +
      '.mc-ugc{margin:20px 0 32px}' +
      '.mc-ugc-grid{display:flex;overflow-x:auto;gap:10px;padding:0 15px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}' +
      '.mc-ugc-grid::-webkit-scrollbar{display:none}' +
      '.mc-ugc-tile{flex:0 0 42%;scroll-snap-align:start}' +
      '.mc-ugc-more{display:none}' +
      '.mc-ugc-box{flex-direction:column;width:100vw;max-height:100vh;height:100%;border-radius:0}' +
      // 手機:大圖矮一點、貼文文字只留 3 行,「貼文中的商品」才會在第一個畫面裡
      '.mc-ugc-box-ph{flex:none}.mc-ugc-box-ph img{max-height:50vh}' +
      '.mc-ugc-side{padding:14px 16px}' +
      '.mc-ugc-side-cap{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px}' +
      '}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }

  var SERIES = '';   // 本頁系列;格子下方優先顯示「搭配的那件」,不重複顯示本款
  var SELF = null;   // 本頁商品;貼文沒寫明顏色的本款卡片,換成本頁這個顏色
  function card(c) {
    // 沒寫明顏色,或貼文用款號點了好幾色(本頁那色也在裡面)→ 換成本頁這個顏色
    var mine = !c.named || (c.named_codes && SELF && c.named_codes.indexOf(SELF.code) >= 0);
    if (SELF && SELF.code && c.series === SERIES && mine) {
      return { code: SELF.code, name: SELF.name || c.name, color: SELF.color, price: SELF.price, img: SELF.img, url: SELF.url, stock: SELF.stock, series: c.series, colors: c.colors, named: false };
    }
    return c;
  }
  function tileHTML(p, i) {
    var first = p.products.filter(function (c) { return c.series !== SERIES; })[0] || card(p.products[0] || {});
    return '<button type="button" class="mc-ugc-tile" data-i="' + i + '" aria-label="看 @' + esc(p.acct) + ' 的貼文">' +
      '<span class="mc-ugc-ph"><img class="mc-ugc-main" loading="lazy" alt="" src="' + esc(pic(p.img, 600)) + '">' +
      '<span class="mc-ugc-acct">@' + esc(p.acct) + '</span>' + (p.type === 'VIDEO' ? '<span class="mc-ugc-play"></span>' : '') + '</span>' +
      '<span class="mc-ugc-prod"><img loading="lazy" alt="" src="' + esc(img(first.img, '100x')) + '">' +
      '<span><span>' + esc(first.name) + '</span><b>' + esc(price(first.price)) + '</b></span></span></button>';
  }

  function openModal(p, from) {
    var pics = (p.imgs && p.imgs.length ? p.imgs : [p.img]).map(function (x) { return pic(x, 1080); });
    var at = 0;
    var list = p.products.filter(function (c) { return c.series === SERIES; }).map(card).concat(p.products.filter(function (c) { return c.series !== SERIES; }));
    var items = list.map(function (c) {
      // 貼文沒寫明顏色的別款,卡片連的是有貨的第一色,不一定是照片那色 → 不寫色名,只寫共幾色
      var vague = !c.named && c.colors > 1 && !(SELF && c.code === SELF.code);
      var sub = (vague ? '' : c.color) + (c.colors > 1 ? (vague ? '' : '・') + '共 ' + c.colors + ' 色' : '') + (c.stock ? '' : '・售完');
      return '<a class="mc-ugc-item" href="' + esc(c.url) + '" data-sku="' + esc(c.code) + '">' +
        '<img alt="" src="' + esc(img(c.img, '200x')) + '"><span class="mc-ugc-item-t"><span>' + esc(c.name) + '</span>' +
        '<span class="mc-ugc-sold">' + esc(sub) + '</span><span><b>' + esc(price(c.price)) + '</b></span></span>' +
        '<span class="mc-ugc-item-go">看商品 ›</span></a>';
    }).join('');
    var m = document.createElement('div');
    m.className = 'mc-ugc-modal';
    m.innerHTML = '<div class="mc-ugc-box" role="dialog" aria-modal="true" aria-label="@' + esc(p.acct) + ' 的 IG 貼文"><button type="button" class="mc-ugc-x" aria-label="關閉">×</button>' +
      '<div class="mc-ugc-box-ph"><img alt="" src="' + esc(pics[0]) + '">' +
      (pics.length > 1 ? '<button type="button" class="mc-ugc-nav" data-d="-1" aria-label="上一張" style="left:8px">‹</button><button type="button" class="mc-ugc-nav" data-d="1" aria-label="下一張" style="right:8px">›</button>' : '') +
      '</div><div class="mc-ugc-side"><p class="mc-ugc-side-acct">@' + esc(p.acct) + '</p>' +
      (p.cap ? '<p class="mc-ugc-side-cap">' + esc(p.cap) + '</p>' : '') +
      '<p class="mc-ugc-side-h">貼文中的商品</p>' + items +
      '<a class="mc-ugc-ig" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + (p.type === 'VIDEO' ? '這是影片,到 Instagram 播放 ›' : '在 Instagram 看這則 ›') + '</a></div></div>';
    // 大圖載不到:圖留著(左右切換還要用)、只藏起來,旁邊顯示文字;換到好的圖再出現
    var big = m.querySelector('.mc-ugc-box-ph img');
    var note = Object.assign(document.createElement('p'), { textContent: '圖片暫時無法顯示,請到 Instagram 看這則', style: 'display:none;color:#ccc;font-size:13px;padding:40px 20px;text-align:center' });
    big.parentNode.insertBefore(note, big);
    big.onerror = function () { if (!retry(big)) { big.style.display = 'none'; note.style.display = 'block'; } };
    big.onload = function () { big.style.display = ''; note.style.display = 'none'; };
    // 鎖背景捲動:iOS Safari 只鎖 overflow 擋不住,要把 body 固定住、關窗再捲回原位
    var y = window.pageYOffset, bs = document.body.style, prev = [bs.position, bs.top, bs.width];
    bs.position = 'fixed'; bs.top = -y + 'px'; bs.width = '100%';
    function close() {
      m.remove();
      document.removeEventListener('keydown', onKey);
      bs.position = prev[0]; bs.top = prev[1]; bs.width = prev[2];
      window.scrollTo(0, y);
      if (from && from.focus) from.focus({ preventScroll: true });
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('.mc-ugc-x')) return close();
      var nav = e.target.closest('.mc-ugc-nav');
      if (nav) {
        at = (at + Number(nav.getAttribute('data-d')) + pics.length) % pics.length;
        big.src = pics[at];
        return;
      }
      var a = e.target.closest('.mc-ugc-item');
      if (a) push({ event: 'mc_ugc_product_click', ugc_from: pid(), ugc_post: p.id, ugc_acct: p.acct, ugc_to_sku: a.getAttribute('data-sku') });
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(m);
    m.querySelector('.mc-ugc-x').focus();
    push({ event: 'mc_ugc_open', ugc_from: pid(), ugc_post: p.id, ugc_acct: p.acct, ugc_match: p.match });
  }

  function anchor() {
    var rel = document.querySelector('.ProductDetail-relatedProducts');
    if (rel) return { el: rel, before: true };
    var info = document.querySelector('.ProductDetail-additionalInfo');
    return info ? { el: info, before: false } : null;
  }

  function place(data) {
    if (document.querySelector('[' + CFG.mark + ']')) return true;
    var a = anchor();
    if (!a) return false;
    var posts = data.posts.filter(function (p) { return p.img && p.products && p.products.length; });
    if (!posts.length) return true;
    var box = document.createElement('div');
    box.className = 'mc-ugc';
    box.setAttribute(CFG.mark, '1');
    // 手機是橫滑,全部放;桌機先放兩排,其餘按「看更多」
    var mobile = window.matchMedia && window.matchMedia('(max-width:767px)').matches;
    var shown = mobile ? posts.length : Math.min(posts.length, 8);
    box.innerHTML = '<p class="mc-ugc-head">IG 穿搭分享</p><div class="mc-ugc-grid">' +
      posts.slice(0, shown).map(tileHTML).join('') + '</div>' +
      (posts.length > shown ? '<button type="button" class="mc-ugc-more">看更多</button>' : '');
    box.addEventListener('click', function (e) {
      if (e.target.closest('.mc-ugc-more')) {
        var grid = box.querySelector('.mc-ugc-grid');
        grid.insertAdjacentHTML('beforeend', posts.slice(shown).map(function (p, k) { return tileHTML(p, shown + k); }).join(''));
        e.target.remove();
        return;
      }
      var t = e.target.closest('.mc-ugc-tile');
      if (t) openModal(posts[Number(t.getAttribute('data-i'))], t);
    });
    // IG 圖片網址過期或載不到:整格拿掉(全部拿掉就整塊不顯示);商品小圖載不到只藏圖
    box.addEventListener('error', function (e) {
      var im = e.target;
      if (!im || im.tagName !== 'IMG') return;
      if (im.classList.contains('mc-ugc-main')) {
        if (retry(im)) return;
        var tile = im.closest('.mc-ugc-tile');
        if (tile) tile.remove();
        if (!box.querySelector('.mc-ugc-tile')) box.remove();
      } else {
        im.style.visibility = 'hidden';
      }
    }, true);
    a.el.parentNode.insertBefore(box, a.before ? a.el : a.el.nextSibling);
    if (window.__mcUgcHideTagnology) {
      var tg = document.querySelector('.embed-tagnology');
      if (tg) tg.style.display = 'none';
    }
    push({ event: 'mc_ugc_shown', ugc_from: pid(), ugc_count: posts.length, ugc_color_match: posts.filter(function (p) { return p.match === 'color'; }).length });
    return true;
  }

  function run(data) {
    if (!data || !data.posts) return;
    SERIES = data.series || '';
    SELF = data.self || null;
    injectCSS();
    if (place(data)) return;
    var mo = new MutationObserver(function () { if (place(data)) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 10000);
  }
  function start() {
    if (!/^\/products\//.test(location.pathname)) return;
    var data = window.__mcUgcData;
    if (data) return run(data);
    var id = pid();
    if (!id) return;
    fetch(CFG.base + id + '.json', { cache: 'default', credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(run).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
