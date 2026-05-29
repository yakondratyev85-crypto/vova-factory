window.MazeStudio = window.MazeStudio || {};

window.MazeStudio.createRandom = function createRandom(seed) {
  var hash = 2166136261;
  var text = seed || 'maze-worksheet-studio';

  for (var index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return function random() {
    hash += 0x6d2b79f5;
    var value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

window.MazeStudio.generateSquareMaze = function generateSquareMaze(size, seed) {
  var random = window.MazeStudio.createRandom(seed);
  var cells = createGrid(size);
  var stack = [];
  var firstCell = cells[0][0];
  var directions = [
    { name: 'top', opposite: 'bottom', row: -1, col: 0 },
    { name: 'right', opposite: 'left', row: 0, col: 1 },
    { name: 'bottom', opposite: 'top', row: 1, col: 0 },
    { name: 'left', opposite: 'right', row: 0, col: -1 },
  ];

  firstCell.visited = true;
  stack.push(firstCell);

  while (stack.length > 0) {
    var current = stack[stack.length - 1];
    var available = shuffle(directions, random).filter(function (direction) {
      var next = getCell(cells, current.row + direction.row, current.col + direction.col);
      return next && !next.visited;
    });

    if (available.length === 0) {
      stack.pop();
      continue;
    }

    var chosen = available[0];
    var nextCell = cells[current.row + chosen.row][current.col + chosen.col];
    current.walls[chosen.name] = false;
    nextCell.walls[chosen.opposite] = false;
    nextCell.visited = true;
    stack.push(nextCell);
  }

  var maze = {
    size: size,
    cells: cells,
    start: { row: 0, col: 0 },
    finish: { row: size - 1, col: size - 1 },
    solution: [],
  };

  maze.solution = window.MazeStudio.solveMaze(maze);
  return maze;
};

window.MazeStudio.sizeForDifficulty = function sizeForDifficulty(difficulty) {
  if (difficulty === 'easy') return 8;
  if (difficulty === 'hard') return 18;
  return 12;
};

function createGrid(size) {
  var rows = [];

  for (var row = 0; row < size; row += 1) {
    var currentRow = [];

    for (var col = 0; col < size; col += 1) {
      currentRow.push({
        row: row,
        col: col,
        visited: false,
        walls: {
          top: true,
          right: true,
          bottom: true,
          left: true,
        },
      });
    }

    rows.push(currentRow);
  }

  return rows;
}

function getCell(cells, row, col) {
  if (!cells[row]) return null;
  return cells[row][col] || null;
}

function shuffle(items, random) {
  var copy = items.slice();

  for (var index = copy.length - 1; index > 0; index -= 1) {
    var swapIndex = Math.floor(random() * (index + 1));
    var temp = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = temp;
  }

  return copy;
}
