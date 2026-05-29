function fallbackControl(value = '', checked = false) {
  return {
    value,
    checked,
    textContent: '',
    options: [{ value }],
    addEventListener: () => {},
    select: () => {},
  };
}

function requiredElement(selector) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Не найден обязательный элемент ${selector}`);
  return element;
}

function optionalControl(selector, value = '', checked = false) {
  return document.querySelector(selector) || fallbackControl(value, checked);
}

const canvas = requiredElement('#mazeCanvas');
const ctx = canvas.getContext('2d');
const controls = {
  type: optionalControl('#mazeType', 'rect'),
  difficulty: optionalControl('#difficulty', 'medium'),
  pattern: optionalControl('#pattern', 'balanced'),
  theme: optionalControl('#theme', 'ink'),
  size: optionalControl('#size', '16'),
  sizeLabel: optionalControl('#sizeLabel'),
  rotation: optionalControl('#rotation', '0'),
  rotationLabel: optionalControl('#rotationLabel'),
  stroke: optionalControl('#stroke', '110'),
  strokeLabel: optionalControl('#strokeLabel'),
  seed: optionalControl('#seed', 'journal-001'),
  showSolution: optionalControl('#showSolution'),
  openEntrances: optionalControl('#openEntrances', '', true),
  invert: optionalControl('#invert'),
  guide: optionalControl('#guide'),
  generate: optionalControl('#generateBtn'),
  random: optionalControl('#randomBtn'),
  download: optionalControl('#downloadBtn'),
  svg: optionalControl('#svgBtn'),
  copyPrompt: optionalControl('#copyPromptBtn'),
  title: optionalControl('#mazeTitle'),
  meta: optionalControl('#mazeMeta'),
  aiPrompt: optionalControl('#aiPrompt'),
};

const typeNames = {
  rect: 'Классический прямоугольный',
  circle: 'Идеально круговой',
  triangle: 'Треугольная сетка',
  hex: 'Соты / гексагональный',
  spiral: 'Прямолинейная спираль',
  crystal: 'Кристалл с прямыми гранями',
  weave: 'Плетёный ортогональный',
  wave: 'Ломаный ортогональный',
};

const difficultyNames = { easy: 'Лёгкая', medium: 'Средняя', hard: 'Сложная', expert: 'Экспертная' };
const difficultyScale = { easy: 0.72, medium: 1, hard: 1.25, expert: 1.55 };
const braidAmount = { easy: 0, medium: 0.015, hard: 0.04, expert: 0.08 };
const patternNames = { balanced: 'Сбалансированный', corridors: 'Длинные коридоры', turns: 'Больше поворотов' };
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

function orderDirections(dirs, current, random, pattern) {
  const shuffled = shuffle([...dirs], random);
  if (pattern === 'corridors' && current.fromDir) {
    return shuffled.sort((a, b) => Number(b[0] === current.fromDir) - Number(a[0] === current.fromDir));
  }
  if (pattern === 'turns' && current.fromDir) {
    return shuffled.sort((a, b) => Number(a[0] === current.fromDir) - Number(b[0] === current.fromDir));
  }
  return shuffled;
}

function carveMaze(cols, rows, random, braid = 0, pattern = 'balanced') {
  const grid = makeGrid(cols, rows);
  const stack = [grid[0][0]];
  grid[0][0].visited = true;
  const dirs = [
    ['n', 0, -1, 's'], ['e', 1, 0, 'w'], ['s', 0, 1, 'n'], ['w', -1, 0, 'e'],
  ];

  while (stack.length) {
    const current = stack[stack.length - 1];
    const choices = orderDirections(dirs, current, random, pattern).filter(([, dx, dy]) => {
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
    next.fromDir = dir;
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

function carveHexMaze(cols, rows, random, braid = 0, pattern = 'balanced') {
  const grid = makeHexGrid(cols, rows);
  const stack = [grid[0][0]];
  grid[0][0].visited = true;
  const dirs = [
    ['e', 1, 0, 'w'], ['ne', 1, -1, 'sw'], ['nw', 0, -1, 'se'],
    ['w', -1, 0, 'e'], ['sw', -1, 1, 'ne'], ['se', 0, 1, 'nw'],
  ];

  while (stack.length) {
    const current = stack[stack.length - 1];
    const choices = orderDirections(dirs, current, random, pattern).filter(([, dq, dr]) => {
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
    next.fromDir = dir;
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
  const type = typeNames[controls.type.value] ? controls.type.value : 'rect';
  const difficulty = difficultyNames[controls.difficulty.value] ? controls.difficulty.value : 'medium';
  const pattern = patternNames[controls.pattern.value] ? controls.pattern.value : 'balanced';
  const themeKey = themes[controls.theme.value] ? controls.theme.value : 'ink';
  const base = Number(controls.size.value) || 16;
  const scale = difficultyScale[difficulty];
  const cols = Math.max(6, Math.min(42, Math.round(base * scale)));
  return {
    type,
    difficulty,
    pattern,
    theme: themes[themeKey],
    seed: controls.seed.value || 'maze',
    showSolution: controls.showSolution.checked,
    openEntrances: controls.openEntrances.checked,
    invert: controls.invert.checked,
    guide: controls.guide.checked,
    rotation: Number(controls.rotation.value) || 0,
    strokeScale: (Number(controls.stroke.value) || 110) / 100,
    cols,
    rows: Math.max(6, Math.min(42, type === 'circle' || type === 'hex' ? cols : cols)),
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
  return (cell.x === 0 && cell.y === 0 && ['w', 'n', 'nw'].includes(wall))
    || (cell.x === last.x && cell.y === last.y && ['e', 's', 'se'].includes(wall));
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


function segmentKey(x1, y1, x2, y2) {
  const a = [Math.round(x1 * 1000), Math.round(y1 * 1000)];
  const b = [Math.round(x2 * 1000), Math.round(y2 * 1000)];
  const first = a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? a : b;
  const second = first === a ? b : a;
  return `${first[0]},${first[1]}:${second[0]},${second[1]}`;
}

function uniqueSegments(segments) {
  const map = new Map();
  segments.forEach((segment) => {
    map.set(segmentKey(...segment), segment);
  });
  return [...map.values()];
}

function drawMergedOrthogonalSegments(segments) {
  const horizontal = new Map();
  const vertical = new Map();
  uniqueSegments(segments).forEach(([x1, y1, x2, y2]) => {
    if (Math.abs(y1 - y2) < 0.001) {
      const y = Math.round(y1 * 1000) / 1000;
      if (!horizontal.has(y)) horizontal.set(y, []);
      horizontal.get(y).push([Math.min(x1, x2), Math.max(x1, x2)]);
    } else if (Math.abs(x1 - x2) < 0.001) {
      const x = Math.round(x1 * 1000) / 1000;
      if (!vertical.has(x)) vertical.set(x, []);
      vertical.get(x).push([Math.min(y1, y2), Math.max(y1, y2)]);
    }
  });

  ctx.beginPath();
  horizontal.forEach((ranges, y) => {
    if (!ranges.length) return;
    ranges.sort((a, b) => a[0] - b[0]);
    let [start, end] = ranges[0];
    for (let i = 1; i < ranges.length; i += 1) {
      const [nextStart, nextEnd] = ranges[i];
      if (nextStart <= end + 0.001) end = Math.max(end, nextEnd);
      else { ctx.moveTo(start, y); ctx.lineTo(end, y); [start, end] = [nextStart, nextEnd]; }
    }
    ctx.moveTo(start, y); ctx.lineTo(end, y);
  });
  vertical.forEach((ranges, x) => {
    if (!ranges.length) return;
    ranges.sort((a, b) => a[0] - b[0]);
    let [start, end] = ranges[0];
    for (let i = 1; i < ranges.length; i += 1) {
      const [nextStart, nextEnd] = ranges[i];
      if (nextStart <= end + 0.001) end = Math.max(end, nextEnd);
      else { ctx.moveTo(x, start); ctx.lineTo(x, end); [start, end] = [nextStart, nextEnd]; }
    }
    ctx.moveTo(x, start); ctx.lineTo(x, end);
  });
  ctx.stroke();
}

function drawUniqueSegments(segments) {
  ctx.beginPath();
  uniqueSegments(segments).forEach(([x1, y1, x2, y2]) => {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  });
  ctx.stroke();
}

function rectCenter(cell, pad, cellW, cellH) {
  return [pad + cell.x * cellW + cellW / 2, pad + cell.y * cellH + cellH / 2];
}

function orthogonalVariantOffset() {
  return [0, 0];
}

function drawRectLikeMaze(grid, cfg) {
  const colors = palette(cfg);
  const pad = 170;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const cellW = w / grid[0].length;
  const cellH = h / grid.length;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
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

  const segments = [];
  grid.flat().forEach((cell) => {
    const [cx, cy] = rectCenter(cell, pad, cellW, cellH);
    const halfW = cellW / 2;
    const halfH = cellH / 2;
    if (cell.walls.n && !shouldOpen(cell, 'n', grid, cfg)) segments.push([cx - halfW, cy - halfH, cx + halfW, cy - halfH]);
    if (cell.walls.e && !shouldOpen(cell, 'e', grid, cfg)) segments.push([cx + halfW, cy - halfH, cx + halfW, cy + halfH]);
    if (cell.walls.s && !shouldOpen(cell, 's', grid, cfg)) segments.push([cx + halfW, cy + halfH, cx - halfW, cy + halfH]);
    if (cell.walls.w && !shouldOpen(cell, 'w', grid, cfg)) segments.push([cx - halfW, cy + halfH, cx - halfW, cy - halfH]);
  });
  drawMergedOrthogonalSegments(segments);

  drawOrthogonalVariantGuide(cfg, pad, w, h, cellW, cellH);
  if (cfg.showSolution) {
    drawPointSolution(solutionPath(grid).map((cell) => rectCenter(cell, pad, cellW, cellH)), cfg, Math.min(cellW, cellH));
  }
  drawMarkers(...rectCenter(grid[0][0], pad, cellW, cellH), ...rectCenter(grid[grid.length - 1][grid[0].length - 1], pad, cellW, cellH), cfg);
}

function drawOrthogonalVariantGuide(cfg, pad, width, height, cellW, cellH) {
  if (!['spiral', 'crystal', 'wave'].includes(cfg.type)) return;
  const colors = palette(cfg);
  ctx.save();
  ctx.strokeStyle = colors.guide;
  ctx.lineWidth = Math.max(2, Math.min(cellW, cellH) * 0.045 * cfg.strokeScale);
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  if (cfg.type === 'spiral') {
    let left = pad + cellW;
    let top = pad + cellH;
    let right = pad + width - cellW;
    let bottom = pad + height - cellH;
    while (left < right && top < bottom) {
      ctx.moveTo(left, top); ctx.lineTo(right, top); ctx.lineTo(right, bottom); ctx.lineTo(left, bottom); ctx.lineTo(left, top + cellH);
      left += cellW * 1.8; top += cellH * 1.8; right -= cellW * 1.8; bottom -= cellH * 1.8;
    }
  } else if (cfg.type === 'crystal') {
    ctx.moveTo(600, pad); ctx.lineTo(pad + width, 600); ctx.lineTo(600, pad + height); ctx.lineTo(pad, 600); ctx.closePath();
    ctx.moveTo(600, pad); ctx.lineTo(600, pad + height); ctx.moveTo(pad, 600); ctx.lineTo(pad + width, 600);
  } else {
    for (let y = 0; y <= height; y += cellH * 2) {
      ctx.moveTo(pad, pad + y); ctx.lineTo(pad + width, pad + y + cellH);
    }
  }
  ctx.stroke();
  ctx.restore();
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

function hexMetrics(grid) {
  const cols = grid[0].length;
  const rows = grid.length;
  const availableW = 900;
  const availableH = 900;
  const radius = Math.min(availableW / (Math.sqrt(3) * (cols + rows / 2 + 0.5)), availableH / (1.5 * rows + 0.5));
  const width = Math.sqrt(3) * radius * (cols + rows / 2);
  const height = radius * (1.5 * rows + 0.5);
  return { radius, originX: (canvas.width - width) / 2 + radius, originY: (canvas.height - height) / 2 + radius };
}

function hexCenter(cellData, metrics) {
  return [
    metrics.originX + Math.sqrt(3) * metrics.radius * (cellData.x + cellData.y / 2),
    metrics.originY + 1.5 * metrics.radius * cellData.y,
  ];
}

function drawHexMaze(grid, cfg) {
  const colors = palette(cfg);
  const metrics = hexMetrics(grid);
  const radius = metrics.radius;
  const sideSegments = {
    ne: [0, 1], nw: [1, 2], w: [2, 3], sw: [3, 4], se: [4, 5], e: [5, 0],
  };
  ctx.strokeStyle = colors.wall;
  ctx.lineWidth = Math.max(3, radius * 0.16 * cfg.strokeScale);
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  const segments = [];
  grid.flat().forEach((cell) => {
    const [cx, cy] = hexCenter(cell, metrics);
    const pts = Array.from({ length: 6 }, (_, i) => {
      const angle = Math.PI / 6 + (Math.PI * 2 * i) / 6;
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    });
    Object.entries(sideSegments).forEach(([key, [a, b]]) => {
      if (!cell.walls[key] || shouldOpen(cell, key, grid, cfg)) return;
      segments.push([pts[a][0], pts[a][1], pts[b][0], pts[b][1]]);
    });
  });
  drawUniqueSegments(segments);
  if (cfg.showSolution) {
    drawPointSolution(solutionPath(grid).map((cellData) => hexCenter(cellData, metrics)), cfg, radius);
  }
  drawMarkers(...hexCenter(grid[0][0], metrics), ...hexCenter(grid[grid.length - 1][grid[0].length - 1], metrics), cfg);
}

function circleCenter(cellData, sectors, step) {
  const angle = ((cellData.x + 0.5) / sectors) * Math.PI * 2 - Math.PI / 2;
  const radius = 58 + (cellData.y + 0.5) * step;
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
  const width = Math.max(5, scale * 0.18 * cfg.strokeScale);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colors.path;
  ctx.lineWidth = width + Math.max(6, width * 0.85);
  ctx.globalAlpha = 0.96;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = width;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
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
  return `Clean printable ${typeNames[cfg.type].toLowerCase()} maze, ${difficultyNames[cfg.difficulty].toLowerCase()} difficulty, ${patternNames[cfg.pattern].toLowerCase()} corridor style, ${cfg.theme.name.toLowerCase()} palette, no characters, no icons, no text, pure geometric walls, rotated ${cfg.rotation} degrees, suitable for children's magazine activity page.`;
}

function render() {
  const cfg = config();
  const seed = xmur3(`${cfg.seed}-${cfg.type}-${cfg.difficulty}`)();
  const random = mulberry32(seed);
  const braid = braidAmount[cfg.difficulty] + (cfg.type === 'weave' ? 0.06 : 0);
  const grid = cfg.type === 'hex' ? carveHexMaze(cfg.cols, cfg.rows, random, braid, cfg.pattern) : carveMaze(cfg.cols, cfg.rows, random, braid, cfg.pattern);

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
  controls.meta.textContent = `${difficultyNames[cfg.difficulty]} · ${patternNames[cfg.pattern]} · ${cfg.theme.name} · ${cfg.rotation}°`;
  controls.sizeLabel.textContent = `${cfg.cols} × ${cfg.rows}`;
  controls.rotationLabel.textContent = `${cfg.rotation}°`;
  controls.strokeLabel.textContent = `${controls.stroke.value}%`;
  controls.aiPrompt.value = aiPrompt(cfg);
}

function randomize() {
  const option = (select) => select.options[Math.floor(Math.random() * select.options.length)].value;
  controls.type.value = option(controls.type);
  controls.difficulty.value = option(controls.difficulty);
  controls.pattern.value = option(controls.pattern);
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
    controls.type, controls.difficulty, controls.pattern, controls.theme, controls.size, controls.rotation, controls.stroke,
    controls.showSolution, controls.openEntrances, controls.invert, controls.guide,
  ].forEach((element) => {
    element.addEventListener(eventName, render);
  });
});
controls.seed.addEventListener('change', render);

render();
