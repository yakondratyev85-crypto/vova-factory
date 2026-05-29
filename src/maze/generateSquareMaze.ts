import type { Direction, Maze, MazeCell, MazePoint } from './types';
import { solveMaze } from './solveMaze';

const opposite: Record<Direction, Direction> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

const directions: Array<{ name: Direction; row: number; col: number }> = [
  { name: 'top', row: -1, col: 0 },
  { name: 'right', row: 0, col: 1 },
  { name: 'bottom', row: 1, col: 0 },
  { name: 'left', row: 0, col: -1 },
];

function createRandom(seed: string): () => number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createGrid(size: number): MazeCell[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      row,
      col,
      visited: false,
      walls: {
        top: true,
        right: true,
        bottom: true,
        left: true,
      },
    })),
  );
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }

  return copy;
}

function getCell(grid: MazeCell[][], point: MazePoint): MazeCell | undefined {
  return grid[point.row]?.[point.col];
}

export function generateSquareMaze(seed: string, size = 12): Maze {
  const random = createRandom(seed || 'maze-worksheet-studio');
  const cells = createGrid(size);
  const stack: MazeCell[] = [];
  const firstCell = cells[0]![0]!;

  firstCell.visited = true;
  stack.push(firstCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1]!;
    const availableDirections = shuffle(directions, random).filter((direction) => {
      const nextCell = getCell(cells, {
        row: current.row + direction.row,
        col: current.col + direction.col,
      });

      return nextCell && !nextCell.visited;
    });

    if (availableDirections.length === 0) {
      stack.pop();
      continue;
    }

    const direction = availableDirections[0]!;
    const nextCell = cells[current.row + direction.row]![current.col + direction.col]!;

    current.walls[direction.name] = false;
    nextCell.walls[opposite[direction.name]] = false;
    nextCell.visited = true;
    stack.push(nextCell);
  }

  const mazeWithoutSolution: Maze = {
    size,
    cells,
    start: { row: 0, col: 0 },
    finish: { row: size - 1, col: size - 1 },
    solution: [],
  };

  return {
    ...mazeWithoutSolution,
    solution: solveMaze(mazeWithoutSolution),
  };
}
