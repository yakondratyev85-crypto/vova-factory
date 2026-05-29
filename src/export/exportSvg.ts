export function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
export function exportSvg(svg: string, filename = 'maze_worksheet.svg') { downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), filename); }
