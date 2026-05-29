import type { MazeSettings, PageSize } from './types';
import { pageSizes } from './constants';
export function getPageSize(settings: MazeSettings): PageSize { if (settings.pageFormat === 'CUSTOM') return { width: settings.customWidth || 900, height: settings.customHeight || 1200, label: 'Custom' }; return pageSizes[settings.pageFormat]; }
export function rotatePoint(x: number, y: number, cx: number, cy: number, angle: number) { const r = (angle * Math.PI) / 180; const cos = Math.cos(r); const sin = Math.sin(r); const dx = x - cx; const dy = y - cy; return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }; }
export function rotationScale(width: number, height: number, angle: number) { const r = Math.abs((angle * Math.PI) / 180); const boxW = Math.abs(width * Math.cos(r)) + Math.abs(height * Math.sin(r)); const boxH = Math.abs(width * Math.sin(r)) + Math.abs(height * Math.cos(r)); return Math.min(1, width / boxW, height / boxH); }
