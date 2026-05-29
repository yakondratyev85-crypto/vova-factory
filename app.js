const canvas = document.querySelector('#mazeCanvas');
const ctx = canvas.getContext('2d');
const controls = {
  type: document.querySelector('#mazeType'),
  difficulty: document.querySelector('#difficulty'),
  theme: document.querySelector('#theme'),
  size: document.querySelector('#size'),
  sizeLabel: document.querySelector('#sizeLabel'),
  rotation: document.querySelector('#rotation'),
  rotationLabel: document.querySelector('#rotationLabel'),
  stroke: document.querySelector('#stroke'),
  strokeLabel: document.querySelector('#strokeLabel'),
  seed: document.querySelector('#seed'),
  showSolution: document.querySelector('#showSolution'),
  openEntrances: document.querySelector('#openEntrances'),
  invert: document.querySelector('#invert'),
  guide: document.querySelector('#guide'),
  generate: document.querySelector('#generateBtn'),
  random: document.querySelector('#randomBtn'),
  download: document.querySelector('#downloadBtn'),
  svg: document.querySelector('#svgBtn'),
  copyPrompt: document.querySelector('#copyPromptBtn'),
  title: document.querySelector('#mazeTitle'),
  meta: document.querySelector('#mazeMeta'),
  aiPrompt: document.querySelector('#aiPrompt'),
};

const typeNames = {
  rect: 'Классический прямоугольный',
  circle: 'Идеально круговой',
  triangle: 'Треугольная сетка',
  hex: 'Соты / гексагональный',
  spiral: 'Спиральный тоннель',
  crystal: 'Кристалл',
  weave: 'Плетёный',
  wave: 'Волновой',
};

const difficultyNames = { easy: 'Лёгкая', medium: 'Средняя', hard: 'Сложная', expert: 'Экспертная' };
const difficultyScale = { easy: 0.72, medium: 1, hard: 1.25, expert: 1.55 };
const braidAmount = { easy: 0, medium: 0.02, hard: 0.06, expert: 0.12 };
const themes = {
  ink: { name: 'Типографская', bg: '#f8fafc', wall: '#111827', path: '#ffffff', accent: '#ef4444', guide: '#d1d5db' },
  blueprint: { name: 'Чертёжная', bg: '#0f2a4a', wall: '#e0f2fe', path: '#123b66', accent: '#facc15', guide: '#60a5fa' },
  neon: { name: 'Неоновая', bg: '#11111f', wall: '#67e8f9', path: '#17172f', accent: '#f472b6', guide: '#7c3aed' },
  sand: { name: 'Песочная', bg: '#fff7ed', wall: '#7c2d12', path: '#ffedd5', accent: '#059669', guide: '#fed7aa' },
  mint: { name: 'Мятная', bg: '#ecfdf5', wall: '#064e3b', path: '#ffffff', accent: '#2563eb', guide: '#a7f3d0' },
  mono: { name: 'Монохромная', bg: '#ffffff', wall: '#000000', path: '#ffffff', accent: '#6b7280', guide: '#e5e7eb' },
};

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

function carveMaze(cols, rows, random, braid = 0) {
  const grid = makeGrid(cols, rows);
  const stack = [grid[0][0]];
  grid[0][0].visited = true;
  const dirs = [
    ['n', 0, -1, 's'], ['e', 1, 0, 'w'], ['s', 0, 1, 'n'], ['w', -1, 0, 'e'],
  ];

  while (stack.length) {
    const current = stack[stack.length - 1];
    const choices = shuffle([...dirs], random).filter(([, dx, dy]) => {
      const next = grid[current.y + dy]?.[current.x + dx];
      return next && !next.visited;
    });
    if (!choices.length) { stack.pop(); continue; }
    const [dir, dx, dy, back] = choices[0];
    const next = grid[current.y + dy][current.x + dx];
    current.walls[dir] = false;
    next.walls[back] = false;
    next.visited = true;
    next.prev = current;
    stack.push(next);
  }

  if (braid > 0) {
    grid.flat().forEach((cell) => {
      const closed = dirs.filter(([dir, dx, dy]) => cell.walls[dir] && grid[cell.y + dy]?.[cell.x + dx]);
      const open = dirs.length - closed.length;
      if (open === 1 && closed.length && random() < braid) {
        const [dir, dx, dy, back] = closed[Math.floor(random() * closed.length)];
        const next = grid[cell.y + dy][cell.x + dx];
        cell.walls[dir] = false;
        next.walls[back] = false;
      }
    });
  }
  return grid;
}


function makeHexGrid(cols, rows) {
  return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, q) => ({
    x: q,
    y: r,
    visited: false,
    walls: { e: true, ne: true, nw: true, w: true, sw: true, se: true },
    prev: null,
  })));
}

function carveHexMaze(cols, rows, random, braid = 0) {
  const grid = makeHexGrid(cols, rows);
  const stack = [grid[0][0]];
  grid[0][0].visited = true;
  const dirs = [
    ['e', 1, 0, 'w'], ['ne', 1, -1, 'sw'], ['nw', 0, -1, 'se'],
    ['w', -1, 0, 'e'], ['sw', -1, 1, 'ne'], ['se', 0, 1, 'nw'],
  ];

  while (stack.length) {
    const current = stack[stack.length - 1];
    const choices = shuffle([...dirs], random).filter(([, dq, dr]) => {
      const next = grid[current.y + dr]?.[current.x + dq];
      return next && !next.visited;
    });
    if (!choices.length) { stack.pop(); continue; }
    const [dir, dq, dr, back] = choices[0];
    const next = grid[current.y + dr][current.x + dq];
    current.walls[dir] = false;
    next.walls[back] = false;
    next.visited = true;
    next.prev = current;
    stack.push(next);
  }

  if (braid > 0) {
    grid.flat().forEach((cell) => {
      const closed = dirs.filter(([dir, dq, dr]) => cell.walls[dir] && grid[cell.y + dr]?.[cell.x + dq]);
      const open = dirs.length - closed.length;
      if (open <= 2 && closed.length && random() < braid) {
        const [dir, dq, dr, back] = closed[Math.floor(random() * closed.length)];
        const next = grid[cell.y + dr][cell.x + dq];
        cell.walls[dir] = false;
        next.walls[back] = false;
      }
    });
  }
  return grid;
}

function solutionPath(grid) {
  const path = [];
  let current = grid[grid.length - 1][grid[0].length - 1];
  while (current) { path.push(current); current = current.prev; }
  return path.reverse();
}

function config() {
  const type = controls.type.value;
  const base = Number(controls.size.value);
  const scale = difficultyScale[controls.difficulty.value];
  const cols = Math.max(6, Math.min(42, Math.round(base * scale)));
  return {
    type,
    difficulty: controls.difficulty.value,
    theme: themes[controls.theme.value],
    seed: controls.seed.value || 'maze',
    showSolution: controls.showSolution.checked,
    openEntrances: controls.openEntrances.checked,
    invert: controls.invert.checked,
    guide: controls.guide.checked,
    rotation: Number(controls.rotation.value),
    strokeScale: Number(controls.stroke.value) / 100,
    cols,
    rows: Math.max(6, Math.min(42, type === 'circle' ? cols : Math.round(cols * (type === 'wave' ? 0.72 : 1)))),
  };
}

function palette(cfg) {
  if (!cfg.invert) return cfg.theme;
  return { ...cfg.theme, bg: cfg.theme.wall, wall: cfg.theme.path, path: cfg.theme.bg };
}

function fillBackground(cfg) {
  const colors = palette(cfg);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBoard(cfg) {
  const colors = palette(cfg);
  ctx.save();
  ctx.fillStyle = colors.path;
  ctx.strokeStyle = colors.wall;
  ctx.lineWidth = 5;
  ctx.beginPath();
  roundRect(86, 86, 1028, 1028, 34);
  ctx.fill();
  ctx.globalAlpha = 0.14;
  ctx.stroke();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function withRotation(cfg, draw) {
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((cfg.rotation * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  draw();
  ctx.restore();
}

function shouldOpen(cell, wall, grid, cfg) {
  if (!cfg.openEntrances) return false;
  const last = grid[grid.length - 1][grid[0].length - 1];
  return (cell.x === 0 && cell.y === 0 && (wall === 'w' || wall === 'n'))
    || (cell.x === last.x && cell.y === last.y && (wall === 'e' || wall === 's'));
}

function guideLine(cfg, draw) {
  if (!cfg.guide) return;
  ctx.save();
  ctx.strokeStyle = palette(cfg).guide;
  ctx.globalAlpha = 0.34;
  ctx.lineWidth = 1;
  draw();
  ctx.restore();
}

function rectCenter(cell, pad, cellW, cellH, type) {
  let x = pad + cell.x * cellW + cellW / 2;
  let y = pad + cell.y * cellH + cellH / 2;
  if (type === 'wave') {
    x += Math.sin(cell.y * 0.82) * cellW * 0.38;
    y += Math.sin(cell.x * 0.55) * cellH * 0.16;
  }
  if (type === 'spiral') {
    const cx = 600;
    const cy = 600;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    const turn = dist * 0.0026;
    const angle = Math.atan2(dy, dx) + turn;
    x = cx + Math.cos(angle) * dist;
    y = cy + Math.sin(angle) * dist;
  }
  if (type === 'crystal') {
    const cx = 600;
    const cy = 600;
    const dx = x - cx;
    const dy = y - cy;
    const scale = 1 - Math.min(0.22, Math.abs(dx * dy) / 920000);
    x = cx + dx * scale;
    y = cy + dy * scale;
  }
  return [x, y];
}

function drawRectLikeMaze(grid, cfg) {
  const colors = palette(cfg);
  const pad = 170;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const cellW = w / grid[0].length;
  const cellH = h / grid.length;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colors.wall;
  ctx.lineWidth = Math.max(3, Math.min(cellW, cellH) * 0.13 * cfg.strokeScale);

  guideLine(cfg, () => {
    for (let x = 0; x <= grid[0].length; x += 1) {
      ctx.beginPath(); ctx.moveTo(pad + x * cellW, pad); ctx.lineTo(pad + x * cellW, pad + h); ctx.stroke();
    }
    for (let y = 0; y <= grid.length; y += 1) {
      ctx.beginPath(); ctx.moveTo(pad, pad + y * cellH); ctx.lineTo(pad + w, pad + y * cellH); ctx.stroke();
    }
  });

  grid.flat().forEach((cell) => {
    const [cx, cy] = rectCenter(cell, pad, cellW, cellH, cfg.type);
    const halfW = cellW / 2;
    const halfH = cellH / 2;
    const skew = cfg.type === 'weave' && (cell.x + cell.y) % 2 ? cellW * 0.12 : 0;
    ctx.beginPath();
    if (cell.walls.n && !shouldOpen(cell, 'n', grid, cfg)) { ctx.moveTo(cx - halfW + skew, cy - halfH); ctx.lineTo(cx + halfW + skew, cy - halfH); }
    if (cell.walls.e && !shouldOpen(cell, 'e', grid, cfg)) { ctx.moveTo(cx + halfW, cy - halfH + skew); ctx.lineTo(cx + halfW, cy + halfH + skew); }
    if (cell.walls.s && !shouldOpen(cell, 's', grid, cfg)) { ctx.moveTo(cx + halfW - skew, cy + halfH); ctx.lineTo(cx - halfW - skew, cy + halfH); }
    if (cell.walls.w && !shouldOpen(cell, 'w', grid, cfg)) { ctx.moveTo(cx - halfW, cy + halfH - skew); ctx.lineTo(cx - halfW, cy - halfH - skew); }
    ctx.stroke();
  });

  if (cfg.showSolution) {
    drawPointSolution(solutionPath(grid).map((cell) => rectCenter(cell, pad, cellW, cellH, cfg.type)), cfg, Math.min(cellW, cellH));
  }
  drawMarkers(...rectCenter(grid[0][0], pad, cellW, cellH, cfg.type), ...rectCenter(grid[grid.length - 1][grid[0].length - 1], pad, cellW, cellH, cfg.type), cfg);
}

function triangleCenter(cellData, pad, cell, height) {
  return [pad + cellData.x * cell + cell / 2, pad + cellData.y * height + height / 2];
}

function triangleCenter(cellData, pad, cell, height) {
  return [pad + cellData.x * cell + cell / 2, pad + cellData.y * height + height / 2];
}

function drawTriangleMaze(grid, cfg) {
  const colors = palette(cfg);
  const pad = 148;
  const w = canvas.width - pad * 2;
  const cell = w / grid[0].length;
  const height = cell * 0.86;
  ctx.strokeStyle = colors.wall;
  ctx.lineWidth = Math.max(3, cell * 0.11 * cfg.strokeScale);
  ctx.lineJoin = 'round';
  grid.flat().forEach((mazeCell) => {
    const up = (mazeCell.x + mazeCell.y) % 2 === 0;
    const x = pad + mazeCell.x * cell;
    const y = pad + mazeCell.y * height;
    const points = up
      ? [[x, y + height], [x + cell / 2, y], [x + cell, y + height]]
      : [[x, y], [x + cell, y], [x + cell / 2, y + height]];
    const wallKeys = ['w', 'n', 'e'];
    points.forEach((point, index) => {
      const wall = wallKeys[index];
      if (!mazeCell.walls[wall] || shouldOpen(mazeCell, wall, grid, cfg)) return;
      const next = points[(index + 1) % points.length];
      ctx.beginPath(); ctx.moveTo(point[0], point[1]); ctx.lineTo(next[0], next[1]); ctx.stroke();
    });
  });
  if (cfg.showSolution) {
    drawPointSolution(solutionPath(grid).map((cellData) => triangleCenter(cellData, pad, cell, height)), cfg, cell);
  }
  drawMarkers(pad + cell * 0.5, pad + height * 0.5, pad + w - cell * 0.5, pad + grid.length * height - height * 0.5, cfg);
}

function hexCenter(cellData, pad, radius, h) {
  return [pad + radius + cellData.x * radius * 1.5, pad + radius + cellData.y * h + (cellData.x % 2 ? h / 2 : 0)];
}

function drawHexMaze(grid, cfg) {
  const colors = palette(cfg);
  const pad = 150;
  const radius = (canvas.width - pad * 2) / (grid[0].length * 1.75);
  const h = Math.sqrt(3) * radius;
  ctx.strokeStyle = colors.wall;
  ctx.lineWidth = Math.max(3, radius * 0.14 * cfg.strokeScale);
  grid.flat().forEach((cell) => {
    const [cx, cy] = hexCenter(cell, pad, radius, h);
    const pts = Array.from({ length: 6 }, (_, i) => {
      const angle = Math.PI / 6 + (Math.PI * 2 * i) / 6;
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    });
    ['n', 'e', 's', 'w'].forEach((key, index) => {
      if (!cell.walls[key] || shouldOpen(cell, key, grid, cfg)) return;
      const a = (index + 5) % 6;
      const b = (index + 1) % 6;
      ctx.beginPath(); ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); ctx.stroke();
    });
  });
  if (cfg.showSolution) {
    drawPointSolution(solutionPath(grid).map((cellData) => hexCenter(cellData, pad, radius, h)), cfg, radius);
  }
  drawMarkers(...hexCenter(grid[0][0], pad, radius, h), ...hexCenter(grid[grid.length - 1][grid[0].length - 1], pad, radius, h), cfg);
}

function circleCenter(cellData, sectors, step) {
  const angle = ((cellData.x + 0.5) / sectors) * Math.PI * 2 - Math.PI / 2;
  const radius = 58 + (cellData.y + 0.5) * step;
  return [canvas.width / 2 + Math.cos(angle) * radius, canvas.height / 2 + Math.sin(angle) * radius];
}

function circleCenter(cellData, sectors, step) {
  const angle = ((cellData.x + 0.5) / sectors) * Math.PI * 2 - Math.PI / 2;
  const radius = 52 + (cellData.y + 0.5) * step;
  return [canvas.width / 2 + Math.cos(angle) * radius, canvas.height / 2 + Math.sin(angle) * radius];
}

function drawCircleMaze(grid, cfg) {
  const colors = palette(cfg);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rings = grid.length;
  const sectors = grid[0].length;
  const maxR = 440;
  const step = maxR / rings;
  ctx.strokeStyle = colors.wall;
  ctx.lineWidth = Math.max(3, step * 0.14 * cfg.strokeScale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  guideLine(cfg, () => {
    for (let ring = 1; ring <= rings; ring += 1) arc(cx, cy, 58 + ring * step, 0, Math.PI * 2);
    for (let sector = 0; sector < sectors; sector += 1) radial(cx, cy, 58, 58 + maxR, (sector / sectors) * Math.PI * 2 - Math.PI / 2);
  });
  for (let y = 0; y < rings; y += 1) {
    for (let x = 0; x < sectors; x += 1) {
      const cell = grid[y][x];
      const a1 = (x / sectors) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((x + 1) / sectors) * Math.PI * 2 - Math.PI / 2;
      const r1 = 58 + y * step;
      const r2 = 58 + (y + 1) * step;
      if (cell.walls.n && !shouldOpen(cell, 'n', grid, cfg)) arc(cx, cy, r1, a1, a2);
      if (cell.walls.s && !shouldOpen(cell, 's', grid, cfg)) arc(cx, cy, r2, a1, a2);
      if (cell.walls.w && !shouldOpen(cell, 'w', grid, cfg)) radial(cx, cy, r1, r2, a1);
      if (cell.walls.e && !shouldOpen(cell, 'e', grid, cfg)) radial(cx, cy, r1, r2, a2);
    }
  }
  if (cfg.showSolution) {
    drawPointSolution(solutionPath(grid).map((cellData) => circleCenter(cellData, sectors, step)), cfg, step);
  }
  drawMarkers(...circleCenter(grid[0][0], sectors, step), ...circleCenter(grid[grid.length - 1][grid[0].length - 1], sectors, step), cfg);
}

function arc(cx, cy, r, a1, a2) { ctx.beginPath(); ctx.arc(cx, cy, r, a1, a2); ctx.stroke(); }
function radial(cx, cy, r1, r2, a) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke(); }

function drawPointSolution(points, cfg, scale) {
  const colors = palette(cfg);
  ctx.save();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = Math.max(6, scale * 0.22 * cfg.strokeScale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = width;
  ctx.globalAlpha = 1;
  ctx.setLineDash([width * 2.8, width * 1.4]);
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSolution(path, pad, cellW, cellH, cfg) {
  drawPointSolution(path.map((cell) => [pad + cell.x * cellW + cellW / 2, pad + cell.y * cellH + cellH / 2]), cfg, Math.min(cellW, cellH));
}

function drawMarkers(sx, sy, gx, gy, cfg) {
  const colors = palette(cfg);
  ctx.save();
  ctx.fillStyle = colors.accent;
  ctx.strokeStyle = colors.path;
  ctx.lineWidth = 5;
  [[sx, sy, 'S'], [gx, gy, 'F']].forEach(([x, y, label]) => {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.path;
    ctx.font = '900 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 1);
    ctx.fillStyle = colors.accent;
  });
  ctx.restore();
}

function drawTitle(cfg) {
  const colors = palette(cfg);
  ctx.save();
  ctx.fillStyle = colors.wall;
  ctx.font = '900 38px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(typeNames[cfg.type], canvas.width / 2, 68);
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillText(`${difficultyNames[cfg.difficulty]} · ${cfg.theme.name} · поворот ${cfg.rotation}°`, canvas.width / 2, 1158);
  ctx.restore();
}

function aiPrompt(cfg) {
  return `Clean printable ${typeNames[cfg.type].toLowerCase()} maze, ${difficultyNames[cfg.difficulty].toLowerCase()} difficulty, ${cfg.theme.name.toLowerCase()} palette, no characters, no icons, no text, pure geometric walls, rotated ${cfg.rotation} degrees, suitable for children's magazine activity page.`;
}

function render() {
  const cfg = config();
  const seed = xmur3(`${cfg.seed}-${cfg.type}-${cfg.difficulty}-${cfg.theme.name}-${cfg.rotation}`)();
  const random = mulberry32(seed);
  const grid = carveMaze(cfg.cols, cfg.rows, random, braidAmount[cfg.difficulty] + (cfg.type === 'weave' ? 0.1 : 0));

  fillBackground(cfg);
  drawBoard(cfg);
  withRotation(cfg, () => {
    if (cfg.type === 'circle') drawCircleMaze(grid, cfg);
    else if (cfg.type === 'triangle') drawTriangleMaze(grid, cfg);
    else if (cfg.type === 'hex') drawHexMaze(grid, cfg);
    else drawRectLikeMaze(grid, cfg);
  });
  drawTitle(cfg);

  controls.title.textContent = typeNames[cfg.type];
  controls.meta.textContent = `${difficultyNames[cfg.difficulty]} · ${cfg.theme.name} · ${cfg.rotation}°`;
  controls.sizeLabel.textContent = `${cfg.cols} × ${cfg.rows}`;
  controls.rotationLabel.textContent = `${cfg.rotation}°`;
  controls.strokeLabel.textContent = `${controls.stroke.value}%`;
  controls.aiPrompt.value = aiPrompt(cfg);
}

function randomize() {
  const option = (select) => select.options[Math.floor(Math.random() * select.options.length)].value;
  controls.type.value = option(controls.type);
  controls.difficulty.value = option(controls.difficulty);
  controls.theme.value = option(controls.theme);
  controls.size.value = String(8 + Math.floor(Math.random() * 23));
  controls.rotation.value = String((Math.floor(Math.random() * 73) - 36) * 5);
  controls.stroke.value = String(70 + Math.floor(Math.random() * 23) * 5);
  controls.invert.checked = Math.random() > 0.7;
  controls.guide.checked = Math.random() > 0.65;
  controls.seed.value = `maze-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  render();
}

function download(name, href) {
  const link = document.createElement('a');
  link.download = name;
  link.href = href;
  link.click();
}

controls.generate.addEventListener('click', render);
controls.random.addEventListener('click', randomize);
controls.download.addEventListener('click', () => download(`maze-${controls.type.value}-${Date.now()}.png`, canvas.toDataURL('image/png')));
controls.svg.addEventListener('click', () => {
  const data = canvas.toDataURL('image/png');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><image href="${data}" width="1200" height="1200"/></svg>`;
  download(`maze-${controls.type.value}-${Date.now()}.svg`, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
});
controls.copyPrompt.addEventListener('click', () => {
  controls.aiPrompt.select();
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(controls.aiPrompt.value);
  }
});
['change', 'input'].forEach((eventName) => {
  [
    controls.type, controls.difficulty, controls.theme, controls.size, controls.rotation, controls.stroke,
    controls.showSolution, controls.openEntrances, controls.invert, controls.guide,
  ].forEach((element) => {
    element.addEventListener(eventName, render);
  });
});
controls.seed.addEventListener('change', render);

render();
