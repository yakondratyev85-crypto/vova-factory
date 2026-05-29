import type { Direction, Maze, MazePoint } from './types';

const directions: Array<{ wall: Direction; row: number; col: number }> = [
  { wall: 'top', row: -1, col: 0 },
  { wall: 'right', row: 0, col: 1 },
  { wall: 'bottom', row: 1, col: 0 },
  { wall: 'left', row: 0, col: -1 },
];

function pointKey(point: MazePoint): string {
  return `${point.row},${point.col}`;
}

export function solveMaze(maze: Maze): MazePoint[] {
  const queue: MazePoint[] = [maze.start];
  const visited = new Set<string>([pointKey(maze.start)]);
  const previous = new Map<string, MazePoint>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.row === maze.finish.row && current.col === maze.finish.col) {
      break;
    }

    const cell = maze.cells[current.row]![current.col]!;

    for (const direction of directions) {
      if (cell.walls[direction.wall]) {
        continue;
      }

      const next = {
        row: current.row + direction.row,
        col: current.col + direction.col,
      };
      const key = pointKey(next);

      if (
        next.row >= 0 &&
        next.col >= 0 &&
        next.row < maze.size &&
        next.col < maze.size &&
        !visited.has(key)
      ) {
        visited.add(key);
        previous.set(key, current);
        queue.push(next);
      }
    }
  }

  const finishKey = pointKey(maze.finish);

  if (!visited.has(finishKey)) {
    return [];
  }

  const path: MazePoint[] = [];
  let current: MazePoint | undefined = maze.finish;

  while (current) {
    path.push(current);
    current = previous.get(pointKey(current));
  }

  return path.reverse();
}
