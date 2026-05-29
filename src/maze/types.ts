export type Direction = 'top' | 'right' | 'bottom' | 'left';

export interface MazeCell {
  row: number;
  col: number;
  visited: boolean;
  walls: Record<Direction, boolean>;
}

export interface MazePoint {
  row: number;
  col: number;
}

export interface Maze {
  size: number;
  cells: MazeCell[][];
  start: MazePoint;
  finish: MazePoint;
  solution: MazePoint[];
}

export interface MazeSettings {
  mazeType: 'square';
  algorithm: 'backtracking';
  visualMode: 'minimal';
  theme: 'basic';
  seed: string;
  rotationAngle: number;
  showSolution: boolean;
}
