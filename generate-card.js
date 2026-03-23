#!/usr/bin/env node
// generate-card.js — builds an SVG stats card from second brain data
// no dependencies, pure Node.js
// design: quiet dark theme — text-first, warm, restrained

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

// if BRAIN_DATA env var is set, use that instead of files (for CI)
let xp, energy, health;

if (process.env.BRAIN_DATA) {
  const data = JSON.parse(process.env.BRAIN_DATA);
  xp = data.xp;
  energy = data.energy;
  health = data.health;
} else {
  xp = readJSON('xp.json');
  energy = readJSON('energy.json');
  health = readJSON('health.json');
}

// --- data ---
const streak = energy?.current_streak || 0;
const achievements = xp?.achievements?.length || 0;

// active projects — real names a stranger would recognize
// map internal project names to public-facing names
const PROJECT_NAMES = {
  'general': null, // skip
  'scripts': null,
  '-scripts': null,
  'obsidian-vault': null,
  'meta': null,
  'agent-a2b0cfdc': null,
  'downloads': null,
  'sheets-v2': 'sheets ai',
  'oss-ghost': 'oss contributions',
  'sqm': 'sqm',
  'ai-tab': 'refresh',
  'hacker-news-ext': 'hacker news ext',
  'studex': 'studex',
  'mindos': 'capsule',
  'instagram-cli': 'instagram cli',
  'curius-rag': 'curius rag',
  'pg-quotes': 'pg quotes',
  'lettersbyohm': 'letters',
  'contrarian': 'contrarian',
  'npmx-dev': 'npmx.dev',
  'teammate-sites': null,
};

// get active projects (score >= 35, mapped to public names)
const activeProjects = [];
if (health?.projects) {
  for (const [key, val] of Object.entries(health.projects)) {
    if (val.score >= 30 && PROJECT_NAMES[key] !== null) {
      const name = PROJECT_NAMES[key] || key;
      activeProjects.push({ name, score: val.score });
    }
  }
  activeProjects.sort((a, b) => b.score - a.score);
}

// currently focused on — top 2-3 active projects
const focusedOn = activeProjects.slice(0, 3).map(p => p.name);
const focusLine = focusedOn.length > 0
  ? focusedOn.join(', ')
  : 'exploring ideas';

// total projects count (only real ones)
const totalProjects = Object.entries(health?.projects || {})
  .filter(([k]) => PROJECT_NAMES[k] !== null)
  .length;

// streak text
const streakText = streak > 0 ? `${streak} day streak` : '';

// shipping since
const SHIPPING_SINCE = 'mar 2026';

// date
const now = new Date();
const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const dateStr = `updated ${months[now.getMonth()]} ${now.getDate()}`;

// --- quiet dark palette ---
const bg = '#262626';
const border = '#303030';
const heading = '#e8e8e8';
const body = '#c8c8c8';
const dim = '#aaa';
const muted = '#484848';
const ghost = '#383838';

// --- svg ---
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="152" viewBox="0 0 480 152">
  <rect x="0.5" y="0.5" width="479" height="151" rx="3" ry="3" fill="${bg}" stroke="${border}" stroke-width="1"/>

  <text x="28" y="36" fill="${heading}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="14" font-weight="400" letter-spacing="-0.02em">ohm.</text>
  <text x="452" y="36" fill="${muted}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="11" font-weight="300" text-anchor="end">shipping since ${SHIPPING_SINCE}</text>

  <text x="28" y="64" fill="${muted}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="10" font-weight="300" letter-spacing="0.03em">currently building</text>
  <text x="28" y="82" fill="${body}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" font-weight="300" letter-spacing="-0.01em">${focusLine}</text>

  <text x="28" y="112" fill="${dim}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="11" font-weight="300" letter-spacing="-0.01em">${totalProjects} projects${streakText ? ` \u00b7 ${streakText}` : ''} \u00b7 ${achievements} milestones</text>

  <text x="452" y="140" fill="${ghost}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="9" font-weight="300" text-anchor="end">${dateStr}</text>
</svg>`;

const outPath = path.join(__dirname, 'stats-card.svg');
fs.writeFileSync(outPath, svg);
console.log(`wrote ${outPath}`);
