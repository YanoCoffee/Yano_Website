/* YANO COFFEE — shared behaviour: nav, language, motion helpers, gallery, live menu facts */
(function () {
  'use strict';
  var D = document, root = D.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- language (EN / عربي) — one setting shared by every page and the order drawer ---------- */
  function initialLang() {
    var s = store('yano-lang');
    if (s === 'ar' || s === 'en') return s;
    return (navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en';
  }
  var lang = initialLang();
  var langBtn = $('.lang');
  function applyLang(l) {
    lang = l === 'ar' ? 'ar' : 'en';
    root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-en]').forEach(function (el) {
      var t = el.getAttribute(lang === 'ar' ? 'data-ar' : 'data-en');
      if (t !== null) el.textContent = t;
    });
    $$('[data-ph-en]').forEach(function (el) { el.placeholder = el.getAttribute(lang === 'ar' ? 'data-ph-ar' : 'data-ph-en') || ''; });
    $$('[data-aria-en]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute(lang === 'ar' ? 'data-aria-ar' : 'data-aria-en')); });
    if (langBtn) langBtn.textContent = lang === 'ar' ? 'EN' : 'عربي';
    var tt = D.documentElement.getAttribute(lang === 'ar' ? 'data-title-ar' : 'data-title-en');
    if (tt) D.title = tt;
    store('yano-lang', lang);
    window.dispatchEvent(new CustomEvent('yano:lang', { detail: lang }));
  }
  window.Yano = { lang: function () { return lang; }, t: function (en, ar) { return lang === 'ar' ? ar : en; }, setLang: applyLang };
  if (langBtn) langBtn.addEventListener('click', function () { applyLang(lang === 'ar' ? 'en' : 'ar'); });
  applyLang(lang);

  /* ---------- nav: solid on scroll, mobile menu ---------- */
  var nav = $('.nav');
  if (nav) {
    var keepSolid = nav.hasAttribute('data-solid');
    var onScroll = function () { nav.classList.toggle('solid', keepSolid || window.scrollY > 24); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    var burger = $('.burger', nav);
    var setOpen = function (o) { nav.classList.toggle('open', o); if (burger) burger.setAttribute('aria-expanded', o ? 'true' : 'false'); };
    if (burger) burger.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    $$('.nav-links a', nav).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  }

  /* ---------- reveal on scroll (staggered inside [data-stagger]) ---------- */
  $$('[data-stagger]').forEach(function (p) { $$('.rise', p).forEach(function (c, i) { c.style.setProperty('--i', i); }); });
  if ('IntersectionObserver' in window && !calm) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('in'); io.unobserve(e.target); } });   // also reveal anything scrolled past in one jump
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    $$('.rise').forEach(function (el) { io.observe(el); });
  } else { $$('.rise').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- parallax (transform only, rAF-throttled) ---------- */
  var par = $$('[data-parallax]');
  if (par.length && !calm) {
    var ticking = false;
    var run = function () {
      ticking = false;
      var vh = window.innerHeight;
      par.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-parallax'));
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    window.addEventListener('resize', run); run();
  }

  /* ---------- cursor spotlight on product cards ---------- */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches && !calm) {
    $$('.pcard').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ---------- animated counters ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')); if (isNaN(to)) return;
    if (calm) { el.textContent = to; return; }
    var t0 = null, dur = 1200;
    (function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var cio = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: .6 }) : null;
  function watchCounters() { $$('[data-count]').forEach(function (el) { if (cio) cio.observe(el); else el.textContent = el.getAttribute('data-count'); }); }

  watchCounters();

  /* ---------- gallery: filters + lightbox ---------- */
  var shots = $$('.shot');
  if (shots.length) {
    $$('.filters .chip').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.filters .chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        var f = b.getAttribute('data-filter');
        shots.forEach(function (p) {
          var show = f === 'all' || p.getAttribute('data-cat') === f;
          p.classList.toggle('hide', !show);
          if (show && !calm) { p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); }
        });
      });
    });
    var box = $('.lightbox'), img = $('img', box), count = $('.lb-count', box), idx = 0, list = [], lastFocus = null;
    var show = function (i) {
      idx = (i + list.length) % list.length;
      var src = list[idx].querySelector('img');
      img.src = src.currentSrc || src.src; img.alt = src.alt;
      count.textContent = (idx + 1) + ' / ' + list.length;
    };
    var openBox = function (b) {
      list = shots.filter(function (s) { return !s.classList.contains('hide'); });
      lastFocus = b; show(list.indexOf(b));
      box.classList.add('open'); box.setAttribute('aria-hidden', 'false'); $('.lb-close', box).focus();
      D.body.style.overflow = 'hidden';
    };
    var closeBox = function () {
      box.classList.remove('open'); box.setAttribute('aria-hidden', 'true'); D.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    shots.forEach(function (b) { b.addEventListener('click', function () { openBox(b); }); });
    $('.lb-close', box).addEventListener('click', closeBox);
    $('.lb-prev', box).addEventListener('click', function () { show(idx - 1); });
    $('.lb-next', box).addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
    D.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') closeBox();
      if (e.key === 'ArrowRight') show(idx + (root.dir === 'rtl' ? -1 : 1));
      if (e.key === 'ArrowLeft') show(idx + (root.dir === 'rtl' ? 1 : -1));
      if (e.key === 'Tab') { // keep focus inside the dialog
        var f = $$('button', box); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
