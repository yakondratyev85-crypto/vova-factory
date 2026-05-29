import type { MazeModel, MazeSettings } from '../core/types';
import { difficultyGrid } from '../core/constants';
import { seededRandom } from '../core/seededRandom';
import { backtracking } from './backtracking';
import { prim } from './prim';
import { solveGridMaze } from '../solver/solveMaze';
export function generateCircleMaze(settings: MazeSettings): MazeModel { const [rings, sectors] = difficultyGrid[settings.difficulty].circle; const random = seededRandom(`${settings.seed}:circle:${settings.difficulty}`); const cells = settings.algorithm === 'prim' ? prim(sectors, rings, random) : backtracking(sectors, rings, random); const mid = Math.floor(sectors / 2); const model: MazeModel = { type: 'circle' as const, cols: sectors, rows: rings, rings, sectors, cells, start: { x: 0, y: rings - 1 }, finish: { x: mid, y: 0 }, solution: [] }; model.solution = solveGridMaze(model); return model; }
