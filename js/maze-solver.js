window.MazeStudio = window.MazeStudio || {};

window.MazeStudio.solveMaze = function solveMaze(maze) {
  var directions = [
    { wall: 'top', row: -1, col: 0 },
    { wall: 'right', row: 0, col: 1 },
    { wall: 'bottom', row: 1, col: 0 },
    { wall: 'left', row: 0, col: -1 },
  ];
  var queue = [maze.start];
  var visited = new Set([key(maze.start)]);
  var previous = {};

  while (queue.length > 0) {
    var current = queue.shift();

    if (current.row === maze.finish.row && current.col === maze.finish.col) {
      break;
    }

    var cell = maze.cells[current.row][current.col];

    for (var i = 0; i < directions.length; i += 1) {
      var direction = directions[i];

      if (cell.walls[direction.wall]) {
        continue;
      }

      var next = {
        row: current.row + direction.row,
        col: current.col + direction.col,
      };
      var nextKey = key(next);

      if (
        next.row >= 0 &&
        next.col >= 0 &&
        next.row < maze.size &&
        next.col < maze.size &&
        !visited.has(nextKey)
      ) {
        visited.add(nextKey);
        previous[nextKey] = current;
        queue.push(next);
      }
    }
  }

  if (!visited.has(key(maze.finish))) {
    return [];
  }

  var path = [];
  var point = maze.finish;

  while (point) {
    path.push(point);
    point = previous[key(point)];
  }

  return path.reverse();
};

function key(point) {
  return point.row + ',' + point.col;
}
