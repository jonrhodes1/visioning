'use strict';

/* ============================================================
   GLOBAL STATE
   ============================================================ */
const visioningState = {
  currentStep: 1,
  valuesSort: {
    veryImportant: [],
    somewhatImportant: []
  },
  customValues: [
    { title: '', description: '' },
    { title: '', description: '' }
  ],
  top10Values: [],    // ordered array of value titles
  edgeValues: [],     // array of 2 value titles
  players: [],
  currentRoles: {},   // { playerName: 'Visionary' | 'Catalyst' | 'Challenger' | 'Supporter' }
  rounds: [],         // completed round records
  selectedEndGameIdea: null, // { theme, prompt } or { custom: true, goal }
  realVision: {
    goal: '',
    pitch: '',
    grow: { whoInvolved: '', whatMeaningful: '', firstStep: '' },
    imagine: { visibleSigns: '', conversations: '', decisions: '', behaviours: '', impact: '' },
    systems: { drive: '', threat: '', soothing: '' },
    archetypes: []
  },
  timeline: {
    targets: [],
    obstacles: [],
    actions: [],
    whatsNext: ''
  },
  commitments: [], // { player, action, when, support, done }
  missionStatement: { anchor: '', goal: '', agency: '' }
};

/* ============================================================
   GAME STATE (transient per-round data)
   ============================================================ */
let gameState = {
  currentPhase: null,
  currentTheme: null,
  catalystRevealed: false,
  challengerRevealed: false,
  catalystCard: null,
  challengerCard: null,
  showEndGameConfirm: false,
  addItemModal: null  // { type } when open
};

/* ============================================================
   NAVIGATION
   ============================================================ */
let currentScreen = 'orientation';
let navigationHistory = [];

const PROGRESS_STEPS = [
  { id: 'values',  label: 'Values', screens: ['orientation', 'valuesSort'] },
  { id: 'rank',    label: 'Rank',   screens: ['selectTop10', 'rankTop10', 'lockIn'] },
  { id: 'edge',    label: 'Edge',   screens: ['edgeValues'] },
  { id: 'game',    label: 'Game',   screens: ['gameIntro', 'playerSetup', 'roleAssignment', 'themeSelection', 'roundPitch', 'roundGrow', 'roundImagine', 'roundComplete'] },
  { id: 'vision',  label: 'Vision', screens: ['endGame', 'realVision'] },
  { id: 'action',  label: 'Action', screens: ['timeline', 'commitment', 'backOfBook'] },
  { id: 'output',  label: 'Output', screens: ['finalOutput'] }
];

function navigate(screen) {
  if (currentScreen !== screen) {
    navigationHistory.push(currentScreen);
  }
  const content = document.getElementById('app-content');
  content.classList.add('leaving');
  setTimeout(() => {
    currentScreen = screen;
    updateHeader();
    renderScreen();
    content.classList.remove('leaving');
    content.classList.add('entering');
    setTimeout(() => content.classList.remove('entering'), 400);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 200);
}

function goBack() {
  if (navigationHistory.length === 0) return;
  const prev = navigationHistory.pop();
  const content = document.getElementById('app-content');
  content.classList.add('leaving');
  setTimeout(() => {
    currentScreen = prev;
    updateHeader();
    renderScreen();
    content.classList.remove('leaving');
    content.classList.add('entering');
    setTimeout(() => content.classList.remove('entering'), 400);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 200);
}

function goHome() {
  navigationHistory = [];
  navigate('orientation');
}

function updateHeader() {
  const header = document.getElementById('app-header');
  if (currentScreen === 'orientation') {
    header.classList.add('hidden');
    return;
  }
  header.classList.remove('hidden');

  // Update brand with back + home
  const brand = header.querySelector('.header-brand');
  if (brand) {
    const canBack = navigationHistory.length > 0;
    brand.innerHTML = `
      ${canBack ? `<button class="nav-back-btn" onclick="goBack()" title="Go back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>` : ''}
      <button class="nav-home-btn" onclick="goHome()" title="Home">VISIONING</button>
    `;
  }

  renderProgressTracker();
}

function renderProgressTracker() {
  const currentIdx = PROGRESS_STEPS.findIndex(s => s.screens.includes(currentScreen));
  const tracker = document.getElementById('progress-tracker');
  if (!tracker) return;

  let html = '';
  PROGRESS_STEPS.forEach((step, i) => {
    const status = i < currentIdx ? 'completed' : i === currentIdx ? 'active' : 'locked';
    const checkIcon = status === 'completed'
      ? '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '';
    html += `<div class="progress-step ${status}"><div class="progress-dot">${checkIcon}</div><span class="progress-label">${step.label}</span></div>`;
    if (i < PROGRESS_STEPS.length - 1) html += '<div class="progress-line"></div>';
  });
  tracker.innerHTML = html;
}

/* ============================================================
   MAIN RENDER DISPATCHER
   ============================================================ */
function renderScreen() {
  const content = document.getElementById('app-content');
  const map = {
    orientation:     [renderOrientation,    initOrientation],
    valuesSort:      [renderValuesSort,      initValuesSort],
    selectTop10:     [renderSelectTop10,     initSelectTop10],
    rankTop10:       [renderRankTop10,       initRankTop10],
    lockIn:          [renderLockIn,          initLockIn],
    edgeValues:      [renderEdgeValues,      initEdgeValues],
    gameIntro:       [renderGameIntro,       initGameIntro],
    playerSetup:     [renderPlayerSetup,     initPlayerSetup],
    roleAssignment:  [renderRoleAssignment,  initRoleAssignment],
    themeSelection:  [renderThemeSelection,  initThemeSelection],
    roundPitch:      [renderRoundPitch,      initRoundPitch],
    roundGrow:       [renderRoundGrow,       initRoundGrow],
    roundImagine:    [renderRoundImagine,    initRoundImagine],
    roundComplete:   [renderRoundComplete,   initRoundComplete],
    endGame:         [renderEndGame,         initEndGame],
    realVision:      [renderRealVision,      initRealVision],
    timeline:        [renderTimeline,        initTimeline],
    commitment:      [renderCommitment,      initCommitment],
    backOfBook:      [renderBackOfBook,      initBackOfBook],
    finalOutput:     [renderFinalOutput,     initFinalOutput]
  };
  const [renderFn, initFn] = map[currentScreen] || [() => '<p>Screen not found</p>', () => {}];
  content.innerHTML = renderFn();
  if (initFn) initFn();
}

/* ============================================================
   UTILITY HELPERS
   ============================================================ */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getValueByTitle(title) {
  return leadershipValues.find(v => v.title === title);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function plural(n, word) {
  return n === 1 ? `1 ${word}` : `${n} ${word}s`;
}

/* ============================================================
   SCREEN 1: ORIENTATION
   ============================================================ */
function renderOrientation() {
  return `
  <div class="o-wrap">
  <!-- TOP BAR -->
  <div class="o-topbar">
    <span class="o-topbar-tag">Experience 5</span>
    <span class="o-topbar-sep">·</span>
    <span class="o-topbar-org">VISIONING</span>
  </div>

  <!-- HERO -->
  <div class="o-hero">
    <div class="o-hero-main">
      <h1 class="o-title o-title-animated" id="o-main-title" aria-label="Visioning">
        ${buildAnimatedTitle('Visioning')}
      </h1>
      <div class="o-subtitle-row">
        <div class="o-subtitle-line"></div>
        <p class="o-subtitle-text">Turning values into a future people can connect with, understand, and act on.</p>
      </div>
    </div>
    <div class="o-hero-aside">
      <div class="o-stat-block">
        <div class="o-stat">
          <div class="o-stat-number">48</div>
          <div class="o-stat-label">Leadership values</div>
        </div>
        <div class="o-stat">
          <div class="o-stat-number">10</div>
          <div class="o-stat-label">Vision Exercises</div>
        </div>
        <div class="o-stat">
          <div class="o-stat-number">2035</div>
          <div class="o-stat-label">Target horizon</div>
        </div>
      </div>
    </div>
  </div>

  <!-- STEP DIVIDER -->
  <div class="o-divider-row">
    <div class="o-step">
      <span class="o-step-num">01</span>
      <span class="o-step-label">Values</span>
    </div>
    <div class="o-step">
      <span class="o-step-num">02</span>
      <span class="o-step-label">Ranking</span>
    </div>
    <div class="o-step">
      <span class="o-step-num">03</span>
      <span class="o-step-label">Edge</span>
    </div>
    <div class="o-step">
      <span class="o-step-num">04</span>
      <span class="o-step-label">Game</span>
    </div>
    <div class="o-step">
      <span class="o-step-num">05</span>
      <span class="o-step-label">Vision</span>
    </div>
    <div class="o-step">
      <span class="o-step-num">06</span>
      <span class="o-step-label">Action</span>
    </div>
    <div class="o-step accent">
      <span class="o-step-num">07</span>
      <span class="o-step-label">Output</span>
    </div>
  </div>

  <!-- THREE PILLARS -->
  <div class="o-pillars">
    <div class="o-pillar o-pillar-values">
      <div class="o-pillar-accent-line"></div>
      <div class="o-pillar-num">01 / Values</div>
      <div class="o-pillar-title">What matters most</div>
      <p class="o-pillar-body">Identify the values that shape your leadership, especially when pressure increases.</p>
    </div>
    <div class="o-pillar o-pillar-vision">
      <div class="o-pillar-accent-line"></div>
      <div class="o-pillar-num">02 / Vision</div>
      <div class="o-pillar-title">Where you're heading</div>
      <p class="o-pillar-body">Use future thinking to imagine what those values look like built into everyday practice.</p>
    </div>
    <div class="o-pillar o-pillar-momentum">
      <div class="o-pillar-accent-line"></div>
      <div class="o-pillar-num">03 / Momentum</div>
      <div class="o-pillar-title">How you move</div>
      <p class="o-pillar-body">Translate vision into shared action, clear milestones, and personal commitments.</p>
    </div>
  </div>

  <!-- INSIGHT + CTA -->
  <div class="o-lower">
    <p class="o-insight">
      <strong>Connecting to your previous work:</strong> Your Archetype describes how you tend to lead. The Three Systems show you when Drive, Threat, or Soothing shapes behaviour. Visioning brings these together: what future do we want to build, and how do we behave our way towards it?
    </p>
    <div class="o-cta">
      <button class="btn btn-primary btn-lg" onclick="navigate('valuesSort')" style="white-space:nowrap;">
        Start Values Sort
      </button>
      <a href="Visioning_Handout.docx" download class="o-handout-link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;"><path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Download session handout
      </a>
      <p class="o-cta-sub">48 values + 2 custom slots · Ranking · Game · Blueprint PDF</p>
    </div>
  </div>

  </div>
  <!-- END o-wrap -->
`;
}

/* Helper: animated title letters */
function buildAnimatedTitle(word) {
  return [...word].map((ch, i) =>
    `<span class="o-letter" style="animation-delay:${i * 0.07}s">${ch}</span>`
  ).join('');
}

function initOrientation() {
  // Re-trigger animation when coming back to home
  const title = document.getElementById('o-main-title');
  if (title) {
    title.querySelectorAll('.o-letter').forEach(el => {
      el.style.animation = 'none';
      el.offsetHeight; // force reflow
      el.style.animation = '';
    });
  }
}

/* ============================================================
   SCREEN 2: VALUES SORT
   ============================================================ */
function getCustomValueTitle(idx) {
  const cv = visioningState.customValues[idx];
  return cv && cv.title.trim() ? cv.title.trim() : null;
}

function buildDial(viStd, siStd, sortedStd) {
  const ratio   = sortedStd > 0 ? siStd / sortedStd : 0.5;
  const angle   = Math.round((ratio - 0.5) * 160); // -80 (all VI) → 0 (balanced) → +80 (all SI)
  const cx = 100, cy = 102, R = 82;

  // Coloured arc segment — highlight the side that's heavier
  // We draw two half-arcs: left (VI) and right (SI), tinting the heavier one
  const viAlpha = sortedStd > 0 ? Math.min(0.9, 0.2 + (viStd / Math.max(sortedStd,1)) * 0.8) : 0.35;
  const siAlpha = sortedStd > 0 ? Math.min(0.9, 0.2 + (siStd / Math.max(sortedStd,1)) * 0.8) : 0.35;

  return `
  <div class="sort-dial-wrap">
    <div class="sort-dial-title">Value Balance</div>
    <svg viewBox="0 0 200 120" class="sort-dial-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dialTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stop-color="#FF5500" stop-opacity="${viAlpha.toFixed(2)}"/>
          <stop offset="44%"  stop-color="#E8E4DE" stop-opacity="1"/>
          <stop offset="56%"  stop-color="#E8E4DE" stop-opacity="1"/>
          <stop offset="100%" stop-color="#FF5500" stop-opacity="${siAlpha.toFixed(2)}"/>
        </linearGradient>
        <filter id="needleGlow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Track: grey base -->
      <path d="M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}"
            fill="none" stroke="#E0DBD2" stroke-width="14" stroke-linecap="round"/>

      <!-- Track: gradient overlay (weighted sides) -->
      <path d="M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}"
            fill="none" stroke="url(#dialTrackGrad)" stroke-width="14" stroke-linecap="round"/>

      <!-- Tick marks: extremes -->
      <circle cx="${cx-R+3}" cy="${cy}" r="3.5" fill="#FF5500" opacity="0.25"/>
      <circle cx="${cx+R-3}" cy="${cy}" r="3.5" fill="#FF5500" opacity="0.25"/>

      <!-- Tick mark: balanced (12 o'clock on arc) -->
      <line x1="${cx}" y1="${cy-R-7}" x2="${cx}" y2="${cy-R+5}"
            stroke="#B8B2A8" stroke-width="2" stroke-linecap="round"/>

      <!-- Needle -->
      <g transform="rotate(${angle}, ${cx}, ${cy})">
        <animateTransform attributeName="transform" type="rotate"
          from="0 ${cx} ${cy}" to="${angle} ${cx} ${cy}"
          dur="0.65s" calcMode="spline"
          keyTimes="0;1" keySplines="0.34 1.56 0.64 1"
          fill="freeze"/>
        <!-- Shadow -->
        <line x1="${cx}" y1="${cy-4}" x2="${cx}" y2="${cy-66}"
              stroke="#FF5500" stroke-width="6" stroke-linecap="round" opacity="0.12"/>
        <!-- Needle body -->
        <line x1="${cx}" y1="${cy-4}" x2="${cx}" y2="${cy-68}"
              stroke="#FF5500" stroke-width="3" stroke-linecap="round" filter="url(#needleGlow)"/>
        <!-- Tip dot -->
        <circle cx="${cx}" cy="${cy-68}" r="4" fill="#FF5500"/>
      </g>

      <!-- Hub ring -->
      <circle cx="${cx}" cy="${cy}" r="10" fill="#FF5500"/>
      <circle cx="${cx}" cy="${cy}" r="5.5" fill="#FFFFFF"/>
      <circle cx="${cx}" cy="${cy}" r="2"   fill="#FF5500"/>

      <!-- VI count (left) -->
      <text x="30" y="80" font-family="Inter,system-ui,sans-serif" font-size="20"
            font-weight="900" fill="#FF5500" text-anchor="middle">${viStd}</text>
      <text x="30" y="92" font-family="Inter,system-ui,sans-serif" font-size="8"
            font-weight="800" letter-spacing="1.5" fill="#8A8278" text-anchor="middle">VI</text>

      <!-- SI count (right) -->
      <text x="170" y="80" font-family="Inter,system-ui,sans-serif" font-size="20"
            font-weight="900" fill="#FF5500" text-anchor="middle">${siStd}</text>
      <text x="170" y="92" font-family="Inter,system-ui,sans-serif" font-size="8"
            font-weight="800" letter-spacing="1.5" fill="#8A8278" text-anchor="middle">SI</text>

      <!-- Bottom labels -->
      <text x="6"   y="117" font-family="Inter,system-ui,sans-serif" font-size="8"
            font-weight="700" letter-spacing="0.5" fill="#C8C2B5" text-anchor="start">VERY</text>
      <text x="${cx}" y="117" font-family="Inter,system-ui,sans-serif" font-size="8"
            fill="#C8C2B5" text-anchor="middle">~24 each</text>
      <text x="194" y="117" font-family="Inter,system-ui,sans-serif" font-size="8"
            font-weight="700" letter-spacing="0.5" fill="#C8C2B5" text-anchor="end">SOMEWHAT</text>
    </svg>
  </div>`;
}

function renderValuesSort() {
  const vi = visioningState.valuesSort.veryImportant;
  const si = visioningState.valuesSort.somewhatImportant;
  const sortedTitles = new Set([...vi, ...si]);

  // Standard unsorted values (48)
  const unsortedStd = leadershipValues.filter(v => !sortedTitles.has(v.title));

  // Custom values: only show as sortable if they have a title
  const customUnsorted = visioningState.customValues
    .map((cv, idx) => ({ idx, title: cv.title.trim(), description: cv.description.trim() }))
    .filter(cv => cv.title && !sortedTitles.has(`__custom_${cv.idx}`));

  // Completion: all 48 standard values sorted (custom optional)
  const stdSortedCount = leadershipValues.filter(v => sortedTitles.has(v.title)).length;
  const total = leadershipValues.length; // 48
  const pct = Math.round((stdSortedCount / total) * 100);
  const allSorted = stdSortedCount === total;

  // Unsorted standard cards
  const unsortedStdHtml = unsortedStd.map(v => `
    <div class="value-card">
      <div class="value-card-title">${escHtml(v.title)}</div>
      <div class="value-card-desc">${escHtml(v.description)}</div>
      <div class="value-card-actions">
        <button class="value-card-vi" onclick="sortValue('${escHtml(v.title)}','vi')">Very Important</button>
        <button class="value-card-si" onclick="sortValue('${escHtml(v.title)}','si')">Somewhat Important</button>
      </div>
    </div>`).join('');

  // Custom sortable cards (if named)
  const customSortableHtml = customUnsorted.map(cv => `
    <div class="value-card value-card-custom">
      <div class="value-card-title">${escHtml(cv.title)} <span class="custom-tag">Custom</span></div>
      ${cv.description ? `<div class="value-card-desc">${escHtml(cv.description)}</div>` : ''}
      <div class="value-card-actions">
        <button class="value-card-vi" onclick="sortValue('__custom_${cv.idx}','vi')">Very Important</button>
        <button class="value-card-si" onclick="sortValue('__custom_${cv.idx}','si')">Somewhat Important</button>
      </div>
    </div>`).join('');

  // Custom input cards (always shown at bottom of unsorted, even if already named)
  const customInputHtml = visioningState.customValues.map((cv, idx) => {
    const isSorted = sortedTitles.has(`__custom_${idx}`);
    return `
    <div class="value-card value-card-custom-input ${isSorted ? 'value-card-custom-sorted' : ''}">
      <div class="custom-input-label">Custom Value ${idx + 1} <span class="custom-tag">Your own</span></div>
      <input class="form-input" style="margin-bottom:6px;" type="text" maxlength="50"
             placeholder="Name your value (optional)"
             value="${escHtml(cv.title)}"
             oninput="updateCustomValue(${idx},'title',this.value)">
      <input class="form-input" type="text" maxlength="120"
             placeholder="Brief description (optional)"
             value="${escHtml(cv.description)}"
             oninput="updateCustomValue(${idx},'description',this.value)">
      ${cv.title.trim() && !isSorted ? `
      <div class="value-card-actions" style="margin-top:8px;">
        <button class="value-card-vi" onclick="sortValue('__custom_${idx}','vi')">Very Important</button>
        <button class="value-card-si" onclick="sortValue('__custom_${idx}','si')">Somewhat Important</button>
      </div>` : ''}
      ${isSorted ? `<div style="font-size:0.75rem;color:var(--success);font-weight:700;margin-top:6px;">Sorted</div>` : ''}
    </div>`;
  }).join('');

  // Sorted columns — 2-column grid
  const viHtml = vi.length > 0 ? `<div class="sorted-grid">${vi.map(t => {
    const label = t.startsWith('__custom_') ? (visioningState.customValues[+t.slice(9)]?.title || 'Custom') : t;
    return `<div class="sorted-pill"><span class="sorted-pill-title">${escHtml(label)}</span><button class="sorted-card-undo" onclick="unsortValue('${escHtml(t)}')">x</button></div>`;
  }).join('')}</div>` : '<p class="sort-empty-note">None yet</p>';

  const siHtml = si.length > 0 ? `<div class="sorted-grid">${si.map(t => {
    const label = t.startsWith('__custom_') ? (visioningState.customValues[+t.slice(9)]?.title || 'Custom') : t;
    return `<div class="sorted-pill sorted-pill-si"><span class="sorted-pill-title">${escHtml(label)}</span><button class="sorted-card-undo" onclick="unsortValue('${escHtml(t)}')">x</button></div>`;
  }).join('')}</div>` : '<p class="sort-empty-note">None yet</p>';

  // Balance logic — standard values only
  const viStd = vi.filter(t => !t.startsWith('__custom_')).length;
  const siStd = si.filter(t => !t.startsWith('__custom_')).length;
  const diff = Math.abs(viStd - siStd);
  const WARN_THRESHOLD = 8;
  const isUneven = allSorted && diff > WARN_THRESHOLD;
  const sortedStd = viStd + siStd;

  return `
  <div>
    <h1 class="screen-title">Sort your leadership values</h1>
    <p class="screen-subtitle">Sort each value into one of two columns based on how important it is to your leadership. Aim for a <strong>roughly equal split</strong> between the two columns (around 24 each). This is not about what sounds good. It is about what genuinely drives your decisions.</p>

    <div class="insight-strip" style="margin-bottom:20px;">
      <strong>Two custom value slots are available</strong> at the bottom of the list. Add values not included here that matter to your leadership. Custom values are optional and do not affect completion.
    </div>

    <div style="margin-bottom:8px;">
      <div class="sort-progress-label">
        <span>${stdSortedCount} of ${total} standard values sorted</span>
        <span style="color:var(--accent);font-weight:700;">${pct}%</span>
      </div>
      <div class="sort-progress-bar">
        <div class="sort-progress-fill" style="width:${pct}%"></div>
      </div>
    </div>

    <!-- BALANCE DIAL -->
    ${buildDial(viStd, siStd, sortedStd)}

    <div class="sort-layout">
      <!-- UNSORTED COLUMN -->
      <div class="sort-col-unsorted">
        <div class="sort-column-header">
          <span class="sort-column-title">To Sort</span>
          <span class="sort-count">${unsortedStd.length}</span>
        </div>
        <div class="sort-column">
          ${unsortedStdHtml || '<div class="empty-state" style="margin-bottom:12px;">All standard values sorted!</div>'}
          ${customInputHtml}
        </div>
      </div>

      <!-- SORTED COLUMNS -->
      <div class="sort-col-sorted">
        <div class="sort-col-vi">
          <div class="sort-column-header">
            <span class="sort-column-title" style="color:var(--accent);">Very Important</span>
            <span class="sort-count">${vi.length}</span>
          </div>
          ${viHtml}
        </div>
        <div class="sort-col-si">
          <div class="sort-column-header">
            <span class="sort-column-title" style="color:var(--accent);">Somewhat Important</span>
            <span class="sort-count">${si.length}</span>
          </div>
          ${siHtml}
        </div>
      </div>
    </div>

    ${isUneven ? `
    <div class="sort-balance-warning">
      <span class="sort-balance-warning-icon">⚠</span>
      <div>
        <strong>Your columns look uneven</strong> (${viStd} Very Important vs ${siStd} Somewhat Important). A big gap can make the next steps less meaningful. Consider moving a few values across to balance them out. Click the <strong>x</strong> next to any value to unsort it.
      </div>
    </div>` : ''}

    <div style="margin-top:28px;">
      <button class="btn btn-primary btn-lg" onclick="navigate('selectTop10')" ${allSorted ? '' : 'disabled'}>
        Continue to Ranking
      </button>
      ${!allSorted ? `<p style="margin-top:10px;font-size:0.875rem;color:var(--t3);">${total - stdSortedCount} standard value${(total - stdSortedCount) !== 1 ? 's' : ''} left to sort</p>` : ''}
    </div>
  </div>`;
}

function initValuesSort() {}

function updateCustomValue(idx, field, val) {
  visioningState.customValues[idx][field] = val;
  // Don't re-render — just update state silently so typing works
}

function sortValue(title, category) {
  const vi = visioningState.valuesSort.veryImportant;
  const si = visioningState.valuesSort.somewhatImportant;
  if (vi.includes(title) || si.includes(title)) return;
  if (category === 'vi') vi.push(title);
  else si.push(title);
  refreshValuesSort();
}

function unsortValue(title) {
  visioningState.valuesSort.veryImportant = visioningState.valuesSort.veryImportant.filter(t => t !== title);
  visioningState.valuesSort.somewhatImportant = visioningState.valuesSort.somewhatImportant.filter(t => t !== title);
  refreshValuesSort();
}

function refreshValuesSort() {
  // Capture current custom value inputs before re-render
  document.querySelectorAll('[oninput*="updateCustomValue"]').forEach(el => {
    const match = el.getAttribute('oninput').match(/updateCustomValue\((\d+),'(\w+)'/);
    if (match) visioningState.customValues[+match[1]][match[2]] = el.value;
  });
  const content = document.getElementById('app-content');
  content.innerHTML = renderValuesSort();
}

/* ============================================================
   SCREEN 3A: SELECT TOP 10
   ============================================================ */
function getDisplayTitle(title) {
  if (title.startsWith('__custom_')) {
    const idx = +title.slice(9);
    return visioningState.customValues[idx]?.title || 'Custom Value';
  }
  return title;
}

function getDisplayValue(title) {
  if (title.startsWith('__custom_')) {
    const idx = +title.slice(9);
    const cv = visioningState.customValues[idx];
    return cv ? { title: cv.title || 'Custom Value', description: cv.description || '' } : null;
  }
  return getValueByTitle(title);
}

function renderSelectTop10() {
  const vi = visioningState.valuesSort.veryImportant;
  const si = visioningState.valuesSort.somewhatImportant;
  const allValues = [...vi, ...si.filter(t => !vi.includes(t))];
  const sel = visioningState.top10Values;
  const count = sel.length;
  const complete = count === 10;

  const pillsHtml = sel.map(t => `<span class="rank-pill">${escHtml(t)}</span>`).join('');

  const cardsHtml = allValues.map(title => {
    const v = getDisplayValue(title);
    if (!v) return '';
    const isSelected = sel.includes(title);
    const isDisabled = !isSelected && count >= 10;
    return `
      <div class="selectable-value-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
           onclick="${isDisabled ? '' : `toggleTop10('${escHtml(title)}')`}"
           style="${isDisabled ? 'pointer-events:none' : 'cursor:pointer'}">
        <div class="selectable-check">
          ${isSelected ? '<span class="selectable-check-icon">✓</span>' : ''}
        </div>
        <div>
          <div class="selectable-value-title">${escHtml(v.title)}</div>
          <div class="selectable-value-desc">${escHtml(v.description)}</div>
        </div>
      </div>`;
  }).join('');

  return `
  <div>
    <h1 class="screen-title">Step 2: Prioritise your leadership values</h1>
    <p class="screen-subtitle">Leadership becomes clearer when priorities are visible. Select exactly 10 values that you will actively bring into your behaviour.</p>

    <div class="insight-strip">
      <strong>Why this matters:</strong> Your Archetype shows how you tend to operate. Your values show what you choose to stand for. Together they shape your behaviour when Drive increases, Threat reacts, or Soothing steadies your decisions.
    </div>

    <div class="rank-counter">
      <div>
        <div class="rank-counter-label">Top 10 selected</div>
        ${pillsHtml ? `<div class="rank-selected-list mt-8">${pillsHtml}</div>` : ''}
      </div>
      <div style="display:flex;align-items:baseline;gap:4px;">
        <span class="rank-counter-value">${count}</span>
        <span class="rank-counter-max"> / 10</span>
      </div>
    </div>

    <div class="selectable-values-grid" style="margin-bottom:32px;">${cardsHtml}</div>

    <button class="btn btn-primary btn-lg" onclick="navigate('rankTop10')" ${complete ? '' : 'disabled'}>
      Continue to Ranking →
    </button>
    ${!complete ? `<p style="margin-top:12px;font-size:0.875rem;color:var(--t3);">Select ${10 - count} more value${(10 - count) !== 1 ? 's' : ''}</p>` : ''}
  </div>`;
}

function initSelectTop10() {}

function toggleTop10(title) {
  const sel = visioningState.top10Values;
  const idx = sel.indexOf(title);
  if (idx >= 0) sel.splice(idx, 1);
  else if (sel.length < 10) sel.push(title);

  const content = document.getElementById('app-content');
  content.innerHTML = renderSelectTop10();
}

/* ============================================================
   SCREEN 3B: RANK TOP 10
   ============================================================ */
function renderRankTop10() {
  const items = visioningState.top10Values.map((title, i) => {
    const v = getDisplayValue(title);
    return `
      <div class="rank-item" draggable="true" data-value="${escHtml(title)}" id="ri-${i}">
        <span class="rank-handle">⠿</span>
        <span class="rank-number">${i + 1}</span>
        <div class="rank-item-info">
          <div class="rank-item-title">${escHtml(v ? v.title : title)}</div>
          <div class="rank-item-desc">${escHtml(v ? v.description : '')}</div>
        </div>
        <div class="rank-controls">
          <button class="rank-btn" onclick="moveRankUp(${i})" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button>
          <button class="rank-btn" onclick="moveRankDown(${i})" ${i === visioningState.top10Values.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
        </div>
      </div>`;
  }).join('');

  return `
  <div>
    <h1 class="screen-title">Rank your Top 10</h1>
    <p class="screen-subtitle">Place your values in order. Position 1 should feel most central to how you want to lead.</p>
    <p style="font-size:0.875rem;color:var(--t2);margin-bottom:24px;">Drag and drop to reorder, or use the arrows.</p>

    <div class="rank-list" id="rank-list">${items}</div>

    <div style="margin-top:32px;">
      <button class="btn btn-primary btn-lg" onclick="navigate('lockIn')">
        Lock Values
      </button>
    </div>
  </div>`;
}

function initRankTop10() {
  initDragDrop();
}

function moveRankUp(index) {
  if (index === 0) return;
  const arr = visioningState.top10Values;
  [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
  document.getElementById('app-content').innerHTML = renderRankTop10();
  initRankTop10();
}

function moveRankDown(index) {
  const arr = visioningState.top10Values;
  if (index >= arr.length - 1) return;
  [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
  document.getElementById('app-content').innerHTML = renderRankTop10();
  initRankTop10();
}

function initDragDrop() {
  const list = document.getElementById('rank-list');
  if (!list) return;
  let dragSrc = null;

  list.querySelectorAll('.rank-item').forEach(item => {
    item.addEventListener('dragstart', e => {
      dragSrc = item;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      list.querySelectorAll('.rank-item').forEach(i => i.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      list.querySelectorAll('.rank-item').forEach(i => i.classList.remove('drag-over'));
      if (item !== dragSrc) item.classList.add('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (!dragSrc || dragSrc === item) return;
      const srcVal = dragSrc.dataset.value;
      const tgtVal = item.dataset.value;
      const arr = visioningState.top10Values;
      const si = arr.indexOf(srcVal);
      const ti = arr.indexOf(tgtVal);
      if (si >= 0 && ti >= 0) {
        arr.splice(si, 1);
        arr.splice(ti, 0, srcVal);
        document.getElementById('app-content').innerHTML = renderRankTop10();
        initRankTop10();
      }
    });
  });
}

/* ============================================================
   SCREEN 4: VALUES LOCK-IN
   ============================================================ */
function renderLockIn() {
  const topHtml = visioningState.top10Values.map((t, i) => {
    const v = getDisplayValue(t);
    const displayTitle = v ? v.title : t;
    const displayDesc = v ? v.description : '';
    return `
      <div class="lock-value-row">
        <span class="lock-rank">${i + 1}</span>
        <div>
          <div class="lock-title">${escHtml(displayTitle)}</div>
          <div class="lock-desc">${escHtml(displayDesc)}</div>
        </div>
      </div>`;
  }).join('');

  return `
  <div>
    <h1 class="screen-title">Your Leadership Values Signature</h1>
    <p class="screen-subtitle">These are the values that matter most to your leadership. They shape your decisions, your behaviour, and how others experience working with you.</p>

    <div class="lock-grid lock-grid-single">
      <div class="card lock-panel top">
        <div class="lock-panel-title" style="color:var(--accent);">Top 10 Values</div>
        ${topHtml}
      </div>
    </div>

    <div class="systems-cards">
      <div class="system-card drive">
        <span class="system-icon">⚡</span>
        <div class="system-title">Drive</div>
        <p class="system-body">These values can increase pace, ambition, and standards. Notice where they help momentum.</p>
      </div>
      <div class="system-card threat">
        <span class="system-icon">⚠</span>
        <div class="system-title">Threat</div>
        <p class="system-body">Some values may become protective under pressure. Watch for control, urgency, or avoidance.</p>
      </div>
      <div class="system-card soothing">
        <span class="system-icon">◎</span>
        <div class="system-title">Soothing</div>
        <p class="system-body">These values support clarity, connection, and steadiness. They help you act with perspective.</p>
      </div>
    </div>

    <button class="btn btn-primary btn-lg" onclick="navigate('edgeValues')">
      Continue to Edge Values →
    </button>
  </div>`;
}

function initLockIn() {}

/* ============================================================
   SCREEN 5: EDGE VALUES
   ============================================================ */
function renderEdgeValues() {
  const sel = visioningState.edgeValues;
  const complete = sel.length === 2;

  const cardsHtml = visioningState.top10Values.map(title => {
    const v = getDisplayValue(title);
    const displayTitle = v ? v.title : title;
    const isSelected = sel.includes(title);
    const isDisabled = !isSelected && sel.length >= 2;
    return `
      <div class="selectable-value-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
           onclick="${isDisabled ? '' : `toggleEdge('${escHtml(title)}')`}"
           style="${isDisabled ? 'pointer-events:none' : ''}">
        <div class="selectable-check">
          ${isSelected ? '<span class="selectable-check-icon">✓</span>' : ''}
        </div>
        <div>
          <div class="selectable-value-title">${escHtml(displayTitle)}</div>
          <div class="selectable-value-desc">${escHtml(v ? v.description : '')}</div>
        </div>
      </div>`;
  }).join('');

  const featureHtml = complete ? `
    <div style="margin:32px 0;">
      <h2 class="section-title" style="margin-bottom:16px;">Your Edge Values</h2>
      <p class="section-body" style="margin-bottom:24px;">These values will guide the Visioning Game. Notice how they influence the ideas you support and the behaviours you choose.</p>
      <div class="edge-feature-cards">
        ${sel.map(t => {
          const v = getDisplayValue(t);
          const displayTitle = v ? v.title : t;
          return `<div class="edge-feature-card">
            <div class="edge-feature-title">${escHtml(displayTitle)}</div>
            <div class="edge-feature-desc">${escHtml(v ? v.description : '')}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="insight-strip">
        <strong>Your Archetype describes your default style. Your Edge Values guide how that style shows up.</strong> When Drive increases or Threat reacts, these values help you choose the behaviour that fits your future direction.
      </div>
    </div>` : '';

  return `
  <div>
    <h1 class="screen-title">Select your two Edge Values</h1>
    <p class="screen-subtitle">Edge Values define what makes your leadership distinctive. They should be visible in daily behaviour and recognisable to others.</p>

    <div class="selectable-values-grid" style="margin-bottom:24px;">${cardsHtml}</div>

    ${featureHtml}

    <button class="btn btn-primary btn-lg" onclick="navigate('gameIntro')" ${complete ? '' : 'disabled'}>
      Continue to Visioning Game →
    </button>
    ${!complete ? `<p style="margin-top:12px;font-size:0.875rem;color:var(--t3);">Select 2 Edge Values to continue</p>` : ''}
  </div>`;
}

function initEdgeValues() {}

function toggleEdge(title) {
  const sel = visioningState.edgeValues;
  const idx = sel.indexOf(title);
  if (idx >= 0) sel.splice(idx, 1);
  else if (sel.length < 2) sel.push(title);
  document.getElementById('app-content').innerHTML = renderEdgeValues();
}

/* ============================================================
   SCREEN 6: GAME INTRO
   ============================================================ */
function renderGameIntro() {
  const badgesHtml = visioningState.edgeValues.map(t =>
    `<span class="edge-badge">${escHtml(t)}</span>`).join('');

  return `
  <div style="max-width:700px;">
    <h1 class="screen-title">Step 3: The Visioning Game</h1>
    <p class="screen-subtitle">The game turns values into future possibilities. Each round moves through Pitch, Grow, and Imagine. The aim is to build ideas that are ambitious, grounded, and shaped by your Edge Values.</p>

    <div class="phase-bar" style="margin-bottom:32px;">
      <div class="phase-step active">Pitch</div>
      <span class="phase-step-arrow">→</span>
      <div class="phase-step">Grow</div>
      <span class="phase-step-arrow">→</span>
      <div class="phase-step">Imagine</div>
    </div>

    <p style="font-size:0.875rem;color:var(--t3);margin-bottom:8px;">Your Edge Values</p>
    <div class="edge-badges" style="margin-bottom:32px;">${badgesHtml}</div>

    <div class="card" style="margin-bottom:32px;padding:32px;">
      <h3 class="section-title">How the game works</h3>
      <div style="display:flex;flex-direction:column;gap:16px;margin-top:16px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:0.8125rem;font-weight:800;color:white;flex-shrink:0;">1</span>
          <div><strong style="color:var(--t1);">Pitch</strong> <span style="color:var(--t2);">The Visionary leads with a future scenario. Start with "Yes, we will..."</span></div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--success);display:flex;align-items:center;justify-content:center;font-size:0.8125rem;font-weight:800;color:#052e1c;flex-shrink:0;">2</span>
          <div><strong style="color:var(--t1);">Grow</strong> <span style="color:var(--t2);">Supporters expand the idea. The Catalyst introduces an opportunity.</span></div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <span style="width:28px;height:28px;border-radius:50%;background:var(--purple);display:flex;align-items:center;justify-content:center;font-size:0.8125rem;font-weight:800;color:white;flex-shrink:0;">3</span>
          <div><strong style="color:var(--t1);">Imagine</strong> <span style="color:var(--t2);">The Visionary guides the group into an image of the achieved future.</span></div>
        </div>
      </div>
    </div>

    <p style="font-size:0.9375rem;color:var(--t2);margin-bottom:32px;">During rounds, you speak. The screen guides. There are no text inputs in the game itself.</p>

    <button class="btn btn-primary btn-lg" onclick="navigate('playerSetup')">
      Set Up Players →
    </button>
  </div>`;
}

function initGameIntro() {}

/* ============================================================
   SCREEN 6B: PLAYER SETUP
   ============================================================ */
function renderPlayerSetup() {
  const players = visioningState.players;
  const valid = players.length >= 4 && players.length <= 10;

  const listHtml = players.map((name, i) => `
    <div class="player-row">
      <span class="player-name">${escHtml(name)}</span>
      <button class="btn btn-danger btn-sm" onclick="removePlayer(${i})">Remove</button>
    </div>`).join('');

  return `
  <div style="max-width:580px;">
    <h1 class="screen-title">Set up players</h1>
    <p class="screen-subtitle">Enter between 4 and 10 players.</p>

    <div class="add-player-row">
      <input class="form-input" id="player-name-input" type="text" placeholder="Player name" maxlength="50"
             onkeydown="if(event.key==='Enter')addPlayer()">
      <button class="btn btn-secondary" onclick="addPlayer()" style="white-space:nowrap;">Add Player</button>
    </div>

    <div class="player-list">
      ${listHtml || '<p style="color:var(--t3);font-size:0.875rem;">No players added yet</p>'}
    </div>

    <p style="font-size:0.8125rem;color:var(--t3);margin-bottom:24px;">${players.length} / 10 players${players.length < 4 ? ` (need at least ${4 - players.length} more)` : ''}</p>

    <button class="btn btn-primary btn-lg" onclick="assignRoles()" ${valid ? '' : 'disabled'}>
      Assign Roles →
    </button>
  </div>`;
}

function initPlayerSetup() {
  setTimeout(() => document.getElementById('player-name-input')?.focus(), 100);
}

function addPlayer() {
  const input = document.getElementById('player-name-input');
  const name = input ? input.value.trim() : '';
  if (!name) return;
  if (visioningState.players.length >= 10) return;
  if (visioningState.players.includes(name)) {
    input.style.borderColor = 'var(--danger)';
    return;
  }
  visioningState.players.push(name);
  document.getElementById('app-content').innerHTML = renderPlayerSetup();
  initPlayerSetup();
}

function removePlayer(index) {
  visioningState.players.splice(index, 1);
  document.getElementById('app-content').innerHTML = renderPlayerSetup();
  initPlayerSetup();
}

function assignRoles() {
  const shuffled = shuffle(visioningState.players);
  visioningState.currentRoles = {};
  shuffled.forEach((p, i) => {
    if (i === 0) visioningState.currentRoles[p] = 'Visionary';
    else if (i === 1) visioningState.currentRoles[p] = 'Catalyst';
    else if (i === 2) visioningState.currentRoles[p] = 'Challenger';
    else visioningState.currentRoles[p] = 'Supporter';
  });
  navigate('roleAssignment');
}

/* ============================================================
   SCREEN 6C: ROLE ASSIGNMENT
   ============================================================ */
function renderRoleAssignment() {
  const roles = visioningState.currentRoles;

  const roleInfo = {
    Visionary:   { color: 'visionary', icon: '◈', desc: 'Leads the pitch and the final imagery.' },
    Catalyst:    { color: 'catalyst',  icon: '⚡', desc: 'Introduces useful opportunities that grow the idea.' },
    Challenger:  { color: 'challenger',icon: '⚠', desc: 'Introduces pressure or constraints that test the idea.' },
    Supporter:   { color: '',          icon: '◎', desc: 'Expands the idea with detail, energy, and direction.' }
  };

  const cardsHtml = Object.entries(roles).map(([name, role]) => {
    const info = roleInfo[role] || roleInfo.Supporter;
    return `
      <div class="role-card ${info.color}">
        <span class="role-icon">${info.icon}</span>
        <div class="role-title">${escHtml(role)}</div>
        <div class="role-name">${escHtml(name)}</div>
        <p class="role-desc">${info.desc}</p>
      </div>`;
  }).join('');

  return `
  <div>
    <h1 class="screen-title">Role Assignment</h1>
    <p class="screen-subtitle">Roles rotate each round. The Visionary leads. The Catalyst opens opportunity. The Challenger tests the idea. Supporters build it out.</p>

    <div class="role-cards-grid">${cardsHtml}</div>

    <button class="btn btn-primary btn-lg" onclick="navigate('themeSelection')">
      Select Round Theme →
    </button>
  </div>`;
}

function initRoleAssignment() {}

/* ============================================================
   SCREEN 6D: THEME SELECTION
   ============================================================ */
function renderThemeSelection() {
  const completedIds = visioningState.rounds.map(r => r.themeId);

  const cardsHtml = roundThemes.map(theme => {
    const done = completedIds.includes(theme.id);
    return `
      <div class="theme-card ${done ? 'done' : ''}" onclick="selectTheme('${escHtml(theme.id)}')">
        <span class="theme-icon">${theme.icon}</span>
        <div class="theme-title">${escHtml(theme.title)}</div>
        ${done ? '<div style="font-size:0.75rem;color:var(--success);margin-top:4px;">Completed</div>' : ''}
      </div>`;
  }).join('');

  return `
  <div>
    <h1 class="screen-title">Select a Round Theme</h1>
    <p class="screen-subtitle">Click a theme to start the round. Completed themes can be replayed.</p>

    ${renderEdgeBadges()}
    <div class="theme-grid">${cardsHtml}</div>

    ${visioningState.rounds.length > 0 ? `
      <div style="margin-top:16px;">
        <button class="btn btn-secondary" onclick="navigate('endGame')">Go to End Game →</button>
      </div>` : ''}
  </div>`;
}

function initThemeSelection() {}

function selectTheme(themeId) {
  const theme = roundThemes.find(t => t.id === themeId);
  if (!theme) return;
  gameState.currentTheme = theme;
  gameState.catalystRevealed = false;
  gameState.challengerRevealed = false;
  gameState.catalystCard = randFrom(catalystCards);
  gameState.challengerCard = randFrom(challengerCards);
  navigate('roundPitch');
}

/* ============================================================
   GAME: SHARED HELPERS
   ============================================================ */
function renderEdgeBadges() {
  return `<div class="edge-badges">${visioningState.edgeValues.map(t =>
    `<span class="edge-badge">${escHtml(t)}</span>`).join('')}</div>`;
}

function renderPhaseBars(active) {
  const phases = ['Pitch', 'Grow', 'Imagine'];
  return `
    <div class="phase-bar">
      ${phases.map((p, i) => {
        const idx = phases.indexOf(active);
        const state = i < idx ? 'done' : i === idx ? 'active' : '';
        return `<div class="phase-step ${state}">${p}</div>${i < 2 ? '<span class="phase-step-arrow">→</span>' : ''}`;
      }).join('')}
    </div>`;
}

function getVisionary() {
  return Object.entries(visioningState.currentRoles).find(([,r]) => r === 'Visionary')?.[0] || 'Visionary';
}

/* ============================================================
   SCREEN 6E: ROUND — PITCH
   ============================================================ */
function renderRoundPitch() {
  const theme = gameState.currentTheme;
  const visionary = getVisionary();

  return `
  <div style="max-width:720px;">
    ${renderPhaseBars('Pitch')}
    ${renderEdgeBadges()}

    <h1 class="screen-title">Pitch</h1>
    <p style="font-size:1rem;color:var(--accent);font-weight:700;margin-bottom:24px;">Visionary leads: <strong>${escHtml(visionary)}</strong></p>

    <div class="phase-prompt">${escHtml(theme.prompt)}</div>

    <div class="starter-phrase">
      "${escHtml(visionary)} begins: 'Yes, we will…'"
    </div>

    <div class="insight-strip">
      The Visionary sets the direction. Speak freely. The screen will move you forward when ready.
    </div>

    <button class="btn btn-primary btn-lg" onclick="navigate('roundGrow')">
      Move to Grow →
    </button>

    <button class="btn btn-ghost btn-sm end-game-go-btn" onclick="showEndGameConfirm()">
      Go to End Game
    </button>
  </div>`;
}

function initRoundPitch() {}

/* ============================================================
   SCREEN 6F: ROUND — GROW
   ============================================================ */
function renderRoundGrow() {
  const chipsHtml = growPromptChips.map(c =>
    `<div class="prompt-chip">${escHtml(c)}</div>`).join('');

  const catalystHtml = gameState.catalystRevealed
    ? `<div class="revealed-card catalyst-reveal">
        <div class="revealed-card-title">⚡ ${escHtml(gameState.catalystCard.title)}</div>
        <div class="revealed-card-text">${escHtml(gameState.catalystCard.text)}</div>
       </div>`
    : `<div class="facedown-card">
        <span class="facedown-pattern">◈ ◉ ◎ ◆</span>
        <p style="color:var(--t3);font-size:0.875rem;margin-bottom:16px;">Catalyst card (face down)</p>
        <button class="btn btn-secondary" onclick="revealCatalyst()">Reveal Catalyst</button>
       </div>`;

  const challengerHtml = gameState.challengerRevealed
    ? `<div class="revealed-card challenger-reveal">
        <div class="revealed-card-title">⚠ ${escHtml(gameState.challengerCard.title)}</div>
        <div class="revealed-card-text">${escHtml(gameState.challengerCard.text)}</div>
       </div>`
    : `<div class="facedown-card">
        <span class="facedown-pattern">◈ ◉ ◎ ◆</span>
        <p style="color:var(--t3);font-size:0.875rem;margin-bottom:16px;">Challenger card (face down)</p>
        <button class="btn btn-secondary" onclick="revealChallenger()">Reveal Challenger</button>
       </div>`;

  return `
  <div style="max-width:720px;">
    ${renderPhaseBars('Grow')}
    ${renderEdgeBadges()}

    <h1 class="screen-title">Grow</h1>
    <p style="font-size:1rem;color:var(--t2);margin-bottom:24px;">Supporters expand the idea. Use these prompts to build it out.</p>

    <div class="prompt-chips">${chipsHtml}</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;flex-wrap:wrap;">
      <div>
        <p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--success);margin-bottom:12px;">Catalyst Role</p>
        ${catalystHtml}
      </div>
      <div>
        <p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--danger);margin-bottom:12px;">Challenger Role</p>
        ${challengerHtml}
      </div>
    </div>

    <button class="btn btn-primary btn-lg" onclick="navigate('roundImagine')">
      Move to Imagine →
    </button>

    <button class="btn btn-ghost btn-sm end-game-go-btn" onclick="showEndGameConfirm()">
      Go to End Game
    </button>
  </div>`;
}

function initRoundGrow() {}

function revealCatalyst() {
  gameState.catalystRevealed = true;
  document.getElementById('app-content').innerHTML = renderRoundGrow();
}

function revealChallenger() {
  gameState.challengerRevealed = true;
  document.getElementById('app-content').innerHTML = renderRoundGrow();
}

/* ============================================================
   SCREEN 6G: ROUND — IMAGINE
   ============================================================ */
function renderRoundImagine() {
  const visionary = getVisionary();

  return `
  <div style="max-width:720px;">
    ${renderPhaseBars('Imagine')}
    ${renderEdgeBadges()}

    <h1 class="screen-title">Imagine</h1>
    <p style="font-size:1rem;color:var(--t2);margin-bottom:32px;">Visionary guides the group: <strong style="color:var(--t1);">${escHtml(visionary)}</strong></p>

    <div class="imagine-script">
      <p>Imagine this has been achieved.</p>
      <p>Notice the conversations.</p>
      <p>Notice how decisions are made.</p>
      <p>Notice what feels different.</p>
      <p>Notice what people see and experience.</p>
      <p>Notice how your Edge Values show up in behaviour.</p>
      <p>Now, discuss how the vision was for each person. What was different? What was it like to achieve this vision? What would be one suitable step to get us closer to our vision?</p>
    </div>

    <button class="btn btn-success btn-lg" onclick="completeRound()">
      Complete Round ✓
    </button>

    <button class="btn btn-ghost btn-sm end-game-go-btn" onclick="showEndGameConfirm()">
      Go to End Game
    </button>
  </div>`;
}

function initRoundImagine() {}

/* ============================================================
   ROUND COMPLETE
   ============================================================ */
function completeRound() {
  const round = {
    themeId: gameState.currentTheme.id,
    themeTitle: gameState.currentTheme.title,
    prompt: gameState.currentTheme.prompt,
    visionary: getVisionary(),
    catalystCard: gameState.catalystRevealed ? gameState.catalystCard : null,
    challengerCard: gameState.challengerRevealed ? gameState.challengerCard : null,
    edgeValues: [...visioningState.edgeValues],
    completed: true
  };
  visioningState.rounds.push(round);

  // Rotate roles for next round
  rotateRoles();

  navigate('roundComplete');
}

function rotateRoles() {
  const players = visioningState.players;
  const roleOrder = ['Visionary', 'Catalyst', 'Challenger'];
  const newRoles = {};
  const currentVisIdx = players.findIndex(p => visioningState.currentRoles[p] === 'Visionary');
  players.forEach((p, i) => {
    const offset = (i - currentVisIdx - 1 + players.length) % players.length;
    if (offset < 3) newRoles[p] = roleOrder[offset];
    else newRoles[p] = 'Supporter';
  });
  visioningState.currentRoles = newRoles;
}

function renderRoundComplete() {
  const lastRound = visioningState.rounds[visioningState.rounds.length - 1];
  return `
  <div class="round-complete-badge">
    <span class="round-complete-icon">✓</span>
    <div class="round-complete-title">Round Complete</div>
    <p class="round-complete-sub">
      <strong style="color:var(--t1);">${escHtml(lastRound.themeTitle)}</strong>, completed by ${escHtml(lastRound.visionary)}
    </p>
    <div class="round-complete-actions">
      <button class="btn btn-secondary btn-lg" onclick="navigate('themeSelection')">Play Another Round</button>
      <button class="btn btn-primary btn-lg" onclick="navigate('endGame')">Go to End Game →</button>
    </div>
  </div>`;
}

function initRoundComplete() {}

/* ============================================================
   END GAME CONFIRM OVERLAY
   ============================================================ */
function showEndGameConfirm() {
  const overlay = document.createElement('div');
  overlay.className = 'end-game-confirm';
  overlay.id = 'end-game-overlay';
  overlay.innerHTML = `
    <div class="confirm-modal">
      <div class="confirm-modal-title">Move to the End Game now?</div>
      <p class="confirm-modal-body">You can still return to play more rounds later.</p>
      <div class="confirm-modal-actions">
        <button class="btn btn-ghost" onclick="closeEndGameConfirm()">Continue Playing</button>
        <button class="btn btn-primary" onclick="navigate('endGame')">Go to End Game</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function closeEndGameConfirm() {
  document.getElementById('end-game-overlay')?.remove();
}

/* ============================================================
   SCREEN 7: END GAME
   ============================================================ */
let endGameSelectedIdx = null; // index in rounds array, or 'new' for custom

function renderEndGame() {
  const roundCardsHtml = visioningState.rounds.map((r, i) => {
    const isSelected = endGameSelectedIdx === i;
    const tagCatalyst = r.catalystCard ? `<span class="round-select-tag tag-catalyst">⚡ ${escHtml(r.catalystCard.title)}</span>` : '';
    const tagChallenger = r.challengerCard ? `<span class="round-select-tag tag-challenger">⚠ ${escHtml(r.challengerCard.title)}</span>` : '';
    return `
      <div class="round-select-card ${isSelected ? 'selected' : ''}" onclick="selectEndGameRound(${i})">
        <div class="round-select-theme">${escHtml(r.themeTitle)}</div>
        <div class="round-select-meta">Visionary: ${escHtml(r.visionary)}</div>
        <div style="margin-top:6px;">${tagCatalyst}${tagChallenger}</div>
        <div style="margin-top:6px;">${r.edgeValues.map(t => `<span class="round-select-tag" style="background:var(--accent-dim);color:var(--accent);">${escHtml(t)}</span>`).join('')}</div>
      </div>`;
  }).join('');

  const newCardSelected = endGameSelectedIdx === 'new';
  const newCardHtml = `
    <div class="round-select-card ${newCardSelected ? 'selected' : ''}" onclick="selectEndGameRound('new')">
      <div class="round-select-theme">Create a new idea</div>
      <span class="round-select-tag tag-new">+ Custom</span>
    </div>`;

  const newGoalInput = newCardSelected ? `
    <div class="card" style="max-width:580px;margin-bottom:24px;">
      <div class="form-group">
        <label class="form-label">What goal do you want to vision?</label>
        <input class="form-input" id="custom-goal-input" type="text"
               placeholder="Build a stronger leadership culture across the University"
               value="${escHtml(visioningState.realVision.goal)}"
               maxlength="200"
               oninput="visioningState.realVision.goal=this.value">
      </div>
    </div>` : '';

  const canContinue = endGameSelectedIdx !== null && (endGameSelectedIdx !== 'new' || visioningState.realVision.goal.trim().length > 0);

  return `
  <div>
    <h1 class="screen-title">Step 4: The End Game</h1>
    <p class="screen-subtitle">Choose one idea to take forward. Shape it into a real vision with momentum, obstacles, targets, and commitment.</p>

    <div class="round-select-grid">
      ${roundCardsHtml}
      ${newCardHtml}
    </div>

    ${newGoalInput}

    <button class="btn btn-primary btn-lg" onclick="startRealVision()" ${canContinue ? '' : 'disabled'}>
      Build the Real Vision →
    </button>
    ${!canContinue ? `<p style="margin-top:12px;font-size:0.875rem;color:var(--t3);">Select an idea to continue</p>` : ''}
  </div>`;
}

function initEndGame() {}

function selectEndGameRound(idx) {
  endGameSelectedIdx = idx;
  if (idx !== 'new') {
    const round = visioningState.rounds[idx];
    visioningState.selectedEndGameIdea = round;
    visioningState.realVision.goal = round.themeTitle;
  } else {
    visioningState.selectedEndGameIdea = null;
  }
  document.getElementById('app-content').innerHTML = renderEndGame();
  initEndGame();
}

function startRealVision() {
  if (endGameSelectedIdx === 'new' && !visioningState.realVision.goal.trim()) return;
  if (endGameSelectedIdx !== 'new') {
    visioningState.selectedEndGameIdea = visioningState.rounds[endGameSelectedIdx];
  } else {
    visioningState.selectedEndGameIdea = { custom: true, goal: visioningState.realVision.goal };
  }
  navigate('realVision');
}

/* ============================================================
   SCREEN 8: REAL VISION BUILDER
   ============================================================ */
function renderRealVision() {
  const rv = visioningState.realVision;
  const idea = visioningState.selectedEndGameIdea;
  const ideaTitle = idea ? (idea.custom ? rv.goal : idea.themeTitle) : '';

  const archetypeHtml = archetypes.map(a => {
    const sel = rv.archetypes.includes(a);
    return `<button class="archetype-btn ${sel ? 'selected' : ''}" onclick="toggleArchetype('${escHtml(a)}')">${escHtml(a)}</button>`;
  }).join('');

  return `
  <div>
    <h1 class="screen-title">Build the Real Vision</h1>
    <p class="screen-subtitle" style="margin-bottom:8px;">Vision: <strong style="color:var(--accent);">${escHtml(ideaTitle)}</strong></p>
    <p style="font-size:0.875rem;color:var(--t2);margin-bottom:40px;">This section uses written inputs. Take time to be specific.</p>

    <div class="vision-panels">
      <!-- PITCH -->
      <div class="vision-panel">
        <div class="vision-panel-header">
          <div class="vision-panel-badge">1</div>
          <div>
            <div class="vision-panel-title">Pitch</div>
            <div class="vision-panel-sub">How will you communicate this clearly to your team?</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">The future, why it matters, and what people will notice</label>
          <textarea class="form-textarea" rows="4" maxlength="1000"
                    placeholder="Describe the future clearly. Why does it matter? What will people notice when it's real?"
                    oninput="visioningState.realVision.pitch=this.value">${escHtml(rv.pitch)}</textarea>
        </div>
      </div>

      <!-- GROW -->
      <div class="vision-panel">
        <div class="vision-panel-header">
          <div class="vision-panel-badge" style="background:var(--success);">2</div>
          <div>
            <div class="vision-panel-title">Grow</div>
            <div class="vision-panel-sub">Build out who is involved and how momentum starts</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Who needs to be involved?</label>
          <textarea class="form-textarea" rows="3" maxlength="500"
                    placeholder="Name the people, teams, or groups whose involvement shapes success"
                    oninput="visioningState.realVision.grow.whoInvolved=this.value">${escHtml(rv.grow.whoInvolved)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">What would make this meaningful to them?</label>
          <textarea class="form-textarea" rows="3" maxlength="500"
                    placeholder="What matters to them about this? What connects it to their work or values?"
                    oninput="visioningState.realVision.grow.whatMeaningful=this.value">${escHtml(rv.grow.whatMeaningful)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">What would help less motivated people take a first step?</label>
          <textarea class="form-textarea" rows="3" maxlength="500"
                    placeholder="A low-barrier entry point. Something visible, safe, or easy to try"
                    oninput="visioningState.realVision.grow.firstStep=this.value">${escHtml(rv.grow.firstStep)}</textarea>
        </div>
      </div>

      <!-- IMAGINE -->
      <div class="vision-panel">
        <div class="vision-panel-header">
          <div class="vision-panel-badge" style="background:var(--purple);">3</div>
          <div>
            <div class="vision-panel-title">Imagine</div>
            <div class="vision-panel-sub">If this vision was real in 2035, what would people see, hear, feel, and do differently?</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Visible signs</label>
          <textarea class="form-textarea" rows="2" maxlength="500"
                    placeholder="What would people see? What looks different?"
                    oninput="visioningState.realVision.imagine.visibleSigns=this.value">${escHtml(rv.imagine.visibleSigns)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Conversations</label>
          <textarea class="form-textarea" rows="2" maxlength="500"
                    placeholder="What would people be talking about? What conversations would be happening?"
                    oninput="visioningState.realVision.imagine.conversations=this.value">${escHtml(rv.imagine.conversations)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Decisions</label>
          <textarea class="form-textarea" rows="2" maxlength="500"
                    placeholder="How would decisions be made differently? What would get approved more easily?"
                    oninput="visioningState.realVision.imagine.decisions=this.value">${escHtml(rv.imagine.decisions)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Behaviours</label>
          <textarea class="form-textarea" rows="2" maxlength="500"
                    placeholder="How would people behave differently day-to-day?"
                    oninput="visioningState.realVision.imagine.behaviours=this.value">${escHtml(rv.imagine.behaviours)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Team, student, or partner impact</label>
          <textarea class="form-textarea" rows="2" maxlength="500"
                    placeholder="What would be different for the people this vision is meant to serve?"
                    oninput="visioningState.realVision.imagine.impact=this.value">${escHtml(rv.imagine.impact)}</textarea>
        </div>
      </div>

      <!-- THREE SYSTEMS -->
      <div class="vision-panel">
        <div class="vision-panel-header">
          <div class="vision-panel-badge" style="background:var(--warning);color:#422006;">≡</div>
          <div>
            <div class="vision-panel-title">Three Systems Reflection</div>
            <div class="vision-panel-sub">How do Drive, Threat, and Soothing show up in this vision?</div>
          </div>
        </div>
        <div class="systems-cards" style="margin-bottom:0;">
          <div class="system-card drive">
            <div class="system-title">⚡ Drive</div>
            <p class="system-body" style="margin-bottom:12px;">What gives this vision energy, ambition, and momentum?</p>
            <textarea class="form-textarea" rows="2" maxlength="400"
                      placeholder="What drives this forward…"
                      oninput="visioningState.realVision.systems.drive=this.value">${escHtml(rv.systems.drive)}</textarea>
          </div>
          <div class="system-card threat">
            <div class="system-title">⚠ Threat</div>
            <p class="system-body" style="margin-bottom:12px;">What might trigger resistance, avoidance, control, or defensiveness?</p>
            <textarea class="form-textarea" rows="2" maxlength="400"
                      placeholder="What could create fear or resistance…"
                      oninput="visioningState.realVision.systems.threat=this.value">${escHtml(rv.systems.threat)}</textarea>
          </div>
          <div class="system-card soothing">
            <div class="system-title">◎ Soothing</div>
            <p class="system-body" style="margin-bottom:12px;">What will help people feel steady, included, and able to act?</p>
            <textarea class="form-textarea" rows="2" maxlength="400"
                      placeholder="What creates safety and steadiness…"
                      oninput="visioningState.realVision.systems.soothing=this.value">${escHtml(rv.systems.soothing)}</textarea>
          </div>
        </div>
      </div>

      <!-- ARCHETYPES -->
      <div class="vision-panel">
        <div class="vision-panel-header">
          <div class="vision-panel-badge" style="background:var(--purple);">★</div>
          <div>
            <div class="vision-panel-title">Leadership strengths that will help this vision move</div>
            <div class="vision-panel-sub">Select all that apply</div>
          </div>
        </div>
        <div class="archetype-grid">${archetypeHtml}</div>
      </div>
    </div>

    <div style="margin-top:32px;">
      <button class="btn btn-primary btn-lg" onclick="navigate('timeline')">
        Continue to Timeline →
      </button>
    </div>
  </div>`;
}

function initRealVision() {}

function toggleArchetype(name) {
  const arr = visioningState.realVision.archetypes;
  const idx = arr.indexOf(name);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(name);

  // Re-render just the archetype section
  document.querySelectorAll('.archetype-btn').forEach(btn => {
    const selected = arr.includes(btn.textContent);
    btn.classList.toggle('selected', selected);
  });
}

/* ============================================================
   SCREEN 9: TIMELINE BUILDER
   ============================================================ */
function renderTimeline() {
  const tl = visioningState.timeline;
  const targets = tl.targets;
  const obstacles = tl.obstacles;
  const actions = tl.actions;

  const allItems = [
    ...targets.map((t, i) => ({ ...t, type: 'target', typeIdx: i })),
    ...obstacles.map((t, i) => ({ ...t, type: 'obstacle', typeIdx: i })),
    ...actions.map((t, i) => ({ ...t, type: 'action', typeIdx: i }))
  ];

  const itemsHtml = allItems.length > 0 ? allItems.map(item => `
    <div class="timeline-item ${item.type}-item">
      <div class="timeline-item-type">${item.type}</div>
      <div class="timeline-item-label">${escHtml(item.label)}</div>
      <div class="timeline-item-time">${escHtml(item.timeLabel || item.time)}</div>
      ${item.description ? `<div class="timeline-item-desc">${escHtml(item.description)}</div>` : ''}
      <button class="timeline-item-remove" onclick="removeTimelineItem('${item.type}',${item.typeIdx})" title="Remove">×</button>
    </div>`).join('') : '<div class="empty-state">No items added yet. Use the buttons below to build your timeline.</div>';

  const tCount = targets.length;
  const oCount = obstacles.length;
  const aCount = actions.length;
  const canLock = tCount >= 2 && oCount >= 2 && aCount >= 2;

  const modalHtml = renderAddItemModal();

  return `
  <div>
    <h1 class="screen-title">Build the Timeline</h1>
    <p class="screen-subtitle">Map the path from today to the vision achieved. Add targets, obstacles, and actions.</p>

    <div class="timeline-outer">
      <div class="timeline-labels">
        <span>Today</span>
        <span>Goal achieved</span>
      </div>
      <div class="timeline-track"></div>
      <div class="timeline-items-area">${itemsHtml}</div>
    </div>

    <div class="timeline-counter">
      <div class="timeline-counter-item">
        <div class="timeline-counter-dot" style="background:var(--accent);"></div>
        <span>${tCount} Target${tCount !== 1 ? 's' : ''} ${tCount < 2 ? '<span style="color:var(--t3);">(need 2)</span>' : '<span style="color:var(--success);">✓</span>'}</span>
      </div>
      <div class="timeline-counter-item">
        <div class="timeline-counter-dot" style="background:var(--danger);"></div>
        <span>${oCount} Obstacle${oCount !== 1 ? 's' : ''} ${oCount < 2 ? '<span style="color:var(--t3);">(need 2)</span>' : '<span style="color:var(--success);">✓</span>'}</span>
      </div>
      <div class="timeline-counter-item">
        <div class="timeline-counter-dot" style="background:var(--success);"></div>
        <span>${aCount} Action${aCount !== 1 ? 's' : ''} ${aCount < 2 ? '<span style="color:var(--t3);">(need 2)</span>' : '<span style="color:var(--success);">✓</span>'}</span>
      </div>
    </div>

    <div class="timeline-prompts">
      <div class="timeline-prompt-title">Thinking prompts</div>
      <ul class="timeline-prompt-list">
        <li>What needs to happen first?</li>
        <li>Where will momentum stall?</li>
        <li>What would make progress visible?</li>
        <li>Who needs to be involved?</li>
        <li>What can be done without permission?</li>
        <li>What requires senior support?</li>
      </ul>
    </div>

    <div class="timeline-actions">
      <button class="btn btn-secondary" onclick="openAddItemModal('target')" style="border-color:var(--accent);color:var(--accent);">+ Add Target</button>
      <button class="btn btn-secondary" onclick="openAddItemModal('obstacle')" style="border-color:var(--danger);color:var(--danger);">+ Add Obstacle</button>
      <button class="btn btn-secondary" onclick="openAddItemModal('action')" style="border-color:var(--success);color:var(--success);">+ Add Action</button>
    </div>

    ${canLock ? `
    <div class="card" style="max-width:640px;margin-bottom:24px;padding:28px;">
      <div style="font-size:1rem;font-weight:700;color:var(--t1);margin-bottom:8px;">What's next?</div>
      <p style="font-size:0.875rem;color:var(--t2);margin-bottom:16px;">Once this goal is achieved, what becomes possible next?</p>
      <div class="form-group">
        <textarea class="form-textarea" rows="3" maxlength="500"
                  placeholder="Once we achieve this, the next possibility is…"
                  oninput="visioningState.timeline.whatsNext=this.value">${escHtml(visioningState.timeline.whatsNext)}</textarea>
      </div>
    </div>` : ''}

    <div style="margin-top:16px;">
      <button class="btn btn-primary btn-lg" onclick="lockTimeline()" ${canLock ? '' : 'disabled'}>
        Lock Timeline →
      </button>
      ${!canLock ? `<p style="margin-top:12px;font-size:0.875rem;color:var(--t3);">Add at least 2 targets, 2 obstacles, and 2 actions to continue</p>` : ''}
    </div>

    ${modalHtml}
  </div>`;
}

function initTimeline() {}

function renderAddItemModal() {
  if (!gameState.addItemModal) return '';
  const { type } = gameState.addItemModal;
  const colour = type === 'target' ? 'var(--accent)' : type === 'obstacle' ? 'var(--danger)' : 'var(--success)';
  const timeOpts = timePoints.map(tp =>
    `<option value="${tp.value}">${escHtml(tp.label)}</option>`).join('');

  return `
    <div class="add-item-modal" id="add-item-modal" onclick="closeAddItemModal(event)">
      <div class="add-item-form" onclick="event.stopPropagation()">
        <div class="add-item-form-title" style="color:${colour};">Add ${escHtml(type.charAt(0).toUpperCase() + type.slice(1))}</div>
        <div class="form-group">
          <label class="form-label">Label</label>
          <input class="form-input" id="tl-label" type="text" placeholder="Short name for this ${escHtml(type)}" maxlength="80">
        </div>
        <div class="form-group">
          <label class="form-label">Description (optional)</label>
          <textarea class="form-textarea" id="tl-desc" rows="2" placeholder="More detail…" maxlength="300"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Time point</label>
          <select class="form-select" id="tl-time">${timeOpts}</select>
        </div>
        <div class="add-item-actions">
          <button class="btn btn-ghost" onclick="closeAddItemModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitTimelineItem()">Add to Timeline</button>
        </div>
      </div>
    </div>`;
}

function openAddItemModal(type) {
  gameState.addItemModal = { type };
  document.getElementById('app-content').innerHTML = renderTimeline();
  initTimeline();
  setTimeout(() => document.getElementById('tl-label')?.focus(), 100);
}

function closeAddItemModal(e) {
  if (e && e.target !== document.getElementById('add-item-modal') && !e.currentTarget?.id) return;
  gameState.addItemModal = null;
  document.getElementById('app-content').innerHTML = renderTimeline();
  initTimeline();
}

function submitTimelineItem() {
  const label = document.getElementById('tl-label')?.value?.trim();
  const desc = document.getElementById('tl-desc')?.value?.trim();
  const timeEl = document.getElementById('tl-time');
  const timeVal = timeEl?.value;
  const timeLabel = timeEl?.options[timeEl.selectedIndex]?.text;

  if (!label) {
    document.getElementById('tl-label').style.borderColor = 'var(--danger)';
    return;
  }

  const type = gameState.addItemModal.type;
  const item = { label, description: desc, time: timeVal, timeLabel };

  const order = tp => { const t = timePoints.find(x => x.value === tp); return t ? t.order : 99; };
  const sortByTime = arr => arr.sort((a, b) => order(a.time) - order(b.time));

  if (type === 'target') { visioningState.timeline.targets.push(item); sortByTime(visioningState.timeline.targets); }
  else if (type === 'obstacle') { visioningState.timeline.obstacles.push(item); sortByTime(visioningState.timeline.obstacles); }
  else { visioningState.timeline.actions.push(item); sortByTime(visioningState.timeline.actions); }

  gameState.addItemModal = null;
  document.getElementById('app-content').innerHTML = renderTimeline();
  initTimeline();
}

function removeTimelineItem(type, idx) {
  if (type === 'target') visioningState.timeline.targets.splice(idx, 1);
  else if (type === 'obstacle') visioningState.timeline.obstacles.splice(idx, 1);
  else visioningState.timeline.actions.splice(idx, 1);
  document.getElementById('app-content').innerHTML = renderTimeline();
  initTimeline();
}

function lockTimeline() {
  navigate('commitment');
}

/* ============================================================
   SCREEN 10: COMMITMENT DIAL
   ============================================================ */
function renderCommitment() {
  const players = visioningState.players;
  const commitments = visioningState.commitments;

  // Ensure commitments array is same length as players
  players.forEach((p, i) => {
    if (!commitments[i]) {
      commitments[i] = { player: p, action: '', when: '', support: '', done: false };
    }
  });

  const doneCount = commitments.filter(c => c.done).length;
  const total = players.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = doneCount === total;

  // SVG dial
  const r = 80;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (circ * pct / 100);

  const dialState = pct === 0 ? 'Waiting for commitment'
    : pct <= 25 ? 'Early movement'
    : pct <= 50 ? 'Momentum forming'
    : pct < 100 ? 'Shared commitment'
    : 'Ready to move';

  const dialColour = pct === 100 ? 'var(--success)' : 'var(--accent)';

  const allActionsHtml = [...visioningState.timeline.targets, ...visioningState.timeline.obstacles, ...visioningState.timeline.actions]
    .map(item => `<option value="${escHtml(item.label)}">${escHtml(item.label)} (${escHtml(item.timeLabel || item.time)})</option>`)
    .join('');

  const formsHtml = players.map((p, i) => {
    const c = commitments[i];
    if (c.done) {
      return `
        <div class="commitment-form done">
          <div class="commitment-player-name">
            ${escHtml(p)}
            <span class="commitment-done-badge">Committed ✓</span>
          </div>
          <div style="font-size:0.875rem;color:var(--t2);">Action: <strong style="color:var(--t1);">${escHtml(c.action)}</strong></div>
          ${c.when ? `<div style="font-size:0.8125rem;color:var(--t2);margin-top:4px;">When: ${escHtml(c.when)}</div>` : ''}
          ${c.support ? `<div style="font-size:0.8125rem;color:var(--t2);margin-top:4px;">Support needed: ${escHtml(c.support)}</div>` : ''}
          <button class="btn btn-ghost btn-sm" style="margin-top:12px;" onclick="editCommitment(${i})">Edit</button>
        </div>`;
    }
    return `
      <div class="commitment-form">
        <div class="commitment-player-name">${escHtml(p)}</div>
        <div class="form-group">
          <label class="form-label">Chosen action from timeline</label>
          <select class="form-select" id="ca-action-${i}" oninput="visioningState.commitments[${i}].action=this.value">
            <option value="">Select an action…</option>
            ${allActionsHtml}
            <option value="__custom">Write my own action…</option>
          </select>
        </div>
        <div class="form-group" id="ca-custom-group-${i}" style="display:none;">
          <label class="form-label">My action</label>
          <input class="form-input" type="text" id="ca-custom-${i}"
                 placeholder="Describe your personal action"
                 oninput="visioningState.commitments[${i}].action=this.value">
        </div>
        <div class="form-group">
          <label class="form-label">When will you do this?</label>
          <select class="form-select" id="ca-when-${i}" oninput="visioningState.commitments[${i}].when=this.value">
            <option value="">Select a time…</option>
            ${timePoints.map(tp => `<option value="${tp.value}">${escHtml(tp.label)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Support needed (optional)</label>
          <input class="form-input" type="text" id="ca-support-${i}"
                 placeholder="What would help you follow through?"
                 oninput="visioningState.commitments[${i}].support=this.value">
        </div>
        <button class="btn btn-primary" onclick="submitCommitment(${i})">Commit →</button>
      </div>`;
  }).join('');

  const completionHtml = allDone ? `
    <div class="commitment-complete">
      <span class="commitment-complete-icon">✓</span>
      <div class="commitment-complete-title">The commitment dial is complete.</div>
      <p class="commitment-complete-body">Every player has committed to action. The vision now has movement.</p>
      <button class="btn btn-primary btn-lg" onclick="navigate('backOfBook')">Continue to Mission Statement →</button>
    </div>` : '';

  return `
  <div>
    <h1 class="screen-title">Commitment Dial</h1>
    <p class="screen-subtitle">Each person commits to one action on the timeline. Turn shared vision into visible movement.</p>

    <div class="commitment-layout">
      <div class="dial-container">
        <svg class="dial-svg" viewBox="0 0 200 200">
          <circle class="dial-bg" cx="100" cy="100" r="${r}" stroke-dasharray="${circ}" stroke-dashoffset="0"/>
          <circle class="dial-fill" cx="100" cy="100" r="${r}"
                  stroke="${dialColour}"
                  stroke-dasharray="${circ}"
                  stroke-dashoffset="${dashOffset}"
                  transform="rotate(-90 100 100)"/>
          <text class="dial-text" x="100" y="96" style="font-size:2.5rem;font-weight:900;fill:var(--t1);dominant-baseline:middle;text-anchor:middle;">${pct}%</text>
          <text class="dial-sub" x="100" y="120" style="font-size:0.75rem;fill:var(--t2);dominant-baseline:middle;text-anchor:middle;">committed</text>
        </svg>
        <div class="dial-state-label" style="color:${dialColour};">${dialState}</div>
        <div class="dial-label">${doneCount} of ${total} players</div>
      </div>

      <div class="commitment-forms">
        ${completionHtml || formsHtml}
        ${!allDone ? `<div style="margin-top:8px;"><button class="btn btn-ghost btn-sm" onclick="navigate('backOfBook')">Skip to Mission Statement</button></div>` : ''}
      </div>
    </div>
  </div>`;
}

function initCommitment() {
  // Handle custom action toggles
  visioningState.players.forEach((_, i) => {
    const sel = document.getElementById(`ca-action-${i}`);
    const customGroup = document.getElementById(`ca-custom-group-${i}`);
    if (sel && customGroup) {
      sel.addEventListener('change', () => {
        if (sel.value === '__custom') {
          customGroup.style.display = 'block';
          visioningState.commitments[i].action = '';
        } else {
          customGroup.style.display = 'none';
          visioningState.commitments[i].action = sel.value;
        }
      });
    }
  });
}

function submitCommitment(idx) {
  const c = visioningState.commitments[idx];
  if (!c.action || !c.action.trim()) {
    alert('Please choose or write an action to commit to.');
    return;
  }
  c.done = true;
  document.getElementById('app-content').innerHTML = renderCommitment();
  initCommitment();
}

function editCommitment(idx) {
  visioningState.commitments[idx].done = false;
  document.getElementById('app-content').innerHTML = renderCommitment();
  initCommitment();
}

/* ============================================================
   SCREEN 11: BACK OF THE BOOK
   ============================================================ */
function getMissionPreview() {
  const ms = visioningState.missionStatement;
  const anchor = ms.anchor.trim();
  const goal   = ms.goal.trim();
  const agency = ms.agency.trim();
  if (!anchor && !goal && !agency) return '';
  let parts = [];
  if (anchor) parts.push(`Guided by ${anchor}`);
  if (goal)   parts.push(`we will ${goal}`);
  if (agency) parts.push(`by ${agency}`);
  return parts.join(', ') + '.';
}

function renderBackOfBook() {
  const ms = visioningState.missionStatement;
  const edge = visioningState.edgeValues;
  const edgeHint = edge.length ? edge.map(getDisplayTitle).join(' and ') : 'your edge values';
  const preview = getMissionPreview();
  const valid = ms.anchor.trim().length >= 5 && ms.goal.trim().length >= 10 && ms.agency.trim().length >= 10;

  return `
  <div style="max-width:820px;">
    <h1 class="screen-title">Write your Mission Statement</h1>
    <p class="screen-subtitle">A mission statement is how you pitch your vision to the people who need to act on it. Three parts. One clear sentence the whole group can stand behind.</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:32px;align-items:start;">

      <!-- LEFT: THREE INPUTS -->
      <div style="display:flex;flex-direction:column;gap:20px;">

        <div class="form-group">
          <label class="form-label">
            <span class="mission-part-badge" style="background:var(--accent-dim);color:var(--accent);">1</span>
            Values anchor
          </label>
          <p style="font-size:0.8125rem;color:var(--t3);margin-bottom:8px;">Start with what you stand for. Use your edge values: <strong style="color:var(--t2);">${escHtml(edgeHint)}</strong>.</p>
          <div class="mission-prefix-row">
            <span class="mission-prefix">Guided by</span>
            <input class="form-input" id="ms-anchor" type="text"
                   placeholder="a commitment to clarity and courage"
                   value="${escHtml(ms.anchor)}"
                   oninput="updateMission('anchor',this.value)">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="mission-part-badge" style="background:var(--success-dim);color:var(--success);">2</span>
            The goal
          </label>
          <p style="font-size:0.8125rem;color:var(--t3);margin-bottom:8px;">Name the future you are building. Be specific. Name the change you want to see.</p>
          <div class="mission-prefix-row">
            <span class="mission-prefix">we will</span>
            <input class="form-input" id="ms-goal" type="text"
                   placeholder="build a culture where every leader can act on their values"
                   value="${escHtml(ms.goal)}"
                   oninput="updateMission('goal',this.value)">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="mission-part-badge" style="background:var(--purple-dim);color:var(--purple);">3</span>
            Agency
          </label>
          <p style="font-size:0.8125rem;color:var(--t3);margin-bottom:8px;">Describe how. Who is involved, what they will do, and what behaviour creates the future.</p>
          <div class="mission-prefix-row">
            <span class="mission-prefix">by</span>
            <input class="form-input" id="ms-agency" type="text"
                   placeholder="creating shared practice, honest conversation, and protected time to reflect"
                   value="${escHtml(ms.agency)}"
                   oninput="updateMission('agency',this.value)">
          </div>
        </div>

      </div>

      <!-- RIGHT: GUIDE + PREVIEW -->
      <div style="display:flex;flex-direction:column;gap:16px;">

        <div class="card subtle" style="padding:20px;">
          <div style="font-size:0.6875rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--t3);margin-bottom:14px;">What makes it work</div>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div>
              <div style="font-size:0.8125rem;font-weight:700;color:var(--accent);margin-bottom:3px;">Values anchor</div>
              <div style="font-size:0.8125rem;color:var(--t2);line-height:1.55;">Ground the statement in what the group actually believes. Use the language of your edge values, not abstract ideals.</div>
            </div>
            <div>
              <div style="font-size:0.8125rem;font-weight:700;color:var(--success);margin-bottom:3px;">Goal</div>
              <div style="font-size:0.8125rem;color:var(--t2);line-height:1.55;">State the concrete future. Avoid vague aspirations. If you can measure or observe it, write that.</div>
            </div>
            <div>
              <div style="font-size:0.8125rem;font-weight:700;color:var(--purple);margin-bottom:3px;">Agency</div>
              <div style="font-size:0.8125rem;color:var(--t2);line-height:1.55;">Name the behaviour, not the intention. "By creating..." beats "by trying to..." every time.</div>
            </div>
          </div>
        </div>

        <div class="mission-preview-card" id="mission-preview">
          <div style="font-size:0.6875rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--t3);margin-bottom:10px;">Live preview</div>
          <p class="mission-preview-text" id="mission-preview-text">
            ${preview ? escHtml(preview) : '<span style="color:var(--t4);">Your mission statement will appear here as you type...</span>'}
          </p>
        </div>

      </div>
    </div>

    <button class="btn btn-primary btn-lg" onclick="navigate('finalOutput')" ${valid ? '' : 'disabled'}>
      Complete the Experience →
    </button>
    ${!valid ? `<p style="margin-top:12px;font-size:0.875rem;color:var(--t3);">Fill in all three parts to continue</p>` : ''}
  </div>`;
}

function initBackOfBook() {}

function updateMission(field, value) {
  visioningState.missionStatement[field] = value;
  const preview = getMissionPreview();
  const previewEl = document.getElementById('mission-preview-text');
  if (previewEl) {
    previewEl.innerHTML = preview ? escHtml(preview) : '<span style="color:var(--t4);">Your mission statement will appear here as you type...</span>';
  }
  const ms = visioningState.missionStatement;
  const valid = ms.anchor.trim().length >= 5 && ms.goal.trim().length >= 10 && ms.agency.trim().length >= 10;
  const btn = document.querySelector('.btn.btn-primary.btn-lg');
  if (btn) btn.disabled = !valid;
}

/* ============================================================
   SCREEN 12: FINAL OUTPUT
   ============================================================ */
function renderFinalOutput() {
  const s = visioningState;
  const rv = s.realVision;
  const idea = s.selectedEndGameIdea;
  const visionGoal = idea ? (idea.custom ? rv.goal : idea.themeTitle) : rv.goal;

  // Section 1: Values Signature
  const top10Html = s.top10Values.map((t, i) => {
    const v = getDisplayValue(t);
    const displayTitle = v ? v.title : t;
    return `<div class="output-value-pill"><div class="output-value-rank">#${i+1}</div><div class="output-value-title">${escHtml(displayTitle)}</div>${v ? `<div class="output-value-desc">${escHtml(v.description)}</div>` : ''}</div>`;
  }).join('');

  const edgeHtml = s.edgeValues.map(t => {
    const v = getDisplayValue(t);
    const displayTitle = v ? v.title : t;
    return `<div class="output-edge-card"><div class="output-edge-title">${escHtml(displayTitle)}</div>${v ? `<div class="output-edge-desc">${escHtml(v.description)}</div>` : ''}</div>`;
  }).join('');

  // Section 4: Timeline
  const tlItems = [
    ...s.timeline.targets.map(i => ({ ...i, type: 'target' })),
    ...s.timeline.obstacles.map(i => ({ ...i, type: 'obstacle' })),
    ...s.timeline.actions.map(i => ({ ...i, type: 'action' }))
  ];

  const tlHtml = tlItems.map(item => `
    <div class="output-timeline-item ${item.type}">
      <span class="output-tl-type">${item.type}</span>
      <div>
        <div class="output-tl-label">${escHtml(item.label)}</div>
        <div class="output-tl-time">${escHtml(item.timeLabel || item.time)}</div>
        ${item.description ? `<div class="output-tl-desc">${escHtml(item.description)}</div>` : ''}
      </div>
    </div>`).join('');

  const commitmentsHtml = s.commitments.filter(c => c.done || c.action).map(c => `
    <div class="output-commitment-row">
      <div class="output-commitment-player">${escHtml(c.player)}</div>
      <div class="output-commitment-action">${escHtml(c.action)}</div>
      ${c.when ? `<div class="output-commitment-meta">By: ${escHtml(c.when)}${c.support ? ` · Support: ${escHtml(c.support)}` : ''}</div>` : ''}
    </div>`).join('');

  return `
  <div>
    <div style="text-align:center;margin-bottom:48px;">
      <span class="screen-kicker">Visioning · University of Plymouth</span>
      <h1 class="screen-title">Your Leadership Vision Blueprint</h1>
      <p class="screen-subtitle" style="margin:0 auto;">Vision becomes useful when it changes behaviour. The work now is to keep the values visible, protect the timeline, and use the commitments as the first signal of movement.</p>
    </div>

    <div class="output-layout">

      <!-- VALUES SIGNATURE -->
      <div class="output-section">
        <div class="output-section-header">
          <div class="output-section-num">1</div>
          <div class="output-section-title">Values Signature</div>
        </div>

        ${edgeHtml ? `<div style="margin-bottom:20px;">
          <div class="output-q">Edge Values</div>
          <div class="output-edge-cards">${edgeHtml}</div>
        </div>` : ''}

        <div style="margin-bottom:16px;">
          <div class="output-q">Top 10 Values</div>
          <div class="output-values-grid">${top10Html}</div>
        </div>
      </div>

      <!-- THE VISION -->
      <div class="output-section">
        <div class="output-section-header">
          <div class="output-section-num">2</div>
          <div class="output-section-title">The Vision</div>
        </div>
        <div class="output-q">Goal</div>
        <div class="output-a" style="font-size:1.125rem;font-weight:700;color:var(--accent);">${escHtml(visionGoal)}</div>
        ${rv.pitch ? `<div class="output-q">Pitch</div><div class="output-a">${escHtml(rv.pitch)}</div>` : ''}
        ${rv.grow.whoInvolved ? `<div class="output-q">Who needs to be involved</div><div class="output-a">${escHtml(rv.grow.whoInvolved)}</div>` : ''}
        ${rv.grow.whatMeaningful ? `<div class="output-q">What makes it meaningful</div><div class="output-a">${escHtml(rv.grow.whatMeaningful)}</div>` : ''}
        ${rv.grow.firstStep ? `<div class="output-q">First step for less motivated people</div><div class="output-a">${escHtml(rv.grow.firstStep)}</div>` : ''}
        ${rv.imagine.visibleSigns ? `<div class="output-q">Visible signs in 2035</div><div class="output-a">${escHtml(rv.imagine.visibleSigns)}</div>` : ''}
        ${rv.imagine.conversations ? `<div class="output-q">Conversations</div><div class="output-a">${escHtml(rv.imagine.conversations)}</div>` : ''}
        ${rv.imagine.decisions ? `<div class="output-q">Decisions</div><div class="output-a">${escHtml(rv.imagine.decisions)}</div>` : ''}
        ${rv.imagine.behaviours ? `<div class="output-q">Behaviours</div><div class="output-a">${escHtml(rv.imagine.behaviours)}</div>` : ''}
        ${rv.imagine.impact ? `<div class="output-q">Impact</div><div class="output-a">${escHtml(rv.imagine.impact)}</div>` : ''}
      </div>

      <!-- SYSTEMS MAP -->
      <div class="output-section">
        <div class="output-section-header">
          <div class="output-section-num">3</div>
          <div class="output-section-title">Systems Map</div>
        </div>
        <div class="output-system-row">
          <div class="output-system drive">
            <div class="output-system-label">⚡ Drive</div>
            <div class="output-system-text">${escHtml(rv.systems.drive) || '<em style="color:var(--t3);">Not completed</em>'}</div>
          </div>
          <div class="output-system threat">
            <div class="output-system-label">⚠ Threat</div>
            <div class="output-system-text">${escHtml(rv.systems.threat) || '<em style="color:var(--t3);">Not completed</em>'}</div>
          </div>
          <div class="output-system soothing">
            <div class="output-system-label">◎ Soothing</div>
            <div class="output-system-text">${escHtml(rv.systems.soothing) || '<em style="color:var(--t3);">Not completed</em>'}</div>
          </div>
        </div>
      </div>

      <!-- LEADERSHIP STRENGTHS -->
      ${rv.archetypes.length > 0 ? `
      <div class="output-section">
        <div class="output-section-header">
          <div class="output-section-num">4</div>
          <div class="output-section-title">Leadership Strengths</div>
        </div>
        <div class="output-archetype-tags">${rv.archetypes.map(a => `<span class="output-archetype-tag">${escHtml(a)}</span>`).join('')}</div>
      </div>` : ''}

      <!-- TIMELINE -->
      <div class="output-section">
        <div class="output-section-header">
          <div class="output-section-num">5</div>
          <div class="output-section-title">Timeline</div>
        </div>
        <div class="output-timeline-list">${tlHtml || '<p style="color:var(--t3);">No timeline items</p>'}</div>
        ${s.timeline.whatsNext ? `<div style="margin-top:16px;"><div class="output-q">What's next after the goal is achieved</div><div class="output-a">${escHtml(s.timeline.whatsNext)}</div></div>` : ''}
      </div>

      <!-- COMMITMENTS -->
      ${commitmentsHtml ? `
      <div class="output-section">
        <div class="output-section-header">
          <div class="output-section-num">6</div>
          <div class="output-section-title">Commitments</div>
        </div>
        ${commitmentsHtml}
      </div>` : ''}

      <!-- MISSION STATEMENT -->
      ${getMissionPreview() ? `
      <div class="output-section output-mission-section">
        <div class="output-section-header">
          <div class="output-section-num">7</div>
          <div class="output-section-title">Mission Statement</div>
        </div>
        <blockquote class="output-mission-statement">${escHtml(getMissionPreview())}</blockquote>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:16px;">
          ${s.missionStatement.anchor ? `<div class="output-mission-part"><div class="output-mission-part-label" style="color:var(--accent);">Values anchor</div><div class="output-mission-part-text">Guided by ${escHtml(s.missionStatement.anchor)}</div></div>` : ''}
          ${s.missionStatement.goal ? `<div class="output-mission-part"><div class="output-mission-part-label" style="color:var(--success);">Goal</div><div class="output-mission-part-text">we will ${escHtml(s.missionStatement.goal)}</div></div>` : ''}
          ${s.missionStatement.agency ? `<div class="output-mission-part"><div class="output-mission-part-label" style="color:var(--purple);">Agency</div><div class="output-mission-part-text">by ${escHtml(s.missionStatement.agency)}</div></div>` : ''}
        </div>
      </div>` : ''}

      <!-- CLOSING -->
      <div class="output-closing">
        A mission statement only works when it changes what people do on Monday morning. Share it. Test it. Return to it when the pressure rises.
      </div>

      <!-- EXPORT -->
      <div class="output-export-row">
        <button class="btn btn-primary btn-lg" onclick="exportToPrint()">
          ↓ Download Vision Blueprint PDF
        </button>
        <button class="btn btn-secondary btn-lg" onclick="window.print()">
          Print
        </button>
      </div>

    </div>
  </div>`;
}

function initFinalOutput() {
  buildPrintOutput();
}

/* ============================================================
   PRINT / PDF EXPORT
   ============================================================ */
function buildPrintOutput() {
  const s = visioningState;
  const rv = s.realVision;
  const idea = s.selectedEndGameIdea;
  const visionGoal = idea ? (idea.custom ? rv.goal : idea.themeTitle) : rv.goal;

  const top10Print = s.top10Values.map((t, i) => {
    const v = getDisplayValue(t);
    const displayTitle = v ? v.title : t;
    return `<div class="print-value-item"><div class="print-value-rank">#${i+1}</div><div class="print-value-title">${escHtml(displayTitle)}</div>${v ? `<div class="print-value-desc">${escHtml(v.description)}</div>` : ''}</div>`;
  }).join('');

  const edgePrint = s.edgeValues.map(t => {
    const v = getDisplayValue(t);
    const displayTitle = v ? v.title : t;
    return `<div class="print-edge-card"><div class="print-edge-title">${escHtml(displayTitle)}</div>${v ? `<div class="print-edge-desc">${escHtml(v.description)}</div>` : ''}</div>`;
  }).join('');

  const tlItems = [
    ...s.timeline.targets.map(i => ({ ...i, type: 'target' })),
    ...s.timeline.obstacles.map(i => ({ ...i, type: 'obstacle' })),
    ...s.timeline.actions.map(i => ({ ...i, type: 'action' }))
  ];

  const tlPrint = tlItems.map(item => `
    <li class="print-tl-item">
      <span class="print-tl-type ${item.type}">${item.type}</span>
      <div>
        <div class="print-tl-label">${escHtml(item.label)}</div>
        <div class="print-tl-time">${escHtml(item.timeLabel || item.time)}</div>
        ${item.description ? `<div class="print-tl-desc">${escHtml(item.description)}</div>` : ''}
      </div>
    </li>`).join('');

  const commitmentsPrint = s.commitments.filter(c => c.done || c.action).map(c => `
    <div class="print-commitment-row">
      <div class="print-commitment-player">${escHtml(c.player)}</div>
      <div class="print-commitment-action">${escHtml(c.action)}</div>
      ${c.when ? `<div class="print-commitment-meta">By: ${escHtml(c.when)}${c.support ? ` · Support needed: ${escHtml(c.support)}` : ''}</div>` : ''}
    </div>`).join('');

  const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  const printHtml = `
    <!-- PAGE 1: Title + Values -->
    <div class="print-page">
      <div class="print-header">
        <div class="print-report-title">Leadership Vision Blueprint</div>
        <div class="print-report-sub">From Values to Vision to Action · University of Plymouth · ${today}</div>
      </div>

      <div class="print-section-title">Why This Matters</div>
      <p style="font-size:13px;color:#475569;line-height:1.7;margin-bottom:20px;">
        Visioning starts with values. Values shape what matters, what gets protected, and what becomes visible in behaviour.
        This blueprint captures your journey from personal values through collective vision to practical commitment.
      </p>

      <div class="print-section-title">Values Signature</div>
      <div class="print-values-grid">${top10Print}</div>

      <div class="print-footer">
        <span>Developed by Dr. Jonathan Rhodes &amp; Prof. Jackie Andrade · University of Plymouth NAVIGATE Leadership Programme</span>
        <span>${today}</span>
      </div>
    </div>

    <!-- PAGE 2: Edge Values + Vision -->
    <div class="print-page">
      <div class="print-header">
        <div class="print-report-title">Edge Values &amp; Real Vision</div>
        <div class="print-report-sub">Leadership Vision Blueprint · University of Plymouth</div>
      </div>

      <div class="print-section-title">Edge Values</div>
      <div class="print-edge-cards">${edgePrint}</div>

      <div class="print-section-title">Vision Goal</div>
      <div class="print-block">
        <div class="print-block-text" style="font-size:16px;font-weight:800;color:#0a0e1a;">${escHtml(visionGoal)}</div>
      </div>

      ${rv.pitch ? `<div class="print-section-title">Pitch</div><div class="print-block"><div class="print-block-text">${escHtml(rv.pitch)}</div></div>` : ''}
      ${rv.grow.whoInvolved ? `<div class="print-section-title">Grow: Who Needs to be Involved</div><div class="print-block"><div class="print-block-text">${escHtml(rv.grow.whoInvolved)}</div></div>` : ''}
      ${rv.grow.whatMeaningful ? `<div class="print-block"><div class="print-block-label">What makes it meaningful</div><div class="print-block-text">${escHtml(rv.grow.whatMeaningful)}</div></div>` : ''}
      ${rv.grow.firstStep ? `<div class="print-block"><div class="print-block-label">First step for less motivated people</div><div class="print-block-text">${escHtml(rv.grow.firstStep)}</div></div>` : ''}

      <div class="print-footer">
        <span>Developed by Dr. Jonathan Rhodes &amp; Prof. Jackie Andrade · University of Plymouth NAVIGATE Leadership Programme</span>
        <span>${today}</span>
      </div>
    </div>

    <!-- PAGE 3: Imagine + Systems + Archetypes -->
    <div class="print-page">
      <div class="print-header">
        <div class="print-report-title">Imagine 2035 &amp; Systems Map</div>
        <div class="print-report-sub">Leadership Vision Blueprint · University of Plymouth</div>
      </div>

      ${rv.imagine.visibleSigns ? `<div class="print-section-title">Imagine 2035</div>
        ${[['Visible signs', rv.imagine.visibleSigns],['Conversations', rv.imagine.conversations],['Decisions', rv.imagine.decisions],['Behaviours', rv.imagine.behaviours],['Impact', rv.imagine.impact]]
          .filter(([,v]) => v)
          .map(([l,v]) => `<div class="print-block"><div class="print-block-label">${escHtml(l)}</div><div class="print-block-text">${escHtml(v)}</div></div>`)
          .join('')}` : ''}

      <div class="print-section-title">Drive · Threat · Soothing Map</div>
      <div class="print-systems">
        <div class="print-system drive">
          <div class="print-system-label">⚡ Drive</div>
          <div class="print-system-text">${escHtml(rv.systems.drive) || 'Not completed'}</div>
        </div>
        <div class="print-system threat">
          <div class="print-system-label">⚠ Threat</div>
          <div class="print-system-text">${escHtml(rv.systems.threat) || 'Not completed'}</div>
        </div>
        <div class="print-system soothing">
          <div class="print-system-label">◎ Soothing</div>
          <div class="print-system-text">${escHtml(rv.systems.soothing) || 'Not completed'}</div>
        </div>
      </div>

      ${rv.archetypes.length > 0 ? `<div class="print-section-title">Archetype Strengths</div>
        <div class="print-archetypes">${rv.archetypes.map(a => `<span class="print-archetype">${escHtml(a)}</span>`).join('')}</div>` : ''}

      <div class="print-footer">
        <span>Developed by Dr. Jonathan Rhodes &amp; Prof. Jackie Andrade · University of Plymouth NAVIGATE Leadership Programme</span>
        <span>${today}</span>
      </div>
    </div>

    <!-- PAGE 4: Timeline + Commitments + Mission Statement -->
    <div class="print-page">
      <div class="print-header">
        <div class="print-report-title">Timeline, Commitments &amp; Mission Statement</div>
        <div class="print-report-sub">Leadership Vision Blueprint · University of Plymouth</div>
      </div>

      <div class="print-section-title">Timeline</div>
      <ul class="print-tl-list">${tlPrint}</ul>

      ${commitmentsPrint ? `<div class="print-section-title">Commitments</div>${commitmentsPrint}` : ''}

      ${getMissionPreview() ? `
        <div class="print-section-title">Mission Statement</div>
        <div class="print-mission-statement">${escHtml(getMissionPreview())}</div>
        <div class="print-mission-parts">
          ${s.missionStatement.anchor ? `<div class="print-mission-part"><span class="print-mission-label" style="color:#ff5500;">Values anchor</span> Guided by ${escHtml(s.missionStatement.anchor)}</div>` : ''}
          ${s.missionStatement.goal ? `<div class="print-mission-part"><span class="print-mission-label" style="color:#0a8a52;">Goal</span> we will ${escHtml(s.missionStatement.goal)}</div>` : ''}
          ${s.missionStatement.agency ? `<div class="print-mission-part"><span class="print-mission-label" style="color:#6b3fc8;">Agency</span> by ${escHtml(s.missionStatement.agency)}</div>` : ''}
        </div>` : ''}

      <div class="print-closing">
        A mission statement only works when it changes what people do on Monday morning. Share it. Test it. Return to it when the pressure rises.
      </div>

      <div class="print-footer">
        <span>Developed by Dr. Jonathan Rhodes &amp; Prof. Jackie Andrade · University of Plymouth NAVIGATE Leadership Programme</span>
        <span>${today}</span>
      </div>
    </div>`;

  document.getElementById('print-output').innerHTML = printHtml;
}

function exportToPrint() {
  buildPrintOutput();
  window.print();
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  updateHeader();
  renderScreen();
});
