import type { MazeModel, MazeSettings } from '../core/types';
import { difficultyGrid } from '../core/constants';
import { seededRandom } from '../core/seededRandom';
import { backtracking } from './backtracking';
import { prim } from './prim';
import { solveGridMaze } from '../solver/solveMaze';
export function generateSquareMaze(settings: MazeSettings): MazeModel { const [cols, rows] = difficultyGrid[settings.difficulty].square; const random = seededRandom(`${settings.seed}:square:${settings.difficulty}`); const cells = settings.algorithm === 'prim' ? prim(cols, rows, random) : backtracking(cols, rows, random); const model: MazeModel = { type: 'square' as const, cols, rows, cells, start: { x: 0, y: 0 }, finish: { x: cols - 1, y: rows - 1 }, solution: [] }; model.solution = solveGridMaze(model); return model; }
