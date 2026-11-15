(() => {
  'use strict';
  const KEY = 'kv_privacy_choice_v1';
  const GA_ID = 'G-SS2CQNBL83';
  const ADS_ID = 'ca-pub-4846653256268972';
  const en = document.documentElement.lang === 'en';
  const copy = en ? {
    title: 'Your privacy choices', body: 'Kolayı Var uses optional analytics to understand visits and optional advertising cookies to support the site. Choose which optional technologies may run. You can change this choice at any time.',
    necessary: 'Necessary only', stats: 'Allow analytics', all: 'Allow all', settings: 'Cookie settings', close: 'Close',
    heading: 'Optional technologies', analytics: 'Analytics: anonymous site usage and page activity measurements.', ads: 'Advertising: Google AdSense cookies and ad measurement.', save: 'Save choices'
  } : {
    title: 'Gizlilik tercihin', body: 'Kolayı Var, ziyaretleri anlamak için isteğe bağlı analiz; siteyi desteklemek için isteğe bağlı reklam çerezleri kullanır. Hangi isteğe bağlı teknolojilerin çalışacağını seç. Tercihini istediğin zaman değiştirebilirsin.',
    necessary: 'Yalnızca gerekli', stats: 'Analitiğe izin ver', all: 'Tümüne izin ver', settings: 'Çerez ayarları', close: 'Kapat',
    heading: 'İsteğe bağlı teknolojiler', analytics: 'Analitik: site kullanımı ve sayfa etkinliği ölçümü.', ads: 'Reklam: Google AdSense çerezleri ve reklam ölçümü.', save: 'Tercihleri kaydet'
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', functionality_storage:'granted', security_storage:'granted'});

  const uiStyle = document.createElement('style');
  uiStyle.textContent = '.kv-consent[hidden]{display:none}.kv-consent{position:fixed;z-index:10000;inset:0;background:#0b102b88;display:grid;place-items:end center;padding:18px}.kv-consent-card{position:relative;width:min(100%,740px);padding:26px;background:#fff;color:#182033;border:1px solid #dce2ef;border-radius:20px;box-shadow:0 20px 70px #11182744;font:500 15px/1.55 system-ui,sans-serif}.kv-consent-card h2,.kv-consent-card h3{margin:0 36px 8px 0;color:#172554}.kv-consent-card p{margin:0 0 18px;color:#475569}.kv-consent-card a{color:#4f46e5;font-weight:700}.kv-actions{display:flex;flex-wrap:wrap;gap:9px}.kv-button{border:1px solid #cbd5e1;border-radius:11px;padding:11px 15px;background:#fff;color:#172554;font:700 14px system-ui,sans-serif;cursor:pointer}.kv-button:hover{border-color:#5b4dff}.kv-button.kv-primary{background:#5b4dff;color:#fff;border-color:#5b4dff}.kv-close{position:absolute;right:16px;top:14px;border:0;background:transparent;color:#475569;font-size:26px;cursor:pointer}.kv-consent-settings{display:grid;gap:12px;margin:10px 0 18px}.kv-consent-settings label{display:flex;gap:8px;align-items:flex-start;color:#334155}.kv-consent-settings input{accent-color:#5b4dff;margin-top:5px}.kv-consent-tab{position:fixed;z-index:9999;bottom:14px;left:14px;border:1px solid #cbd5e1;border-radius:999px;padding:9px 13px;background:#fff;color:#26315a;box-shadow:0 5px 18px #17203322;font:700 12px system-ui,sans-serif;cursor:pointer}@media(max-width:600px){.kv-consent{padding:8px}.kv-consent-card{padding:22px 16px;border-radius:16px}.kv-actions{display:grid}.kv-button{width:100%}}';
  document.head.appendChild(uiStyle);

  function loadAnalytics() {
    if (document.querySelector('script[data-kv-analytics]')) return;
    const s = document.createElement('script'); s.async = true; s.dataset.kvAnalytics = '1';
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(s);
    window.gtag('js', new Date()); window.gtag('config', GA_ID);
  }
  function loadAds() {
    // Google's EEA/UK/CH rules require a Google-certified CMP integrated with IAB TCF.
    // Until that CMP is active, never load AdSense from this custom preference panel.
    if (typeof window.__tcfapi !== 'function') return;
    if (document.querySelector('script[data-kv-ads]')) return;
    const s = document.createElement('script'); s.async = true; s.dataset.kvAds = '1';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADS_ID;
    s.crossOrigin = 'anonymous'; document.head.appendChild(s);
  }
  function apply(choice) {
    window.gtag('consent', 'update', {
      analytics_storage: choice.analytics ? 'granted' : 'denied',
      ad_storage: choice.ads ? 'granted' : 'denied',
      ad_user_data: choice.ads ? 'granted' : 'denied',
      ad_personalization: choice.ads ? 'granted' : 'denied'
    });
    if (choice.analytics) loadAnalytics();
    if (choice.ads) loadAds();
  }
  window.kvTrack = (name, params = {}) => {
    let choice; try { choice = JSON.parse(localStorage.getItem(KEY)); } catch (_) {}
    if (choice && choice.analytics) window.gtag('event', name, params);
  };

  function openPanel(saved) {
    let wrap = document.getElementById('kv-consent');
    if (!wrap) {
      wrap = document.createElement('section'); wrap.id = 'kv-consent'; wrap.className = 'kv-consent';
      wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'kv-consent-title');
      document.body.appendChild(wrap);
    }
    const panel = saved ? `<div class="kv-consent-settings"><h3>${copy.heading}</h3><label><input id="kv-analytics" type="checkbox"> ${copy.analytics}</label><label><input id="kv-ads" type="checkbox"> ${copy.ads}</label><button class="kv-button kv-primary" id="kv-save">${copy.save}</button></div>` : '';
    wrap.innerHTML = `<div class="kv-consent-card"><button class="kv-close" id="kv-close" aria-label="${copy.close}">×</button><h2 id="kv-consent-title">${copy.title}</h2><p>${copy.body} <a href="${en?'/en/privacy-policy/':'/gizlilik-politikasi/'}">${en?'Privacy policy':'Gizlilik Politikası'}</a></p>${panel}<div class="kv-actions">${saved?'':`<button class="kv-button" id="kv-necessary">${copy.necessary}</button><button class="kv-button" id="kv-stats">${copy.stats}</button><button class="kv-button kv-primary" id="kv-all">${copy.all}</button>`}</div></div>`;
    wrap.hidden = false;
    if (saved) {
      let current = {}; try { current = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {}
      wrap.querySelector('#kv-analytics').checked = !!current.analytics; wrap.querySelector('#kv-ads').checked = !!current.ads;
      wrap.querySelector('#kv-save').onclick = () => save({analytics:wrap.querySelector('#kv-analytics').checked,ads:wrap.querySelector('#kv-ads').checked});
    } else {
      wrap.querySelector('#kv-necessary').onclick = () => save({analytics:false,ads:false});
      wrap.querySelector('#kv-stats').onclick = () => save({analytics:true,ads:false});
      wrap.querySelector('#kv-all').onclick = () => save({analytics:true,ads:true});
    }
    wrap.querySelector('#kv-close').onclick = () => { wrap.hidden = true; };
  }
  function save(choice) { try { localStorage.setItem(KEY, JSON.stringify({...choice, savedAt:new Date().toISOString()})); } catch (_) {} apply(choice); openTab(); document.getElementById('kv-consent').hidden = true; }
  function openTab() {
    let tab = document.getElementById('kv-consent-tab'); if (!tab) { tab = document.createElement('button'); tab.id = 'kv-consent-tab'; tab.className = 'kv-consent-tab'; tab.textContent = copy.settings; tab.onclick = () => openPanel(true); document.body.appendChild(tab); }
  }
  let saved; try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (_) {}
  if (saved) { apply(saved); openTab(); } else { openPanel(false); }
})();
