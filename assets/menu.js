/* Yano — menu page enhancements. Pure static: works on the markup already in menu.html (sections marked data-cat).
 * If you paste your own menu HTML, give each category <section data-cat="id" data-title-en=".." data-title-ar=".."> and this adds
 * category chips, search and smooth switching. Without those sections it does nothing, so any HTML is safe. */
(function () {
  'use strict';
  var D = document, $ = function (s, r) { return (r || D).querySelector(s); };
  var root = $('#menu-root'), chips = $('#cats-in'), qBox = $('#q'), live = $('#live');
  var secs = root ? [].slice.call(root.querySelectorAll('.sec[data-cat]')) : [];
  var cats = $('#cats'), head = $('.mhead'), search = $('.search');
  if (!secs.length) { if (cats) cats.hidden = true; if (search) search.hidden = true; return; }
  var isAr = function () { return window.Yano && window.Yano.lang() === 'ar'; };
  var TX = { all: ['All', 'الكل'], search: ['Search the menu', 'دوّر في المنيو'], none: ['Nothing matches — try another word.', 'مفيش نتيجة — جرّب كلمة تانية.'], found: ['results', 'نتيجة'] };
  var t = function (k) { return TX[k][isAr() ? 1 : 0]; };
  var filter = 'all', query = '';
  var empty = D.createElement('p'); empty.className = 'state'; empty.hidden = true; root.appendChild(empty);

  function title(s) { return s.getAttribute(isAr() ? 'data-title-ar' : 'data-title-en') || s.getAttribute('data-cat'); }
  function count(s) { return s.querySelectorAll('.item').length; }
  function buildChips() {
    chips.textContent = '';
    function chip(id, label, n) {
      var b = D.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.id = id;
      b.setAttribute('aria-pressed', filter === id ? 'true' : 'false');
      var a = D.createElement('span'); a.textContent = label; var c = D.createElement('small'); c.textContent = n; b.append(a, c); return b;
    }
    chips.appendChild(chip('all', t('all'), secs.reduce(function (n, s) { return n + count(s); }, 0)));
    secs.forEach(function (s) { chips.appendChild(chip(s.dataset.cat, title(s), count(s))); });
  }
  function apply() {
    var q = query.toLowerCase(), shown = 0;
    secs.forEach(function (s) {
      var inCat = filter === 'all' || filter === s.dataset.cat, catHit = q && (s.dataset.titleEn + ' ' + s.dataset.titleAr).toLowerCase().indexOf(q) > -1, any = 0;
      [].forEach.call(s.querySelectorAll('.item'), function (it) {
        var ok = inCat && (!q || catHit || it.textContent.toLowerCase().indexOf(q) > -1 || (it.querySelector('h3').getAttribute('data-ar') || '').indexOf(query) > -1);
        it.hidden = !ok; if (ok) any++;
      });
      var also = s.querySelector('.also'); if (also) also.hidden = !(inCat && !q);
      s.hidden = !any; shown += any;
    });
    empty.hidden = !!shown; empty.textContent = t('none');
    if (q) live.textContent = shown + ' ' + t('found');
  }
  function setFilter(id, scroll) {
    if (id === filter) return; filter = id;
    [].forEach.call(chips.querySelectorAll('.chip'), function (c) {
      var on = c.dataset.id === id; c.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) c.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
    try { history.replaceState(null, '', id === 'all' ? location.pathname : '#' + id); } catch (e) {}
    var calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (calm) apply(); else { root.classList.add('swap'); setTimeout(function () { apply(); requestAnimationFrame(function () { root.classList.remove('swap'); }); }, 160); }
    if (scroll && head) { var top = head.offsetTop + head.offsetHeight; if (scrollY > top) scrollTo({ top: top, behavior: 'smooth' }); }
  }
  chips.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) setFilter(b.dataset.id, true); });
  function fromHash() { var h = decodeURIComponent((location.hash || '').slice(1)); return secs.some(function (s) { return s.dataset.cat === h; }) ? h : 'all'; }
  addEventListener('hashchange', function () { setFilter(fromHash(), true); });
  var tm; qBox.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { query = qBox.value.trim(); apply(); }, 120); });
  function labels() { qBox.placeholder = t('search'); qBox.setAttribute('aria-label', t('search')); }
  addEventListener('yano:lang', function () { labels(); buildChips(); apply(); });
  filter = fromHash(); labels(); buildChips(); apply();
})();
