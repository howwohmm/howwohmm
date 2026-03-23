const fs = require('fs');
const path = require('path');

const stacks = [
  { name: 'next.js', level: 95, projects: 3 },
  { name: 'react', level: 90, projects: 4 },
  { name: 'typescript', level: 85, projects: 5 },
  { name: 'python', level: 80, projects: 3 },
  { name: 'fastapi', level: 75, projects: 2 },
  { name: 'node.js', level: 85, projects: 6 },
  { name: 'sqlite', level: 65, projects: 2 },
  { name: 'vite', level: 80, projects: 3 },
];

function generateStackCard() {
  const width = 390;
  const height = 280;
  const padX = 24;
  const padTop = 28;
  const barStartY = 52;
  const rowHeight = 28;
  const barHeight = 6;
  const barRadius = 3;
  const barTrackWidth = width - padX * 2;

  // Interpolate bar fill color based on level (low=#484848, high=#c8c8c8)
  function barColor(level) {
    const t = (level - 0) / 100;
    const low = { r: 0x48, g: 0x48, b: 0x48 };
    const high = { r: 0xc8, g: 0xc8, b: 0xc8 };
    const r = Math.round(low.r + (high.r - low.r) * t);
    const g = Math.round(low.g + (high.g - low.g) * t);
    const b = Math.round(low.b + (high.b - low.b) * t);
    return `rgb(${r},${g},${b})`;
  }

  let rows = '';
  stacks.forEach((s, i) => {
    const y = barStartY + i * rowHeight;
    const labelY = y + 2;
    const barY = y + 8;
    const fillWidth = (s.level / 100) * barTrackWidth;

    rows += `
    <!-- ${s.name} -->
    <text x="${padX}" y="${labelY}" fill="#c8c8c8" font-size="11" font-weight="300" font-family="-apple-system, sans-serif">${s.name}</text>
    <text x="${width - padX}" y="${labelY}" fill="#484848" font-size="10" font-weight="300" font-family="-apple-system, sans-serif" text-anchor="end">${s.level}</text>
    <rect x="${padX}" y="${barY}" width="${barTrackWidth}" height="${barHeight}" rx="${barRadius}" fill="#303030"/>
    <rect x="${padX}" y="${barY}" width="${fillWidth}" height="${barHeight}" rx="${barRadius}" fill="${barColor(s.level)}"/>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="4" fill="#262626" stroke="#303030" stroke-width="1"/>
  <text x="${padX}" y="${padTop}" fill="#484848" font-size="10" font-weight="400" font-family="-apple-system, sans-serif" letter-spacing="0.04em">stack</text>
${rows}
</svg>
`;

  return svg;
}

const svg = generateStackCard();
const outPath = path.join(__dirname, 'stack-card.svg');
fs.writeFileSync(outPath, svg);
console.log(`wrote ${outPath} (${svg.length} bytes)`);
