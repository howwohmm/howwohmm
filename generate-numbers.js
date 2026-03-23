const fs = require("fs");
const path = require("path");
const os = require("os");

const home = os.homedir();
const vault = path.join(home, "obsidian-vault", "brain");

// --- read real data with fallbacks ---

let totalXp = 15060, achievementsCount = 15;
try {
  const xp = JSON.parse(fs.readFileSync(path.join(vault, "xp.json"), "utf8"));
  totalXp = xp.total_xp ?? totalXp;
  achievementsCount = (xp.achievements ?? []).length;
} catch {}

let currentStreak = 2, totalSessions = 20;
try {
  const energy = JSON.parse(fs.readFileSync(path.join(vault, "energy.json"), "utf8"));
  currentStreak = energy.current_streak ?? currentStreak;
  totalSessions = energy.total_sessions ?? totalSessions;
} catch {}

let nodes = 509, edges = 13603;
try {
  const lines = fs.readFileSync(path.join(vault, "stats-log.jsonl"), "utf8").trim().split("\n");
  const last = JSON.parse(lines[lines.length - 1]);
  nodes = last.nodes ?? nodes;
  edges = last.edges ?? edges;
} catch {}

// hardcoded github stats
const contributions = 456;
const repos = 75;
const prs = 21;

// --- format helpers ---
function fmt(n) {
  if (n >= 100000) return (n / 1000).toFixed(0) + "k";
  if (n >= 10000) return (n / 1000).toFixed(1) + "k";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function streakLabel(n) {
  return n === 1 ? "day streak" : "day streak";
}

// --- stats array ---
const stats = [
  { value: fmt(contributions), label: "contributions" },
  { value: fmt(repos), label: "repos" },
  { value: fmt(prs), label: "prs" },
  { value: fmt(nodes), label: "nodes" },
  { value: fmt(edges), label: "edges" },
  { value: fmt(totalXp), label: "xp" },
  { value: String(currentStreak) + "d", label: "streak" },
];

// --- SVG generation ---
const W = 800, H = 56;
const count = stats.length;
const spacing = W / count;

let items = "";
stats.forEach((s, i) => {
  const x = spacing * i + spacing / 2;
  const yNum = 24;
  const yLabel = 38;

  items += `  <text x="${x}" y="${yNum}" fill="#c8c8c8" font-size="13" font-weight="400" text-anchor="middle" font-family="-apple-system, sans-serif">${s.value}</text>\n`;
  items += `  <text x="${x}" y="${yLabel}" fill="#484848" font-size="10" font-weight="300" text-anchor="middle" font-family="-apple-system, sans-serif">${s.label}</text>\n`;

  // dot separator after each except last
  if (i < count - 1) {
    const dotX = spacing * (i + 1);
    items += `  <text x="${dotX}" y="${30}" fill="#303030" font-size="12" text-anchor="middle" font-family="-apple-system, sans-serif">·</text>\n`;
  }
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="4" fill="#262626" stroke="#303030" stroke-width="1"/>
${items}</svg>
`;

const outDir = "/tmp/howwohmm-profile";
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "numbers-card.svg");
fs.writeFileSync(outPath, svg);
console.log("wrote", outPath);
console.log("stats:", stats.map(s => `${s.value} ${s.label}`).join("  ·  "));
