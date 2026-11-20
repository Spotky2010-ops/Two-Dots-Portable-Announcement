/* =========================================================
   TWO DOTS HANDHELD CONSOLE — STAGES, MANUAL & KEYBOARD OS
   ========================================================= */

const STORAGE_KEY = 'twoDotsConsoleSave_v2';
const DOT_COLORS = ['#ff6b72', '#2185d5', '#4ecdc4', '#f7b731', '#9b59b6'];
const COLS = 6;
const ROWS = 4;
const TOTAL_CELLS = COLS * ROWS;

/* =========================================================
   1. MULTI-STAGE WORLD MAP DATA (LEVELS 1069–1075)
   ========================================================= */
const STAGES = [
  {
    id: 1069,
    sector: 'EMBER FOUNDRY',
    desc: 'Fire Dots 🔥 • Clear 24 dots & 0 anchors',
    moves: 16,
    dotGoal: 24,
    anchorGoal: 0,
    buildBoard: () => {
      const b = Array.from({ length: TOTAL_CELLS }, () => createRandomTile(false, 1));
      b = { type: 'fire', color: '#ff6b72', dropRows: 1 };
      b = { type: 'fire', color: '#ff6b72', dropRows: 1 };
      b = { type: 'fire', color: '#ff6b72', dropRows: 1 };
      return b;
    }
  },
  {
    id: 1070,
    sector: 'CARGO BRIDGE',
    desc: 'Wooden Crates 📦 • Clear 26 dots & crack crates',
    moves: 16,
    dotGoal: 26,
    anchorGoal: 0,
    buildBoard: () => {
      const b = Array.from({ length: TOTAL_CELLS }, () => createRandomTile(false, 1));
      [6, 7, 10, 11, 14, 15].forEach(i => {
        b[i] = { type: 'crate', color: 'crate', hp: 2, dropRows: 1 };
      });
      return b;
    }
  },
  {
    id: 1071,
    sector: 'ROCKET LAUNCHPAD',
    desc: 'Crates & Anchors • Clear 30 dots & sink 2 anchors',
    moves: 15,
    dotGoal: 30,
    anchorGoal: 2,
    buildBoard: () => {
      const b = Array.from({ length: TOTAL_CELLS }, () => createRandomTile(true, 1));
      b = { type: 'anchor', color: 'anchor', dropRows: 1 };
      b = { type: 'anchor', color: 'anchor', dropRows: 1 };
      b = { type: 'crate', color: 'crate', hp: 2, dropRows: 1 };
      b = { type: 'crate', color: 'crate', hp: 2, dropRows: 1 };
      b = { type: 'crate', color: 'crate', hp: 2, dropRows: 1 };
      b = { type: 'crate', color: 'crate', hp: 2, dropRows: 1 };
      b = { type: 'fire', color: '#ff6b72', dropRows: 1 };
      return b;
    }
  },
  {
    id: 1072,
    sector: 'DEEP HARBOR',
    desc: 'Triple Anchor Drop • Clear 28 dots & sink 3 anchors',
    moves: 16,
    dotGoal: 28,
    anchorGoal: 3,
    buildBoard: () => {
      const b = Array.from({ length: TOTAL_CELLS }, () => createRandomTile(false, 1));
      [1, 3, 5].forEach(i => {
        b[i] = { type: 'anchor', color: 'anchor', dropRows: 1 };
      });
      return b;
    }
  },
  {
    id: 1073,
    sector: 'SOLAR REACTOR',
    desc: 'Chain Blast • Clear 34 dots with Fire Dots 🔥',
    moves: 14,
    dotGoal: 34,
    anchorGoal: 1,
    buildBoard: () => {
      const b = Array.from({ length: TOTAL_CELLS }, () => createRandomTile(true, 1));
      [2, 7, 10, 15].forEach(i => {
        b[i] = { type: 'fire', color: '#ff6b72', dropRows: 1 };
      });
      b = { type: 'anchor', color: 'anchor', dropRows: 1 };
      return b;
    }
  },
  {
    id: 1074,
    sector: 'CITADEL VAULT',
    desc: 'Fortress Crates • Clear 35 dots & sink 2 anchors',
    moves: 16,
    dotGoal: 35,
    anchorGoal: 2,
    buildBoard: () => {
      const b = Array.from({ length: TOTAL_CELLS }, () => createRandomTile(false, 1));
      [7, 8, 9, 10, 13, 16].forEach(i => {
        b[i] = { type: 'crate', color: 'crate', hp: 2, dropRows: 1 };
      });
      b = { type: 'anchor', color: 'anchor', dropRows: 1 };
      b = { type: 'anchor', color: 'anchor', dropRows: 1 };
      return b;
    }
  },
  {
    id: 1075,
    sector: 'ORBITAL SUMMIT',
    desc: 'Finale Challenge • Clear 39 dots & sink 3 anchors',
    moves: 17,
    dotGoal: 39,
    anchorGoal: 3,
    buildBoard: () => {
      const b = Array.from({ length: TOTAL_CELLS }, () => createRandomTile(true, 1));
      [0, 3, 5].forEach(i => (b[i] = { type: 'anchor', color: 'anchor', dropRows: 1 }));
      [8, 9, 14, 15].forEach(i => (b[i] = { type: 'crate', color: 'crate', hp: 2, dropRows: 1 }));
      [1, 16].forEach(i => (b[i] = { type: 'fire', color: '#ff6b72', dropRows: 1 }));
      return b;
    }
  }
];

let gold = 10000;
let levelsCompleted = 0;
let unlockedTech = { 3: false, 4: false };
let customEditorBoard = null;
let stageStars = {
  1069: 3,
  1070: 1,
  1071: 0,
  1072: 0,
  1073: 0,
  1074: 0,
  1075: 0
};

let selectedStageIndex = 2; /* Default Level 1071 */
let activeStage = STAGES;
let isPlayingCustomStage = false;

let moves = 15;
let cleared = 0;
let anchorsSunk = 0;
let currentDotGoal = 30;
let currentAnchorGoal = 2;

let wifiConnected = true;
let tvConnected = false;
let activeViewId = 'worldMapView';

/* Board & Keyboard Cursor State */
let boardTiles = [];
let isDragging = false;
let chain = [];
let activeChainColor = null;
let isSquareFormed = false;
let kbdCursorIndex = 0;
let kbdChainingActive = false;

/* =========================================================
   2. INTERACTIVE TWO DOTS USER MANUAL CONTENT
   ========================================================= */
const MANUAL_PAGES = [
  {
    title: 'Controls & Shortcuts',
    html: `
      <strong>Hardware &amp; Hands-Free Keyboard Controls:</strong>
      <ul>
        <li><strong>D-Pad / Arrow Keys (&larr;&uarr;&darr;&rarr;):</strong> Select stages on the World Map or move the cursor on the puzzle board.</li>
        <li><strong>Spacebar:</strong> Start, extend, or release a dot chain using the keyboard cursor.</li>
        <li><strong>A Button / Enter:</strong> Launch the highlighted stage or confirm prompts.</li>
        <li><strong>Menu (&equiv;) / Esc:</strong> Pause gameplay anytime; press <strong>Home (&#8962;) / H</strong> for World Maps.</li>
      </ul>
    `
  },
  {
    title: 'Special Tiles & Squares',
    html: `
      <strong>Mastering Board Mechanics:</strong>
      <ul>
        <li><strong>Squares:</strong> Connect 4+ matching dots in a closed loop to clear <em>every</em> dot of that color on the board!</li>
        <li><strong>Fire Dots 🔥:</strong> Matching a Fire Dot blasts all 4 adjacent orthogonal tiles.</li>
        <li><strong>Anchors ⚓:</strong> Clear dots beneath Anchors so gravity drops them off the bottom row.</li>
        <li><strong>Wooden Crates 📦:</strong> Match dots next to crates twice to crack and clear them.</li>
      </ul>
    `
  },
  {
    title: 'Hardware, HDMI & Charging',
    html: `
      <strong>Console Hardware &amp; Box Contents:</strong>
      <ul>
        <li><strong>Connect to TV (HDMI):</strong> Toggle TV Output in the top bar or Settings to expand the console display.</li>
        <li><strong>Power Button [P]:</strong> Access <em>Standby Mode</em> (live clock/date), <em>Restart</em>, or <em>CRT Shutdown</em>.</li>
        <li><strong>Included in Box:</strong> USB-C Charging Cable, Protective Carrying Bags, Exclusive Wallpaper, Collectible Plush &amp; User Manual.</li>
      </ul>
    `
  },
  {
    title: 'Economy & Tech Tree',
    html: `
      <strong>Upgraded Console Edition Rewards:</strong>
      <ul>
        <li><strong>1.25x Bigger Rewards:</strong> Every completed stage &amp; collection pays 1.25x Gold (Collection target: 10,000 Gold).</li>
        <li><strong>Extra Moves Spin Wheel:</strong> Costs 250 Gold for +5 extra moves in tight stages.</li>
        <li><strong>Expedition Tech Tree:</strong> Unlock permanent perks saved automatically in LocalStorage.</li>
      </ul>
    `
  }
];

let manualPageIndex = 0;

function renderManual() {
  const page = MANUAL_PAGES[manualPageIndex];
  document.getElementById('manualPageIndicator').textContent =
    `Page ${manualPageIndex + 1} / ${MANUAL_PAGES.length}`;

  const chaptersEl = document.getElementById('manualChapters');
  chaptersEl.innerHTML = '';
  MANUAL_PAGES.forEach((p, idx) => {
    const btn = document.createElement('button');
    btn.className = 'chapter-pill' + (idx === manualPageIndex ? ' active' : '');
    btn.textContent = `${idx + 1}. ${p.title}`;
    btn.onclick = () => {
      playUiClick();
      manualPageIndex = idx;
      renderManual();
    };
    chaptersEl.appendChild(btn);
  });

  document.getElementById('manualContent').innerHTML = page.html;
}

function changeManualPage(delta) {
  playUiClick();
  manualPageIndex = (manualPageIndex + delta + MANUAL_PAGES.length) % MANUAL_PAGES.length;
  renderManual();
}

/* =========================================================
   3. LOCALSTORAGE PERSISTENCE
   ========================================================= */
function saveProgress() {
  const payload = {
    gold,
    levelsCompleted,
    unlockedTech,
    customEditorBoard,
    stageStars,
    selectedStageIndex
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    const badge = document.getElementById('saveBadge');
    if (badge) {
      badge.classList.add('flash');
      setTimeout(() => badge.classList.remove('flash'), 300);
    }
  } catch (err) {
    console.warn('LocalStorage unavailable:', err);
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (typeof saved.gold === 'number') gold = saved.gold;
    if (typeof saved.levelsCompleted === 'number') levelsCompleted = saved.levelsCompleted;
    if (saved.unlockedTech) unlockedTech = { ...unlockedTech, ...saved.unlockedTech };
    if (saved.stageStars) stageStars = { ...stageStars, ...saved.stageStars };
    if (typeof saved.selectedStageIndex === 'number') selectedStageIndex = saved.selectedStageIndex;
    if (Array.isArray(saved.customEditorBoard) && saved.customEditorBoard.length === TOTAL_CELLS) {
      customEditorBoard = saved.customEditorBoard;
    }
  } catch (err) {
    console.warn('Could not parse saved state:', err);
  }
}

function applySavedUiState() {
  updateGold();
  updateProfileStats();
  renderWorldMap();

  if (unlockedTech) {
