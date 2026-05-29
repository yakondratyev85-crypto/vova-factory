window.MazeStudio = window.MazeStudio || {};

window.MazeStudio.themes = {
  basic: {
    name: 'Basic',
    title: 'Maze Worksheet Studio',
    instruction: 'Проведи путь от START до FINISH.',
    background: '#ffffff',
    paper: '#ffffff',
    frame: '#111827',
    wall: '#111827',
    text: '#111827',
    muted: '#64748b',
    solution: '#2563eb',
    start: '#16a34a',
    finish: '#dc2626',
    decorations: ['●', '○', '□', '△'],
  },
  space: {
    name: 'Space',
    title: 'Помоги космонавту добраться до ракеты!',
    instruction: 'Найди безопасный путь через звёзды и планеты.',
    background: '#eef2ff',
    paper: '#ffffff',
    frame: '#7c3aed',
    wall: '#312e81',
    text: '#172554',
    muted: '#475569',
    solution: '#ef4444',
    start: '#22c55e',
    finish: '#f97316',
    decorations: ['★', '✦', '🪐', '🚀'],
  },
  forest: {
    name: 'Forest',
    title: 'Помоги зверьку найти лесной домик!',
    instruction: 'Иди по дорожкам среди листьев и грибов.',
    background: '#f0fdf4',
    paper: '#fffdf6',
    frame: '#22c55e',
    wall: '#166534',
    text: '#14532d',
    muted: '#4b5563',
    solution: '#dc2626',
    start: '#65a30d',
    finish: '#a16207',
    decorations: ['☘', '🍄', '♧', '⌂'],
  },
  cats: {
    name: 'Cats',
    title: 'Помоги котёнку найти клубок!',
    instruction: 'Проведи аккуратную линию от старта до финиша.',
    background: '#fff7ed',
    paper: '#ffffff',
    frame: '#fb923c',
    wall: '#7c2d12',
    text: '#431407',
    muted: '#57534e',
    solution: '#2563eb',
    start: '#16a34a',
    finish: '#db2777',
    decorations: ['🐱', '♡', '🐾', '🧶'],
  },
};

window.MazeStudio.getTheme = function getTheme(themeName, visualMode) {
  var theme = window.MazeStudio.themes[themeName] || window.MazeStudio.themes.basic;
  var copy = Object.assign({}, theme);

  if (visualMode === 'coloring') {
    copy.background = '#ffffff';
    copy.paper = '#ffffff';
    copy.frame = '#111111';
    copy.wall = '#111111';
    copy.text = '#111111';
    copy.muted = '#111111';
    copy.start = '#ffffff';
    copy.finish = '#ffffff';
    copy.solution = '#2563eb';
  }

  if (visualMode === 'minimal') {
    copy.background = '#f8fafc';
    copy.paper = '#ffffff';
    copy.frame = '#cbd5e1';
    copy.wall = '#111827';
    copy.text = '#111827';
    copy.muted = '#64748b';
    copy.decorations = [];
  }

  return copy;
};
