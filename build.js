#!/usr/bin/env node
/*
 * Portfolio of Janin A Apurba — static site builder.
 * Zero dependencies: reads data/profile.json and writes the finished website to site/.
 * © Janin A Apurba, CSE, AUST · Advanced ICT Officer, CNRS-UNHCR
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'site');
const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'profile.json'), 'utf8'));
const BASE = (P.siteUrl || '').replace(/\/$/, '');
const YEAR = new Date().getFullYear();
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/* ---------- helpers ---------- */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d) {
  if (!d) return '';
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(d);
  if (!m) return d;
  return (m[3] ? +m[3] + ' ' : '') + MONTHS[+m[2] - 1] + ' ' + m[1];
}
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ext = (url) => url ? ' target="_blank" rel="noopener"' : '';

function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}

/* JPEG width/height (read from the SOF marker) so the browser can reserve space for each image. */
function jpegSize(file) {
  try {
    const b = fs.readFileSync(file);
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xC0 && marker <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(marker)) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  } catch (e) { /* missing image */ }
  return null;
}

/* ---------- icons ---------- */
const I = {
  mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M6.6 3.5 9 3l1.6 4-2 1.3a11 11 0 0 0 5.1 5.1l1.3-2 4 1.6-.5 2.4A2 2 0 0 1 16.5 17 13.5 13.5 0 0 1 4 4.5a2 2 0 0 1 2.6-1Z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  ext: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v6H4V6h6"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 7h7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n] || ''}</svg>`;

/* Platform badges: neutral monograms in each platform's colour (no trademark artwork). */
const BADGE = {
  orcid: ['iD', '#A6CE39'], scholar: ['GS', '#4285F4'], researchgate: ['RG', '#00CCBB'], academia: ['A', '#41454A'],
  semantic: ['S2', '#1857B6'], scopus: ['Sc', '#E9711C'], wos: ['WoS', '#5E33BF'], dblp: ['db', '#004F9F'], arxiv: ['aX', '#B31B1B'],
  github: ['GH', '#24292F'], linkedin: ['in', '#0A66C2'], kaggle: ['K', '#20BEFF'], huggingface: ['HF', '#FFB000'], medium: ['M', '#111111'],
  youtube: ['YT', '#FF0000'], facebook: ['f', '#1877F2'], x: ['X', '#111111'], stopstalk: ['SS', '#E14C4C'],
  codeforces: ['CF', '#1F8ACB'], codechef: ['CC', '#5B4638'], hackerrank: ['HR', '#00EA64'], leetcode: ['LC', '#FFA116'],
  atcoder: ['AC', '#222222'], uva: ['UVa', '#2E6DB4'], toph: ['T', '#0F9D58']
};
function badge(key) {
  const [t, c] = BADGE[key] || [String(key).slice(0, 2).toUpperCase(), '#6b7280'];
  return `<span class="badge" style="--b:${c}">${esc(t)}</span>`;
}

/* ---------- shared layout ---------- */
const NAV = [
  ['about', 'About'], ['research', 'Research'], ['education', 'Education'], ['experience', 'Experience'],
  ['teaching', 'Teaching'], ['projects', 'Projects'], ['certificates', 'Certificates'], ['profiles', 'Profiles'], ['contact', 'Contact']
];
const credit = `© ${YEAR} ${esc(P.name)}, ${esc(P.credentials)} · ${esc(P.currentRole)}, ${esc(P.currentOrg)}. All rights reserved.`;

function head({ title, description, canonical, extra = '' }) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(P.name)}">
<meta name="copyright" content="${esc(P.name)}, ${esc(P.credentials)}">
<meta name="theme-color" content="#070b1a">
<link rel="canonical" href="${esc(BASE + canonical)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(BASE + canonical)}">
<meta property="og:image" content="${esc(BASE + '/' + P.photo)}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v=${BUILD_DATE}">
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}</script>
${extra}
</head>`;
}

function header(active) {
  const links = NAV.map(([id, label]) =>
    `<a href="${active === 'home' ? '' : '/'}#${id}" data-nav="${id}">${label}</a>`).join('');
  return `<header class="topbar" id="top">
  <div class="topbar-inner">
    <a class="brand" href="/" aria-label="${esc(P.name)} — home">
      <span class="brand-mark">JA</span><span class="brand-text">${esc(P.name)}</span>
    </a>
    <nav class="nav" id="nav" aria-label="Main">${links}</nav>
    <div class="top-actions">
      <a class="btn btn-sm btn-ghost" href="/cv.html">${icon('doc')}<span>CV</span></a>
      <button class="icon-btn" id="themeToggle" aria-label="Toggle light / dark theme">${icon('sun', 'i-sun')}${icon('moon', 'i-moon')}</button>
      <button class="icon-btn menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="nav">${icon('menu')}</button>
    </div>
  </div>
</header>`;
}

function footer() {
  return `<footer class="footer">
  <div class="wrap footer-inner">
    <div>
      <div class="brand"><span class="brand-mark">JA</span><span class="brand-text">${esc(P.name)}</span></div>
      <p class="muted small">${esc(P.degree)} · ${esc(P.currentRole)}, ${esc(P.currentOrg)}</p>
    </div>
    <div class="footer-links">
      <a href="/#about">About</a><a href="/#research">Research</a><a href="/#certificates">Certificates</a>
      <a href="/cv.html">Academic CV</a><a href="https://ai-lecture-hall.vercel.app" target="_blank" rel="noopener">AI Lecture Hall</a>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p>${credit}</p>
    <p class="muted small">All credits and copyrights by ${esc(P.name)}, ${esc(P.credentials)}. Last updated ${fmtDate(BUILD_DATE)}.</p>
  </div>
</footer>`;
}

const bg = `<div class="bg" aria-hidden="true">
  <div class="aurora a1"></div><div class="aurora a2"></div><div class="aurora a3"></div>
  <div class="grid-lines"></div>
  <canvas id="net"></canvas>
</div>`;

/* ---------- home page sections ---------- */
function sectionHead(id, kicker, title, lead = '') {
  return `<div class="sec-head reveal">
    <span class="kicker">${kicker}</span>
    <h2>${title}</h2>
    ${lead ? `<p class="lead">${lead}</p>` : ''}
  </div>`;
}

function hero() {
  const roles = esc(JSON.stringify(P.typedRoles || []));
  const orbit = ['Computer Vision', 'Deep Learning', 'YOLO', 'Algorithms'];
  return `<section class="hero" id="home">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="pill pulse"><span class="dot"></span>${esc(P.openTo)}</p>
      <h1><span class="hello">Hello, I am</span><span class="name grad-text">${esc(P.name)}</span></h1>
      <p class="typed" aria-live="polite"><span id="typed" data-roles="${roles}">${esc((P.typedRoles || [''])[0])}</span><span class="caret"></span></p>
      <p class="hero-sub">${esc(P.tagline)}</p>
      <div class="hero-meta">
        <span>${icon('cap')} ${esc(P.degree)}</span>
        <span>${icon('brief')} ${esc(P.currentRole)}, ${esc(P.currentOrg)}</span>
        <span>${icon('pin')} ${esc(P.location)}</span>
      </div>
      <div class="cta">
        <a class="btn btn-primary" href="#research">${icon('spark')} Explore my research</a>
        <a class="btn btn-ghost" href="/cv.html">${icon('doc')} Academic CV</a>
        <a class="btn btn-ghost" href="#contact">${icon('mail')} Contact</a>
      </div>
    </div>
    <div class="hero-visual">
      <div class="portrait">
        <div class="ring"></div><div class="ring r2"></div>
        <img src="/${esc(P.photo)}" width="618" height="734" alt="Portrait of ${esc(P.name)}">
        ${orbit.map((o, i) => `<span class="orbit o${i + 1}">${esc(o)}</span>`).join('')}
      </div>
    </div>
  </div>
  <div class="wrap stats">
    ${(P.stats || []).map(s => `<div class="stat reveal"><b data-count="${s.value}" data-suffix="${esc(s.suffix)}">${s.value}${esc(s.suffix)}</b><span>${esc(s.label)}</span></div>`).join('')}
  </div>
  <a class="scroll-cue" href="#about" aria-label="Scroll to About"><span></span></a>
</section>`;
}

function about() {
  return `<section class="section" id="about">
  <div class="wrap">
    ${sectionHead('about', '01 · About', 'A problem-solver on the path to research')}
    <div class="about-grid">
      <div class="glass about-text reveal">
        ${P.summary.map(p => `<p>${esc(p)}</p>`).join('')}
      </div>
      <aside class="glass statement reveal">
        <span class="kicker small">Research statement</span>
        <p>${esc(P.researchStatement)}</p>
        <a class="link-arrow" href="#research">See research work ${icon('arrow')}</a>
      </aside>
    </div>
    <h3 class="sub-title reveal">Fields of interest</h3>
    <div class="interest-grid">
      ${P.interests.map(it => `<article class="interest tilt reveal"><span class="emoji" aria-hidden="true">${it.icon}</span><h4>${esc(it.title)}</h4><p>${esc(it.text)}</p></article>`).join('')}
    </div>
  </div>
</section>`;
}

function research() {
  return `<section class="section" id="research">
  <div class="wrap">
    ${sectionHead('research', '02 · Research', 'Research &amp; publications',
      'Computer vision for safety and human understanding — with a focus on real-world conditions in Bangladesh.')}
    <div class="research-list">
      ${P.research.map((r, i) => `<article class="paper glass reveal">
        <div class="paper-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="paper-body">
          <div class="paper-meta"><span class="tag">${esc(r.type)}</span><span class="status">${esc(r.status)}</span>${r.year ? `<span class="muted">${esc(r.year)}</span>` : ''}</div>
          <h3>${esc(r.title)}</h3>
          <p class="muted">${esc(r.description)}</p>
          <div class="chips">${(r.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
          ${(r.links || []).length ? `<div class="paper-links">${r.links.map(l => `<a class="btn btn-sm btn-ghost" href="${esc(l.url)}" target="_blank" rel="noopener">${icon('ext')} ${esc(l.label)}</a>`).join('')}</div>` : ''}
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>`;
}

function timeline(items, kind) {
  return `<ol class="timeline">${items.map(e => {
    const title = kind === 'edu' ? e.degree : e.role;
    const org = kind === 'edu' ? e.institution : e.org;
    const list = kind === 'edu' ? e.details : e.points;
    return `<li class="tl-item reveal${e.current ? ' current' : ''}">
      <span class="tl-dot"></span>
      <div class="glass tl-card">
        <div class="tl-top"><h3>${esc(title)}</h3>${e.period ? `<span class="period">${esc(e.period)}</span>` : ''}</div>
        <p class="org">${esc(org)}${e.location ? ` · <span class="muted">${esc(e.location)}</span>` : ''}</p>
        ${list && list.length ? `<ul class="ticks">${list.map(x => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul>` : ''}
      </div>
    </li>`;
  }).join('')}</ol>`;
}

function eduExp() {
  return `<section class="section" id="education">
  <div class="wrap two-col">
    <div>
      ${sectionHead('education', '03 · Education', 'Education')}
      ${timeline(P.education, 'edu')}
    </div>
    <div id="experience" class="anchor-offset">
      ${sectionHead('experience', '04 · Experience', 'Experience')}
      ${timeline(P.experience, 'exp')}
    </div>
  </div>
</section>`;
}

function teaching() {
  const [main, ...rest] = P.teaching;
  return `<section class="section" id="teaching">
  <div class="wrap">
    ${sectionHead('teaching', '05 · Teaching', 'Teaching &amp; outreach', 'Explaining ideas clearly is how I test that I truly understand them.')}
    <article class="feature reveal">
      <div class="feature-art" aria-hidden="true">
        <svg viewBox="0 0 400 260"><defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
        ${Array.from({ length: 4 }, (_, l) => Array.from({ length: [3, 5, 5, 2][l] }, (_, n) => {
          const cx = 60 + l * 95, cy = 130 + (n - ([3, 5, 5, 2][l] - 1) / 2) * 44;
          return `<circle cx="${cx}" cy="${cy}" r="9" fill="url(#fg)"/>`;
        }).join('')).join('')}
        ${(() => { let s = ''; const L = [3, 5, 5, 2]; for (let l = 0; l < 3; l++) for (let a = 0; a < L[l]; a++) for (let b = 0; b < L[l + 1]; b++) { const y1 = 130 + (a - (L[l] - 1) / 2) * 44, y2 = 130 + (b - (L[l + 1] - 1) / 2) * 44; s += `<line x1="${60 + l * 95}" y1="${y1}" x2="${155 + l * 95}" y2="${y2}" stroke="url(#fg)" stroke-opacity=".35"/>`; } return s; })()}
        </svg>
      </div>
      <div class="feature-body">
        <span class="kicker small">Free online curriculum</span>
        <h3>${esc(main.title)}</h3>
        <p>${esc(main.description)}</p>
        <div class="chips">${main.highlights.map(h => `<span class="chip">${esc(h)}</span>`).join('')}</div>
        ${main.url ? `<a class="btn btn-primary" href="${esc(main.url)}" target="_blank" rel="noopener">${icon('book')} Visit the Lecture Hall</a>` : ''}
      </div>
    </article>
    ${rest.length ? `<div class="mini-grid">${rest.map(t => `<article class="glass mini reveal"><h4>${esc(t.title)}</h4><p class="muted">${esc(t.description)}</p>${t.url ? `<a class="link-arrow" href="${esc(t.url)}" target="_blank" rel="noopener">Open ${icon('arrow')}</a>` : ''}</article>`).join('')}</div>` : ''}
  </div>
</section>`;
}

function skills() {
  return `<section class="section" id="skills">
  <div class="wrap">
    ${sectionHead('skills', '06 · Skills', 'Technical toolkit')}
    <div class="skill-grid">
      ${P.skills.map(g => `<article class="glass skill reveal">
        <div class="skill-top"><h3>${esc(g.group)}</h3><span class="level ${g.level === 'Proficient' ? 'pro' : ''}">${esc(g.level)}</span></div>
        <div class="chips">${g.items.map(s => `<span class="chip chip-lg">${esc(s)}</span>`).join('')}</div>
      </article>`).join('')}
    </div>
  </div>
</section>`;
}

function projects() {
  const cats = [...new Set(P.projects.map(p => p.category))];
  return `<section class="section" id="projects">
  <div class="wrap">
    ${sectionHead('projects', '07 · Projects', 'Selected projects', 'Software I have designed and built — from desktop and mobile apps to databases, games and the web.')}
    <div class="filters reveal" data-filter-group="projects" role="tablist">
      <button class="filter active" data-filter="all">All <em>${P.projects.length}</em></button>
      ${cats.map(c => `<button class="filter" data-filter="${slug(c)}">${esc(c)} <em>${P.projects.filter(p => p.category === c).length}</em></button>`).join('')}
    </div>
    <div class="project-grid" data-items="projects">
      ${P.projects.map((p, i) => `<article class="project glass tilt reveal" data-cat="${slug(p.category)}">
        <div class="project-top"><span class="proj-no">${String(i + 1).padStart(2, '0')}</span><span class="tag">${esc(p.category)}</span></div>
        <h3>${esc(p.title)}</h3>
        <p class="muted">${esc(p.description)}</p>
        <div class="chips">${p.tech.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
        <div class="project-links">
          ${p.code ? `<a href="${esc(p.code)}" target="_blank" rel="noopener">${icon('github')} Code</a>` : ''}
          ${p.live ? `<a href="${esc(p.live)}" target="_blank" rel="noopener">${icon('ext')} Live</a>` : ''}
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>`;
}

function certCard(c, i) {
  const size = c.image ? jpegSize(path.join(ROOT, 'public', 'images', 'certificates', 'thumbs', c.image)) : null;
  const media = c.image
    ? `<img loading="lazy" src="/images/certificates/thumbs/${esc(c.image)}" ${size ? `width="${size.w}" height="${size.h}"` : ''} alt="Certificate: ${esc(c.title)} — ${esc(c.issuer)}">`
    : `<div class="cert-placeholder"><span>${icon('star')}</span><b>${esc(c.issuer.split('(')[0].trim())}</b><small>Verified online</small></div>`;
  return `<article class="cert reveal" data-cat="${slug(c.topic)}" data-search="${esc((c.title + ' ' + c.issuer + ' ' + c.topic + ' ' + (c.id || '')).toLowerCase())}" data-index="${i}">
    <button class="cert-media" data-open="${i}" aria-label="View certificate: ${esc(c.title)}">${media}${c.featured ? '<span class="ribbon">Featured</span>' : ''}</button>
    <div class="cert-body">
      <span class="cert-issuer">${esc(c.issuer)}</span>
      <h3>${esc(c.title)}</h3>
      <div class="cert-meta">${c.date ? `<span>${fmtDate(c.date)}</span>` : ''}${c.id ? `<code>${esc(c.id)}</code>` : ''}</div>
      ${c.url ? `<a class="verify" href="${esc(c.url)}" target="_blank" rel="noopener">${icon('check')} Verify credential</a>` : ''}
    </div>
  </article>`;
}

function certificates() {
  const C = P.certificates;
  const topics = [...new Set(C.map(c => c.topic))];
  const issuers = [...new Set(C.map(c => c.issuer.replace(/\s*\(.*\)$/, '').replace(/^.*\bCoursera\b.*$/, 'Coursera')))];
  const data = C.map(c => ({ t: c.title, i: c.issuer, d: fmtDate(c.date), id: c.id || '', u: c.url || '', img: c.image ? '/images/certificates/full/' + c.image : '', n: c.note || '' }));
  const coursera = C.filter(c => /Coursera/.test(c.issuer)).length;
  return `<section class="section" id="certificates">
  <div class="wrap">
    ${sectionHead('certificates', '08 · Certificates', 'Licenses, certifications &amp; ECA',
      `${C.length} verified credentials in machine learning, deep learning, algorithms, mathematics and data science — from Stanford, UC San Diego, University of Illinois, University of Michigan, DeepLearning.AI, IBM, 365 Data Science and more.`)}
    <div class="cert-summary reveal">
      <div><b>${C.length}</b><span>Credentials</span></div>
      <div><b>${coursera}</b><span>University courses (Coursera)</span></div>
      <div><b>${C.filter(c => c.topic === 'Machine Learning' || c.topic === 'Deep Learning').length}</b><span>ML &amp; Deep Learning</span></div>
      <div><b>${issuers.length}</b><span>Issuing organisations</span></div>
    </div>
    <div class="cert-tools reveal">
      <div class="filters" data-filter-group="certs">
        <button class="filter active" data-filter="all">All <em>${C.length}</em></button>
        ${topics.map(t => `<button class="filter" data-filter="${slug(t)}">${esc(t)} <em>${C.filter(c => c.topic === t).length}</em></button>`).join('')}
      </div>
      <label class="search">${icon('search')}<input id="certSearch" type="search" placeholder="Search certificates, issuers or IDs…" aria-label="Search certificates"></label>
    </div>
    <div class="cert-grid" data-items="certs">
      ${C.map(certCard).join('')}
    </div>
    <p class="empty" id="certEmpty" hidden>No certificates match your search.</p>
    ${P.certificatesDriveLink ? `<p class="center reveal"><a class="btn btn-ghost" href="${esc(P.certificatesDriveLink)}" target="_blank" rel="noopener">${icon('ext')} Open the complete ECA certificate collection</a></p>` : ''}
  </div>
  <script type="application/json" id="certData">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</section>`;
}

function awards() {
  return `<section class="section" id="awards">
  <div class="wrap">
    ${sectionHead('awards', '09 · Honours', 'Honours &amp; awards')}
    <div class="award-grid">
      ${P.awards.map(a => `<article class="award glass reveal"><span class="trophy">${icon('star')}</span><div><h3>${esc(a.title)}</h3>${a.year ? `<span class="period">${esc(a.year)}</span>` : ''}<p class="muted">${esc(a.text)}</p></div></article>`).join('')}
    </div>
  </div>
</section>`;
}

function news() {
  if (!P.news || !P.news.length) return '';
  return `<section class="section" id="news">
  <div class="wrap">
    ${sectionHead('news', '10 · Updates', 'Latest news')}
    <ul class="news glass reveal">
      ${P.news.map(n => `<li><span class="news-date">${n.date ? fmtDate(n.date) : 'Ongoing'}</span><p>${esc(n.text)}${n.url ? ` <a href="${esc(n.url)}" target="_blank" rel="noopener">${icon('ext')}</a>` : ''}</p></li>`).join('')}
    </ul>
  </div>
</section>`;
}

function profiles() {
  const group = (title, desc, list) => `<div class="prof-group reveal">
    <h3>${title}</h3><p class="muted small">${desc}</p>
    <div class="prof-grid">${list.map(p => `<a class="prof" href="${esc(p.url)}" target="_blank" rel="noopener">${badge(p.icon)}<span>${esc(p.name)}</span>${icon('ext', 'prof-ext')}</a>`).join('')}</div>
  </div>`;
  const pr = P.profiles;
  return `<section class="section" id="profiles">
  <div class="wrap">
    ${sectionHead('profiles', '11 · Profiles', 'Academic &amp; professional profiles', 'Find my work, code and problem-solving record across the research and developer ecosystem.')}
    <div class="prof-wrap">
      ${group('Research identity', 'ORCID, citation indexes and research networks', pr.research)}
      ${group('Professional', 'Code, datasets, models and writing', pr.professional)}
      ${group('Competitive programming', '10+ years of contests and problem solving', pr.coding)}
    </div>
  </div>
</section>`;
}

function references() {
  return `<section class="section" id="references">
  <div class="wrap">
    ${sectionHead('references', '12 · References', 'Academic references', 'Faculty of the Department of Computer Science &amp; Engineering, AUST. Phone numbers are available on request.')}
    <div class="ref-grid">
      ${P.references.map(r => `<article class="ref glass reveal">
        <div class="ref-avatar">${esc(r.name.replace(/^(Dr|Mr|Ms|Mrs)\.?\s*/i, '').replace(/^Md\.?\s*/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join(''))}</div>
        <h3>${esc(r.name)}</h3>
        <p class="ref-title">${esc(r.title)}</p>
        <p class="muted small">${esc(r.dept)}</p>
        ${r.email ? `<a class="ref-mail" href="mailto:${esc(r.email)}">${icon('mail')} ${esc(r.email)}</a>` : ''}
      </article>`).join('')}
    </div>
  </div>
</section>`;
}

function contact() {
  return `<section class="section" id="contact">
  <div class="wrap">
    <div class="contact glass reveal">
      <div>
        <span class="kicker">13 · Contact</span>
        <h2>Let’s build something meaningful together</h2>
        <p class="lead">I am actively looking for a <b>fully funded PhD position</b> or research assistantship in AI, computer vision and machine learning. If my work fits your lab, I would be glad to hear from you.</p>
        <div class="cta">
          <a class="btn btn-primary" href="mailto:${esc(P.email)}?subject=${encodeURIComponent('PhD / research opportunity')}">${icon('mail')} Email me</a>
          <a class="btn btn-ghost" href="/cv.html">${icon('doc')} View academic CV</a>
        </div>
      </div>
      <ul class="contact-list">
        <li><span>${icon('mail')}</span><div><small>Email</small><a href="mailto:${esc(P.email)}">${esc(P.email)}</a></div></li>
        <li><span>${icon('phone')}</span><div><small>Phone / WhatsApp</small><a href="tel:${esc(P.phone.replace(/\s/g, ''))}">${esc(P.phone)}</a></div></li>
        <li><span>${icon('pin')}</span><div><small>Location</small>${esc(P.location)}</div></li>
        <li><span>${icon('github')}</span><div><small>GitHub</small><a href="https://github.com/Apurba94" target="_blank" rel="noopener">github.com/Apurba94</a></div></li>
      </ul>
    </div>
  </div>
</section>`;
}

const lightbox = `<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Certificate viewer" hidden>
  <button class="lb-close icon-btn" data-lb="close" aria-label="Close">${icon('close')}</button>
  <button class="lb-nav lb-prev icon-btn" data-lb="prev" aria-label="Previous certificate">${icon('left')}</button>
  <figure class="lb-figure">
    <div class="lb-img"><img id="lbImg" alt=""></div>
    <figcaption>
      <span id="lbIssuer" class="cert-issuer"></span>
      <h3 id="lbTitle"></h3>
      <p id="lbMeta" class="muted small"></p>
      <p id="lbNote" class="small"></p>
      <a id="lbVerify" class="btn btn-sm btn-primary" target="_blank" rel="noopener">${icon('check')} Verify credential</a>
    </figcaption>
  </figure>
  <button class="lb-nav lb-next icon-btn" data-lb="next" aria-label="Next certificate">${icon('right')}</button>
</div>`;

function jsonLd() {
  const same = [...P.profiles.research, ...P.profiles.professional, ...P.profiles.coding]
    .map(p => p.url).filter(u => !/^https?:\/\/[^/]+\/?$/.test(u));
  const ld = {
    '@context': 'https://schema.org', '@type': 'Person', name: P.name, url: BASE + '/', image: BASE + '/' + P.photo,
    email: 'mailto:' + P.email, jobTitle: P.currentRole, worksFor: { '@type': 'Organization', name: P.currentOrg },
    alumniOf: P.education.map(e => ({ '@type': 'EducationalOrganization', name: e.institution })),
    knowsAbout: P.interests.map(i => i.title), address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' },
    sameAs: same
  };
  return `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
}

function homePage() {
  return head({
    title: `${P.name} — AI & Computer Vision | Portfolio`,
    description: `${P.name}: ${P.degree}. ${P.currentRole} at ${P.currentOrg}. Research in computer vision and deep learning, ${P.certificates.length} certifications, 10+ years of competitive programming. Seeking a funded PhD in AI.`,
    canonical: '/', extra: jsonLd()
  }) + `
<body>
<a class="skip" href="#about">Skip to content</a>
${bg}
<div class="progress" id="progress"></div>
${header('home')}
<main>
${hero()}
${about()}
${research()}
${eduExp()}
${teaching()}
${skills()}
${projects()}
${certificates()}
${awards()}
${news()}
${profiles()}
${references()}
${contact()}
</main>
${footer()}
${lightbox}
<button class="to-top icon-btn" id="toTop" aria-label="Back to top">${icon('left')}</button>
<script src="/assets/app.js?v=${BUILD_DATE}" defer></script>
</body>
</html>`;
}

/* ---------- printable academic CV ---------- */
function cvPage() {
  const sec = (t, body) => `<section class="cv-sec"><h2>${t}</h2>${body}</section>`;
  const allProfiles = [...P.profiles.research, ...P.profiles.professional, ...P.profiles.coding]
    .filter(p => !/^https?:\/\/[^/]+\/?$/.test(p.url));
  return head({ title: `Academic CV — ${P.name}`, description: `Curriculum vitae of ${P.name}, ${P.degree}.`, canonical: '/cv.html' }) + `
<body class="cv-body">
${bg}
${header('cv')}
<main class="cv-main">
  <div class="cv-toolbar"><a class="btn btn-sm btn-ghost" href="/">${icon('left')} Portfolio</a><button class="btn btn-sm btn-primary" onclick="window.print()">${icon('print')} Print / Save as PDF</button></div>
  <article class="cv-paper">
    <header class="cv-head">
      <img src="/${esc(P.photo)}" width="618" height="734" alt="${esc(P.name)}">
      <div>
        <h1>${esc(P.name)}</h1>
        <p class="cv-role">${esc(P.degree)}<br>${esc(P.currentRole)}, ${esc(P.currentOrg)}</p>
        <p class="cv-contact">${esc(P.location)} · <a href="mailto:${esc(P.email)}">${esc(P.email)}</a> · ${esc(P.phone)}<br>
        ${allProfiles.map(p => `<a href="${esc(p.url)}">${esc(p.url.replace(/^https?:\/\/(www\.)?/, ''))}</a>`).join(' · ')}
        ${BASE ? ` · <a href="${esc(BASE)}/">${esc(BASE.replace(/^https?:\/\//, ''))}</a>` : ''}</p>
      </div>
    </header>
    ${sec('Summary', P.summary.map(p => `<p>${esc(p)}</p>`).join(''))}
    ${sec('Research interests', `<p>${P.interests.map(i => esc(i.title)).join(' · ')}</p><p>${esc(P.researchStatement)}</p>`)}
    ${sec('Education', P.education.map(e => `<div class="cv-row"><div><b>${esc(e.degree)}</b><br>${esc(e.institution)}, ${esc(e.location)}${e.details && e.details.length ? `<ul>${e.details.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}</div><span>${esc(e.period)}</span></div>`).join(''))}
    ${sec('Research &amp; publications', `<ol>${P.research.map(r => `<li><b>${esc(r.title)}</b> — ${esc(r.type)} <i>(${esc(r.status)})</i></li>`).join('')}</ol>`)}
    ${sec('Experience', P.experience.map(e => `<div class="cv-row"><div><b>${esc(e.role)}</b> — ${esc(e.org)}<ul>${e.points.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><span>${esc(e.period)}</span></div>`).join(''))}
    ${sec('Teaching &amp; outreach', P.teaching.map(t => `<p><b>${esc(t.title)}</b>${t.url ? ` (<a href="${esc(t.url)}">${esc(t.url.replace(/^https?:\/\//, ''))}</a>)` : ''} — ${esc(t.description)}</p>`).join(''))}
    ${sec('Skills', P.skills.map(g => `<p><b>${esc(g.group)}:</b> ${g.items.map(esc).join(', ')}</p>`).join(''))}
    ${sec('Projects', `<ul>${P.projects.map(p => `<li><b>${esc(p.title)}</b> (${esc(p.category)}) — ${p.tech.map(esc).join(', ')}${p.code ? ` · <a href="${esc(p.code)}">code</a>` : ''}${p.live ? ` · <a href="${esc(p.live)}">live</a>` : ''}</li>`).join('')}</ul>`)}
    ${sec('Licenses &amp; certifications', `<ul class="cv-certs">${P.certificates.map(c => `<li><b>${esc(c.title)}</b> — ${esc(c.issuer)}${c.date ? `, ${fmtDate(c.date)}` : ''}${c.id ? ` <code>${esc(c.id)}</code>` : ''}${c.url ? ` · <a href="${esc(c.url)}">verify</a>` : ''}</li>`).join('')}</ul>`)}
    ${sec('Honours &amp; awards', `<ul>${P.awards.map(a => `<li><b>${esc(a.title)}</b>${a.year ? ` (${esc(a.year)})` : ''} — ${esc(a.text)}</li>`).join('')}</ul>`)}
    ${sec('References', `<div class="cv-refs">${P.references.map(r => `<div><b>${esc(r.name)}</b><br>${esc(r.title)}, ${esc(r.dept)}<br><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></div>`).join('')}</div><p class="small muted">Phone numbers of referees are available on request.</p>`)}
    <p class="cv-foot">${credit}</p>
  </article>
</main>
${footer()}
<script src="/assets/app.js?v=${BUILD_DATE}" defer></script>
</body>
</html>`;
}

function notFound() {
  return head({ title: `Page not found — ${P.name}`, description: 'Page not found', canonical: '/404.html' }) + `
<body>
${bg}
${header('404')}
<main class="nf"><div class="glass nf-card"><span class="kicker">Error 404</span><h1 class="grad-text">Lost in latent space</h1><p class="lead">The page you are looking for does not exist.</p><a class="btn btn-primary" href="/">${icon('left')} Back to the portfolio</a></div></main>
${footer()}
<script src="/assets/app.js?v=${BUILD_DATE}" defer></script>
</body></html>`;
}

/* ---------- build ---------- */
function validate() {
  const problems = [];
  P.certificates.forEach((c, i) => {
    if (!c.title || !c.issuer || !c.topic) problems.push(`certificate #${i + 1} needs title, issuer and topic`);
    if (c.image && !fs.existsSync(path.join(ROOT, 'public', 'images', 'certificates', 'full', c.image))) problems.push(`missing image ${c.image}`);
  });
  if (problems.length) { console.error('Data problems:\n - ' + problems.join('\n - ')); process.exit(1); }
}

validate();
rmrf(OUT);
copyDir(path.join(ROOT, 'public'), OUT);
copyDir(path.join(ROOT, 'src'), path.join(OUT, 'assets'));
fs.renameSync(path.join(OUT, 'assets', 'favicon.svg'), path.join(OUT, 'favicon.svg'));
write('index.html', homePage());
write('cv.html', cvPage());
write('404.html', notFound());
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ['/', '/cv.html'].map(u => `  <url><loc>${BASE}${u}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n') + '\n</urlset>\n');
console.log(`Built portfolio → site/  (${P.certificates.length} certificates, ${P.projects.length} projects, ${P.research.length} research items)`);
