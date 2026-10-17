/* MACACA 會員購物金提示 v0.2(2026-10-17 設計稿,未上線)— 不用任何 Open API
 * 宏鈞 10/17:「沒有 open api,要用沒有 api 的程式版本」→ 預設 USE_STOREFRONT_API=false:只讀頁面上現成的
 * window.mainConfig.currentUser.credit_balance;沒有這個欄位就什麼都不顯示。
 * (USE_STOREFRONT_API=true 時才會打官網前台自己的 /api/user_credits——那是顧客瀏覽器在會員中心本來就會打的內部網址,
 *  靠登入 cookie 認人,不是 SHOPLINE Open API、不用申請金鑰;先留著,宏鈞同意才開。)
 * 需求(宏鈞):有登入、而且有購物金的顧客,頁面上方顯示購物金符號;點了顯示金額。
 * 資料:①window.mainConfig.currentUser(未登入=null)②購物金餘額:先看 currentUser.credit_balance,
 *       沒有就打官網自己的 /api/user_credits?limit=1&page=1(同網域、帶 cookie,會員中心就是打這支),取第一筆的 credit_balance。
 * 位置:桌機 nav.header--desktop、手機 nav.header--mobile 的「會員」圖示(a[href^="/users"] 或 icon-person)旁邊,
 *       複製同一個 li.List-item 結構,所以顏色、間距跟原生一樣。
 * 安全:找不到 header/會員圖示就不動;API 失敗就不顯示;餘額 10 分鐘內用 sessionStorage 快取,不每頁打 API。
 * 關閉:GTM 暫停標籤;個人測試 localStorage.setItem('mcCreditOff','1')。
 * 測試:window.__mcCreditTest = { balance: 350, userId: 'test' } 可在未登入時模擬。
 */
(function () {
  'use strict';
  if (!/macaca\.com\.tw$/.test(location.hostname)) return;
  try { if (localStorage.getItem('mcCreditOff') === '1') return; } catch (e) {}
  if (window.__mcCreditLoaded) return;
  window.__mcCreditLoaded = true;

  var USE_STOREFRONT_API = false;                      // 宏鈞 10/17:預設不打任何網址
  var TEST = window.__mcCreditTest || null;
  var user = TEST ? { _id: TEST.userId || 'test', credit_balance: TEST.balance } : (window.mainConfig && window.mainConfig.currentUser);
  if (!user || !user._id) return;                       // 沒登入 → 什麼都不做

  var CACHE_KEY = 'mcCredit:' + user._id, CACHE_MS = 10 * 60 * 1000;

  function fmt(n) { return 'NT$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function findBalance(obj, depth) {                    // 回應結構不確定,遞迴找第一個 credit_balance
    if (!obj || typeof obj !== 'object' || depth > 4) return null;
    if (typeof obj.credit_balance === 'number') return obj.credit_balance;
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) { var v = findBalance(obj[keys[i]], depth + 1); if (v !== null) return v; }
    return null;
  }
  function getBalance(cb) {
    if (TEST) return cb(TEST.balance);
    if (typeof user.credit_balance === 'number') return cb(user.credit_balance);
    if (!USE_STOREFRONT_API) return;                     // 沒有欄位、又不准打網址 → 不顯示
    try {
      var c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (c && Date.now() - c.t < CACHE_MS) return cb(c.v);
    } catch (e) {}
    fetch('/api/user_credits?limit=1&page=1', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var v = findBalance(j, 0);
        if (v === null) return;
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: v })); } catch (e) {}
        cb(v);
      }).catch(function () {});
  }

  var ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18"/><path d="M8 7V5.5a2.5 2.5 0 0 1 5 0V7"/><path d="M11 7V5.5a2.5 2.5 0 0 1 5 0V7"/></svg>';

  function injectCSS() {
    var css = '.mc-credit{position:relative}' +
      '.mc-credit .mc-credit-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;background:none;border:0;padding:0;line-height:1}' +
      '.mc-credit .mc-credit-dot{position:absolute;top:-3px;right:-5px;min-width:8px;height:8px;border-radius:50%;background:#d9534f}' +
      '.mc-credit-pop{position:absolute;top:calc(100% + 12px);right:-8px;z-index:1200;background:#fff;color:#333;border:1px solid #e5e5e5;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.12);padding:14px 16px;min-width:200px;font-size:14px;line-height:1.5;text-align:left;display:none}' +
      '.mc-credit-pop.open{display:block}' +
      '.mc-credit-pop:before{content:"";position:absolute;top:-6px;right:16px;width:10px;height:10px;background:#fff;border-left:1px solid #e5e5e5;border-top:1px solid #e5e5e5;transform:rotate(45deg)}' +
      '.mc-credit-pop .mc-credit-label{color:#888;font-size:12px;letter-spacing:.05em}' +
      '.mc-credit-pop .mc-credit-amt{font-size:22px;font-weight:600;margin:2px 0 8px;letter-spacing:.02em}' +
      '.mc-credit-pop a.mc-credit-link{display:inline-block;color:#333;text-decoration:underline;font-size:13px}' +
      '@media (max-width:767px){.mc-credit-pop{position:fixed;top:auto;right:12px;left:12px;margin-top:8px;min-width:0}.mc-credit-pop:before{display:none}}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }

  function build(nav, balance) {
    if (!nav || nav.querySelector('.mc-credit')) return false;
    var userA = nav.querySelector('a[href^="/users"], a .icon-person, svg.icon-person');
    if (!userA) return false;
    var li = userA.closest('li'); if (!li) return false;
    var el = document.createElement('li');
    el.className = (li.className || 'List-item') + ' mc-credit';
    el.style.position = 'relative';
    el.innerHTML = '<button type="button" class="NavigationBar-actionMenu-button nav-color mc-credit-btn" aria-label="購物金" title="購物金">' + ICON + '<span class="mc-credit-dot"></span></button>' +
      '<div class="mc-credit-pop" role="dialog" aria-label="購物金"><div class="mc-credit-label">可用購物金</div><div class="mc-credit-amt">' + fmt(balance) + '</div>' +
      '<a class="mc-credit-link" href="/user_credits">查看明細與到期日 ›</a></div>';   // 10/17 登入實測:購物金頁是 /user_credits(/users/{id}/user_credits 會被導回首頁)
    li.parentNode.insertBefore(el, li.nextSibling);
    var btn = el.querySelector('.mc-credit-btn'), pop = el.querySelector('.mc-credit-pop');
    btn.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); pop.classList.toggle('open'); });
    document.addEventListener('click', function (ev) { if (!el.contains(ev.target)) pop.classList.remove('open'); });
    return true;
  }

  getBalance(function (balance) {
    if (!(balance > 0)) return;                          // 沒有購物金 → 不顯示
    injectCSS();
    var navs = document.querySelectorAll('nav.header--desktop, nav.header--mobile');
    var done = 0;
    for (var i = 0; i < navs.length; i++) if (build(navs[i], balance)) done++;
    if (!done) {                                         // header 晚一點才渲染的保險
      var mo = new MutationObserver(function () {
        var n2 = document.querySelectorAll('nav.header--desktop, nav.header--mobile'); var ok = 0;
        for (var j = 0; j < n2.length; j++) if (build(n2[j], balance)) ok++;
        if (ok) mo.disconnect();
      });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 8000);
    }
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'mc_credit_badge_shown', credit_balance: balance }); } catch (e) {}
  });
})();
