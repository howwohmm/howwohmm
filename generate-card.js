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
const totalSessions = energy?.total_sessions || 0;
const shipped = xp?.achievements?.filter(a =>
  ['shipper', 'first_blood', 'brain_architect', 'flow_master'].includes(a)
).length || 0;
const projectCount = health?.projects ? Object.keys(health.projects).length : 0;
const achievements = xp?.achievements?.length || 0;

// streak text
const streakText = streak > 0 ? `${streak} day build streak` : 'building things';

// projects text — count active ones (grade C or above)
const activeProjects = health?.projects
  ? Object.entries(health.projects)
      .filter(([_, v]) => v.score >= 40)
      .map(([k]) => k)
  : [];

const projectLine = activeProjects.length > 0
  ? activeProjects.slice(0, 3).join(', ') + (activeProjects.length > 3 ? ` + ${activeProjects.length - 3} more` : '')
  : `${projectCount} projects`;

// date
const now = new Date();
const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

// --- quiet dark palette ---
const bg = '#262626';
const border = '#303030';
const heading = '#e8e8e8';
const body = '#c8c8c8';
const dim = '#aaa';
const muted = '#484848';
const ghost = '#383838';

// --- svg ---
// minimal, text-first, generous whitespace
// no monospace, no colored badges, no dev chrome
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="130" viewBox="0 0 480 130">
  <rect x="0.5" y="0.5" width="479" height="129" rx="3" ry="3" fill="${bg}" stroke="${border}" stroke-width="1"/>

  <text x="28" y="38" fill="${heading}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="14" font-weight="400" letter-spacing="-0.02em">ohm.</text>
  <text x="66" y="38" fill="${muted}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" font-weight="300" letter-spacing="-0.01em">ships code daily</text>

  <text x="28" y="68" fill="${body}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" font-weight="300" letter-spacing="-0.01em">${streakText}</text>
  <text x="28" y="88" fill="${dim}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="11" font-weight="300" letter-spacing="-0.01em">${projectCount} projects \u00b7 ${achievements} milestones</text>

  <text x="452" y="114" fill="${ghost}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="9" font-weight="300" text-anchor="end">${dateStr}</text>
</svg>`;

const outPath = path.join(__dirname, 'stats-card.svg');
fs.writeFileSync(outPath, svg);
console.log(`wrote ${outPath}`);
