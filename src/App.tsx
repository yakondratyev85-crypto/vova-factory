import { useMemo, useState } from 'react';
import './App.css';
import { generateSquareMaze } from './maze/generateSquareMaze';
import { RenderMazeSvg } from './maze/renderMazeSvg';
import type { MazeSettings } from './maze/types';

const initialSettings: MazeSettings = {
  mazeType: 'square',
  algorithm: 'backtracking',
  visualMode: 'minimal',
  theme: 'basic',
  seed: 'worksheet-001',
  rotationAngle: 0,
  showSolution: false,
};

export default function App() {
  const [settings, setSettings] = useState<MazeSettings>(initialSettings);
  const [generatedSeed, setGeneratedSeed] = useState(initialSettings.seed);
  const maze = useMemo(() => generateSquareMaze(generatedSeed, 12), [generatedSeed]);

  function updateSetting<K extends keyof MazeSettings>(key: K, value: MazeSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function generateMaze() {
    setGeneratedSeed(settings.seed.trim() || 'worksheet-001');
  }

  function randomizeSeed() {
    const nextSeed = `worksheet-${Math.floor(Math.random() * 1_000_000)}`;
    setSettings((current) => ({ ...current, seed: nextSeed }));
    setGeneratedSeed(nextSeed);
  }

  return (
    <main className="app-shell">
      <aside className="controls-panel" aria-label="Maze settings">
        <p className="eyebrow">Local React + Vite MVP</p>
        <h1>Maze Worksheet Studio</h1>
        <p className="description">Minimal stable square maze generator for local testing.</p>

        <label>
          Maze Type
          <input value={settings.mazeType} readOnly />
        </label>

        <label>
          Algorithm
          <input value={settings.algorithm} readOnly />
        </label>

        <label>
          Theme
          <input value={settings.theme} readOnly />
        </label>

        <label>
          Visual Mode
          <input value={settings.visualMode} readOnly />
        </label>

        <label>
          Seed
          <input value={settings.seed} onChange={(event) => updateSetting('seed', event.target.value)} />
        </label>

        <label>
          Rotation Angle
          <input
            type="number"
            step="1"
            value={settings.rotationAngle}
            onChange={(event) => updateSetting('rotationAngle', Number(event.target.value) || 0)}
          />
        </label>

        <div className="button-row">
          <button type="button" onClick={generateMaze}>Generate</button>
          <button type="button" className="secondary" onClick={randomizeSeed}>Random Seed</button>
        </div>

        <div className="button-row">
          <button type="button" onClick={() => updateSetting('showSolution', true)}>Show Solution</button>
          <button type="button" className="secondary" onClick={() => updateSetting('showSolution', false)}>Hide Solution</button>
        </div>
      </aside>

      <section className="preview-panel" aria-label="Maze preview">
        <div className="preview-header">
          <div>
            <h2>Preview</h2>
            <p>Seed: {generatedSeed} · 12 × 12 · Rotation: {settings.rotationAngle}°</p>
          </div>
          <span className={settings.showSolution ? 'status is-on' : 'status'}>
            Solution {settings.showSolution ? 'shown' : 'hidden'}
          </span>
        </div>

        <div className="worksheet-card">
          <h2>Maze Worksheet Studio</h2>
          <p>Find a path from START to FINISH.</p>
          <RenderMazeSvg maze={maze} rotationAngle={settings.rotationAngle} showSolution={settings.showSolution} />
        </div>
      </section>
    </main>
  );
}
