import type { MazeTheme, VisualMode } from '../core/types';
import { applyVisualMode } from './themeTypes';
import { space } from './space'; import { forest } from './forest'; import { ocean } from './ocean'; import { dinosaurs } from './dinosaurs'; import { cats } from './cats';
const themes = { space, forest, ocean, dinosaurs, cats };
export function getTheme(id: MazeTheme, mode: VisualMode) { return applyVisualMode(themes[id], mode); }
