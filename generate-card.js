#!/usr/bin/env node
// generate-card.js — builds an SVG stats card from second brain data
// no dependencies, pure Node.js

const fs = require('fs');
const path = require('path');

const BRAIN_DIR = process.env.BRAIN_DIR || path.join(require('os').homedir(), 'obsidian-vault', 'brain');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(BRAIN_DIR, file), 'utf8'));
}

function readLastLine(file) {
  const lines = fs.readFileSync(path.join(BRAIN_DIR, file), 'utf8').trim().split('\n');
  return JSON.parse(lines[lines.length - 1]);
}

// if BRAIN_DATA env var is set, use that instead of files (for CI)
let xp, omega, energy, statsLog;

if (process.env.BRAIN_DATA) {
  const data = JSON.parse(process.env.BRAIN_DATA);
  xp = data.xp;
  omega = data.omega;
  energy = data.energy;
  statsLog = data.statsLog;
} else {
  xp = readJSON('xp.json');
  omega = readJSON('omega.json');
  energy = readJSON('energy.json');
  statsLog = readLastLine('stats-log.jsonl');
}

// format omega with commas
function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

// sparkline from omega history (last 7 days)
function sparkline(history) {
  const pts = history.slice(-7);
  if (pts.length < 2) return '';

  const values = pts.map(p => p.omega);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // sparkline area: x 340-460, y 130-165
  const sx = 340, ex = 460, sy = 135, ey = 165;
  const w = ex - sx;
  const h = ey - sy;

  const points = values.map((v, i) => {
    const x = sx + (i / (values.length - 1)) * w;
    const y = ey - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `<polyline points="${points.join(' ')}" fill="none" stroke="#e8b661" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`;
}

const level = xp.level;
const title = xp.title;
const omegaVal = omega.omega;
const streak = energy.current_streak;
const nodes = statsLog.nodes;
const edges = statsLog.edges;
const multiplier = omega.multipliers.total;
const totalXp = xp.total_xp;

const spark = sparkline(omega.history);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180" viewBox="0 0 480 180">
  <rect x="1" y="1" width="478" height="178" rx="8" ry="8" fill="#262626" stroke="#333" stroke-width="1"/>

  <text x="24" y="36" fill="#d4d4d4" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="400">ohm. \u00b7 builder stats</text>

  <text x="24" y="68" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="400">lv.${level}</text>
  <text x="${64 + String(level).length * 4}" y="68" fill="#888" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="300">${title}</text>
  <text x="240" y="68" fill="#e8b661" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="400">\u03A9 ${fmt(omegaVal)}</text>

  <text x="24" y="100" fill="#e8b661" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="300">${streak}d streak \u{1F525}</text>
  <text x="140" y="100" fill="#7da6d4" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="300">${fmt(nodes)} nodes \u00b7 ${fmt(edges)} edges</text>

  <text x="24" y="130" fill="#7dbd7d" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="300">\u00d7${multiplier} multiplier</text>
  <text x="160" y="130" fill="#888" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="300">${fmt(totalXp)} xp</text>

  ${spark}

  <text x="340" y="130" fill="#555" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="300">\u03A9 7d</text>
</svg>`;

const outPath = path.join(__dirname, 'stats-card.svg');
fs.writeFileSync(outPath, svg);
console.log(`wrote ${outPath}`);
