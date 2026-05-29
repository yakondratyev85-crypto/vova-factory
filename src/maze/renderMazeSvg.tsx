import type { Maze } from './types';

interface RenderMazeSvgProps {
  maze: Maze;
  rotationAngle: number;
  showSolution: boolean;
}

const SVG_SIZE = 620;
const PADDING = 72;

export function RenderMazeSvg({ maze, rotationAngle, showSolution }: RenderMazeSvgProps) {
  const mazeSize = SVG_SIZE - PADDING * 2;
  const cellSize = mazeSize / maze.size;
  const center = SVG_SIZE / 2;
  const rotationScale = getRotationScale(mazeSize, rotationAngle);

  const wallLines = maze.cells.flatMap((row) =>
    row.flatMap((cell) => {
      const x = PADDING + cell.col * cellSize;
      const y = PADDING + cell.row * cellSize;
      const lines = [];

      if (cell.walls.top) {
        lines.push(<line key={`${cell.row}-${cell.col}-top`} x1={x} y1={y} x2={x + cellSize} y2={y} />);
      }

      if (cell.walls.right) {
        lines.push(
          <line key={`${cell.row}-${cell.col}-right`} x1={x + cellSize} y1={y} x2={x + cellSize} y2={y + cellSize} />,
        );
      }

      if (cell.walls.bottom) {
        lines.push(
          <line key={`${cell.row}-${cell.col}-bottom`} x1={x} y1={y + cellSize} x2={x + cellSize} y2={y + cellSize} />,
        );
      }

      if (cell.walls.left) {
        lines.push(<line key={`${cell.row}-${cell.col}-left`} x1={x} y1={y} x2={x} y2={y + cellSize} />);
      }

      return lines;
    }),
  );

  const solutionPoints = maze.solution
    .map((point) => `${PADDING + point.col * cellSize + cellSize / 2},${PADDING + point.row * cellSize + cellSize / 2}`)
    .join(' ');

  const startCenter = {
    x: PADDING + maze.start.col * cellSize + cellSize / 2,
    y: PADDING + maze.start.row * cellSize + cellSize / 2,
  };
  const finishCenter = {
    x: PADDING + maze.finish.col * cellSize + cellSize / 2,
    y: PADDING + maze.finish.row * cellSize + cellSize / 2,
  };

  return (
    <svg className="maze-svg" viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} role="img" aria-label="Generated square maze">
      <rect width={SVG_SIZE} height={SVG_SIZE} rx="24" fill="white" />
      <g transform={`translate(${center} ${center}) rotate(${rotationAngle}) scale(${rotationScale}) translate(${-center} ${-center})`}>
        <rect x={PADDING} y={PADDING} width={mazeSize} height={mazeSize} fill="white" stroke="#e5e7eb" strokeWidth="2" />
        {showSolution && solutionPoints && (
          <polyline
            points={solutionPoints}
            fill="none"
            stroke="#2563eb"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.88"
          />
        )}
        <g stroke="#111827" strokeWidth="4" strokeLinecap="round">
          {wallLines}
        </g>
        <circle cx={startCenter.x} cy={startCenter.y} r="13" fill="#16a34a" />
        <circle cx={finishCenter.x} cy={finishCenter.y} r="13" fill="#dc2626" />
        <text x={startCenter.x + 18} y={startCenter.y - 13} fontSize="18" fontWeight="700" fill="#166534">
          START
        </text>
        <text x={finishCenter.x - 74} y={finishCenter.y + 28} fontSize="18" fontWeight="700" fill="#991b1b">
          FINISH
        </text>
      </g>
    </svg>
  );
}

function getRotationScale(size: number, rotationAngle: number): number {
  const radians = (Math.abs(rotationAngle) * Math.PI) / 180;
  const rotatedBox = Math.abs(size * Math.cos(radians)) + Math.abs(size * Math.sin(radians));

  if (rotatedBox <= size) {
    return 1;
  }

  return Math.max(0.68, size / rotatedBox);
}
