const fs = require("fs");
const path = require("path");

const ENERGY_PATH = path.join(
  process.env.HOME,
  "obsidian-vault/brain/energy.json"
);
const STATS_PATH = path.join(
  process.env.HOME,
  "obsidian-vault/brain/stats-log.jsonl"
);
const OUT_PATH = "/tmp/howwohmm-profile/activity-card.svg";

// defaults
const defaults = {
  today_sessions: 0,
  today_minutes: 0,
  peak_hours: [],
  peak_window: "—",
  session_buckets: {
    "<5min": 0,
    "5-15min": 0,
    "15-30min": 0,
    "30-60min": 0,
    "60+min": 0,
  },
  avg_session_min: 0,
  longest_session_min: 0,
  total_hours_this_week: 0,
};

let energy = { ...defaults };
try {
  const raw = JSON.parse(fs.readFileSync(ENERGY_PATH, "utf8"));
  energy = { ...defaults, ...raw };
} catch {
  console.log("energy.json not found, using defaults");
}

let statsLines = [];
try {
  const raw = fs.readFileSync(STATS_PATH, "utf8").trim();
  statsLines = raw
    .split("\n")
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
} catch {
  console.log("stats-log.jsonl not found, using defaults");
}

// normalize buckets — the real data has different keys than spec
const bucketMap = {
  "<5min": "<5m",
  "5-15min": "5-15",
  "15-30min": "15-30",
  "30-60min": "30-60",
  "1-2hr": "60+",
  "2hr+": "60+",
  "60+min": "60+",
};

const normalizedBuckets = {};
const displayOrder = ["<5m", "5-15", "15-30", "30-60", "60+"];
for (const key of displayOrder) normalizedBuckets[key] = 0;

const rawBuckets = energy.session_buckets || {};
for (const [k, v] of Object.entries(rawBuckets)) {
  const mapped = bucketMap[k] || k;
  if (mapped in normalizedBuckets) {
    normalizedBuckets[mapped] += v;
  }
}

const bucketEntries = displayOrder.map((k) => [k, normalizedBuckets[k]]);
const maxBucket = Math.max(...bucketEntries.map(([, v]) => v), 1);

// opacity: shorter sessions = more opaque (darker)
const opacities = [1.0, 0.8, 0.6, 0.45, 0.3];

// SVG generation
const W = 800;
const H = 140;
const MID = 400;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const barMaxW = 180;
const barH = 12;
const barGap = 4;
const barStartX = 70;
const barStartY = 38;

let barsSvg = "";
bucketEntries.forEach(([label, count], i) => {
  const y = barStartY + i * (barH + barGap);
  const w = maxBucket > 0 ? Math.max((count / maxBucket) * barMaxW, count > 0 ? 4 : 0) : 0;
  barsSvg += `  <text x="60" y="${y + barH - 2}" fill="#484848" font-size="10" font-family="-apple-system, sans-serif" text-anchor="end">${esc(label)}</text>\n`;
  barsSvg += `  <rect x="${barStartX}" y="${y}" width="${w}" height="${barH}" rx="2" fill="#c8c8c8" opacity="${opacities[i]}" />\n`;
  barsSvg += `  <text x="${barStartX + w + 6}" y="${y + barH - 2}" fill="#383838" font-size="10" font-family="-apple-system, sans-serif">${count}</text>\n`;
});

// right half — stats
const statsX = MID + 30;
const statsY = 38;
const statsGap = 17;
const stats = [
  [`${energy.total_hours_this_week}h total`, ""],
  [`${energy.today_sessions} sessions today`, ""],
  [`peak: ${energy.peak_window}`, ""],
  [`longest: ${energy.longest_session_min} min`, ""],
  [`avg: ${energy.avg_session_min} min`, ""],
];

let statsSvg = "";
stats.forEach(([text], i) => {
  const y = statsY + i * statsGap;
  statsSvg += `  <text x="${statsX}" y="${y}" fill="#c8c8c8" font-size="11" font-family="-apple-system, sans-serif" font-weight="300">${esc(text)}</text>\n`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="4" fill="#262626" stroke="#303030" stroke-width="1" />

  <!-- left: session distribution -->
  <text x="20" y="24" fill="#484848" font-size="10" font-family="-apple-system, sans-serif" font-weight="400" letter-spacing="0.5">sessions</text>
${barsSvg}
  <!-- divider -->
  <line x1="${MID}" y1="14" x2="${MID}" y2="${H - 14}" stroke="#303030" stroke-width="1" />

  <!-- right: key stats -->
  <text x="${statsX}" y="24" fill="#484848" font-size="10" font-family="-apple-system, sans-serif" font-weight="400" letter-spacing="0.5">this week</text>
${statsSvg}
</svg>`;

fs.writeFileSync(OUT_PATH, svg);
console.log(`wrote ${OUT_PATH} (${svg.length} bytes)`);
