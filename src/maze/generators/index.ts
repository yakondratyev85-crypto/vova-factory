import type { MazeModel, MazeSettings } from '../core/types';
import { generateSquareMaze } from './squareMaze';
import { generateRectangleMaze } from './rectangleMaze';
import { generateCircleMaze } from './circleMaze';
import { generateRoadMaze } from './roadMaze';
export function generateMaze(settings: MazeSettings): MazeModel { if (settings.mazeType === 'rectangle') return generateRectangleMaze(settings); if (settings.mazeType === 'circle') return generateCircleMaze(settings); if (settings.mazeType === 'road') return generateRoadMaze(settings); return generateSquareMaze(settings); }
