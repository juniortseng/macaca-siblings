/* MACACA IG 穿搭牆 v0.6(2026-10-31 示意,未上線;要取代 Tagnology 的「相關產品上方」內容牆;v0.2/v0.3 照 Fable 兩輪審查修)
 * 資安(v0.5,宏鈞 10/31 定):資料檔一律當成可能被竄改。每個欄位照真實格式檢查(SHOPLINE 編號=24 個 0–9/a–f),
 *   不合格的整則/整張略過,不會被放進頁面;連結只放本站 /products/ 與 instagram.com 貼文。
 * 作用:商品頁「您可能喜歡」上方,放跟這件有關的 IG 貼文(@macaca_official、@macaca_shops),點開看大圖和貼文裡的商品。
 * 資料:GitHub Pages macaca-ig-wall 的 ugc/<商品id>.json(build_ugc.py 每天產;排序=標到本色 → 同系列其他色,新→舊,最多 12 則)。沒有檔的頁面不顯示。
 * 圖片(v0.6,宏鈞 10/31 從 Google Drive 改 GitHub):同一個 repo 的 i/<key>_600.webp(格子)、_1080.webp(點開);還沒存的是 IG 網址。
 * 量測:dataLayer mc_ugc_shown / mc_ugc_open / mc_ugc_product_click;連結不加 UTM(避免蓋掉原本的流量來源)。
 * 安全:找不到「您可能喜歡」就放商品描述區後面,兩個都找不到就不動;localStorage mcUgcOff=1 關閉。
 * 測試:window.__mcUgcData = {...} 直接塞資料不抓網路;window.__mcUgcHideTagnology = true 同頁隱藏 Tagnology 牆。
 */
(function () {
  'use strict';
  var CFG = { base: 'https://juniortseng.github.io/macaca-ig-wall/ugc/', img: 'https://juniortseng.github.io/macaca-ig-wall/i/',
    mid: '5f893ca8281f94002455640b', mark: 'data-mc-ugc' };
  // 只在官網跑;管理畫面的預覽(本機 127.0.0.1)要先設 __mcUgcPreview,圖讀本機還沒推上去的檔
  var PREVIEW = window.__mcUgcPreview === true && /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  if (!/macaca\.com\.tw$/.test(location.hostname) && !PREVIEW) return;
  if (PREVIEW) CFG.img = '/i/';
  try { if (localStorage.getItem('mcUgcOff') === '1') return; } catch (e) {}
  if (window.__mcUgcLoaded) return;
  window.__mcUgcLoaded = true;

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  // 欄位格式(10/31 對過全部 1,395 頁的真實資料);商品網址有中文品名,舊瀏覽器不支援 \p{L} 就只收英數
  var OK = {
    sl: /^[0-9a-f]{24}$/,                                            // SHOPLINE 商品/商品圖編號
    imgKey: /^\d{5,25}$/,                                            // 存在圖片 repo 的圖(IG 貼文/子圖 id,純數字)
    igImg: /^https:\/\/[a-z0-9.-]+\.cdninstagram\.com\/[^\s"'<>\\]*$/,  // 還沒存進圖片 repo 的 IG 圖
    igPost: /^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/,
    sku: /^[A-Za-z0-9-]{4,20}$/,
    acct: /^[A-Za-z0-9._]{1,30}$/,
    postId: /^\d{5,25}$/,
    type: /^(IMAGE|VIDEO|CAROUSEL_ALBUM)$/
  };
  try { OK.path = new RegExp('^/products/[\\p{L}\\p{N}_-]+$', 'u'); } catch (e) { OK.path = /^\/products\/[A-Za-z0-9_-]+$/; }
  function str(v, re) { return typeof v === 'string' && re.test(v) ? v : ''; }
  function num(v) { return typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0; }
  // 文字只收字串、限長度(不是字串的值用 String() 轉可能直接丟錯,整面牆就不見)
  function txt(v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; }
  function list(v, n) { return Array.isArray(v) ? v.slice(0, n) : []; }
  function cleanCard(c) {
    // 款號可以是空的(「療癒瑜伽流」這類商品後台沒填),有填就要合格式
    if (!c || !str(c.url, OK.path) || (c.code !== '' && !str(c.code, OK.sku))) return null;
    return { code: c.code, name: txt(c.name, 80), color: txt(c.color, 30), price: num(c.price), img: str(c.img, OK.sl),
      url: c.url, stock: !!c.stock, series: txt(c.series, 80), colors: Math.floor(num(c.colors)), named: !!c.named,
      named_codes: list(c.named_codes, 10).filter(function (x) { return str(x, OK.sku); }) };
  }
  function cleanImg(x) { return str(x, OK.imgKey) || str(x, OK.igImg); }
  function clean(d) {
    if (!d || !Array.isArray(d.posts)) return null;
    var posts = [];
    list(d.posts, 12).forEach(function (p) {   // 數量上限照 build_ugc.py:每頁 12 則、輪播 6 張、每則 6 款
      if (!p || !str(p.id, OK.postId) || !str(p.acct, OK.acct) || !str(p.url, OK.igPost) || !str(p.type, OK.type)) return;
      var main = cleanImg(p.img);
      var products = list(p.products, 6).map(cleanCard).filter(Boolean);
      if (!main || !products.length) return;
      posts.push({ id: p.id, acct: p.acct, url: p.url, type: p.type, img: main,
        imgs: list(p.imgs, 6).map(cleanImg).filter(Boolean),
        cap: txt(p.cap, 200), products: products, match: p.match === 'color' ? 'color' : 'series' });
    });
    return { series: txt(d.series, 80), self: cleanCard(d.self), posts: posts, cfg: cleanCfg(d.cfg) };
  }
  window.__mcUgcClean = clean;   // 測試用(純函式,不碰頁面)

  function img(m, size) { return OK.sl.test(m || '') ? 'https://shoplineimg.com/' + CFG.mid + '/' + m + '/' + (size || '200x') + '.webp?source_format=jpg' : ''; }
  // 圖片 repo 只有 600 與 1080 兩種寬度
  function pic(x, w) { return OK.imgKey.test(x || '') ? CFG.img + x + '_' + (w > 600 ? 1080 : 600) + '.webp' : str(x, OK.igImg); }
  function pid() { try { return window.mainConfig.trackerEventData['Product ID'] || ''; } catch (e) { return ''; } }
  function price(n) { return n ? 'NT$' + Number(n).toLocaleString('en-US') : ''; }
  function push(o) { try { window.dataLayer = window.dataLayer || []; window.dataLayer.push(o); } catch (e) {} }

  // 版面設定(管理畫面存的,build_ugc.py 放進每頁資料的 cfg);每一項只收清單裡的值,其他一律用預設
  var DEF = { pos: 'above_related', layout: 'grid', cols: 4, rows: 2, size: 'M', max: 12, media: 'all', title: 'IG 穿搭分享' };
  var ALLOW = {
    pos: ['above_related', 'before_info', 'after_description', 'buybox'],   // 您可能喜歡上方/商品描述上方/商品描述之後/加入購物車下方
    layout: ['grid', 'row'],                                                // 桌機:格子(看更多)/一排橫滑
    cols: [3, 4, 5], rows: [1, 2, 3], size: ['S', 'M', 'L'], max: [4, 6, 8, 12],
    media: ['all', 'image', 'video']                                        // 全部/只放圖片/只放影片
  };
  function cleanCfg(c) {
    var o = {};
    c = c && typeof c === 'object' ? c : {};
    Object.keys(ALLOW).forEach(function (k) { o[k] = ALLOW[k].indexOf(c[k]) >= 0 ? c[k] : DEF[k]; });
    o.title = txt(c.title, 20) || DEF.title;
    return o;
  }
  var SIZE = { S: { w: 760, m: 34 }, M: { w: 1000, m: 42 }, L: { w: 1200, m: 62 } };   // 桌機最大寬度 px、手機每格占螢幕 %

  function injectCSS(cfg) {
    var sz = SIZE[cfg.size], row = cfg.layout === 'row';
    var css = '.mc-ugc{max-width:' + sz.w + 'px;margin:24px auto 40px;padding:0 0 4px}' +
      // 放在右欄購買區(桌機約 430px 寬)時跟著欄寬、固定 2 欄
      '.ProductDetail-product-info .mc-ugc{max-width:100%;margin:20px 0}' +
      '.ProductDetail-product-info .mc-ugc-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-columns:calc((100% - 12px) / 2)}' +
      '.mc-ugc-head{font-size:12px;letter-spacing:.14em;color:#888;text-align:center;margin:0 0 14px}' +
      // minmax(0,…) 與 min-width:0:品名不換行,不加的話長品名會把那一格撐寬(手機橫滑每格大小不一)
      (row
        ? '.mc-ugc-grid{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - ' + (cfg.cols - 1) * 12 + 'px) / ' + cfg.cols + ');gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin}.mc-ugc-tile{scroll-snap-align:start}'
        : '.mc-ugc-grid{display:grid;grid-template-columns:repeat(' + cfg.cols + ',minmax(0,1fr));gap:12px}') +
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
      '.mc-ugc-tile{flex:0 0 ' + sz.m + '%;scroll-snap-align:start}' +
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
    big.onerror = function () { big.style.display = 'none'; note.style.display = 'block'; };
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

  // 位置(10/31 看過商品頁:桌機右欄是 .ProductDetail-product-info,下面依序是商品描述、Tagnology、您可能喜歡);
  // 選的位置找不到就退回「您可能喜歡」上方,再找不到就放商品描述區後面,都找不到就不動
  function anchor(pos) {
    function q(s) { return document.querySelector(s); }
    var at = {
      above_related: function () { var e = q('.ProductDetail-relatedProducts'); return e && { el: e, how: 'before' }; },
      before_info: function () { var e = q('.ProductDetail-additionalInfo'); return e && { el: e, how: 'before' }; },
      after_description: function () { var e = q('.ProductDetail-description'); return e && { el: e, how: 'after' }; },
      buybox: function () { var e = q('.ProductDetail-product-info'); return e && { el: e, how: 'append' }; }
    };
    var info = q('.ProductDetail-additionalInfo');
    return at[pos]() || at.above_related() || (info && { el: info, how: 'after' }) || null;
  }
  function insert(box, a) {
    if (a.how === 'append') a.el.appendChild(box);
    else a.el.parentNode.insertBefore(box, a.how === 'before' ? a.el : a.el.nextSibling);
  }

  function place(data) {
    if (document.querySelector('[' + CFG.mark + ']')) return true;
    var cfg = data.cfg;
    var a = anchor(cfg.pos);
    if (!a) return false;
    var posts = data.posts.filter(function (p) {
      if (!p.img || !p.products || !p.products.length) return false;
      if (cfg.media === 'video') return p.type === 'VIDEO';
      if (cfg.media === 'image') return p.type !== 'VIDEO';
      return true;
    }).slice(0, cfg.max);
    if (!posts.length) return true;
    var box = document.createElement('div');
    box.className = 'mc-ugc';
    box.setAttribute(CFG.mark, '1');
    // 手機與「一排橫滑」全部放;桌機格子先放「欄數×排數」,其餘按「看更多」
    var mobile = window.matchMedia && window.matchMedia('(max-width:767px)').matches;
    var cols = a.how === 'append' ? 2 : cfg.cols;
    var shown = mobile || cfg.layout === 'row' ? posts.length : Math.min(posts.length, cols * cfg.rows);
    box.innerHTML = '<p class="mc-ugc-head">' + esc(cfg.title) + '</p><div class="mc-ugc-grid">' +
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
        var tile = im.closest('.mc-ugc-tile');
        if (tile) tile.remove();
        if (!box.querySelector('.mc-ugc-tile')) box.remove();
      } else {
        im.style.visibility = 'hidden';
      }
    }, true);
    insert(box, a);
    if (window.__mcUgcHideTagnology) {
      var tg = document.querySelector('.embed-tagnology');
      if (tg) tg.style.display = 'none';
    }
    push({ event: 'mc_ugc_shown', ugc_from: pid(), ugc_count: posts.length, ugc_color_match: posts.filter(function (p) { return p.match === 'color'; }).length });
    return true;
  }

  function run(raw) {
    var data = clean(raw);
    if (!data || !data.posts.length) return;
    SERIES = data.series || '';
    SELF = data.self || null;
    injectCSS(data.cfg);
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
    if (!OK.sl.test(id)) return;
    fetch(CFG.base + id + '.json', { cache: 'default', credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(run).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
