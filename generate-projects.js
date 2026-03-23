const fs = require('fs');
const path = require('path');

const projects = [
  { name: 'studex', desc: 'timetable + bunk tracker', stack: 'next.js · neon', status: 'pre-launch', url: 'github.com/howwohmm/studex' },
  { name: 'capsule', desc: 'playlist → morning course', stack: 'fastapi · fly.io', status: 'live', url: 'mindos.fly.dev' },
  { name: 'refresh', desc: 'ai-ranked headlines', stack: 'vanilla js · 0 deps', status: 'published', url: 'chrome web store' },
  { name: 'contrarian', desc: 'one pg quote per day', stack: 'vanilla js · 125 quotes', status: 'published', url: 'chrome web store' },
  { name: 'sheets ai', desc: 'spreadsheet ai assistant', stack: 'next.js · openai', status: 'building', url: 'private' },
  { name: 'ohm.quest', desc: 'personal website', stack: 'next.js', status: 'live', url: 'ohm.quest' },
];

function generateProjectsCard(projects) {
  const width = 800;
  const paddingX = 24;
  const paddingTop = 20;
  const headingHeight = 28;
  const rowHeight = 26;
  const rowCount = projects.length;
  const height = paddingTop + headingHeight + (rowCount * rowHeight) + 14;

  // column x positions
  const colName = paddingX;
  const colDesc = 160;
  const colStack = 520;
  const colStatus = 700;

  const escXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let rows = '';
  projects.forEach((p, i) => {
    const y = paddingTop + headingHeight + (i * rowHeight);
    const textY = y + 17;

    // separator line above each row
    rows += `  <line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="#303030" stroke-width="1"/>\n`;

    // name
    rows += `  <text x="${colName}" y="${textY}" fill="#e8e8e8" font-size="12" font-weight="400">${escXml(p.name)}</text>\n`;

    // description
    rows += `  <text x="${colDesc}" y="${textY}" fill="#aaa" font-size="11" font-weight="300">${escXml(p.desc)}</text>\n`;

    // stack
    rows += `  <text x="${colStack}" y="${textY}" fill="#484848" font-size="10" font-weight="400">${escXml(p.stack)}</text>\n`;

    // status — "live" gets brighter color
    const statusColor = p.status === 'live' ? '#aaa' : '#484848';
    rows += `  <text x="${colStatus}" y="${textY}" fill="${statusColor}" font-size="10" font-weight="400">${escXml(p.status)}</text>\n`;
  });

  // bottom border after last row
  const bottomY = paddingTop + headingHeight + (rowCount * rowHeight);
  rows += `  <line x1="${paddingX}" y1="${bottomY}" x2="${width - paddingX}" y2="${bottomY}" stroke="#303030" stroke-width="1"/>\n`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="4" fill="#262626" stroke="#303030" stroke-width="1"/>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
  </style>

  <!-- heading -->
  <text x="${paddingX}" y="${paddingTop + 14}" fill="#484848" font-size="11" font-weight="400" letter-spacing="0.5">projects</text>

${rows}</svg>
`;

  return svg;
}

const svg = generateProjectsCard(projects);
const outPath = path.join(__dirname, 'projects-card.svg');
fs.writeFileSync(outPath, svg, 'utf-8');
console.log(`written to ${outPath} (${svg.length} bytes)`);
