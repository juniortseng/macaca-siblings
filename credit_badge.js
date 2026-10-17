/* MACACA 會員購物金提示 v0.3(2026-10-17 三版設計稿,未上線)— 不用任何 Open API
 * 需求:有登入、而且有購物金的顧客,header 顯示購物金符號;點了看得到金額。
 * 資料:只讀頁面上現成的 window.mainConfig.currentUser.credit_balance(10/17 登入實測有此欄位);沒有就不顯示、不打任何網址。
 * 視覺:照 SHOPLINE 原生購物袋徽章的規格(10/17 量測):背景 #eaaa96、白字 11px、高 18px、圓角 10px、絕對定位 top -6px;
 *       圖示用實心剪影(跟原生 person/bag 一樣),22px;字體/顏色繼承 nav(#333)。
 * 三個版本(window.__mcCreditVariant = 'A' | 'B' | 'C',正式版定稿後寫死):
 *   A 同購物袋徽章:實心錢包 + 購物袋同款徽章(寫 $);點了出現一行式小氣泡「購物金 NT$350 ›」,整顆可點去明細。
 *   B 金額標籤:實心硬幣 + 旁邊直接掛金額小標籤(徽章同色);手機版空間不夠,改成徽章直接寫金額數字;沒有氣泡,點了直接去明細。
 *   C 主題色圖示:禮券圖示本身改成主題色(有購物金才出現),沒有徽章;點了出現小卡(金額 + 主題色按鈕「使用購物金」)。
 * 安全:找不到 header/會員圖示就不動;localStorage.mcCreditOff=1 個人關閉;GTM 暫停=全站關閉。
 * 測試:window.__mcCreditTest = { balance: 350 } 可在未登入時模擬。
 */
(function () {
  'use strict';
  if (!/macaca\.com\.tw$/.test(location.hostname)) return;
  try { if (localStorage.getItem('mcCreditOff') === '1') return; } catch (e) {}
  if (window.__mcCreditLoaded) return;
  window.__mcCreditLoaded = true;

  var VARIANT = (window.__mcCreditVariant || 'A').toUpperCase();
  var TEST = window.__mcCreditTest || null;
  var user = TEST ? { _id: 'test', credit_balance: TEST.balance } : (window.mainConfig && window.mainConfig.currentUser);
  if (!user || !user._id) return;                                   // 沒登入 → 什麼都不做
  var balance = typeof user.credit_balance === 'number' ? user.credit_balance : null;
  if (!(balance > 0)) return;                                       // 沒有購物金(或欄位不存在)→ 不顯示

  var PINK = '#eaaa96', ACCENT = '#ce715e', LINK = '/user_credits';
  function fmt(n) { return 'NT$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  // 實心剪影圖示(22×22,跟原生 icon-person / icon-nav-cart 同語彙)
  var ICONS = {
    wallet: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4 4.5A1.5 1.5 0 0 1 5.5 3h12a1 1 0 1 1 0 2H6v1h14a2 2 0 0 1 2 2v3h-5.5a3.5 3.5 0 0 0 0 7H22v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-15.5zM16.5 12.5a2 2 0 1 0 0 4h5.5v-4h-5.5z"/></svg>',
    coin: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm.9 4h-1.8v1.3c-1.7.3-2.8 1.4-2.8 2.9 0 1.6 1 2.4 3.1 3 1.6.4 2.1.8 2.1 1.5 0 .7-.6 1.2-1.6 1.2-1.1 0-1.8-.5-1.9-1.5H8.1c.1 1.8 1.3 2.9 3 3.2V19h1.8v-1.4c1.8-.3 2.9-1.4 2.9-3 0-1.7-1-2.5-3.2-3.1-1.5-.4-2-.8-2-1.4 0-.6.5-1.1 1.4-1.1 1 0 1.6.5 1.7 1.4h1.9c-.1-1.7-1.2-2.8-2.7-3.1V6z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v2.3a3.2 3.2 0 0 0 0 6.4v2.3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-2.3a3.2 3.2 0 0 0 0-6.4V6.5zm6.2 1.7h-1.4v1.6h1.4V8.2zm0 3h-1.4v1.6h1.4v-1.6zm0 3h-1.4v1.6h1.4v-1.6z"/></svg>'
  };

  function injectCSS() {
    var css =
      '.mc-credit{position:relative}' +
      '.mc-credit .mc-credit-btn{position:relative;display:inline-flex;align-items:center;cursor:pointer;background:none;border:0;padding:0;line-height:1;color:inherit;text-decoration:none}' +
      // 徽章:照原生 .Cart-count 規格
      '.mc-credit .mc-credit-badge{position:absolute;top:-6px;right:-10px;min-width:18px;height:18px;line-height:18px;padding:0 5px;border-radius:10px;background:' + PINK + ';color:#fff;font-size:11px;font-weight:400;text-align:center;box-sizing:border-box;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}' +
      // B 金額標籤:徽章同色、接在圖示右邊
      '.mc-credit .mc-credit-chip{display:inline-block;margin-left:5px;height:18px;line-height:18px;padding:0 7px;border-radius:10px;background:' + PINK + ';color:#fff;font-size:11px;white-space:nowrap;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.02em}' +
      '.mc-credit .mc-credit-badge-m{display:none}' +
      '@media (max-width:767px){.mc-credit .mc-credit-chip{display:none}.mc-credit .mc-credit-badge-m{display:block}}' +
      // C 主題色圖示
      '.mc-credit.mc-credit-c .mc-credit-btn{color:' + ACCENT + '}' +
      // 氣泡共用:白底、細框、貼合內容寬度
      '.mc-credit-pop{position:absolute;top:calc(100% + 10px);z-index:1200;background:#fff;color:#333;border:1px solid #e3e3e3;box-shadow:0 4px 14px rgba(0,0,0,.10);display:none;white-space:nowrap;font-family:"Helvetica Neue",Helvetica,"Microsoft JhengHei",sans-serif;text-align:left}' +
      '.mc-credit-pop.open{display:block}' +
      '.mc-credit-pop:before{content:"";position:absolute;top:-5px;width:8px;height:8px;background:#fff;border-left:1px solid #e3e3e3;border-top:1px solid #e3e3e3;transform:rotate(45deg)}' +
      '.mc-credit-pop.at-left{left:-4px}.mc-credit-pop.at-left:before{left:11px}' +
      '.mc-credit-pop.at-right{right:-4px}.mc-credit-pop.at-right:before{right:11px}' +
      // A 一行式小氣泡(整顆是連結)
      '.mc-credit-pop.pop-a{border-radius:20px;padding:0}' +
      '.mc-credit-pop.pop-a a{display:block;padding:7px 12px;font-size:13px;color:#333;text-decoration:none;line-height:1.3}' +
      '.mc-credit-pop.pop-a a b{font-weight:600;margin:0 2px 0 6px}' +
      '.mc-credit-pop.pop-a a span{color:' + ACCENT + ';margin-left:2px}' +
      // C 小卡(金額 + 主題色按鈕,寬度貼合)
      '.mc-credit-pop.pop-c{border-radius:6px;padding:10px 14px;text-align:center}' +
      '.mc-credit-pop.pop-c .l{font-size:11px;color:#888;letter-spacing:.05em}' +
      '.mc-credit-pop.pop-c .v{font-size:18px;font-weight:600;line-height:1.3;margin:2px 0 8px}' +
      '.mc-credit-pop.pop-c a{display:block;background:' + PINK + ';color:#fff;font-size:12px;padding:6px 12px;border-radius:3px;text-decoration:none;line-height:1.3}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }

  function build(nav) {
    if (!nav || nav.querySelector('.mc-credit')) return false;
    var userA = nav.querySelector('a[href^="/users"], a .icon-person, svg.icon-person');
    if (!userA) return false;
    var li = userA.closest('li'); if (!li) return false;
    var el = document.createElement('li');
    el.className = (li.className || 'List-item') + ' mc-credit mc-credit-' + VARIANT.toLowerCase();
    el.style.position = 'relative';
    var pop = null;
    if (VARIANT === 'B') {
      el.innerHTML = '<a class="NavigationBar-actionMenu-button nav-color mc-credit-btn" href="' + LINK + '" aria-label="購物金 ' + fmt(balance) + '">' + ICONS.coin + '<span class="mc-credit-chip">' + fmt(balance) + '</span><span class="mc-credit-badge mc-credit-badge-m">' + (balance >= 10000 ? '9999+' : Math.round(balance)) + '</span></a>';   // 手機版:徽章直接寫金額數字(跟購物袋的數字徽章同一種語言)
    } else if (VARIANT === 'C') {
      el.innerHTML = '<button type="button" class="NavigationBar-actionMenu-button nav-color mc-credit-btn" aria-label="購物金">' + ICONS.ticket + '</button>' +
        '<div class="mc-credit-pop pop-c" role="dialog"><div class="l">可用購物金</div><div class="v">' + fmt(balance) + '</div><a href="' + LINK + '">使用購物金 ›</a></div>';
    } else {
      el.innerHTML = '<button type="button" class="NavigationBar-actionMenu-button nav-color mc-credit-btn" aria-label="購物金">' + ICONS.wallet + '<span class="mc-credit-badge">$</span></button>' +
        '<div class="mc-credit-pop pop-a" role="dialog"><a href="' + LINK + '">購物金<b>' + fmt(balance) + '</b><span>›</span></a></div>';
    }
    li.parentNode.insertBefore(el, li.nextSibling);
    pop = el.querySelector('.mc-credit-pop');
    if (pop) {
      var btn = el.querySelector('.mc-credit-btn');
      btn.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var r = el.getBoundingClientRect();                        // 圖示在畫面左半邊就往右展開,右半邊就往左展開
        pop.classList.remove('at-left', 'at-right');
        pop.classList.add(r.left < window.innerWidth / 2 ? 'at-left' : 'at-right');
        pop.classList.toggle('open');
      });
      document.addEventListener('click', function (ev) { if (!el.contains(ev.target)) pop.classList.remove('open'); });
    }
    return true;
  }

  injectCSS();
  var navs = document.querySelectorAll('nav.header--desktop, nav.header--mobile');
  var done = 0;
  for (var i = 0; i < navs.length; i++) if (build(navs[i])) done++;
  if (!done) {
    var mo = new MutationObserver(function () {
      var n2 = document.querySelectorAll('nav.header--desktop, nav.header--mobile'); var ok = 0;
      for (var j = 0; j < n2.length; j++) if (build(n2[j])) ok++;
      if (ok) mo.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 8000);
  }
  try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'mc_credit_badge_shown', credit_balance: balance, variant: VARIANT }); } catch (e) {}
})();
