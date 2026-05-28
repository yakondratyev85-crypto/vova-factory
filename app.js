const canvas = document.querySelector('#mazeCanvas');
const ctx = canvas.getContext('2d');
const controls = {
  type: document.querySelector('#mazeType'),
  variation: document.querySelector('#variation'),
  difficulty: document.querySelector('#difficulty'),
  theme: document.querySelector('#theme'),
  size: document.querySelector('#size'),
  sizeLabel: document.querySelector('#sizeLabel'),
  houseCount: document.querySelector('#houseCount'),
  houseCountLabel: document.querySelector('#houseCountLabel'),
  rotation: document.querySelector('#rotation'),
  seed: document.querySelector('#seed'),
  showSolution: document.querySelector('#showSolution'),
  decorate: document.querySelector('#decorate'),
  generate: document.querySelector('#generateBtn'),
  random: document.querySelector('#randomBtn'),
  download: document.querySelector('#downloadBtn'),
  title: document.querySelector('#mazeTitle'),
  meta: document.querySelector('#mazeMeta'),
};

const typeNames = {
  rect: 'Классический прямоугольный',
  circle: 'Круговой спиральный',
  triangle: 'Треугольная сетка',
  hex: 'Гексагональные соты',
  honey: 'Медовые соты с цветами',
  islands: 'Острова и мостики',
  picture: 'Картинка по каркасу',
  houses: 'Маршруты между домиками',
};

const difficultyNames = { easy: 'Лёгкая', medium: 'Средняя', hard: 'Сложная', expert: 'Экспертная' };
const difficultyScale = { easy: 0.72, medium: 1, hard: 1.25, expert: 1.55 };
const variationNames = {
  perfect: 'один путь', braid: 'петли', long: 'длинные коридоры', rooms: 'комнаты',
};
const themes = {
  space: { name: 'Космос', bg: ['#111827', '#4338ca'], wall: '#fff7cc', path: '#67e8f9', accent: '#fbbf24', hero: '🚀', goal: '🪐', home: '🛸', bits: ['✦', '★', '☄', '🛰️'] },
  jungle: { name: 'Джунгли', bg: ['#dcfce7', '#16a34a'], wall: '#14532d', path: '#fef08a', accent: '#f97316', hero: '🐒', goal: '🍌', home: '🏕️', bits: ['🌿', '🦜', '🌺', '🦋'] },
  sea: { name: 'Море', bg: ['#cffafe', '#0ea5e9'], wall: '#075985', path: '#fef3c7', accent: '#fb7185', hero: '🐠', goal: '🏝️', home: '🐚', bits: ['🐚', '⭐', '🌊', '🫧'] },
  candy: { name: 'Сладости', bg: ['#ffe4f2', '#f9a8d4'], wall: '#9d174d', path: '#ffffff', accent: '#8b5cf6', hero: '🍭', goal: '🧁', home: '🍩', bits: ['🍬', '✨', '🍓', '🍪'] },
  dino: { name: 'Динозавры', bg: ['#fef3c7', '#84cc16'], wall: '#365314', path: '#fff7ed', accent: '#dc2626', hero: '🦕', goal: '🥚', home: '⛺', bits: ['🦴', '🌋', '🌱', '🪨'] },
  fairy: { name: 'Сказка', bg: ['#f5d0fe', '#a78bfa'], wall: '#581c87', path: '#fff1f2', accent: '#f59e0b', hero: '🧚', goal: '🏰', home: '🏡', bits: ['✨', '🌙', '💎', '🦄'] },
};
const solutionColors = ['#ff3b7f', '#16a34a', '#2563eb', '#f97316', '#7c3aed', '#0f766e'];

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(array, random) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function makeGrid(cols, rows) {
  return Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => ({
    x, y, visited: false, walls: { n: true, e: true, s: true, w: true }, prev: null,
  })));
}

function cellAt(grid, x, y) { return grid[y]?.[x]; }
function openWall(a, b, dir, back) { a.walls[dir] = false; b.walls[back] = false; }

function carveMaze(cols, rows, random, variation) {
  const grid = makeGrid(cols, rows);
  const start = grid[0][0];
  const stack = [start];
  const dirs = [
    ['n', 0, -1, 's'], ['e', 1, 0, 'w'], ['s', 0, 1, 'n'], ['w', -1, 0, 'e'],
  ];
  start.visited = true;

  while (stack.length) {
    const current = stack[stack.length - 1];
    let ordered = [...dirs];
    if (variation === 'long' && current.prev && random() < 0.68) {
      const dx = current.x - current.prev.x;
      const dy = current.y - current.prev.y;
      ordered = dirs.sort((a, b) => (b[1] === dx && b[2] === dy) - (a[1] === dx && a[2] === dy));
    } else {
      ordered = shuffle(ordered, random);
    }
    const choices = ordered.filter(([, dx, dy]) => {
      const next = cellAt(grid, current.x + dx, current.y + dy);
      return next && !next.visited;
    });
    if (!choices.length) { stack.pop(); continue; }
    const [dir, dx, dy, back] = choices[0];
    const next = cellAt(grid, current.x + dx, current.y + dy);
    openWall(current, next, dir, back);
    next.visited = true;
    next.prev = current;
    stack.push(next);
  }

  addVariationOpenings(grid, dirs, random, variation);
  return grid;
}

function addVariationOpenings(grid, dirs, random, variation) {
  const braidChance = { perfect: 0, long: 0.025, braid: 0.18, rooms: 0.1 }[variation] ?? 0;
  grid.flat().forEach((cell) => {
    const closed = dirs.filter(([dir, dx, dy]) => cell.walls[dir] && cellAt(grid, cell.x + dx, cell.y + dy));
    const open = dirs.length - closed.length;
    if ((open === 1 || variation === 'braid') && closed.length && random() < braidChance) {
      const [dir, dx, dy, back] = closed[Math.floor(random() * closed.length)];
      openWall(cell, cellAt(grid, cell.x + dx, cell.y + dy), dir, back);
    }
  });

  if (variation !== 'rooms') return;
  for (let i = 0; i < Math.max(3, Math.floor(grid.length * grid[0].length / 55)); i += 1) {
    const w = 2 + Math.floor(random() * 3);
    const h = 2 + Math.floor(random() * 3);
    const ox = Math.floor(random() * Math.max(1, grid[0].length - w));
    const oy = Math.floor(random() * Math.max(1, grid.length - h));
    for (let y = oy; y < oy + h; y += 1) {
      for (let x = ox; x < ox + w; x += 1) {
        const cell = cellAt(grid, x, y);
        [['e', 1, 0, 'w'], ['s', 0, 1, 'n']].forEach(([dir, dx, dy, back]) => {
          const next = cellAt(grid, x + dx, y + dy);
          if (next && x + dx < ox + w && y + dy < oy + h) openWall(cell, next, dir, back);
        });
      }
    }
  }
}

function solutionPathTo(cell) {
  const path = [];
  let current = cell;
  while (current) { path.push(current); current = current.prev; }
  return path.reverse();
}

function solutionPath(grid) { return solutionPathTo(grid[grid.length - 1][grid[0].length - 1]); }

function config() {
  const base = Number(controls.size.value);
  const scale = difficultyScale[controls.difficulty.value];
  const cols = Math.round(base * scale);
  return {
    type: controls.type.value,
    variation: controls.variation.value,
    difficulty: controls.difficulty.value,
    theme: themes[controls.theme.value],
    seed: controls.seed.value || 'maze',
    decorate: controls.decorate.checked,
    showSolution: controls.showSolution.checked,
    houseCount: Number(controls.houseCount.value),
    rotation: Number(controls.rotation.value),
    cols: Math.max(6, Math.min(42, cols)),
    rows: Math.max(6, Math.min(42, Math.round(cols * (controls.type.value === 'circle' ? 0.72 : 1)))),
  };
}

function background(theme) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, theme.bg[0]);
  gradient.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let r = 80; r < 720; r += 96) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(550, 550, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function roundedCard(theme) {
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
  ctx.shadowBlur = 38;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  roundRect(72, 72, 956, 956, 54);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function decorate(theme, random) {
  ctx.save();
  ctx.font = '54px serif';
  for (let i = 0; i < 56; i += 1) {
    const symbol = theme.bits[i % theme.bits.length];
    ctx.globalAlpha = 0.42 + random() * 0.42;
    ctx.fillText(symbol, 35 + random() * 1030, 45 + random() * 1020);
  }
  ctx.globalAlpha = 1;
  ctx.font = '92px serif';
  ctx.fillText(theme.hero, 88, 990);
  ctx.fillText(theme.goal, 920, 150);
  ctx.restore();
}

function rotateDrawing(cfg, draw) {
  ctx.save();
  if (cfg.rotation) {
    ctx.translate(550, 550);
    ctx.rotate((cfg.rotation * Math.PI) / 180);
    ctx.scale(Math.abs(cfg.rotation) === 45 ? 0.83 : 0.9, Math.abs(cfg.rotation) === 45 ? 0.83 : 0.9);
    ctx.translate(-550, -550);
  }
  draw();
  ctx.restore();
}

function rectLayout(grid) {
  const pad = 150;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  return { pad, w, h, cellW: w / grid[0].length, cellH: h / grid.length };
}

function rectCenter(cell, layout) {
  return [layout.pad + cell.x * layout.cellW + layout.cellW / 2, layout.pad + cell.y * layout.cellH + layout.cellH / 2];
}

function drawRectMaze(grid, cfg, random, options = {}) {
  const layout = rectLayout(grid);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = cfg.theme.wall;
  ctx.lineWidth = Math.max(3, Math.min(layout.cellW, layout.cellH) * 0.13);

  if (cfg.type === 'picture') drawPictureMask(cfg, random);
  if (cfg.type === 'islands') drawIslands(grid, cfg, layout, random);
  if (!options.skipSolution && cfg.showSolution) drawPolyline(solutionPath(grid), (cell) => rectCenter(cell, layout), cfg.theme.accent, Math.max(7, Math.min(layout.cellW, layout.cellH) * 0.24));

  grid.flat().forEach((cell) => {
    const x = layout.pad + cell.x * layout.cellW;
    const y = layout.pad + cell.y * layout.cellH;
    ctx.beginPath();
    if (cell.walls.n) { ctx.moveTo(x, y); ctx.lineTo(x + layout.cellW, y); }
    if (cell.walls.e) { ctx.moveTo(x + layout.cellW, y); ctx.lineTo(x + layout.cellW, y + layout.cellH); }
    if (cell.walls.s) { ctx.moveTo(x + layout.cellW, y + layout.cellH); ctx.lineTo(x, y + layout.cellH); }
    if (cell.walls.w) { ctx.moveTo(x, y + layout.cellH); ctx.lineTo(x, y); }
    ctx.stroke();
  });

  if (!options.skipMarkers) {
    drawMarkers(layout.pad + layout.cellW * 0.5, layout.pad + layout.cellH * 0.5, layout.pad + layout.w - layout.cellW * 0.5, layout.pad + layout.h - layout.cellH * 0.5, cfg);
  }
}

function triangleCenter(cell, layout) {
  const up = (cell.x + cell.y) % 2 === 0;
  const x = layout.pad + cell.x * layout.cell;
  const y = layout.pad + cell.y * layout.height;
  return up ? [x + layout.cell / 2, y + layout.height * 0.64] : [x + layout.cell / 2, y + layout.height * 0.36];
}

function drawTriangleMaze(grid, cfg) {
  const layout = { pad: 130, w: canvas.width - 260 };
  layout.cell = layout.w / grid[0].length;
  layout.height = layout.cell * 0.86;
  if (cfg.showSolution) drawPolyline(solutionPath(grid), (cell) => triangleCenter(cell, layout), cfg.theme.accent, Math.max(7, layout.cell * 0.22));
  ctx.strokeStyle = cfg.theme.wall;
  ctx.lineWidth = Math.max(3, layout.cell * 0.11);
  ctx.lineJoin = 'round';
  grid.flat().forEach((mazeCell) => {
    const up = (mazeCell.x + mazeCell.y) % 2 === 0;
    const x = layout.pad + mazeCell.x * layout.cell;
    const y = layout.pad + mazeCell.y * layout.height;
    const points = up
      ? [[x, y + layout.height], [x + layout.cell / 2, y], [x + layout.cell, y + layout.height]]
      : [[x, y], [x + layout.cell, y], [x + layout.cell / 2, y + layout.height]];
    const wallKeys = ['w', 'n', 'e'];
    points.forEach((point, index) => {
      if (!mazeCell.walls[wallKeys[index]]) return;
      const next = points[(index + 1) % points.length];
      ctx.beginPath(); ctx.moveTo(point[0], point[1]); ctx.lineTo(next[0], next[1]); ctx.stroke();
    });
  });
  const start = triangleCenter(grid[0][0], layout);
  const end = triangleCenter(grid.at(-1).at(-1), layout);
  drawMarkers(start[0], start[1], end[0], end[1], cfg);
}

function hexCenter(cell, layout) {
  return [layout.pad + layout.radius + cell.x * layout.radius * 1.5, layout.pad + layout.radius + cell.y * layout.h + (cell.x % 2 ? layout.h / 2 : 0)];
}

function drawHexMaze(grid, cfg, random) {
  const layout = { pad: cfg.type === 'honey' ? 125 : 140 };
  layout.radius = (canvas.width - layout.pad * 2) / (grid[0].length * 1.75);
  layout.h = Math.sqrt(3) * layout.radius;
  if (cfg.showSolution) drawPolyline(solutionPath(grid), (cell) => hexCenter(cell, layout), cfg.theme.accent, Math.max(7, layout.radius * 0.28));
  if (cfg.type === 'honey') drawHoneyDecor(grid, cfg, layout, random);
  ctx.strokeStyle = cfg.theme.wall;
  ctx.lineWidth = Math.max(3, layout.radius * 0.14);
  ctx.lineCap = 'round';
  grid.flat().forEach((cell) => {
    const [cx, cy] = hexCenter(cell, layout);
    const pts = Array.from({ length: 6 }, (_, i) => {
      const angle = Math.PI / 6 + (Math.PI * 2 * i) / 6;
      return [cx + Math.cos(angle) * layout.radius, cy + Math.sin(angle) * layout.radius];
    });
    [['n', 4, 5], ['e', 5, 1], ['s', 1, 2], ['w', 2, 4]].forEach(([key, a, b]) => {
      if (!cell.walls[key]) return;
      ctx.beginPath(); ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); ctx.stroke();
    });
  });
  const start = hexCenter(grid[0][0], layout);
  const end = hexCenter(grid.at(-1).at(-1), layout);
  drawMarkers(start[0], start[1], end[0], end[1], cfg);
}

function drawHoneyDecor(grid, cfg, layout, random) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = cfg.theme.accent;
  grid.flat().forEach((cell) => {
    if (random() > 0.16) return;
    const [cx, cy] = hexCenter(cell, layout);
    ctx.beginPath();
    ctx.arc(cx, cy, layout.radius * 0.38, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function circleCenter(cell, layout) {
  const angle = ((cell.x + 0.5) / layout.sectors) * Math.PI * 2 - Math.PI / 2;
  const radius = 52 + (cell.y + 0.5) * layout.step;
  return [layout.cx + Math.cos(angle) * radius, layout.cy + Math.sin(angle) * radius];
}

function drawCircleMaze(grid, cfg) {
  const layout = { cx: canvas.width / 2, cy: canvas.height / 2, rings: grid.length, sectors: grid[0].length, maxR: 410 };
  layout.step = layout.maxR / layout.rings;
  if (cfg.showSolution) drawPolyline(solutionPath(grid), (cell) => circleCenter(cell, layout), cfg.theme.accent, Math.max(7, layout.step * 0.26));
  ctx.strokeStyle = cfg.theme.wall;
  ctx.lineWidth = Math.max(3, layout.step * 0.14);
  ctx.lineCap = 'round';
  for (let y = 0; y < layout.rings; y += 1) {
    for (let x = 0; x < layout.sectors; x += 1) {
      const cell = grid[y][x];
      const a1 = (x / layout.sectors) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((x + 1) / layout.sectors) * Math.PI * 2 - Math.PI / 2;
      const r1 = 52 + y * layout.step;
      const r2 = 52 + (y + 1) * layout.step;
      if (cell.walls.n) arc(layout.cx, layout.cy, r1, a1, a2);
      if (cell.walls.s) arc(layout.cx, layout.cy, r2, a1, a2);
      if (cell.walls.w) radial(layout.cx, layout.cy, r1, r2, a1);
      if (cell.walls.e) radial(layout.cx, layout.cy, r1, r2, a2);
    }
  }
  const start = circleCenter(grid[0][0], layout);
  const end = circleCenter(grid.at(-1).at(-1), layout);
  drawMarkers(start[0], start[1], end[0], end[1], cfg);
}

function arc(cx, cy, r, a1, a2) { ctx.beginPath(); ctx.arc(cx, cy, r, a1, a2); ctx.stroke(); }
function radial(cx, cy, r1, r2, a) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke(); }

function drawHouseMaze(grid, cfg, random) {
  const layout = rectLayout(grid);
  const targets = pickHouseTargets(grid, cfg.houseCount);
  if (cfg.showSolution) {
    targets.forEach((cell, index) => {
      drawPolyline(solutionPathTo(cell), (step) => rectCenter(step, layout), solutionColors[index % solutionColors.length], Math.max(6, Math.min(layout.cellW, layout.cellH) * 0.18));
    });
  }
  drawRectMaze(grid, cfg, random, { skipSolution: true, skipMarkers: true });
  drawHouseMarker(...rectCenter(grid[0][0], layout), '🏠', cfg.theme.accent, 'Старт');
  targets.forEach((cell, index) => drawHouseMarker(...rectCenter(cell, layout), `${index + 1}🏡`, solutionColors[index % solutionColors.length], `${index + 1}`));
}

function pickHouseTargets(grid, count) {
  const rows = grid.length;
  const cols = grid[0].length;
  const points = [
    [cols - 1, rows - 1], [cols - 1, 0], [0, rows - 1],
    [Math.floor(cols / 2), rows - 1], [cols - 1, Math.floor(rows / 2)], [Math.floor(cols * 0.7), Math.floor(rows * 0.7)],
  ];
  return points.slice(0, count).map(([x, y]) => grid[y][x]);
}

function drawHouseMarker(x, y, icon, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.font = '30px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x, y + 1);
  ctx.restore();
}

function drawPictureMask(cfg, random) {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = cfg.theme.accent;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 24) {
    const r = 285 + Math.sin(a * 5 + random()) * 55;
    const x = 550 + Math.cos(a) * r;
    const y = 550 + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.font = '210px serif';
  ctx.textAlign = 'center';
  ctx.fillText(cfg.theme.hero, 550, 620);
  ctx.restore();
}

function drawIslands(grid, cfg, layout, random) {
  ctx.save();
  ctx.fillStyle = cfg.theme.path;
  ctx.globalAlpha = 0.72;
  for (let i = 0; i < 20; i += 1) {
    const x = layout.pad + random() * layout.cellW * grid[0].length;
    const y = layout.pad + random() * layout.cellH * grid.length;
    ctx.beginPath();
    ctx.ellipse(x, y, layout.cellW * (1.5 + random()), layout.cellH * (1.1 + random()), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPolyline(path, pointFn, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  path.forEach((cell, index) => {
    const [x, y] = pointFn(cell);
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawMarkers(sx, sy, gx, gy, cfg) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '56px serif';
  ctx.fillText(cfg.theme.hero, sx, sy);
  ctx.fillText(cfg.theme.goal, gx, gy);
  ctx.restore();
}

function drawTitle(cfg) {
  ctx.save();
  ctx.fillStyle = cfg.theme.wall;
  ctx.font = '900 42px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(typeNames[cfg.type], canvas.width / 2, 122);
  ctx.font = '700 24px system-ui, sans-serif';
  const rotated = cfg.rotation ? ` · поворот ${cfg.rotation}°` : '';
  ctx.fillText(`${difficultyNames[cfg.difficulty]} · ${variationNames[cfg.variation]} · тема «${cfg.theme.name}»${rotated}`, canvas.width / 2, 964);
  ctx.restore();
}

function render() {
  const cfg = config();
  const seed = xmur3(`${cfg.seed}-${cfg.type}-${cfg.variation}-${cfg.difficulty}-${cfg.theme.name}-${cfg.houseCount}`)();
  const random = mulberry32(seed);
  const grid = carveMaze(cfg.cols, cfg.rows, random, cfg.variation);

  background(cfg.theme);
  if (cfg.decorate) decorate(cfg.theme, random);
  roundedCard(cfg.theme);
  drawTitle(cfg);
  rotateDrawing(cfg, () => {
    if (cfg.type === 'circle') drawCircleMaze(grid, cfg);
    else if (cfg.type === 'triangle') drawTriangleMaze(grid, cfg);
    else if (cfg.type === 'hex' || cfg.type === 'honey') drawHexMaze(grid, cfg, random);
    else if (cfg.type === 'houses') drawHouseMaze(grid, cfg, random);
    else drawRectMaze(grid, cfg, random);
  });

  controls.title.textContent = typeNames[cfg.type];
  controls.meta.textContent = `${difficultyNames[cfg.difficulty]} · ${variationNames[cfg.variation]} · ${cfg.theme.name}`;
  controls.sizeLabel.textContent = `${cfg.cols} × ${cfg.rows}`;
  controls.houseCountLabel.textContent = `${cfg.houseCount} ${cfg.houseCount === 1 ? 'домик' : cfg.houseCount < 5 ? 'домика' : 'домиков'}`;
}

function randomize() {
  const option = (select) => select.options[Math.floor(Math.random() * select.options.length)].value;
  controls.type.value = option(controls.type);
  controls.variation.value = option(controls.variation);
  controls.difficulty.value = option(controls.difficulty);
  controls.theme.value = option(controls.theme);
  controls.rotation.value = Math.random() > 0.55 ? '45' : '0';
  controls.houseCount.value = String(1 + Math.floor(Math.random() * 6));
  controls.size.value = String(8 + Math.floor(Math.random() * 23));
  controls.seed.value = `journal-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  render();
}

controls.generate.addEventListener('click', render);
controls.random.addEventListener('click', randomize);
controls.download.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `maze-${controls.type.value}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});
['change', 'input'].forEach((eventName) => {
  [controls.type, controls.variation, controls.difficulty, controls.theme, controls.size, controls.houseCount, controls.rotation, controls.showSolution, controls.decorate].forEach((element) => {
    element.addEventListener(eventName, render);
  });
});
controls.seed.addEventListener('change', render);

render();
