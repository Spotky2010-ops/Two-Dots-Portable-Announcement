```javascript
/* =========================================================
   TWO DOTS HANDHELD CONSOLE — WEB AUDIO, DRAG-MATCH & OS
   ========================================================= */

const DOT_COLORS = ['#ff6b72', '#2185d5', '#4ecdc4', '#f7b731', '#9b59b6'];
const COLS = 6;
const ROWS = 4;
const TOTAL_CELLS = COLS * ROWS;

let gold = 10000;
let moves = 15;
let cleared = 0;
let wifiConnected = true;
let tvConnected = false;
let activeViewId = 'worldMapView';

/* Game & Editor Board State */
let boardColors = [];
let editorColors = [];
let isDragging = false;
let chain = [];
let activeChainColor = null;
let isSquareFormed = false;

/* =========================================================
   1. WEB AUDIO API (SOUND EFFECTS & AMBIENT BACKGROUND MUSIC)
   ========================================================= */
let audioCtx = null;
let sfxEnabled = true;
let bgmEnabled = false;
let bgmTimer = null;
let bgmStep = 0;

function ensureAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, duration = 0.14, type = 'sine', volume = 0.14, delay = 0) {
  if (!sfxEnabled) return;
  ensureAudioContext();

  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/* Pentatonic chimes for dot connection chain */
const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

function playConnectNote(stepIndex) {
  const freq = PENTATONIC[Math.min(stepIndex, PENTATONIC.length - 1)];
  playTone(freq, 0.16, 'triangle', 0.16);
}

function playClearChord(isSquare = false) {
  if (isSquare) {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      playTone(f, 0.32, 'triangle', 0.15, i * 0.045);
    });
  } else {
    playTone(523.25, 0.2, 'sine', 0.15, 0);
    playTone(659.25, 0.24, 'sine', 0.15, 0.06);
  }
}

function playUiClick() {
  playTone(440, 0.07, 'sine', 0.09);
}

function playShutdownSound() {
  [523.25, 392.00, 329.63, 261.63].forEach((f, i) => {
    playTone(f, 0.22, 'sine', 0.13, i * 0.11);
  });
}

function playBootSound() {
  [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
    playTone(f, 0.2, 'triangle', 0.14, i * 0.09);
  });
}

function toggleSfx() {
  sfxEnabled = !sfxEnabled;
  const btn = document.getElementById('sfxToggleBtn');
  btn.classList.toggle('active', sfxEnabled);
  btn.textContent = sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
  if (sfxEnabled) playUiClick();
}

function toggleMusic() {
  bgmEnabled = !bgmEnabled;
  const btn = document.getElementById('bgmToggleBtn');
  btn.classList.toggle('active', bgmEnabled);
  btn.textContent = bgmEnabled ? '🎵 BGM: ON' : '🎵 BGM: OFF';

  if (bgmEnabled) {
    ensureAudioContext();
    startAmbientMusic();
  } else {
    stopAmbientMusic();
  }
}

function startAmbientMusic() {
  stopAmbientMusic();
  const melody = [261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66, 392.00];
  bgmTimer = setInterval(() => {
    if (!bgmEnabled) return;
    ensureAudioContext();
    const freq = melody[bgmStep % melody.length];
    bgmStep++;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }, 620);
}

function stopAmbientMusic() {
  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

/* =========================================================
   2. NAVIGATION & HARDWARE BUTTONS
   ========================================================= */
function switchView(viewId) {
  playUiClick();
  closeOverlays();
  activeViewId = viewId;

  document.querySelectorAll('.screen-view').forEach(v => v.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');

  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === viewId);
  });

  if (viewId === 'gameView') {
    setTimeout(drawChainLines, 20);
  }
}

function pressHomeButton() {
  if (document.getElementById('offOverlay').classList.contains('show')) return;
  switchView('worldMapView');
}

function pressMenuButton() {
  if (document.getElementById('offOverlay').classList.contains('show')) return;
  playUiClick();
  if (activeViewId === 'gameView') {
    document.getElementById('pauseOverlay').classList.add('show');
  } else {
    switchView('settingsView');
  }
}

function openPowerMenu() {
  if (document.getElementById('offOverlay').classList.contains('show')) {
    restartConsole();
    return;
  }
  playUiClick();
  document.getElementById('powerOverlay').classList.add('show');
}

function enterStandby() {
  playUiClick();
  closeOverlays();
  updateClockDisplay();
  document.getElementById('standbyOverlay').classList.add('show');
}

function wakeFromStandby() {
  playUiClick();
  closeOverlays();
}

function shutdownConsole() {
  playShutdownSound();
  closeOverlays();
  const screen = document.getElementById('consoleScreen');
  screen.classList.add('shutting-down');
  setTimeout(() => {
    screen.classList.remove('shutting-down');
    document.getElementById('offOverlay').classList.add('show');
  }, 720);
}

function restartConsole() {
  playBootSound();
  closeOverlays();
  const screen = document.getElementById('consoleScreen');
  screen.style.opacity = '0';
  setTimeout(() => {
    screen.style.opacity = '1';
    switchView('worldMapView');
  }, 350);
}

function closeOverlays() {
  document.querySelectorAll('.screen-overlay').forEach(o => o.classList.remove('show'));
}

/* =========================================================
   3. PLAYABLE DRAG-TO-CONNECT MATCHING DOT MECHANIC
   ========================================================= */
function randomColor() {
  return DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];
}

function initPlayableBoard(customPreset = null) {
  boardColors = customPreset
    ? [...customPreset]
    : Array.from({ length: TOTAL_CELLS }, () => randomColor());
  renderPlayableBoard();
}

function renderPlayableBoard() {
  const grid = document.getElementById('dotGrid');
  grid.innerHTML = '';

  boardColors.forEach((color, idx) => {
    const btn = document.createElement('button');
    btn.className = 'dot-cell';
    btn.dataset.index = idx;
    btn.style.background = color;

    if (chain.includes(idx)) {
      btn.classList.add('selected');
    }
    if (isSquareFormed && color === activeChainColor) {
      btn.classList.add('square-highlight');
    }

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startDotChain(idx);
    });

    grid.appendChild(btn);
  });

  drawChainLines();
}

function areOrthogonallyAdjacent(idxA, idxB) {
  const r1 = Math.floor(idxA / COLS);
  const c1 = idxA % COLS;
  const r2 = Math.floor(idxB / COLS);
  const c2 = idxB % COLS;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function startDotChain(idx) {
  if (moves <= 0) {
    setGameFeedback('Out of moves! Spin the Wheel for +5 Moves.');
    return;
  }
  isDragging = true;
  isSquareFormed = false;
  activeChainColor = boardColors[idx];
  chain = [idx];
  playConnectNote(0);
  renderPlayableBoard();
}

function handleBoardPointerMove(e) {
  if (!isDragging) return;
  const target = document.elementFromPoint(e.clientX, e.clientY);
  if (!target || !target.classList.contains('dot-cell')) return;

  const targetIdx = Number(target.dataset.index);
  const lastIdx = chain[chain.length - 1];
  if (targetIdx === lastIdx) return;

  /* Backtrack if dragging back to previous dot */
  if (chain.length >= 2 && targetIdx === chain[chain.length - 2]) {
    chain.pop();
    isSquareFormed = false;
    playConnectNote(chain.length - 1);
    renderPlayableBoard();
    return;
  }

  /* Validate same color & orthogonal neighbor */
  if (boardColors[targetIdx] !== activeChainColor) return;
  if (!areOrthogonallyAdjacent(lastIdx, targetIdx)) return;

  /* Check for Square loop (closing back onto an earlier dot in chain) */
  if (chain.includes(targetIdx)) {
    if (chain.length >= 4 && !isSquareFormed) {
      chain.push(targetIdx);
      isSquareFormed = true;
      playConnectNote(chain.length + 2);
      setGameFeedback('✨ SQUARE FORMED! Release to clear ALL dots of this color!');
      renderPlayableBoard();
    }
    return;
  }

  if (!isSquareFormed) {
    chain.push(targetIdx);
    playConnectNote(chain.length - 1);
    renderPlayableBoard();
  }
}

function finishDotChain() {
  if (!isDragging) return;
  isDragging = false;

  const uniqueIndices = [...new Set(chain)];

  if (uniqueIndices.length >= 2 && moves > 0) {
    moves--;
    let clearedThisTurn = 0;

    if (isSquareFormed) {
      /* Square bonus clears all dots matching activeChainColor */
      boardColors = boardColors.map((col) => {
        if (col === activeChainColor) {
          clearedThisTurn++;
          return randomColor();
        }
        return col;
      });
      playClearChord(true);
      setGameFeedback(`💥 SQUARE CLEAR! Removed ${clearedThisTurn} matching dots!`);
    } else {
      uniqueIndices.forEach((idx) => {
        boardColors[idx] = randomColor();
