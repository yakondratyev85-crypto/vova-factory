window.MazeStudio = window.MazeStudio || {};

(function initMazeStudio() {
  var state = {
    maze: null,
    seed: 'worksheet-001',
    showSolution: false,
    currentSvg: '',
  };

  var controls = {
    mazeSize: document.getElementById('mazeSize'),
    difficulty: document.getElementById('difficulty'),
    seed: document.getElementById('seedInput'),
    rotation: document.getElementById('rotationInput'),
    theme: document.getElementById('themeSelect'),
    visualMode: document.getElementById('visualMode'),
    generate: document.getElementById('generateButton'),
    showSolution: document.getElementById('showSolutionButton'),
    hideSolution: document.getElementById('hideSolutionButton'),
    downloadSvg: document.getElementById('downloadSvgButton'),
    downloadPng: document.getElementById('downloadPngButton'),
    preview: document.getElementById('worksheetPreview'),
  };

  function readSettings() {
    var seed = controls.seed.value.trim();

    if (!seed) {
      seed = 'maze-' + Date.now();
      controls.seed.value = seed;
    }

    return {
      size: Number(controls.mazeSize.value),
      difficulty: controls.difficulty.value,
      seed: seed,
      rotationAngle: Number(controls.rotation.value) || 0,
      theme: controls.theme.value,
      visualMode: controls.visualMode.value,
      showSolution: state.showSolution,
    };
  }

  function generateMaze() {
    var settings = readSettings();
    state.seed = settings.seed;
    state.maze = window.MazeStudio.generateSquareMaze(settings.size, settings.seed + ':' + settings.difficulty);
    render();
  }

  function render() {
    if (!state.maze) {
      generateMaze();
      return;
    }

    var settings = readSettings();
    state.currentSvg = window.MazeStudio.renderWorksheetSvg({
      maze: state.maze,
      seed: state.seed,
      rotationAngle: settings.rotationAngle,
      theme: settings.theme,
      visualMode: settings.visualMode,
      showSolution: state.showSolution,
    });
    controls.preview.innerHTML = state.currentSvg;
  }

  function syncDifficulty() {
    var size = window.MazeStudio.sizeForDifficulty(controls.difficulty.value);
    controls.mazeSize.value = String(size);
  }

  controls.generate.addEventListener('click', generateMaze);
  controls.showSolution.addEventListener('click', function () {
    state.showSolution = true;
    render();
  });
  controls.hideSolution.addEventListener('click', function () {
    state.showSolution = false;
    render();
  });
  controls.downloadSvg.addEventListener('click', function () {
    window.MazeStudio.downloadSvg(state.currentSvg, 'maze-worksheet-' + state.seed + '.svg');
  });
  controls.downloadPng.addEventListener('click', function () {
    window.MazeStudio.downloadPng(state.currentSvg, 'maze-worksheet-' + state.seed + '.png');
  });
  controls.rotation.addEventListener('input', render);
  controls.theme.addEventListener('change', render);
  controls.visualMode.addEventListener('change', render);
  controls.difficulty.addEventListener('change', function () {
    syncDifficulty();
    generateMaze();
  });
  controls.mazeSize.addEventListener('change', generateMaze);
  controls.seed.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      generateMaze();
    }
  });

  syncDifficulty();
  generateMaze();
}());
