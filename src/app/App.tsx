import { useMemo, useState } from 'react';
import { ControlsPanel } from '../components/ControlsPanel';
import { MazePreview } from '../components/MazePreview';
import { generateMaze } from '../maze/generators';
import { renderPageSvg } from '../maze/render/renderPageSvg';
import { validateMaze } from '../maze/solver/validateMaze';
import { defaultSettings } from '../presets/presets';
import { getTheme } from '../maze/themes';
import './App.css';
export function App() { const [settings, setSettings] = useState(defaultSettings); const [nonce, setNonce] = useState(0); const model = useMemo(() => generateMaze(settings), [settings, nonce]); const svg = useMemo(() => renderPageSvg(settings, model), [settings, model]); const validation = useMemo(() => validateMaze(model, settings.lineWidth, settings.pathWidth), [model, settings.lineWidth, settings.pathWidth]); const createWorksheet = () => { const t = getTheme(settings.theme, settings.visualMode); setSettings({ ...settings, title: t.title, instruction: t.instruction, startLabel: 'Старт', finishLabel: 'Финиш', taskNumber: settings.taskNumber || 1 }); setNonce(v=>v+1); }; return <main className="app-shell"><ControlsPanel settings={settings} setSettings={setSettings} onGenerate={() => setNonce(v=>v+1)} onWorksheet={createWorksheet}/><MazePreview svg={svg} settings={settings} model={model} validation={validation}/></main>; }
