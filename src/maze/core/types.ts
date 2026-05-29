export type MazeType = 'square' | 'rectangle' | 'circle' | 'road';
export type FutureMazeType = 'hex' | 'triangle' | 'spiral' | 'shape' | 'collectItems' | 'ruleBased' | 'numberMaze' | 'letterMaze';
export type Difficulty = 'toddler' | 'easy' | 'medium' | 'hard' | 'expert';
export type VisualMode = 'color' | 'coloring' | 'premium' | 'minimal';
export type MazeTheme = 'space' | 'forest' | 'ocean' | 'dinosaurs' | 'cats';
export type PageFormat = 'A4_PORTRAIT' | 'A4_LANDSCAPE' | '900x1200' | '1200x900' | '1080x1350' | '1024x1024' | 'CUSTOM';
export type SolutionMode = 'none' | 'overlay' | 'teacher' | 'separatePage';
export type Algorithm = 'backtracking' | 'prim';
export interface MazeSettings { mazeType: MazeType; difficulty: Difficulty; visualMode: VisualMode; theme: MazeTheme; algorithm: Algorithm; seed: string; pageFormat: PageFormat; customWidth?: number; customHeight?: number; rotationAngle: number; rotateMazeOnly: boolean; rotateFullComposition: boolean; showSolution: boolean; solutionMode: SolutionMode; lineWidth: number; pathWidth: number; title: string; instruction: string; startLabel: string; finishLabel: string; taskNumber: number; }
export interface Cell { x: number; y: number; walls: { n: boolean; e: boolean; s: boolean; w: boolean }; }
export interface Point { x: number; y: number; }
export interface MazeModel { type: MazeType; cols: number; rows: number; cells: Cell[][]; start: Point; finish: Point; solution: Point[]; roadPath?: Point[]; rings?: number; sectors?: number; }
export interface PageSize { width: number; height: number; label: string; pdfUnit?: 'px' | 'pt'; }
export interface ValidationResult { valid: boolean; messages: string[]; }
