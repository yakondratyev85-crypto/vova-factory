const canvas = document.querySelector('#mazeCanvas');
const ctx = canvas.getContext('2d');
const controls = {
  type: document.querySelector('#mazeType'),
  difficulty: document.querySelector('#difficulty'),
  theme: document.querySelector('#theme'),
  size: document.querySelector('#size'),
  sizeLabel: document.querySelector('#sizeLabel'),
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
  islands: 'Острова и мостики',
  picture: 'Картинка по каркасу',
};

const difficultyNames = { easy: 'Лёгкая', medium: 'Средняя', hard: 'Сложная', expert: 'Экспертная' };
const difficultyScale = { easy: 0.72, medium: 1, hard: 1.25, expert: 1.55 };
const themes = {
  space: { name: 'Космос', bg: ['#18204a', '#4b3ba8'], wall: '#fff6c9', path: '#82eaff', accent: '#ffcf5c', hero: '🚀', goal: '🪐', bits: ['✦', '★', '☄'] },
  jungle: { name: 'Джунгли', bg: ['#d9f99d', '#22c55e'], wall: '#245c38', path: '#fef08a', accent: '#f97316', hero: '🐒', goal: '🍌', bits: ['🌿', '🦜', '🌺'] },
  sea: { name: 'Море', bg: ['#cffafe', '#38bdf8'], wall: '#075985', path: '#fef3c7', accent: '#fb7185', hero: '🐠', goal: '🏝️', bits: ['🐚', '⭐', '🌊'] },
  candy: { name: 'Сладости', bg: ['#ffe4f2', '#f9a8d4'], wall: '#9d174d', path: '#ffffff', accent: '#8b5cf6', hero: '🍭', goal: '🧁', bits: ['🍬', '✨', '🍓'] },
  dino: { name: 'Динозавры', bg: ['#fef3c7', '#84cc16'], wall: '#365314', path: '#fff7ed', accent: '#dc2626', hero: '🦕', goal: '🥚', bits: ['🦴', '🌋', '🌱'] },
  fairy: { name: 'Сказка', bg: ['#f5d0fe', '#c4b5fd'], wall: '#581c87', path: '#fff1f2', accent: '#f59e0b', hero: '🧚', goal: '🏰', bits: ['✨', '🌙', '💎'] },
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

function solutionPath(grid) {
  const path = [];
  let current = grid[grid.length - 1][grid[0].length - 1];
  while (current) { path.push(current); current = current.prev; }
  return path.reverse();
}

function config() {
  const base = Number(controls.size.value);
  const scale = difficultyScale[controls.difficulty.value];
  const cols = Math.round(base * scale);
  return {
    type: controls.type.value,
    difficulty: controls.difficulty.value,
    theme: themes[controls.theme.value],
    seed: controls.seed.value || 'maze',
    decorate: controls.decorate.checked,
    showSolution: controls.showSolution.checked,
    cols: Math.max(6, Math.min(42, cols)),
    rows: Math.max(6, Math.min(42, Math.round(cols * (controls.type.value === 'circle' ? 0.7 : 1)))),
  };
}

function background(theme) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, theme.bg[0]);
  gradient.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function roundedCard(theme) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 8;
  roundRect(72, 72, 956, 956, 54);
  ctx.fill();
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
  ctx.font = '52px serif';
  for (let i = 0; i < 42; i += 1) {
    const symbol = theme.bits[i % theme.bits.length];
    ctx.globalAlpha = 0.55 + random() * 0.35;
    ctx.fillText(symbol, 35 + random() * 1030, 45 + random() * 1020);
  }
  ctx.globalAlpha = 1;
  ctx.font = '92px serif';
  ctx.fillText(theme.hero, 88, 990);
  ctx.fillText(theme.goal, 920, 150);
  ctx.restore();
}

function drawRectMaze(grid, cfg, random) {
  const pad = 150;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const cellW = w / grid[0].length;
  const cellH = h / grid.length;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = cfg.theme.wall;
  ctx.lineWidth = Math.max(3, Math.min(cellW, cellH) * 0.13);

  if (cfg.type === 'picture') drawPictureMask(cfg, random);
  if (cfg.type === 'islands') drawIslands(grid, cfg, pad, cellW, cellH, random);

  grid.flat().forEach((cell) => {
    const x = pad + cell.x * cellW;
    const y = pad + cell.y * cellH;
    ctx.beginPath();
    if (cell.walls.n) { ctx.moveTo(x, y); ctx.lineTo(x + cellW, y); }
    if (cell.walls.e) { ctx.moveTo(x + cellW, y); ctx.lineTo(x + cellW, y + cellH); }
    if (cell.walls.s) { ctx.moveTo(x + cellW, y + cellH); ctx.lineTo(x, y + cellH); }
    if (cell.walls.w) { ctx.moveTo(x, y + cellH); ctx.lineTo(x, y); }
    ctx.stroke();
  });

  drawMarkers(pad + cellW * 0.5, pad + cellH * 0.5, pad + w - cellW * 0.5, pad + h - cellH * 0.5, cfg);
  if (cfg.showSolution) drawSolution(solutionPath(grid), pad, cellW, cellH, cfg);
}

function drawTriangleMaze(grid, cfg) {
  const pad = 130;
  const w = canvas.width - pad * 2;
  const cell = w / grid[0].length;
  const height = cell * 0.86;
  ctx.strokeStyle = cfg.theme.wall;
  ctx.lineWidth = Math.max(3, cell * 0.11);
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
      if (!mazeCell.walls[wallKeys[index]]) return;
      const next = points[(index + 1) % points.length];
      ctx.beginPath(); ctx.moveTo(point[0], point[1]); ctx.lineTo(next[0], next[1]); ctx.stroke();
    });
  });
  drawMarkers(pad + cell * 0.5, pad + height * 0.5, pad + w - cell * 0.5, pad + grid.length * height - height * 0.5, cfg);
}

function drawHexMaze(grid, cfg) {
  const pad = 140;
  const radius = (canvas.width - pad * 2) / (grid[0].length * 1.75);
  const h = Math.sqrt(3) * radius;
  ctx.strokeStyle = cfg.theme.wall;
  ctx.lineWidth = Math.max(3, radius * 0.14);
  grid.flat().forEach((cell) => {
    const cx = pad + radius + cell.x * radius * 1.5;
    const cy = pad + radius + cell.y * h + (cell.x % 2 ? h / 2 : 0);
    const pts = Array.from({ length: 6 }, (_, i) => {
      const angle = Math.PI / 6 + (Math.PI * 2 * i) / 6;
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    });
    ['n', 'e', 's', 'w'].forEach((key, index) => {
      if (!cell.walls[key]) return;
      const a = (index + 5) % 6;
      const b = (index + 1) % 6;
      ctx.beginPath(); ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); ctx.stroke();
    });
  });
  drawMarkers(pad + radius, pad + radius, pad + radius + (grid[0].length - 1) * radius * 1.5, pad + radius + (grid.length - 1) * h, cfg);
}

function drawCircleMaze(grid, cfg) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rings = grid.length;
  const sectors = grid[0].length;
  const maxR = 410;
  const step = maxR / rings;
  ctx.strokeStyle = cfg.theme.wall;
  ctx.lineWidth = Math.max(3, step * 0.14);
  for (let y = 0; y < rings; y += 1) {
    for (let x = 0; x < sectors; x += 1) {
      const cell = grid[y][x];
      const a1 = (x / sectors) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((x + 1) / sectors) * Math.PI * 2 - Math.PI / 2;
      const r1 = 52 + y * step;
      const r2 = 52 + (y + 1) * step;
      if (cell.walls.n) arc(cx, cy, r1, a1, a2);
      if (cell.walls.s) arc(cx, cy, r2, a1, a2);
      if (cell.walls.w) radial(cx, cy, r1, r2, a1);
      if (cell.walls.e) radial(cx, cy, r1, r2, a2);
    }
  }
  drawMarkers(cx, cy - 32, cx, cy + maxR - step / 2, cfg);
}

function arc(cx, cy, r, a1, a2) { ctx.beginPath(); ctx.arc(cx, cy, r, a1, a2); ctx.stroke(); }
function radial(cx, cy, r1, r2, a) { ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke(); }

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

function drawIslands(grid, cfg, pad, cellW, cellH, random) {
  ctx.save();
  ctx.fillStyle = cfg.theme.path;
  ctx.globalAlpha = 0.72;
  for (let i = 0; i < 16; i += 1) {
    const x = pad + random() * cellW * grid[0].length;
    const y = pad + random() * cellH * grid.length;
    ctx.beginPath();
    ctx.ellipse(x, y, cellW * (1.6 + random()), cellH * (1.2 + random()), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSolution(path, pad, cellW, cellH, cfg) {
  ctx.save();
  ctx.strokeStyle = cfg.theme.accent;
  ctx.lineWidth = Math.max(7, Math.min(cellW, cellH) * 0.24);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  path.forEach((cell, index) => {
    const x = pad + cell.x * cellW + cellW / 2;
    const y = pad + cell.y * cellH + cellH / 2;
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
  ctx.fillText(`${difficultyNames[cfg.difficulty]} сложность · тема «${cfg.theme.name}»`, canvas.width / 2, 964);
  ctx.restore();
}

function render() {
  const cfg = config();
  const seed = xmur3(`${cfg.seed}-${cfg.type}-${cfg.difficulty}-${cfg.theme.name}`)();
  const random = mulberry32(seed);
  const grid = carveMaze(cfg.cols, cfg.rows, random, cfg.difficulty === 'expert' ? 0.06 : 0);

  background(cfg.theme);
  if (cfg.decorate) decorate(cfg.theme, random);
  roundedCard(cfg.theme);
  drawTitle(cfg);
  if (cfg.type === 'circle') drawCircleMaze(grid, cfg);
  else if (cfg.type === 'triangle') drawTriangleMaze(grid, cfg);
  else if (cfg.type === 'hex') drawHexMaze(grid, cfg);
  else drawRectMaze(grid, cfg, random);

  controls.title.textContent = typeNames[cfg.type];
  controls.meta.textContent = `${difficultyNames[cfg.difficulty]} · ${cfg.theme.name}`;
  controls.sizeLabel.textContent = `${cfg.cols} × ${cfg.rows}`;
}

function randomize() {
  const option = (select) => select.options[Math.floor(Math.random() * select.options.length)].value;
  controls.type.value = option(controls.type);
  controls.difficulty.value = option(controls.difficulty);
  controls.theme.value = option(controls.theme);
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
  [controls.type, controls.difficulty, controls.theme, controls.size, controls.showSolution, controls.decorate].forEach((element) => {
    element.addEventListener(eventName, render);
  });
});
controls.seed.addEventListener('change', render);

render();
