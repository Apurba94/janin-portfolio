/* Portfolio of Janin A Apurba — © Janin A Apurba, CSE, AUST · Advanced ICT Officer, CNRS-UNHCR */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* theme */
  var tt = $('#themeToggle');
  if (tt) tt.addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
  });

  /* mobile menu */
  var nav = $('#nav'), mb = $('#menuBtn');
  if (mb && nav) {
    mb.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      mb.setAttribute('aria-expanded', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* header state, progress bar, back-to-top */
  var bar = $('.topbar'), prog = $('#progress'), top = $('#toTop');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.classList.toggle('scrolled', y > 10);
    if (prog) prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (top) top.classList.toggle('show', y > 800);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (top) top.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });

  /* reveal on scroll + counters */
  function countUp(el) {
    var end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = null;
    if (reduced) { el.textContent = end + suf; return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        var c = en.target.querySelector('[data-count]');
        if (c) countUp(c);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = Math.min((i % 6) * 60, 300) + 'ms';
      io.observe(el);
    });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* scrollspy */
  var links = $$('.nav a[data-nav]');
  if (links.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('active', a.dataset.nav === en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = document.getElementById(a.dataset.nav); if (s) spy.observe(s); });
  }

  /* typed roles */
  var typed = $('#typed');
  if (typed && !reduced) {
    var roles = []; try { roles = JSON.parse(typed.dataset.roles); } catch (e) { }
    var ri = 0, ci = roles[0] ? roles[0].length : 0, del = true;
    (function tick() {
      var word = roles[ri] || '';
      if (del) {
        ci--; typed.textContent = word.slice(0, ci);
        if (ci <= 0) { del = false; ri = (ri + 1) % roles.length; }
        setTimeout(tick, ci <= 0 ? 350 : 28);
      } else {
        word = roles[ri]; ci++; typed.textContent = word.slice(0, ci);
        if (ci >= word.length) { del = true; setTimeout(tick, 2100); } else setTimeout(tick, 60);
      }
    })();
  }

  /* spotlight hover on cards */
  $$('.tilt').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* filters + certificate search */
  function applyFilter(group) {
    var box = $('[data-filter-group="' + group + '"]'), items = $$('[data-items="' + group + '"] > *');
    if (!box) return;
    var act = $('.filter.active', box), f = act ? act.dataset.filter : 'all';
    var q = group === 'certs' && $('#certSearch') ? $('#certSearch').value.trim().toLowerCase() : '';
    var shown = 0;
    items.forEach(function (it) {
      var ok = (f === 'all' || it.dataset.cat === f) && (!q || (it.dataset.search || '').indexOf(q) !== -1);
      it.classList.toggle('is-hidden', !ok);
      if (ok) { shown++; it.classList.add('in'); }
    });
    if (group === 'certs' && $('#certEmpty')) $('#certEmpty').hidden = shown > 0;
  }
  $$('[data-filter-group]').forEach(function (box) {
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.filter'); if (!b) return;
      $$('.filter', box).forEach(function (x) { x.classList.toggle('active', x === b); });
      applyFilter(box.dataset.filterGroup);
    });
  });
  var cs = $('#certSearch');
  if (cs) cs.addEventListener('input', function () { applyFilter('certs'); });

  /* certificate lightbox */
  var lb = $('#lightbox'), data = [];
  try { data = JSON.parse($('#certData').textContent); } catch (e) { }
  var cur = 0, lastFocus = null;
  function visibleIdx() {
    return $$('[data-items="certs"] > .cert:not(.is-hidden)').map(function (c) { return +c.dataset.index; });
  }
  function show(i) {
    var c = data[i]; if (!c) return; cur = i;
    var img = $('#lbImg');
    if (c.img) { img.src = c.img; img.alt = 'Certificate: ' + c.t; img.parentNode.hidden = false; }
    else { img.removeAttribute('src'); img.parentNode.hidden = true; }
    $('#lbIssuer').textContent = c.i;
    $('#lbTitle').textContent = c.t;
    $('#lbMeta').textContent = [c.d, c.id ? 'Credential ID: ' + c.id : ''].filter(Boolean).join(' · ');
    $('#lbNote').textContent = c.n;
    var v = $('#lbVerify');
    if (c.u) { v.href = c.u; v.hidden = false; } else v.hidden = true;
  }
  function open(i) {
    if (!lb) return;
    lastFocus = document.activeElement;
    show(i); lb.hidden = false; document.body.style.overflow = 'hidden';
    $('[data-lb="close"]', lb).focus();
  }
  function close() {
    lb.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  function step(d) {
    var v = visibleIdx(); if (!v.length) return;
    var p = v.indexOf(cur); p = (p + d + v.length) % v.length; show(v[p]);
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) { open(+o.dataset.open); return; }
    var a = e.target.closest('[data-lb]');
    if (a) { a.dataset.lb === 'close' ? close() : step(a.dataset.lb === 'next' ? 1 : -1); return; }
    if (lb && !lb.hidden && e.target === lb) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });

  /* neural-network constellation background */
  var cv = $('#net');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), W, H, dpr, pts = [], mouse = { x: -1e4, y: -1e4 }, running = true;
    function colors() {
      var s = getComputedStyle(root);
      return [s.getPropertyValue('--c1').trim(), s.getPropertyValue('--c2').trim(), s.getPropertyValue('--c4').trim()];
    }
    var cols = colors();
    new MutationObserver(function () { cols = colors(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, (W * H) / 16000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .8, c: i % 3 });
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var light = root.dataset.theme === 'light', maxD = 140;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        var mdx = p.x - mouse.x, mdy = p.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md > 0 && md < 160) { p.x += mdx / md * .6; p.y += mdy / md * .6; }
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxD) {
            ctx.globalAlpha = (1 - d / maxD) * (light ? .28 : .35);
            ctx.strokeStyle = cols[p.c]; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        ctx.globalAlpha = light ? .55 : .85; ctx.fillStyle = cols[p.c];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) requestAnimationFrame(frame);
    }
    size();
    addEventListener('resize', function () { size(); if (!running) frame(); });
    addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      var was = running; running = !document.hidden && !reduced; if (running && !was) frame();
    });
    running = !reduced;
    frame();
  }
})();
