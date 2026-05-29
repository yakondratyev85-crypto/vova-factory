import { exportSvg } from '../export/exportSvg';
import { exportPng } from '../export/exportPng';
import { exportPdf } from '../export/exportPdf';
import type { MazeModel, MazeSettings } from '../maze/core/types';
import { getPageSize } from '../maze/core/geometry';
export function ExportButtons({ svg, settings, model }: { svg: string; settings: MazeSettings; model: MazeModel }) { const page = getPageSize(settings); return <div className="export-buttons"><button onClick={() => exportSvg(svg)}>Export SVG</button><button onClick={() => void exportPng(svg, page.width, page.height)}>Export PNG</button><button onClick={() => void exportPdf(settings, model)}>Export PDF</button></div>; }
