const fs = require('fs');
const path = require('path');

const oss = {
  prs_submitted: 21,
  prs_merged: 4,
  repos_contributed: 12,
  merge_rate: '19%',
  top_repos: ['nuxt/ui', 'nuxt/nuxt', 'npmx.dev', 'instagram-cli', 'directus'],
  recent_pr: 'fix: restrict session file permissions',
  github_achievements: ['Pull Shark', 'Pair Extraordinaire', 'YOLO', 'Quickdraw'],
};

const W = 390;
const H = 260;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const repoRow1 = oss.top_repos.slice(0, 3).join('  ');
const repoRow2 = oss.top_repos.slice(3).join('  ');

const achRow1 = oss.github_achievements.slice(0, 2).join(' · ');
const achRow2 = oss.github_achievements.slice(2).join(' · ');

// trim "fix: " prefix and keep it short for the card
const latestLabel = 'latest: ' + oss.recent_pr.replace(/^fix:\s*/, 'fix ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#262626" rx="4" stroke="#303030" stroke-width="1"/>

  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  </style>

  <!-- heading -->
  <text x="24" y="36" fill="#484848" font-size="10" font-weight="400">open source</text>

  <!-- stats -->
  <text x="24" y="68" fill="#c8c8c8" font-size="12" font-weight="400">${oss.prs_submitted} prs · ${oss.prs_merged} merged · ${oss.repos_contributed} repos</text>

  <!-- top repos row 1 -->
  <text x="24" y="100" fill="#aaa" font-size="11" font-weight="400">${esc(repoRow1)}</text>

  <!-- top repos row 2 -->
  <text x="24" y="118" fill="#aaa" font-size="11" font-weight="400">${esc(repoRow2)}</text>

  <!-- divider -->
  <line x1="24" y1="140" x2="${W - 24}" y2="140" stroke="#303030" stroke-width="1"/>

  <!-- latest pr -->
  <text x="24" y="164" fill="#484848" font-size="10" font-weight="400">${esc(latestLabel)}</text>

  <!-- achievements row 1 -->
  <text x="24" y="200" fill="#383838" font-size="9" font-weight="400">${esc(achRow1.toLowerCase())}</text>

  <!-- achievements row 2 -->
  <text x="24" y="216" fill="#383838" font-size="9" font-weight="400">${esc(achRow2.toLowerCase())}</text>
</svg>`;

const out = path.join(__dirname, 'oss-card.svg');
fs.writeFileSync(out, svg);
console.log(`wrote ${out} (${svg.length} bytes)`);
