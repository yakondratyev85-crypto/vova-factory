window.MazeStudio = window.MazeStudio || {};

window.MazeStudio.renderWorksheetSvg = function renderWorksheetSvg(options) {
  var maze = options.maze;
  var theme = window.MazeStudio.getTheme(options.theme, options.visualMode);
  var visualMode = options.visualMode;
  var pageWidth = 900;
  var pageHeight = 1180;
  var mazeBoxSize = visualMode === 'minimal' ? 690 : 650;
  var mazeX = (pageWidth - mazeBoxSize) / 2;
  var mazeY = 265;
  var cellSize = mazeBoxSize / maze.size;
  var centerX = mazeX + mazeBoxSize / 2;
  var centerY = mazeY + mazeBoxSize / 2;
  var rotationScale = getRotationScale(mazeBoxSize, options.rotationAngle);
  var lineWidth = maze.size >= 18 ? 3 : maze.size <= 8 ? 6 : 4;
  var decorations = visualMode === 'minimal' ? '' : renderDecorations(theme, visualMode, pageWidth, pageHeight);
  var coloring = visualMode === 'coloring';
  var start = pointCenter(maze.start, mazeX, mazeY, cellSize);
  var finish = pointCenter(maze.finish, mazeX, mazeY, cellSize);

  var mazeContent = [
    '<rect x="' + mazeX + '" y="' + mazeY + '" width="' + mazeBoxSize + '" height="' + mazeBoxSize + '" rx="18" fill="' + theme.paper + '" stroke="' + (coloring ? '#111111' : '#e5e7eb') + '" stroke-width="2"/>',
    options.showSolution ? renderSolution(maze, mazeX, mazeY, cellSize, theme) : '',
    renderWalls(maze, mazeX, mazeY, cellSize, theme, lineWidth),
    '<circle cx="' + start.x + '" cy="' + start.y + '" r="15" fill="' + theme.start + '" stroke="' + (coloring ? '#111111' : theme.start) + '" stroke-width="3"/>',
    '<circle cx="' + finish.x + '" cy="' + finish.y + '" r="15" fill="' + theme.finish + '" stroke="' + (coloring ? '#111111' : theme.finish) + '" stroke-width="3"/>',
    '<text x="' + (start.x + 22) + '" y="' + (start.y - 16) + '" font-size="20" font-weight="800" fill="' + theme.text + '">START</text>',
    '<text x="' + (finish.x - 82) + '" y="' + (finish.y + 32) + '" font-size="20" font-weight="800" fill="' + theme.text + '">FINISH</text>',
  ].join('');

  var rotatedMaze = '<g transform="translate(' + centerX + ' ' + centerY + ') rotate(' + options.rotationAngle + ') scale(' + rotationScale + ') translate(' + -centerX + ' ' + -centerY + ')">' + mazeContent + '</g>';

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + pageWidth + '" height="' + pageHeight + '" viewBox="0 0 ' + pageWidth + ' ' + pageHeight + '" role="img" aria-label="Maze Worksheet Studio worksheet">',
    '<rect width="' + pageWidth + '" height="' + pageHeight + '" fill="' + theme.background + '"/>',
    '<rect x="45" y="45" width="810" height="1090" rx="32" fill="' + theme.paper + '" stroke="' + theme.frame + '" stroke-width="4" stroke-dasharray="' + (coloring ? '0' : '12 12') + '"/>',
    decorations,
    '<text x="90" y="125" font-size="38" font-weight="900" fill="' + theme.text + '">' + escapeXml(theme.title) + '</text>',
    '<text x="90" y="168" font-size="22" fill="' + theme.muted + '">' + escapeXml(theme.instruction) + '</text>',
    '<text x="742" y="126" font-size="20" font-weight="800" fill="' + theme.text + '">№ 001</text>',
    rotatedMaze,
    '<text x="90" y="1065" font-size="24" fill="' + theme.text + '">Имя: __________________________</text>',
    '<text x="90" y="1105" font-size="16" fill="' + theme.muted + '">Seed: ' + escapeXml(options.seed) + ' · ' + maze.size + ' × ' + maze.size + ' · Rotation: ' + options.rotationAngle + '°</text>',
    '</svg>',
  ].join('');
};

function renderWalls(maze, mazeX, mazeY, cellSize, theme, lineWidth) {
  var output = ['<g stroke="' + theme.wall + '" stroke-width="' + lineWidth + '" stroke-linecap="round">'];

  for (var row = 0; row < maze.size; row += 1) {
    for (var col = 0; col < maze.size; col += 1) {
      var cell = maze.cells[row][col];
      var x = mazeX + col * cellSize;
      var y = mazeY + row * cellSize;

      if (cell.walls.top) output.push(line(x, y, x + cellSize, y));
      if (cell.walls.right) output.push(line(x + cellSize, y, x + cellSize, y + cellSize));
      if (cell.walls.bottom) output.push(line(x, y + cellSize, x + cellSize, y + cellSize));
      if (cell.walls.left) output.push(line(x, y, x, y + cellSize));
    }
  }

  output.push('</g>');
  return output.join('');
}

function renderSolution(maze, mazeX, mazeY, cellSize, theme) {
  var points = maze.solution.map(function (point) {
    var center = pointCenter(point, mazeX, mazeY, cellSize);
    return center.x + ',' + center.y;
  }).join(' ');

  return '<polyline points="' + points + '" fill="none" stroke="' + theme.solution + '" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.88"/>';
}

function renderDecorations(theme, visualMode, pageWidth, pageHeight) {
  var fill = visualMode === 'coloring' ? '#ffffff' : theme.background;
  var stroke = visualMode === 'coloring' ? '#111111' : theme.frame;
  var icons = theme.decorations || [];
  var positions = [
    { x: 116, y: 214 },
    { x: pageWidth - 120, y: 214 },
    { x: 120, y: pageHeight - 148 },
    { x: pageWidth - 122, y: pageHeight - 148 },
  ];

  return positions.map(function (position, index) {
    return '<g opacity="0.85"><circle cx="' + position.x + '" cy="' + position.y + '" r="28" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"/><text x="' + position.x + '" y="' + (position.y + 8) + '" text-anchor="middle" font-size="24" fill="' + stroke + '">' + escapeXml(icons[index] || '•') + '</text></g>';
  }).join('');
}

function pointCenter(point, mazeX, mazeY, cellSize) {
  return {
    x: mazeX + point.col * cellSize + cellSize / 2,
    y: mazeY + point.row * cellSize + cellSize / 2,
  };
}

function line(x1, y1, x2, y2) {
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>';
}

function getRotationScale(size, angle) {
  var radians = Math.abs(angle) * Math.PI / 180;
  var rotatedBox = Math.abs(size * Math.cos(radians)) + Math.abs(size * Math.sin(radians));
  return Math.min(1, Math.max(0.68, size / rotatedBox));
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, function (character) {
    return {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    }[character];
  });
}
