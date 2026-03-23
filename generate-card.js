#!/usr/bin/env node
// generate-card.js — SVG stats card in quiet dark design language
// mirrors ohm.quest: typography hierarchy, border structure, constellation bg
// no dependencies, pure Node.js

const fs = require('fs');
const path = require('path');

const BRAIN_DIR = process.env.BRAIN_DIR || path.join(require('os').homedir(), 'obsidian-vault', 'brain');

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(path.join(BRAIN_DIR, file), 'utf8')); }
  catch { return null; }
}

function readLastLine(file) {
  try {
    const lines = fs.readFileSync(path.join(BRAIN_DIR, file), 'utf8').trim().split('\n');
    return JSON.parse(lines[lines.length - 1]);
  } catch { return null; }
}

let xp, energy, health, omega, statsLog;

if (process.env.BRAIN_DATA) {
  const data = JSON.parse(process.env.BRAIN_DATA);
  xp = data.xp; energy = data.energy; health = data.health;
  omega = data.omega; statsLog = data.statsLog;
} else {
  xp = readJSON('xp.json');
  energy = readJSON('energy.json');
  health = readJSON('health.json');
  omega = readJSON('omega.json');
  statsLog = readLastLine('stats-log.jsonl');
}

// --- data ---
const streak = energy?.current_streak || 0;
const achievements = xp?.achievements?.length || 0;
const nodes = statsLog?.nodes || 0;
const edges = statsLog?.edges || 0;
const totalProjects = health?.projects
  ? Object.keys(health.projects).filter(k =>
      !['general','scripts','-scripts','obsidian-vault','meta','agent-a2b0cfdc','downloads','teammate-sites'].includes(k)
    ).length
  : 0;

// currently building — top active projects
const PROJECT_NAMES = {
  'sheets-v2': 'sheets ai', 'oss-ghost': 'oss contributions',
  'sqm': 'sqm', 'ai-tab': 'refresh', 'studex': 'studex',
  'instagram-cli': 'instagram cli', 'npmx-dev': 'npmx.dev',
  'mindos': 'capsule', 'contrarian': 'contrarian',
  'lettersbyohm': 'letters', 'pg-quotes': 'pg quotes',
};
const SKIP = ['general','scripts','-scripts','obsidian-vault','meta','agent-a2b0cfdc','downloads','teammate-sites'];

const activeProjects = [];
if (health?.projects) {
  for (const [key, val] of Object.entries(health.projects)) {
    if (!SKIP.includes(key) && val.score >= 28) {
      activeProjects.push({ name: PROJECT_NAMES[key] || key, score: val.score });
    }
  }
  activeProjects.sort((a, b) => b.score - a.score);
}
const focusLine = activeProjects.slice(0, 3).map(p => p.name).join('  ·  ') || 'exploring';

// activity sparkline — last 7 entries from omega history
const history = omega?.history || [];
const spark = history.slice(-7);
function renderSparkline(data, x, y, w, h) {
  if (data.length < 2) return '';
  const values = data.map(d => d.omega || 0);
  const max = Math.max(...values) || 1;
  const barW = Math.min(4, (w / data.length) - 2);
  return data.map((d, i) => {
    const barH = Math.max(2, (d.omega / max) * h);
    const bx = x + i * (w / data.length) + (w / data.length - barW) / 2;
    const by = y + h - barH;
    const opacity = 0.25 + (d.omega / max) * 0.5;
    return `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW}" height="${barH.toFixed(1)}" rx="1" fill="#c8c8c8" opacity="${opacity.toFixed(2)}"/>`;
  }).join('\n  ');
}

// constellation — abstract neural net background
// deterministic pseudo-random based on node/edge count
function constellation(nodeCount, edgeCount, cx, cy, radius) {
  const seed = (nodeCount * 7 + edgeCount * 13) & 0xffff;
  const rng = (i) => {
    const x = Math.sin(seed + i * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  const pts = [];
  const numPts = 18;
  for (let i = 0; i < numPts; i++) {
    const angle = rng(i) * Math.PI * 2;
    const r = radius * (0.3 + rng(i + 100) * 0.7);
    pts.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      size: 1 + rng(i + 200) * 1.8,
      bright: rng(i + 300) > 0.75,
    });
  }

  // draw edges between nearby points
  const lines = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius * 0.6 && rng(i * numPts + j) > 0.4) {
        lines.push(`<line x1="${pts[i].x.toFixed(1)}" y1="${pts[i].y.toFixed(1)}" x2="${pts[j].x.toFixed(1)}" y2="${pts[j].y.toFixed(1)}" stroke="#303030" stroke-width="0.5"/>`);
      }
    }
  }

  const dots = pts.map(p =>
    `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.size.toFixed(1)}" fill="${p.bright ? '#484848' : '#383838'}"/>`
  );

  return [...lines, ...dots].join('\n  ');
}

// date
const now = new Date();
const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const dateStr = `${months[now.getMonth()]} ${now.getDate()}`;

// format numbers
const fmtNum = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : `${n}`;

// --- quiet dark palette ---
const bg = '#262626';
const border = '#303030';
const white = '#e8e8e8';   // headings, primary
const text = '#c8c8c8';    // body
const dim = '#aaa';         // secondary
const muted = '#484848';    // tertiary
const ghost = '#383838';    // meta

// --- card dimensions ---
const W = 800;
const H = 220;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="4"/></clipPath>
  </defs>
  <g clip-path="url(#card)">
  <rect width="${W}" height="${H}" rx="4" fill="${bg}"/>

  <!-- constellation background -->
  <g opacity="0.6">
  ${constellation(nodes, edges, W - 140, H / 2, 100)}
  </g>

  <!-- top border -->
  <line x1="32" y1="0" x2="${W - 32}" y2="0" stroke="${border}" stroke-width="1"/>

  <!-- header row -->
  <text x="36" y="40" fill="${white}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="16" font-weight="400" letter-spacing="-0.02em">ohm.</text>
  <text x="82" y="40" fill="${muted}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="12" font-weight="300" letter-spacing="-0.01em">i built a neural net that watches me code</text>

  <!-- divider -->
  <line x1="36" y1="56" x2="${W - 36}" y2="56" stroke="${border}" stroke-width="0.5"/>

  <!-- main content -->
  <text x="36" y="82" fill="${muted}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="10" font-weight="300" letter-spacing="0.04em">currently building</text>
  <text x="36" y="102" fill="${text}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="13" font-weight="400" letter-spacing="-0.01em">${focusLine}</text>

  <!-- stats row -->
  <text x="36" y="134" fill="${dim}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="11" font-weight="300">${fmtNum(nodes)} nodes</text>
  <text x="120" y="134" fill="${ghost}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="11" font-weight="300">·</text>
  <text x="132" y="134" fill="${dim}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="11" font-weight="300">${fmtNum(edges)} edges</text>
  <text x="230" y="134" fill="${ghost}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="11" font-weight="300">·</text>
  <text x="242" y="134" fill="${dim}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="11" font-weight="300">${totalProjects} projects</text>
  <text x="330" y="134" fill="${ghost}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="11" font-weight="300">·</text>
  <text x="342" y="134" fill="${dim}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="11" font-weight="300">${achievements} milestones</text>

  <!-- divider -->
  <line x1="36" y1="152" x2="${W - 36}" y2="152" stroke="${border}" stroke-width="0.5"/>

  <!-- bottom row -->
  ${streak > 0 ? `<text x="36" y="176" fill="${text}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="12" font-weight="300">${streak} day build streak</text>` : ''}
  <text x="36" y="196" fill="${muted}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="10" font-weight="300">shipping since mar 2026</text>

  <!-- sparkline: 7d activity -->
  ${spark.length >= 2 ? `
  <text x="${W - 72}" y="176" fill="${ghost}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="9" font-weight="300" text-anchor="middle">7d</text>
  ${renderSparkline(spark, W - 108, 180, 72, 24)}
  ` : ''}

  <!-- updated -->
  <text x="${W - 36}" y="210" fill="${ghost}" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="9" font-weight="300" text-anchor="end">${dateStr}</text>

  </g>
</svg>`;

const outPath = path.join(__dirname, 'stats-card.svg');
fs.writeFileSync(outPath, svg);
console.log(`wrote ${outPath}`);
