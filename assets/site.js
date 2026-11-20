/* MORSE project page: behaviour. Numbers come from window.MORSE (inlined from the paper by tools/build.py); the few
   that are written here carry their source in a comment. */
(function () {
  'use strict';
  var DATA = window.MORSE, D = document, root = D.documentElement;
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (id) { return D.getElementById(id); };
  function el(tag, attrs, text) { var e = D.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; }
  function h(tag, cls, text) { var e = D.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { return 1 - Math.pow(1 - x, 3); }
  var ICON = {
    play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 1.2v9.6L10.6 6z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.4 1.5h2.5v9H2.4zM7.1 1.5h2.5v9H7.1z" fill="currentColor"/></svg>'
  };
  function tween(ms, fn, done) {            // fn(0..1), eased
    if (RM) { fn(1); if (done) done(); return function () {}; }
    var t0 = performance.now(), id = 0, live = true;
    (function step(now) { if (!live) return; var p = clamp((now - t0) / ms); fn(ease(p)); if (p < 1) id = requestAnimationFrame(step); else if (done) done(); })(t0);
    return function () { live = false; cancelAnimationFrame(id); };
  }

  // ---------- theme ----------
  $('theme').addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'), next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next); try { localStorage.setItem('morse-theme', next); } catch (e) {}
  });

  // ---------- reveal on scroll; components start when their block is first seen ----------
  function onReveal(node, fn) { if (!node) return; if (node.classList.contains('in')) fn(); else node.addEventListener('reveal', fn, { once: true }); }
  (function () {
    var nodes = [].slice.call(D.querySelectorAll('[data-r]'));
    function show(n) { n.classList.add('in'); n.dispatchEvent(new CustomEvent('reveal')); }
    if (RM || !('IntersectionObserver' in window)) { setTimeout(function () { nodes.forEach(show); }, 0); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); show(e.target); } }); }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });
    nodes.forEach(function (n) { io.observe(n); });
  })();

  // ---------- numbers that count up ----------
  [].forEach.call(D.querySelectorAll('[data-count]'), function (n) {
    var to = parseFloat(n.getAttribute('data-count')), dec = +(n.getAttribute('data-dec') || 1), from = +(n.getAttribute('data-from') || 0);
    onReveal(n.closest('[data-r]'), function () { tween(1000, function (p) { n.textContent = (from + (to - from) * p).toFixed(dec); }); });
  });

  // ---------- nav island: the section in view gets the dark pill; on phones the links fold into a menu ----------
  (function () {
    var nav = $('island'), menu = $('menu'), pill = $('pill'), links = [].slice.call(D.querySelectorAll('#navlinks a')), cur = -2, busy = false;
    var secs = links.map(function (a) { return D.querySelector(a.getAttribute('href')); });
    function place() {
      var a = links[cur];
      if (!a) { pill.style.opacity = '0'; return; }
      pill.style.width = a.offsetWidth + 'px'; pill.style.transform = 'translateX(' + a.offsetLeft + 'px)'; pill.style.opacity = '1';
    }
    function upd() {
      busy = false; var c = -1;
      for (var i = 0; i < secs.length; i++) if (secs[i].getBoundingClientRect().top < 150) c = i;
      if (c !== cur) { cur = c; links.forEach(function (a, k) { a.classList.toggle('cur', k === c); }); place(); }
    }
    addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', place);
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(place);
    upd();
    function shut() { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
    menu.addEventListener('click', function () { var o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    links.forEach(function (a) { a.addEventListener('click', shut); });
  })();

  // ---------- telegraph tape: a random run of dots and dashes, drifting (built twice over, so the loop has no seam) ----------
  (function () {
    var run = $('tape'), half = D.createDocumentFragment(), n = 0;
    while (n < 150) {
      var len = 1 + Math.floor(Math.random() * 5);                                   // a "letter" of one to five marks
      for (var k = 0; k < len; k++, n++) half.append(h('i', (Math.random() < 0.56 ? 'dot' : 'dash') + (Math.random() < 0.3 ? ' f' : '')));
      half.append(h('i', Math.random() < 0.22 ? 'wd' : 'sp'));
    }
    run.append(half.cloneNode(true), half);
  })();

  // ---------- hero wall: the example streams (time-lapses and stills) between cards from the run log, drifting slowly ----------
  (function () {
    var W = DATA.wall, plane = $('plane');
    if (!W || !plane) return;
    var SRC = { arxiv: ['arXiv', 'var(--ax)'], hf: ['Hugging Face', 'var(--hf)'], github: ['GitHub', 'var(--ink)'] };
    var NAME = { epm: 'Ego4D', asi: 'YouCook2', fpd: 'Ego4D' };
    function logo(k) { var s = el('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' }); s.style.color = SRC[k][1]; s.append(el('path', { d: DATA.logos[k], fill: 'currentColor' })); return s; }
    function clock(t) { return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
    function card(cls, k, icon) { var d = h('div', 'tile c ' + cls), kk = h('div', 'k'); if (icon) kk.append(logo(icon)); kk.append(D.createTextNode(k)); d.append(kk); return d; }
    var make = {
      V: function (key) {
        var d = h('div', 'tile m'), v = D.createElement('video');
        v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'none';
        v.poster = 'assets/video/wall-' + key + '.jpg'; v.setAttribute('data-src', 'assets/video/wall-' + key + '.mp4');
        d.append(v, h('span', 'chip live', NAME[key] + ' stream')); return d;
      },
      I: function (id) { var d = h('div', 'tile m'), im = new Image(); im.src = 'assets/img/wall/' + id + '.jpg'; im.alt = ''; im.decoding = 'async'; d.append(im, h('span', 'chip', NAME[id.slice(0, 3)])); return d; },
      S: function (i) {
        var s = W.search[i], d = card('srch', SRC[s[0]][0] + (s[0] === 'arxiv' ? ' search' : s[0] === 'hf' ? ' models' : ' repo') + ' · round ' + s[1], s[0]);
        d.append(h('div', 't mono', s[2]), h('div', 'f', s[3] >= 0 ? s[3] + ' results' + (s[0] === 'hf' && s[4] ? ' · ' + s[4] : '') : 'read the code')); return d;
      },
      R: function (i) { var r = W.read[i], d = card('read', 'Paper read · round ' + r[0], 'arxiv'); d.append(h('div', 't', r[1])); return d; },
      N: function (i) { var n = W.notes[i], d = card('note', 'Step log · ' + n[1] + ' · ' + clock(n[2])); d.append(h('div', 't', n[3])); return d; },
      C: function (i) {
        var c = W.cands[i], d = card('cand', 'Round ' + c[0] + ' · new harness'), f = h('div', 'f'), b = h('b', '', 'passed');
        f.append(b, D.createTextNode(' · validation ' + c[3].toFixed(1) + '%'));
        d.append(h('div', 'n', c[1]), h('div', 't', c[2]), f); return d;
      },
      Q: function (i) { var q = W.qs[i], d = card('q', q[1] + ' · asked ' + q[2] + ' s in'); d.append(h('div', 't', q[3])); return d; }
    };
    var COLS = [
      [['V', 'epm'], ['S', 0], ['I', 'asi-1'], ['N', 0], ['C', 1], ['I', 'fpd-2'], ['R', 0], ['Q', 0]],
      [['Q', 1], ['I', 'epm-1'], ['S', 6], ['V', 'asi'], ['N', 3], ['R', 1], ['I', 'fpd-0'], ['C', 2]],
      [['I', 'asi-0'], ['R', 2], ['V', 'fpd'], ['N', 5], ['S', 1], ['I', 'epm-2'], ['S', 7], ['C', 3]]
    ];
    var vids = [];
    COLS.forEach(function (list, k) {
      var col = h('div', 'wcol' + (k === 1 ? ' rev' : '')), half = [];
      col.style.setProperty('--t', [120, 150, 135][k] + 's');
      list.forEach(function (it) { half.push(make[it[0]](it[1])); });
      half.forEach(function (n) { col.append(n); });
      half.forEach(function (n) { col.append(n.cloneNode(true)); });            // second copy, so the drift loops without a seam
      plane.append(col);
    });
    [].forEach.call(plane.querySelectorAll('video'), function (v) { v.muted = true; vids.push(v); });
    if (RM) return;
    function run(on) { vids.forEach(function (v) { if (on) { if (!v.src) v.src = v.getAttribute('data-src'); var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { run(es[0].isIntersecting && getComputedStyle(plane.parentNode).display !== 'none'); }).observe(plane.parentNode);
    else run(true);
  })();

  // ---------- films: load when near, play while in view, click to pause ----------
  var films = {};
  [].forEach.call(D.querySelectorAll('[data-film]'), function (node) {
    var v = node.querySelector('video'), btn = node.querySelector('.fp'), bar = node.querySelector('.fbar b'), want = !RM, seen = false, src = '';
    function sync() {
      if (want && seen && v.getAttribute('data-src')) {
        if (src !== v.getAttribute('data-src')) { src = v.getAttribute('data-src'); v.src = src; }
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else v.pause();
      node.classList.toggle('paused', !want); btn.innerHTML = want ? ICON.pause : ICON.play; btn.setAttribute('aria-label', want ? 'Pause' : 'Play');
    }
    node.addEventListener('click', function () { want = !want; sync(); });
    (function loop() { if (!v.paused && v.duration) bar.style.width = (100 * v.currentTime / v.duration).toFixed(2) + '%'; requestAnimationFrame(loop); })();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; sync(); }, { threshold: 0.3 }).observe(node); else seen = true;
    sync();
    if (node.id) films[node.id] = { video: v, show: function (file, poster) { v.poster = poster; v.setAttribute('data-src', file); bar.style.width = '0'; want = true; sync(); }, play: function () { want = true; sync(); } };
  });

  // ---------- trailer: jump between its parts (times written by tools/make_trailer.py) ----------
  (function () {
    var T = DATA.trailer, segs = $('segs'), v = films.trailer.video, fills = [], btns = [];
    if (!T) { segs.hidden = true; return; }
    T.scenes.forEach(function (s, i) {
      var b = h('button'), tr = h('i'), f = h('b'); b.type = 'button'; tr.append(f); b.append(tr, D.createTextNode(s[0]));
      b.addEventListener('click', function () { films.trailer.play(); var go = function () { try { v.currentTime = s[1] + 0.05; } catch (e) {} }; if (v.readyState) go(); else v.addEventListener('loadedmetadata', go, { once: true }); });
      segs.append(b); fills.push(f); btns.push(b);
    });
    (function loop() {
      var t = v.currentTime || 0;
      T.scenes.forEach(function (s, i) { var e = i + 1 < T.scenes.length ? T.scenes[i + 1][1] : T.end; fills[i].style.width = (100 * clamp((t - s[1]) / (e - s[1]))).toFixed(1) + '%'; btns[i].classList.toggle('cur', t >= s[1] && t < e); });
      requestAnimationFrame(loop);
    })();
  })();

  // ---------- 01: three examples, one film each ----------
  (function () {
    var EX = [['epm', 'EPM · EPISODIC MEMORY', 'Which tool, 400 s ago?'], ['asi', 'ASI · ACTION SEQUENCE', 'What came before the slicing?'], ['fpd', 'FPD · FUTURE PREDICTION', 'What happens next?']], tabs = $('extabs');
    function show(i) {
      [].forEach.call(tabs.children, function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      films.exfilm.show('assets/video/replay-' + EX[i][0] + '.mp4', 'assets/video/replay-' + EX[i][0] + '.jpg');
    }
    EX.forEach(function (e, i) {
      var b = h('button'), im = new Image(), sp = h('span'); b.type = 'button'; im.src = 'assets/img/ex-' + e[0] + '.jpg'; im.alt = ''; im.loading = 'lazy';
      sp.append(h('small', '', e[1]), h('b', '', e[2])); b.append(im, sp); b.addEventListener('click', function () { show(i); }); tabs.append(b);
    });
    show(0);
  })();

  // ---------- 02: one diagram, three stages (by hand / closed world / open world) ----------
  (function () {
    var svg = $('dia').querySelector('svg'), cards = [].slice.call(D.querySelectorAll('#waylist .way')), timer = 0;
    function sel(i, auto) {
      svg.setAttribute('data-stage', 'abc'.charAt(i));
      cards.forEach(function (c, k) { c.classList.toggle('on', k === i); c.classList.toggle('auto', !!auto && k === i && i < 2); c.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      clearTimeout(timer);
      if (auto && i < 2) timer = setTimeout(function () { sel(i + 1, true); }, 5000);
    }
    cards.forEach(function (c, i) { c.addEventListener('click', function () { sel(i, false); }); });
    sel(2, false);
    onReveal($('ways'), function () { if (!RM) sel(0, true); });
  })();

  // ---------- 03: the four steps take turns, on the cards and on the figure (the figure itself is untouched) ----------
  (function () {
    var marks = [].slice.call(D.querySelectorAll('#loopfig i')), cards = [].slice.call(D.querySelectorAll('#four > div')), cur = -1, seen = [false, false], hold = 0;
    function show(i) { cur = i; marks.forEach(function (m, k) { m.classList.toggle('on', k === i); }); cards.forEach(function (c, k) { c.classList.toggle('on', k === i); }); }
    cards.forEach(function (c, i) { c.addEventListener('mouseenter', function () { hold = performance.now() + 4500; show(i); }); });
    if (RM) return;
    setInterval(function () { if ((seen[0] || seen[1]) && performance.now() > hold) show((cur + 1) % 4); }, 2600);
    if ('IntersectionObserver' in window) [$('four'), $('loopfig')].forEach(function (n, k) { new IntersectionObserver(function (es) { seen[k] = es[0].isIntersecting; }, { threshold: 0.25 }).observe(n); }); else seen[0] = true;
  })();

  // ---------- 04: the run, round by round: a slider over the 25 rounds that moves on by itself when left alone ----------
  (function () {
    var R = DATA.rounds, N = R.length, UPD = {}; DATA.updates.forEach(function (u) { if (u.round) UPD[u.round] = u; });
    var svg = $('rxchart'), X0 = 56, X1 = 704, AT = 22, AB = 240, LT = 284, LB = 374, colW = (X1 - X0) / N;
    var xr = function (r) { return X0 + colW * (r - 0.5); }, xb = function (r) { return X0 + colW * r; };
    var ya = function (a) { return AB - (AB - AT) * (a - 66) / 16; }, yl = function (l) { return LB - (LB - LT) * l / 0.9; };
    svg.append(el('rect', { x: xb(0), y: AT - 12, width: xb(20) - xb(0) - 2, height: LB - AT + 24, rx: 10, fill: 'var(--violet-soft)', opacity: .45 }));
    svg.append(el('rect', { x: xb(20) + 2, y: AT - 12, width: xb(25) - xb(20) - 2, height: LB - AT + 24, rx: 10, fill: 'var(--amber-soft)', opacity: .8 }));
    var col = el('rect', { class: 'col', x: xb(0), y: AT - 12, width: colW, height: LB - AT + 24, rx: 8, fill: 'var(--ink)', opacity: .08 }); svg.append(col);
    [68, 72, 76, 80].forEach(function (a) { svg.append(el('line', { x1: X0, x2: X1, y1: ya(a), y2: ya(a), stroke: 'var(--line)' })); svg.append(el('text', { x: X0 - 8, y: ya(a) + 4, 'text-anchor': 'end' }, a + '%')); });
    [0, 0.4, 0.8].forEach(function (l) { svg.append(el('line', { x1: X0, x2: X1, y1: yl(l), y2: yl(l), stroke: 'var(--line)' })); svg.append(el('text', { x: X0 - 8, y: yl(l) + 4, 'text-anchor': 'end' }, l.toFixed(1) + ' s')); });
    svg.append(el('text', { x: xb(20) - 9, y: AB - 9, class: 'lab', 'text-anchor': 'end' }, 'Validation accuracy'));
    svg.append(el('text', { x: xb(20) - 9, y: LB - 8, class: 'lab', 'text-anchor': 'end' }, 'Estimated answer latency'));
    // the harness line steps at the candidate that was kept; candidates of a round sit side by side in its column
    var cx = function (r, j, n) { return xr(r) + (j - (n - 1) / 2) * 3.3; };
    var headA = R.map(function (r) { return r.a0; }).concat([R[N - 1].a1]), headL = R.map(function (r) { return r.l0; }).concat([R[N - 1].l1]);
    var SX = [0].concat(R.map(function (r) { var j = -1; r.c.forEach(function (c, k) { if (c[4]) j = k; }); return cx(r.r, j < 0 ? r.c.length - 1 : j, r.c.length); }));
    function stepPath(vals, y) { var d = 'M' + xb(0) + ' ' + y(vals[0]).toFixed(1); for (var i = 1; i <= N; i++) if (vals[i] !== vals[i - 1]) d += 'H' + SX[i].toFixed(1) + 'V' + y(vals[i]).toFixed(1); return d + 'H' + xb(N); }
    function lines(g) {
      g.append(el('path', { d: stepPath(headA, ya), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
      g.append(el('path', { d: stepPath(headL, yl), fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
    }
    var dim = el('g', { opacity: .22 }); lines(dim); svg.append(dim);
    var clip = el('clipPath', { id: 'rxclip' }), rev = el('rect', { x: 0, y: 0, width: 0, height: 400 }); clip.append(rev); svg.append(clip);
    var lit = el('g', { 'clip-path': 'url(#rxclip)' }); lines(lit); svg.append(lit);
    var groups = R.map(function (r) {
      var g = el('g', { class: 'rd' }), n = r.c.length, eff = r.r >= 21;
      r.c.forEach(function (c, j) {
        var x = cx(r.r, j, n), kept = c[4], pass = c[3];
        g.append(el('circle', { cx: x, cy: ya(c[1]), r: kept ? 3.4 : 2.4, fill: kept ? 'var(--surface)' : pass ? 'var(--violet)' : 'none', stroke: kept ? 'var(--violet)' : pass ? 'none' : 'var(--faint)', 'stroke-width': kept ? 2 : 1 }));
        g.append(el('circle', { cx: x, cy: yl(c[2]), r: kept ? 3.4 : 2.4, fill: kept ? 'var(--surface)' : pass && eff ? 'var(--amber)' : 'none', stroke: kept ? 'var(--amber)' : pass && eff ? 'none' : 'var(--faint)', 'stroke-width': kept ? 2 : 1 }));
      });
      svg.append(g); return g;
    });
    var nums = R.map(function (r) { var sp = h('span', (r.ok ? 'k' : '') + (r.r >= 21 ? ' e' : ''), String(r.r)); sp.style.left = (100 * (r.r - 0.5) / N) + '%'; $('rx-nums').append(sp); return sp; });

    var range = $('rx-range'), side = $('rx-side'), cur = 1, revx = 0, stopT = null;
    function stat(label, value, cls, delta, good) { var d = h('div'), b = h('b', cls, value); d.append(h('small', '', label), b); if (delta) d.append(h('em', good ? 'up' : '', delta)); return d; }
    function signed(v, dec) { return (v > 0 ? '+' : '−') + Math.abs(v).toFixed(dec); }
    function render(d) {
      var w = h('div', 'rx-anim'), top = h('div', 'rx-top'), rn = h('div', 'rx-rn', 'Round ' + d.r), eff = d.r >= 21; rn.append(h('small', '', '/ 25'));
      top.append(rn, h('span', 'rx-chip ' + (eff ? 'eff' : 'acc'), eff ? 'EFFICIENCY ROUND' : 'ACCURACY ROUND'), h('span', 'rx-chip ' + (d.ok ? 'kept' : 'none'), d.ok ? 'UPDATE KEPT' : 'NOTHING KEPT'));
      var two = h('div', 'rx-two'), da = d.a1 - d.a0, dl = d.l1 - d.l0;
      two.append(stat('ACCURACY AFTER', d.a1.toFixed(1) + '%', 'a', Math.abs(da) >= 0.05 ? signed(da, 1) : '', da > 0), stat('LATENCY AFTER', d.l1.toFixed(2) + ' s', 'l', Math.abs(dl) >= 0.005 ? signed(dl, 2) : '', dl < 0));
      w.append(top, two, h('div', 'rx-what' + (d.ok ? '' : ' no'), d.ok && UPD[d.r] ? UPD[d.r].text : 'No candidate cleared the gate, so the harness stays as it is.'));
      if (d.tool) { var t = h('div', 'rx-tool'); t.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.2 8.6l3.1 3.1 6.5-7.4"/></svg>'; t.append(D.createTextNode(d.tool)); w.append(t); }
      w.append(h('div', 'rx-h', d.c.length + ' CANDIDATES TESTED · ' + (eff ? 'CHANGE IN LATENCY' : 'CHANGE IN ACCURACY')));
      var list = h('div', 'rx-list');
      d.c.forEach(function (c) {
        var row = h('div', 'rx-c' + (c[4] ? ' k' : c[3] ? ' p' : '')), v = eff ? c[2] - d.l0 : c[1] - d.a0, zero = Math.abs(v) < (eff ? 0.005 : 0.05);
        row.append(h('i'), h('span', '', c[0] === 'merge' ? 'Merge of the candidates that passed' : c[0]), h('em', !zero && (eff ? v < 0 : v > 0) ? 'up' : '', zero ? '0' : signed(v, eff ? 2 : 1))); list.append(row);
      });
      w.append(list);
      side.textContent = ''; side.append(w);
      // what the editor read in this round, under the chart
      var rd = $('rx-reads'), box = h('div', 'rx-anim'); rd.textContent = '';
      box.append(h('div', 'rx-h', d.reads.length ? 'PAPERS READ IN ROUND ' + d.r + ' · ' + d.reads.length : 'PAPERS READ IN ROUND ' + d.r));
      d.reads.slice(0, 4).forEach(function (title) { var r = h('div', 'rx-read'); r.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + DATA.logos.arxiv + '"/></svg>'; r.append(h('span', '', title)); box.append(r); });
      if (d.reads.length > 4) { var more = h('div', 'rx-read'); more.append(h('span'), h('span', '', '+ ' + (d.reads.length - 4) + ' more')); box.append(more); }
      if (!d.reads.length) box.append(h('div', 'rx-read none', 'None: this round worked from what was already read.'));
      rd.append(box);
    }
    function pick(r) {
      cur = r; range.value = r; var from = revx, to = xb(r);
      col.setAttribute('x', xb(r - 1));
      groups.forEach(function (g, k) { g.classList.toggle('on', k === r - 1); }); nums.forEach(function (n, k) { n.classList.toggle('cur', k === r - 1); });
      if (stopT) stopT(); stopT = tween(450, function (p) { revx = from + (to - from) * p; rev.setAttribute('width', revx.toFixed(1)); });
      render(R[r - 1]);
    }
    var auto = !RM, seen = false, hold = 0, bPlay = $('rx-play');
    function btn() { bPlay.innerHTML = auto ? ICON.pause : ICON.play; bPlay.setAttribute('aria-label', auto ? 'Pause' : 'Play'); }
    range.addEventListener('input', function () { hold = performance.now() + 12000; pick(+range.value); });
    ['pointerdown', 'keydown'].forEach(function (ev) { $('rx').addEventListener(ev, function () { hold = performance.now() + 12000; }); });
    bPlay.addEventListener('click', function () { auto = !auto; hold = 0; btn(); });
    setInterval(function () { if (auto && seen && performance.now() > hold) pick(cur % N + 1); }, 3600);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.3 }).observe($('rx')); else seen = true;
    pick(1); btn();
  })();

  // ---------- 05: results explorer ----------
  (function () {
    var groups = function (t) { return t.filter(function (g) { return g.backbone; }); }, OVO = groups(DATA.ovo), STR = groups(DATA.stream);
    var BENCH = [
      { name: 'OVO-Bench', src: OVO, idx: 11, cols: ['OCR', 'ACR', 'ATR', 'STU', 'FPD', 'OJR', 'RT avg', 'EPM', 'ASI', 'HLD', 'BT avg', 'Overall'], pick: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
      { name: 'StreamingBench', src: STR, idx: 4, cols: ['Real-time', 'ACU', 'MCU', 'SQA', 'Avg'], pick: [0, 1, 2, 3, 4] },
      { name: 'StreamBench', src: STR, idx: 11, cols: ['OS', 'LM', 'SM', 'CI', 'KG', 'SF', 'Avg'], pick: [5, 6, 7, 8, 9, 10, 11] }
    ];
    var MODELS = OVO.map(function (g) { return g.backbone; }), mi = Math.max(0, MODELS.indexOf('Qwen3-VL-8B')), bi = 0;
    function tabs(host, names, cur, on) {
      names.forEach(function (n, i) {
        var b = h('button', '', n); b.type = 'button'; b.setAttribute('aria-pressed', i === cur ? 'true' : 'false');
        b.addEventListener('click', function () { [].forEach.call(host.querySelectorAll('button'), function (x, k) { x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); }); on(i); }); host.append(b);
      });
    }
    tabs($('tabs-model'), MODELS, mi, function (i) { mi = i; results(); });
    tabs($('tabs-bench'), BENCH.map(function (b) { return b.name; }), bi, function (i) { bi = i; results(); });
    function results() {
      var b = BENCH[bi], g = b.src.filter(function (x) { return x.backbone === MODELS[mi]; })[0];
      $('bars-title').textContent = b.name + ' · ' + MODELS[mi] + ' · average accuracy (%)';
      var rows = g.rows.filter(function (r) { return r.v[b.idx] != null; }).slice().sort(function (x, y) { return y.v[b.idx] - x.v[b.idx]; });
      var host = $('bars'); host.textContent = '';
      rows.forEach(function (r, k) {
        var row = h('div', 'bar' + (r.ours ? ' ours' : '') + (r.base ? ' base' : '')), t = h('div', 't'), f = h('div', 'f'), v = h('div', 'v', '0.0'); t.append(f); f.style.transitionDelay = k * 60 + 'ms';
        row.append(h('div', 'n', r.ours ? 'MORSE (ours)' : r.name), t, v); host.append(row);
        requestAnimationFrame(function () { requestAnimationFrame(function () { f.style.width = r.v[b.idx] + '%'; }); });
        tween(800 + k * 60, function (p) { v.textContent = (r.v[b.idx] * p).toFixed(1); });
      });
      var ours = rows.filter(function (r) { return r.ours; })[0], others = rows.filter(function (r) { return !r.ours && !r.base; }), gain = $('gain');
      if (ours && others.length) {
        var best = others[0], d = ours.v[b.idx] - best.v[b.idx]; gain.hidden = false;
        gain.textContent = (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(1) + ' over the next best (' + best.name + ')';
      } else gain.hidden = true;
      var tw = $('fulltable'), table = h('table'), thead = h('thead'), trh = h('tr'), tb = h('tbody'); tw.textContent = '';
      trh.append(h('th', '', 'Method'), h('th', '', 'Frames')); b.cols.forEach(function (c) { trh.append(h('th', '', c)); }); thead.append(trh);
      g.rows.forEach(function (r) {
        var tr = h('tr', r.ours ? 'ours' : r.base ? 'base' : ''); tr.append(h('td', '', r.ours ? 'MORSE (ours)' : r.name), h('td', '', r.frames));
        b.pick.forEach(function (k) { tr.append(h('td', '', r.v[k] == null ? '–' : r.v[k].toFixed(1))); }); tb.append(tr);
      });
      table.append(thead, tb); tw.append(table);
    }
    results();
    onReveal($('explorer'), function () { results(); });
  })();

  // ---------- 06: the answer race (efficiency table and Figure 4: printed total, VLM part, other-model part, in seconds) ----------
  (function () {
    var SYS = [
      { n: 'Qwen3-VL-8B', sub: 'direct, no memory', ans: [0.48, 0.477, 0], write: [0, 0, 0] },
      { n: 'OASIS', ans: [1.06, 1.03, 0.03], write: [0.76, 0.74, 0.02] },
      { n: 'MemEvo', ans: [1.80, 1.77, 0.02], write: [1.77, 1.49, 0.28] },
      { n: 'Seed harness', sub: 'starting point', ans: [0.11, 0.113, 0], write: [0.43, 0.435, 0] },
      { n: 'MORSE', sub: 'after accuracy rounds', cls: 'mid', ans: [0.82, 0.326, 0.494], write: [0.87, 0.773, 0.102] },
      { n: 'MORSE', sub: 'final harness', cls: 'ours', ans: [0.30, 0.294, 0.006], write: [1.19, 0.773, 0.415] }
    ], MAX = 2.0, mode = 'ans', raf = 0, go = $('race-go'), clock = $('clock'), host = $('lanes');
    var MODE = { ans: ['Ask a question', 'Mean seconds per answer, OVO-Bench.'], write: ['Stream 8 s of video', 'Seconds of compute per 8 s of video.'] };
    var rows = SYS.map(function (s) {
      var row = h('div', 'lane' + (s.cls ? ' ' + s.cls : '')), n = h('div', 'n', s.n), t = h('div', 't'), b = h('b'), u = h('u'), v = h('div', 'v');
      if (s.sub) n.append(h('small', '', s.sub)); t.append(b, u); row.append(n, t, v); host.append(row); return { row: row, b: b, u: u, v: v, s: s };
    });
    function draw(t) {            // t = seconds since the question; Infinity = finished
      rows.forEach(function (r) {
        var d = r.s[mode], tot = d[0], k = d[1] + d[2] > 0 ? tot / (d[1] + d[2]) : 0, vlm = d[1] * k, shown = Math.min(t, tot), a = Math.min(shown, vlm), done = t >= tot;
        r.b.style.width = (100 * a / MAX).toFixed(2) + '%'; r.u.style.width = (100 * (shown - a) / MAX).toFixed(2) + '%';
        r.v.textContent = (done ? tot : shown).toFixed(2) + ' s';
        if (done && r.row.classList.contains('run')) r.row.classList.add('done');
        r.row.classList.toggle('run', !done);
      });
      clock.textContent = (t === Infinity ? 0 : t).toFixed(2) + ' s';
    }
    function race() {
      cancelAnimationFrame(raf); rows.forEach(function (r) { r.row.classList.remove('done'); r.row.classList.add('run'); });
      if (RM) { draw(Infinity); return; }
      var t0 = performance.now(), end = Math.max.apply(null, SYS.map(function (s) { return s[mode][0]; })) + 0.12;
      (function step(now) { var t = (now - t0) / 1000; if (t >= end) { draw(Infinity); clock.textContent = 'done'; return; } draw(t); raf = requestAnimationFrame(step); })(t0);
    }
    function setMode(m) {
      mode = m; cancelAnimationFrame(raf);
      [].forEach.call($('race-mode').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-m') === m ? 'true' : 'false'); });
      go.innerHTML = ICON.play + '<span>' + MODE[m][0] + '</span>'; $('race-sub').textContent = MODE[m][1];
      rows.forEach(function (r) { r.row.classList.remove('run', 'done'); }); draw(Infinity);
    }
    [].forEach.call($('race-mode').querySelectorAll('button'), function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-m')); race(); }); });
    go.addEventListener('click', race);
    setMode('ans');
    onReveal($('race'), function () { setTimeout(race, 450); });
  })();

  // ---------- figures open large ----------
  (function () {
    var dlg = $('zoom'), big = $('zoomimg');
    [].forEach.call(D.querySelectorAll('[data-zoom]'), function (n) {
      n.addEventListener('click', function (e) { e.preventDefault(); big.src = n.getAttribute('data-zoom') || n.currentSrc || n.src; big.alt = n.alt || ''; if (dlg.showModal) dlg.showModal(); });
    });
    dlg.addEventListener('click', function () { dlg.close(); });
  })();

  // ---------- copy BibTeX ----------
  $('copy').addEventListener('click', function () {
    var b = $('copy'), text = $('bib').textContent;
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
    function select() { var r = D.createRange(); r.selectNodeContents($('bib')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, select); else select();
  });
})();
