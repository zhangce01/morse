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

  // ---------- hero, upper part: rows of frames of the example streams, flowing right to left; the ones on screen (up to a cap)
  // play their stream's time-lapse. They fade out downward into the tape below ----------
  (function () {
    var flow = $('flow'), T = DATA.wt;
    if (!flow || !T) return;
    var NR = 4, PER = 12, CAP = innerWidth < 700 ? 4 : 10, n = T.length, fi = 0, runs = [];
    flow.style.setProperty('--nr', NR);
    for (var r = 0; r < NR; r++) {
      var row = h('div', 'frow'), run = h('div', 'frun'), half = [];
      for (var i = 0; i < PER; i++) {
        var t = T[(fi++ * 31 + r * 13) % n], d = h('div', 'ft'), im = new Image(), v = D.createElement('video');
        im.src = 'assets/img/wt/' + t.f + '.jpg'; im.alt = ''; im.decoding = 'async';
        v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'none';
        v.setAttribute('data-src', 'assets/video/wall-' + t.key + '.mp4'); v.setAttribute('data-p', t.p); d.append(im, v); half.push(d);
      }
      half.forEach(function (x) { run.append(x); }); half.forEach(function (x) { run.append(x.cloneNode(true)); });
      row.append(run); flow.append(row); runs.push([run, 22 + (r * 7) % 11]);          // px per second for this row
    }
    function pace() { runs.forEach(function (x) { x[0].style.setProperty('--t', (x[0].scrollWidth / 2 / x[1]).toFixed(1) + 's'); }); }
    pace(); addEventListener('load', pace);
    if (RM || !('IntersectionObserver' in window)) return;
    var seen = [], playing = [];
    function start(tile) {
      var v = tile.lastChild; v.muted = true;
      if (!v.getAttribute('src')) {
        v.addEventListener('loadedmetadata', function () { try { v.currentTime = Math.min(v.duration - 1, parseFloat(v.getAttribute('data-p')) * v.duration); } catch (e) {} }, { once: true });
        v.addEventListener('seeked', function () { v.classList.add('on'); }, { once: true });
        v.src = v.getAttribute('data-src');
      } else v.classList.add('on');
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    function sync() {
      playing = playing.filter(function (t) { if (seen.indexOf(t) >= 0) return true; var v = t.lastChild; v.pause(); v.classList.remove('on'); return false; });
      for (var i = 0; i < seen.length && playing.length < CAP; i++) { var t = seen[i], b = t.getBoundingClientRect(); if (playing.indexOf(t) < 0 && b.left > innerWidth * 0.42 && b.top < innerHeight * 0.4) { start(t); playing.push(t); } }
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var k = seen.indexOf(e.target); if (e.isIntersecting && k < 0) seen.push(e.target); else if (!e.isIntersecting && k >= 0) seen.splice(k, 1); });
      sync();
    }, { threshold: 0.6 });
    [].forEach.call(flow.querySelectorAll('.ft'), function (t) { io.observe(t); });
  })();

  // ---------- hero, lower part: a telegraph tape. Each row is real Morse code for a line of the paper's own title and
  // summary, moving left at its own pace; now and then a signal runs along a row. Under the lens (the pointer; a slow wander
  // when the page is left alone or has no pointer) the marks turn dark and the letter each group stands for appears above it ----------
  (function () {
    var cv = $('field'); if (!cv || !cv.getContext) return;
    var hero = cv.parentNode, ctx = cv.getContext('2d');
    var CODE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
    var TEXT = ['OPTIMIZING STREAMING MEMORY DESIGN VIA OPEN WORLD AUTO RESEARCH', 'DIAGNOSE RESEARCH PROPOSE VALIDATE', 'AN LLM EDITOR DIAGNOSES THE RECURRING FAILURES OF A STREAMING VIDEO HARNESS',
      'MORSE', 'READS PAPERS MODEL CARDS AND CODE AND REWRITES ITS MEMORY', 'STREAMING VIDEO MEMORY'];
    var W = 0, H = 0, U = 7, P = 31, R = 170, rows = [], amber = '#b9690f', ink = '#15112a', violet = '#5a3ec8', EX = 1.7, born = performance.now(), frame = 0, raf = 0, live = true;
    var lens = { x: -999, y: -999, tx: 0, ty: 0, held: false };

    function lay(text) {                                   // one line of text as marks; widths in units: dot 1, dash 3, gaps 1 / 3 / 7
      var marks = [], letters = [], x = 0;
      text.split(' ').forEach(function (word) {
        word.split('').forEach(function (ch) {
          var code = CODE[ch], x0 = x; if (!code) return;
          code.split('').forEach(function (m) { var w = m === '-' ? 3 : 1; marks.push([x, w, letters.length]); x += w + 1; });
          letters.push([ch, (x0 + x - 1) / 2]); x += 2;
        });
        x += 4;
      });
      return { marks: marks, letters: letters, len: x };
    }
    function size() {
      var dpr = Math.min(2, devicePixelRatio || 1), b = hero.getBoundingClientRect();
      W = Math.round(b.width); H = Math.round(b.height); U = W < 700 ? 5 : 8; P = Math.round(U * 4.6); R = Math.max(80, Math.min(150, Math.min(W, H) * 0.17));
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rows = [];
      for (var r = 0, n = Math.ceil(H / P) + 1; r < n; r++) {
        var L = lay(TEXT[(r * 5 + 2) % TEXT.length]);
        rows.push({ y: r * P + P * 0.62, m: L.marks, l: L.letters, len: L.len * U, v: RM ? 0 : 12 + ((r * 7) % 11) * 2.3, ph: ((r * 733) % 997) / 997 * L.len * U, a: [0.3, 0.46, 0.38, 0.58][r % 4],
          sig: -1, next: 1.5 + ((r * 37) % 23) * 0.6, d: 0.05 + r * 0.022 + ((r * 13) % 7) * 0.03 });
      }
      if (lens.x < -900) { idle(0); lens.x = lens.tx; lens.y = lens.ty; }
    }
    function idle(t) {
      if (W < 700) { lens.tx = W * (0.5 + 0.3 * Math.sin(t * 0.23)); lens.ty = H * (0.8 + 0.1 * Math.sin(t * 0.17 + 1.3)); }
      else { lens.tx = W * (0.7 + 0.14 * Math.sin(t * 0.21)); lens.ty = H * (0.78 + 0.1 * Math.sin(t * 0.33 + 1.3)); }
    }
    function seg(x, y, w) { ctx.moveTo(x + U / 2, y); ctx.lineTo(x + w - U / 2 + 0.01, y); }
    function draw(now) {
      var t = (now - born) / 1000, R2 = R * R, la = RM ? 1 : Math.max(0, Math.min(1, (t - 2.3) / 0.8));      // the lens waits until the tape has been keyed in
      if (frame++ % 30 === 0) { var cs = getComputedStyle(D.documentElement); amber = cs.getPropertyValue('--amber').trim() || amber; ink = cs.getPropertyValue('--ink').trim() || ink; violet = cs.getPropertyValue('--violet').trim() || violet; }
      if (!lens.held) idle(t);
      lens.x += (lens.tx - lens.x) * (RM ? 1 : 0.11); lens.y += (lens.ty - lens.y) * (RM ? 1 : 0.11);
      ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round'; ctx.lineWidth = U; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = '700 ' + Math.round(U * 1.9) + 'px "JetBrains Mono", ui-monospace, Consolas, monospace';
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r], off = ((t * row.v + row.ph) % row.len), y = row.y, dy = y - U * 0.6 - lens.y, near = Math.abs(dy) < R, hot = [];
        var front = RM ? -1 : W - (t - row.d) * 2400;                      // the tape is keyed in from the right when the page opens
        if (front > W) continue;
        if (!RM) { if (row.sig < 0 && t > row.next) row.sig = W + 200; if (row.sig >= 0) { row.sig -= 9; if (row.sig < -260) { row.sig = -1; row.next = t + 5 + ((r * 29 + frame) % 17) * 0.7; } } }
        ctx.beginPath(); ctx.strokeStyle = amber; ctx.globalAlpha = row.a;
        for (var base = -off; base < W; base += row.len) {
          for (var i = 0; i < row.m.length; i++) {
            var mk = row.m[i], x = base + mk[0] * U, w = mk[1] * U;
            if (x + w < 0 || x > W || x < front) continue;
            var k = 0, g = 0, cx = x + w / 2;
            if (near) { var dx = (cx - lens.x) / EX, d2 = dx * dx + dy * dy; if (d2 < R2) { k = Math.min(1, (1 - Math.sqrt(d2) / R) * 2.2); k = k * k * (3 - 2 * k) * la; } }
            if (row.sig >= 0) { var ds = Math.abs(cx - row.sig); if (ds < 130) g = 1 - ds / 130; }
            if (k > 0.02 || g > 0.02) hot.push(x, w, k, g); else seg(x, y, w);
          }
          if (near) for (var q = 0; q < row.l.length; q++) {
            var lt = row.l[q], lx = base + lt[1] * U, ex = (lx - lens.x) / EX, e2 = ex * ex + dy * dy;
            if (lx < front || e2 > R2 * 0.86) continue;
            var kk = Math.min(1, (1 - Math.sqrt(e2 / (R2 * 0.86))) * 2.6); hot.push(-1, lx, kk * kk * (3 - 2 * kk) * la, lt[0]);
          }
        }
        ctx.stroke();
        for (var z = 0; z < hot.length; z += 4) {
          if (hot[z] === -1) { ctx.globalAlpha = hot[z + 2]; ctx.fillStyle = ink; ctx.fillText(hot[z + 3], hot[z + 1], y - U * 1.18); continue; }
          ctx.beginPath(); ctx.strokeStyle = amber; ctx.globalAlpha = row.a; seg(hot[z], y, hot[z + 1]); ctx.stroke();
          if (hot[z + 3] > 0.02) { ctx.beginPath(); ctx.strokeStyle = violet; ctx.globalAlpha = hot[z + 3]; seg(hot[z], y, hot[z + 1]); ctx.stroke(); }      // a signal passing
          if (hot[z + 2] > 0.02) { ctx.beginPath(); ctx.strokeStyle = ink; ctx.globalAlpha = hot[z + 2]; seg(hot[z], y, hot[z + 1]); ctx.stroke(); }
        }
      }
      ctx.globalAlpha = 0.2 * la; ctx.lineWidth = 1.2; ctx.strokeStyle = ink; ctx.beginPath(); ctx.ellipse(lens.x, lens.y, R * EX, R, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    function loop(now) { raf = 0; if (!live || D.hidden) return; draw(now); raf = requestAnimationFrame(loop); }
    function wake() { if (RM) { draw(performance.now()); return; } if (!raf) raf = requestAnimationFrame(loop); }
    size(); wake();
    var rs = 0; addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(function () { size(); wake(); }, 120); });
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(wake);
    D.addEventListener('visibilitychange', wake);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { live = es[0].isIntersecting; wake(); }).observe(hero);
    hero.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var b = hero.getBoundingClientRect(); lens.held = true; lens.tx = e.clientX - b.left; lens.ty = e.clientY - b.top; if (RM) draw(performance.now()); });
    hero.addEventListener('pointerleave', function () { lens.held = false; });
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

  // ---------- 04: what the final harness holds for three questions, and what it sends to the model (click to inspect) ----------
  (function () {
    var M = DATA.mem, box = $('mx');
    if (!M || !box) return;
    var tabs = $('mx-tabs'), qbox = $('mx-q'), line = $('mx-line'), views = $('mx-views'), rules = $('mx-rules'), list = $('mx-list'), side = $('mx-side');
    var FOCUS = { epm: 1, asi: 165, fpd: 126 }, COLS = 10;               // the frame the paper's figure shows as recalled
    var ex, view = 'frames', sel = null, rule = null, at, stored, sent, recent, relMin, relMax, ruleCount;
    function clock(t) { return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
    function span(a, b) { return a === b ? a + ' s' : a + '–' + b + ' s'; }
    function pad(t) { return ('00' + t).slice(-3); }
    function thumb(t) {
      var i = at[t], rows = Math.ceil(ex.times.length / COLS), b = h('button', 'th' + (sent[t] || recent[t] ? ' sent' : '') + (sel && sel.k === 'f' && sel.t === t ? ' sel' : ''));
      b.type = 'button'; b.setAttribute('aria-label', 'Frame at ' + t + ' seconds');
      b.style.cssText = 'aspect-ratio:160/' + ex.th + ';background-image:url(assets/img/mem/' + ex.key + '-grid.jpg);background-size:' + COLS * 100 + '% ' + rows * 100 + '%;background-position:' +
        (100 * (i % COLS) / (COLS - 1)).toFixed(3) + '% ' + (rows > 1 ? 100 * Math.floor(i / COLS) / (rows - 1) : 0).toFixed(3) + '%';
      if (rule && !(sent[t] && sent[t].indexOf(rule) >= 0)) b.classList.add('dim');
      b.append(h('span', '', clock(t))); b.addEventListener('click', function () { pick({ k: 'f', t: t }); });
      return b;
    }
    function grid(times) { var g = h('div', 'mx-grid'); times.forEach(function (t) { g.append(thumb(t)); }); return g; }
    function inSpan(a, b) { return ex.times.filter(function (t) { return t >= a && t <= b; }); }

    function drawLine() {
      var T = ex.T, X = function (t) { return 16 + 968 * t / T; }, s = el('svg', { viewBox: '0 0 1000 86', role: 'img', 'aria-label': 'Timeline of the stream: stored frames, evicted frames, frames sent to the model and step-log entries.' });
      s.append(el('rect', { x: 16, y: 20, width: 968, height: 30, rx: 5, fill: 'var(--bg)' }));
      ex.dropped.forEach(function (t) { s.append(el('rect', { x: X(t) - 0.6, y: 29, width: 1.2, height: 12, fill: 'var(--faint)', opacity: 0.4 })); });
      ex.stored.forEach(function (f) { s.append(el('rect', { x: X(f[0]) - 1.4, y: 24, width: 2.8, height: 22, rx: 1, fill: 'var(--violet)' })); });
      ex.steps.forEach(function (st, i) { s.append(el('rect', { x: X(st[0]), y: 56, width: Math.max(2, X(st[1]) - X(st[0]) - 1), height: 6, rx: 2, fill: 'var(--good)', opacity: i % 2 ? 0.38 : 0.7 })); });
      ex.sent.forEach(function (f) { s.append(el('circle', { cx: X(f[0]), cy: 10, r: 4.2, fill: 'var(--amber)' })); });
      ex.recent.forEach(function (t) { s.append(el('circle', { cx: X(t), cy: 10, r: 4.2, fill: 'var(--amber)', stroke: 'var(--ink)', 'stroke-width': 1.4 })); });
      s.append(el('text', { x: 16, y: 80 }, '0 s'), el('text', { x: 984, y: 80, 'text-anchor': 'end' }, 'question at ' + T + ' s'));
      if (sel) {
        var a = sel.k === 'f' ? sel.t : sel.a, b = sel.k === 'f' ? sel.t : sel.b;
        if (b > a) s.append(el('rect', { x: X(a), y: 2, width: X(b) - X(a), height: 64, rx: 3, fill: 'var(--violet)', opacity: 0.13 }));
        s.append(el('path', { d: 'M' + X(a).toFixed(1) + ' 0V68', stroke: 'var(--ink)', 'stroke-width': 1.6 }));
      }
      s.addEventListener('click', function (e) {
        var r = s.getBoundingClientRect(), t = (((e.clientX - r.left) / r.width * 1000) - 16) / 968 * T, best = ex.times[0];
        ex.times.forEach(function (x) { if (Math.abs(x - t) < Math.abs(best - t)) best = x; });
        pick({ k: 'f', t: best });
      });
      line.replaceChildren(s);
    }

    function drawQ() {
      var l = h('div'), r = h('div', 'mx-opt');
      l.append(h('div', 'mx-lab', ex.video + ' · ' + ex.task + ' · asked ' + ex.T + ' s into the stream'), h('h3', '', ex.q),
        h('p', 'sub', 'Same frozen model. The seed harness sends ' + ex.seed.sends + '; the final harness sends ' + ex.sent.length + ' retrieved keyframes, the 4 most recent frames and its notes.'));
      r.append(h('span'), h('span'), h('span', 'hd', 'Seed harness'), h('span', 'hd', 'Final harness'));
      Object.keys(ex.opts).forEach(function (k) {
        r.append(h('b', '', k), h('span', k === ex.gold ? 'gold' : '', ex.opts[k]));
        [['seed', ''], ['morse', ' m']].forEach(function (w) {
          var p = ex[w[0]].p[k], pb = h('div', 'pb' + w[1] + (ex[w[0]].a === k ? ' pick' : '')), f = h('i'); f.style.width = (100 * p).toFixed(1) + '%';
          pb.append(f, h('span', '', (100 * p).toFixed(p >= 0.0995 ? 0 : 1) + '%')); r.append(pb);
        });
      });
      qbox.replaceChildren(l, r);
    }

    function drawViews() {
      var V = [['frames', 'Frame store', ex.stored.length], ['steps', 'Step log', ex.steps.length], ['chapters', 'Chapter notes', ex.chapters.length], ['prompt', 'Sent to the model', ex.sent.length + ex.recent.length]];
      views.replaceChildren.apply(views, V.map(function (v) {
        var b = h('button', '', v[1]); b.type = 'button'; b.append(h('small', '', v[2])); b.setAttribute('aria-pressed', view === v[0] ? 'true' : 'false');
        b.addEventListener('click', function () { view = v[0]; rule = null; drawViews(); drawList(); }); return b;
      }));
    }

    function drawList() {
      rules.replaceChildren(); var kids = [];
      if (view === 'frames') {
        rules.append(h('span', 'lbl', 'SENT BECAUSE OF'));
        Object.keys(ruleCount).forEach(function (name) {
          var b = h('button', '', name + ' · ' + ruleCount[name]); b.type = 'button'; b.setAttribute('aria-pressed', rule === name ? 'true' : 'false');
          b.addEventListener('click', function () { rule = rule === name ? null : name; drawList(); }); rules.append(b);
        });
        kids.push(grid(ex.stored.map(function (f) { return f[0]; })));
      } else if (view === 'steps' || view === 'chapters') {
        var rows = h('div', 'mx-rows'), src = view === 'steps' ? ex.steps : ex.chapters, k = view === 'steps' ? 's' : 'c';
        src.forEach(function (st, i) {
          var b = h('button', 'mx-row' + (k === 'c' ? ' ch' : '') + (sel && sel.k === k && sel.i === i ? ' sel' : '')), tm = h('time', '', span(st[0], st[1])); b.type = 'button';
          b.append(tm, h('span', '', st[2]));
          if (k === 's' && inSpan(st[0], st[1]).some(function (t) { return sent[t]; })) b.append(h('em', '', 'FRAME SENT'));
          b.addEventListener('click', function () { pick({ k: k, i: i, a: st[0], b: st[1] }); }); rows.append(b);
        });
        kids.push(rows);
      } else {
        kids.push(h('div', 'mx-sub', ex.sent.length + ' retrieved keyframes'), grid(ex.sent.map(function (f) { return f[0]; })),
          h('div', 'mx-sub', 'The ' + ex.recent.length + ' most recent frames'), grid(ex.recent), h('div', 'mx-sub', 'Notes from memory, as text'));
        ex.notes.forEach(function (n) { var d = h('div', 'mx-note'); d.append(h('b', '', n[0] + (n[1].length > 1 ? ' · ' + n[1].length : '')), h('p', '', n[1].join(' '))); kids.push(d); });
      }
      list.replaceChildren.apply(list, kids);
    }

    function drawSide() {
      var kids = [];
      if (!sel) { side.replaceChildren(h('p', '', 'Select a frame, a step-log entry or a chapter note.')); return; }
      if (sel.k === 'f') {
        var t = sel.t, im = new Image(), bd = h('div', 'badges'), st = stored[t], why = sent[t];
        im.className = 'big'; im.alt = 'Frame of the stream at ' + t + ' seconds'; im.width = 480; im.height = Math.round(480 * ex.th / 160); im.src = 'assets/img/mem/' + ex.key + '/' + pad(t) + '.jpg';
        bd.append(h('span', 'badge ' + (st ? 'k' : 'n'), st ? 'in the frame store' : 'not in the frame store'));
        bd.append(h('span', 'badge ' + (why || recent[t] ? 's' : 'n'), why || recent[t] ? 'sent to the model' : 'not sent for this question'));
        kids.push(im, h('div', 'mx-lab', 'Frame'), h('h3', '', 't = ' + t + ' s'), bd);
        if (why || recent[t]) { var w = h('div', 'sec'); w.append(h('div', 'mx-lab', 'Selected by'), h('p', 'big', (why || []).concat(recent[t] ? ['the 4 most recent frames'] : []).join(' · '))); kids.push(w); }
        if (st) {
          var rr = h('div', 'sec'), bar = h('div', 'mx-rel'), tr = h('div'), fi = h('i'); fi.style.width = (8 + 92 * (st[0] - relMin) / (relMax - relMin || 1)).toFixed(1) + '%'; tr.append(fi);
          bar.append(tr, h('span', '', st[0].toFixed(3))); rr.append(h('div', 'mx-lab', 'CLIP relevance to the question'), bar);
          if (st[1]) rr.append(h('p', '', 'Key frame of its segment, protected from eviction.'));
          kids.push(rr);
        }
        var steps = ex.steps.filter(function (s) { return s[0] <= t && t <= s[1]; });
        if (steps.length) { var sl = h('div', 'sec'); sl.append(h('div', 'mx-lab', 'Step log at this moment')); steps.slice(0, 2).forEach(function (s) { sl.append(h('p', '', span(s[0], s[1]) + ': ' + s[2])); }); kids.push(sl); }
      } else {
        var src = sel.k === 's' ? ex.steps : ex.chapters, it = src[sel.i], fr = inSpan(it[0], it[1]), ns = fr.filter(function (x) { return sent[x] || recent[x]; }).length, sec = h('div', 'sec');
        kids.push(h('div', 'mx-lab', sel.k === 's' ? 'Step-log entry · written as the stream played' : 'Chapter note · summary of a ~64-s span'), h('h3', '', span(it[0], it[1])), h('p', sel.k === 's' ? 'big' : '', it[2]));
        sec.append(h('div', 'mx-lab', fr.length ? fr.length + ' frame' + (fr.length > 1 ? 's' : '') + ' of this span in memory · ' + ns + ' sent' : 'No frame of this span is still stored'));
        if (fr.length) { var g = grid(fr.slice(0, 8)); sec.append(g); }
        kids.push(sec);
      }
      side.replaceChildren.apply(side, kids);
    }

    function pick(s) { sel = s; drawLine(); drawList(); drawSide(); }
    function load(i) {
      ex = M[i]; at = {}; stored = {}; sent = {}; recent = {}; ruleCount = {}; rule = null; view = 'frames';
      ex.times.forEach(function (t, k) { at[t] = k; });
      ex.stored.forEach(function (f) { stored[f[0]] = [f[1], f[2]]; });
      ex.sent.forEach(function (f) { sent[f[0]] = f[1]; f[1].forEach(function (n) { ruleCount[n] = (ruleCount[n] || 0) + 1; }); });
      ex.recent.forEach(function (t) { recent[t] = 1; });
      relMin = Math.min.apply(null, ex.stored.map(function (f) { return f[1]; })); relMax = Math.max.apply(null, ex.stored.map(function (f) { return f[1]; }));
      [].forEach.call(tabs.children, function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      var f = FOCUS[ex.key]; drawQ(); drawViews();
      pick({ k: 'f', t: at[f] != null ? f : ex.sent[0][0] });
    }
    M.forEach(function (e, i) {
      var b = h('button'), im = new Image(), sp = h('span'); b.type = 'button'; im.src = 'assets/img/ex-' + e.key + '.jpg'; im.alt = ''; im.loading = 'lazy';
      sp.append(h('small', '', e.code + ' · ' + e.task.toUpperCase()), h('b', '', e.q)); b.append(im, sp); b.addEventListener('click', function () { load(i); }); tabs.append(b);
    });
    load(0);
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
