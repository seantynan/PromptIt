const inputArea = document.getElementById('inputArea');
const outputArea = document.getElementById('outputArea');
const inputOverlay = document.getElementById('inputOverlay');
const outputOverlay = document.getElementById('outputOverlay');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const chainBtn = document.getElementById('chainBtn');
const chainMenu = document.getElementById('chainMenu');
const layoutBtn = document.getElementById('layoutBtn');
const workspace = document.getElementById('workspace');
const panels = document.getElementById('panels');
const panelResizeHandle = document.getElementById('panelResizeHandle');
const promptletList = document.getElementById('promptletList');
const tokenUsage = document.getElementById('tokenUsage');
const themeBtn = document.getElementById('themeBtn');
const themeMenu = document.getElementById('themeMenu');
const fontTypeBtn = document.getElementById('fontTypeBtn');
const fontTypeMenu = document.getElementById('fontTypeMenu');
const fontSizeBtn = document.getElementById('fontSizeBtn');
const fontSizeMenu = document.getElementById('fontSizeMenu');
const customThemeContainer = document.createElement('div');
const copyBtnDefaultLabel = copyBtn.textContent;
const copyBtnMinWidth = copyBtn.offsetWidth;
copyBtn.style.minWidth = `${copyBtnMinWidth}px`;

function resizeInputToContent() {
  inputArea.style.height = '100%';
}

function resizeOutputToContent() {
  outputArea.style.height = '100%';
}

const STORAGE_KEYS = {
  input: 'scratchpad-input',
  output: 'scratchpad-output',
  layout: 'scratchpad-layout',
  theme: 'scratchpad-theme',
  fontFamily: 'scratchpad-font-family',
  fontSize: 'scratchpad-font-size',
  splitHorizontal: 'scratchpad-split-horizontal',
  splitVertical: 'scratchpad-split-vertical'
};

const PANEL_RATIO_DEFAULT = 0.5;
const PANEL_RATIO_MIN = 0.2;
const PANEL_RATIO_MAX = 0.8;

const PRESET_THEMES = {
  Dark: { font: 'Segoe UI', size: 16, bg: '#111217', fg: '#e5e5e5' },
  Light: { font: 'Segoe UI', size: 16, bg: '#f7f8fb', fg: '#1e1f29' },
  Solarized: { font: '"Helvetica Neue", Arial, sans-serif', size: 16, bg: '#002b36', fg: '#eee8d5' },
  'High Contrast': { font: 'Arial Black, Arial, sans-serif', size: 17, bg: '#000000', fg: '#ffffff' },
  'Warm Cream': { font: 'Georgia, serif', size: 17, bg: '#f9f5eb', fg: '#2d2418' },
  'Hacker Night': { font: '"Fira Code", monospace', size: 15, bg: '#0b0f0c', fg: '#5ce38a' },
  'Ocean Breeze': { font: 'Inter, sans-serif', size: 16, bg: '#0e1f2f', fg: '#b3e5fc' },
  'Midnight Plum': { font: '"IBM Plex Sans", sans-serif', size: 16, bg: '#1b1026', fg: '#e0c3ff' },
  'Forest Trail': { font: '"Source Serif Pro", serif', size: 17, bg: '#0f1a14', fg: '#d7e7c1' },
  'Slate Mono': { font: '"JetBrains Mono", monospace', size: 15, bg: '#1c1f26', fg: '#d6deff' },
  'Vintage Paper': { font: '"Book Antiqua", serif', size: 17, bg: '#fbf2d5', fg: '#3c2f1b' },
  'Pastel Dream': { font: '"Nunito", sans-serif', size: 16, bg: '#22212c', fg: '#f2d5cf' },
  'Ocean Foam': { font: '"Montserrat", sans-serif', size: 16, bg: '#0d1b2a', fg: '#e0fbfc' }
};

const FONT_OPTIONS = [
  'Segoe UI',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Fira Code',
  'Inter',
  'JetBrains Mono',
  'Book Antiqua',
  'Nunito',
  'Montserrat'
];

const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24, 26, 28];

let currentThemeName = 'Dark';
let currentFontFamily = PRESET_THEMES.Dark.font;
let currentFontSize = PRESET_THEMES.Dark.size;

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

function saveToStorage(key, value) {
  if (hasChromeStorage()) {
    return new Promise((resolve) => chrome.storage.local.set({ [key]: value }, resolve));
  }

  const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
  localStorage.setItem(key, serialized);
  return Promise.resolve();
}

function getFromStorage(key, defaultValue) {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.get({ [key]: defaultValue }, (data) => {
        resolve(data[key] ?? defaultValue);
      });
      return;
    }

    const stored = localStorage.getItem(key);
    if (stored === null || stored === undefined) {
      resolve(defaultValue);
      return;
    }

    if (typeof defaultValue === 'object') {
      try {
        resolve(JSON.parse(stored));
        return;
      } catch (err) {
        resolve(defaultValue);
        return;
      }
    }

    if (typeof defaultValue === 'number') {
      const num = Number(stored);
      resolve(Number.isNaN(num) ? defaultValue : num);
      return;
    }

    resolve(stored);
  });
}

function clampPanelRatio(value) {
  return Math.min(Math.max(value, PANEL_RATIO_MIN), PANEL_RATIO_MAX);
}

function loadPanelRatio(layout) {
  const key = layout === 'horizontal' ? STORAGE_KEYS.splitHorizontal : STORAGE_KEYS.splitVertical;
  const stored = Number(localStorage.getItem(key));
  if (Number.isFinite(stored)) {
    return clampPanelRatio(stored);
  }
  return PANEL_RATIO_DEFAULT;
}

function persistPanelRatio(layout, value) {
  const key = layout === 'horizontal' ? STORAGE_KEYS.splitHorizontal : STORAGE_KEYS.splitVertical;
  localStorage.setItem(key, value);
}

let undoBuffer = null;
let availablePromptlets = [];
let copyTimeout = null;
let saveTimeout = null;
let isRunningPromptlet = false;
let lastOutputValue = '';
let isDraggingHandle = false;

const panelRatios = {
  horizontal: loadPanelRatio('horizontal'),
  vertical: loadPanelRatio('vertical')
};

init();

async function init() {
  await restoreInput();
  await restoreOutput();
  buildLayoutFromStorage();
  attachResizeHandle();
  attachInputHandlers();
  attachButtons();
  buildPromptletSidebar();
  buildChainMenu();
  buildThemeMenu();
  buildFontMenus();
  await applyStoredAppearance();
  updateTokenUsage(null);
  updateOverlays();
}

function attachInputHandlers() {
  inputArea.addEventListener('input', () => {
    queueSave();
    updateOverlays();
    setClearState();
    resizeInputToContent();
  });
}

function attachButtons() {
  clearBtn.addEventListener('click', handleClear);
  copyBtn.addEventListener('click', handleCopy);
  chainBtn.addEventListener('click', toggleChainMenu);
  layoutBtn.addEventListener('click', toggleLayout);
  themeBtn.addEventListener('click', () => toggleMenu(themeMenu, themeBtn));
  fontTypeBtn.addEventListener('click', () => toggleMenu(fontTypeMenu, fontTypeBtn));
  fontSizeBtn.addEventListener('click', () => toggleMenu(fontSizeMenu, fontSizeBtn));
  document.addEventListener('click', (e) => handleDocumentClick(e));
}

function handleDocumentClick(event) {
  const menus = [chainMenu, themeMenu, fontTypeMenu, fontSizeMenu];
  menus.forEach((menu) => {
    const toggleBtn = menu.previousElementSibling;
    if (menu.contains(event.target) || toggleBtn.contains(event.target)) return;
    menu.classList.remove('open');
    if (toggleBtn === chainBtn) {
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

async function restoreInput() {
  const saved = await getFromStorage(STORAGE_KEYS.input, '');
  inputArea.value = saved || '';
  setClearState();
  resizeInputToContent();
}

function saveInput() {
  saveToStorage(STORAGE_KEYS.input, inputArea.value);
}

async function restoreOutput() {
  const saved = await getStoredOutput();
  if (saved) {
    renderOutput(saved);
  } else {
    lastOutputValue = '';
    updateOverlays();
  }
  setClearState();
}

function saveOutput(content) {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    localStorage.setItem(STORAGE_KEYS.output, content);
    return;
  }

  chrome.storage.local.set({ [STORAGE_KEYS.output]: content });
}

function getStoredOutput() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve(localStorage.getItem(STORAGE_KEYS.output) || '');
      return;
    }

    chrome.storage.local.get({ [STORAGE_KEYS.output]: '' }, (data) => {
      resolve(data[STORAGE_KEYS.output] || '');
    });
  });
}

function queueSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveInput, 250);
}

function updateOverlays() {
  inputOverlay.style.display = inputArea.value.trim() ? 'none' : 'flex';
  outputOverlay.style.display = outputArea.textContent.trim() ? 'none' : 'flex';
  copyBtn.disabled = !outputArea.textContent.trim();
}

function hasScratchpadContent() {
  return inputArea.value.trim() || outputArea.textContent.trim();
}

function setClearState() {
  if (hasScratchpadContent()) {
    clearBtn.textContent = '🧹 Clear';
    clearBtn.setAttribute('aria-label', 'Clear Input and Output');
  } else if (undoBuffer) {
    clearBtn.textContent = '↩️ Undo';
    clearBtn.setAttribute('aria-label', 'Undo clear');
  } else {
    clearBtn.textContent = '📄 New';
    clearBtn.setAttribute('aria-label', 'New scratchpad');
  }
}

function handleClear() {
  const hasContent = !!hasScratchpadContent();
  if (hasContent) {
    undoBuffer = {
      input: inputArea.value,
      output: lastOutputValue || outputArea.textContent
    };

    inputArea.value = '';
    outputArea.textContent = '';
    outputArea.classList.remove('markdown');
    lastOutputValue = '';
    saveInput();
    saveOutput('');
    setClearState();
    resizeInputToContent();
    resizeOutputToContent();
    updateOverlays();
    return;
  }

  if (!hasContent && undoBuffer) {
    inputArea.value = undoBuffer.input || '';
    saveInput();

    const outputToRestore = undoBuffer.output || '';
    lastOutputValue = outputToRestore;
    if (outputToRestore) {
      renderOutput(outputToRestore);
    } else {
      outputArea.textContent = '';
      outputArea.classList.remove('markdown');
      saveOutput('');
      resizeOutputToContent();
      updateOverlays();
    }

    undoBuffer = null;
    setClearState();
    resizeInputToContent();
    updateOverlays();
  }
}

function handleCopy() {
  if (!outputArea.textContent.trim()) return;
  const selectedText = getSelectedOutputText();
  const textToCopy = selectedText.trim() ? selectedText : outputArea.textContent;

  navigator.clipboard.writeText(textToCopy).then(() => {
    clearTimeout(copyTimeout);
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');
    copyTimeout = setTimeout(() => {
      copyBtn.textContent = copyBtnDefaultLabel;
      copyBtn.classList.remove('copied');
    }, 2000);
  });
}

function toggleChainMenu() {
  toggleMenu(chainMenu, chainBtn);
}

function toggleMenu(menu, btn) {
  const isOpen = menu.classList.contains('open');
  closeAllMenus();
  if (!isOpen) {
    if (menu === themeMenu) {
      collapseCustomTheme();
    }
    menu.classList.add('open');
    btn?.setAttribute('aria-expanded', 'true');
  } else {
    btn?.setAttribute('aria-expanded', 'false');
  }
}

function closeAllMenus() {
  document.querySelectorAll('.dropdown-menu').forEach((menu) => menu.classList.remove('open'));
  chainBtn.setAttribute('aria-expanded', 'false');
}

async function buildPromptletSidebar() {
  availablePromptlets = await fetchPromptlets();
  renderPromptletSidebar();
}

async function buildChainMenu() {
  availablePromptlets = availablePromptlets.length ? availablePromptlets : await fetchPromptlets();
  chainMenu.innerHTML = '';
  if (!availablePromptlets.length) {
    chainMenu.innerHTML = '<div class="menu-item">No Promptlets available</div>';
    return;
  }

  availablePromptlets.forEach((p) => {
    const btn = document.createElement('button');
    btn.textContent = `${p.emoji || '✨'} ${p.name}`;
    btn.addEventListener('click', () => runPromptletOnOutput(p));
    chainMenu.appendChild(btn);
  });
}

async function fetchPromptlets() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(DEFAULT_PROMPTLETS || []);
      return;
    }
    chrome.storage.local.get({ defaultPromptlets: [], customPromptlets: [], promptlets: [] }, (data) => {
      const list = combineStoredPromptlets(data);
      resolve(list.length ? list : DEFAULT_PROMPTLETS || []);
    });
  });
}

function combineStoredPromptlets(data) {
  const storedDefaults = Array.isArray(data.defaultPromptlets) ? data.defaultPromptlets : null;
  const storedCustoms = Array.isArray(data.customPromptlets) ? data.customPromptlets : null;

  if (storedDefaults || storedCustoms) {
    const defaults = (storedDefaults || []).map((p, index) => ({
      ...p,
      isDefault: true,
      isActive: p.isActive !== false,
      defaultIndex: p.defaultIndex ?? index
    }));

    const customs = (storedCustoms || []).map((p) => ({
      ...p,
      isDefault: false,
      isActive: p.isActive !== false
    }));

    return [...defaults, ...customs];
  }

  return (data.promptlets || []).map((p, index) => ({
    ...p,
    isActive: p.isActive !== false,
    defaultIndex: p.defaultIndex ?? index
  }));
}

function renderPromptletSidebar() {
  promptletList.innerHTML = '';
  if (!availablePromptlets.length) {
    const empty = document.createElement('div');
    empty.className = 'promptlet-empty';
    empty.textContent = 'No Promptlets enabled. Add one in Manage.';
    promptletList.appendChild(empty);
    return;
  }

  availablePromptlets.forEach((p) => {
    const btn = document.createElement('button');
    btn.className = 'promptlet-btn';
    btn.innerHTML = `<span>${p.emoji || '✨'}</span><span>${p.name}</span>`;
    btn.setAttribute('aria-label', `${p.name} promptlet`);
    btn.addEventListener('click', () => runPromptletOnInput(p));
    promptletList.appendChild(btn);
  });
}

function updateTokenUsage(usage) {
  if (!tokenUsage) return;

  const hasUsage = !!usage && [usage.totalTokens, usage.inputTokens, usage.outputTokens]
    .some((value) => value !== null && value !== undefined);

  if (!hasUsage) {
    tokenUsage.textContent = '';
    tokenUsage.classList.add('hidden');
    return;
  }

  const segments = [];
  if (usage.totalTokens !== null && usage.totalTokens !== undefined) {
    segments.push(`Tokens: ${usage.totalTokens}`);
  }

  const subSegments = [];
  if (usage.inputTokens !== null && usage.inputTokens !== undefined) {
    subSegments.push(`In: ${usage.inputTokens}`);
  }
  if (usage.outputTokens !== null && usage.outputTokens !== undefined) {
    subSegments.push(`Out: ${usage.outputTokens}`);
  }

  if (subSegments.length) {
    segments.push(`(${subSegments.join(' | ')})`);
  }

  tokenUsage.textContent = segments.join(' ');
  tokenUsage.classList.remove('hidden');
}

function getInputSelectionOrAll() {
  const selection = inputArea.value.substring(inputArea.selectionStart, inputArea.selectionEnd);
  return selection.trim() ? selection : inputArea.value;
}

function getOutputSelectionOrAll() {
  const selection = getSelectedOutputText();
  return selection.trim() ? selection : outputArea.textContent;
}

function getSelectedOutputText() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return '';

  const range = selection.getRangeAt(0);
  const anchorNode = range.commonAncestorContainer;
  if (!outputArea.contains(anchorNode)) return '';

  return selection.toString();
}

async function runPromptletOnInput(promptlet) {
  const text = getInputSelectionOrAll();
  await executePromptlet(text, promptlet);
}

async function runPromptletOnOutput(promptlet) {
  closeAllMenus();
  const text = getOutputSelectionOrAll();
  await executePromptlet(text, promptlet);
}

async function executePromptlet(text, promptlet) {
  if (isRunningPromptlet) return;

  if (!text || !text.trim()) return;

  updateTokenUsage(null);
  isRunningPromptlet = true;
  outputArea.textContent = '';
  outputOverlay.style.display = 'none';
  outputArea.classList.remove('markdown');
  copyBtn.disabled = true;
  outputArea.textContent = `Processing with ${promptlet.name}...`;

  try {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      simulateResult(promptlet, text);
      return;
    }

    const combinedPrompt = `${promptlet.prompt}\n\n${text}`;
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'executePrompt',
        prompt: combinedPrompt,
        promptlet
      }, (res) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!res) {
          reject(new Error('No response from background'));
          return;
        }
        resolve(res);
      });
    });

    if (!response.success) {
      throw new Error(response.error || 'Unknown error');
    }

    renderOutput(response.result);
    updateTokenUsage(response.usage);
  } catch (err) {
    outputArea.textContent = `Error: ${err.message}`;
    lastOutputValue = outputArea.textContent;
    resizeOutputToContent();
    saveOutput(outputArea.textContent);
    updateTokenUsage(null);
  } finally {
    isRunningPromptlet = false;
    updateOverlays();
  }
}

function simulateResult(promptlet, text) {
  const mocked = `${promptlet.name} preview:\n\n${text}`;
  renderOutput(mocked);
}

function renderOutput(text) {
  lastOutputValue = text;
  outputArea.innerHTML = '';
  outputArea.classList.add('markdown');
  const html = basicMarkdown(text);
  outputArea.innerHTML = html;
  resizeOutputToContent();
  saveOutput(text);
  copyBtn.disabled = !text.trim();
  updateOverlays();
}

function basicMarkdown(text) {
  let safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  safe = safe.replace(/\n\n/g, '</p><p>');
  return `<p>${safe}</p>`;
}

function applyPanelRatios() {
  if (!panels || !panelResizeHandle) return;

  const isVerticalLayout = workspace.classList.contains('vertical');
  const layoutKey = isVerticalLayout ? 'vertical' : 'horizontal';
  const ratio = clampPanelRatio(panelRatios[layoutKey] ?? PANEL_RATIO_DEFAULT);
  panelRatios[layoutKey] = ratio;
  const inverse = 1 - ratio;

  if (isVerticalLayout) {
    panels.style.gridTemplateColumns = '1fr';
    panels.style.gridTemplateRows = `${ratio}fr var(--divider-size) ${inverse}fr`;
    panelResizeHandle.setAttribute('aria-orientation', 'horizontal');
  } else {
    panels.style.gridTemplateColumns = `${ratio}fr var(--divider-size) ${inverse}fr`;
    panels.style.gridTemplateRows = '1fr';
    panelResizeHandle.setAttribute('aria-orientation', 'vertical');
  }
}

function attachResizeHandle() {
  if (!panelResizeHandle) return;
  panelResizeHandle.addEventListener('pointerdown', startDraggingPanels);
}

function startDraggingPanels(event) {
  event.preventDefault();
  isDraggingHandle = true;
  panelResizeHandle.classList.add('dragging');
  panelResizeHandle.setPointerCapture(event.pointerId);
  window.addEventListener('pointermove', handlePanelDrag);
  window.addEventListener('pointerup', stopDraggingPanels);
}

function handlePanelDrag(event) {
  if (!isDraggingHandle || !panels) return;

  const isVerticalLayout = workspace.classList.contains('vertical');
  const rect = panels.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  if (isVerticalLayout) {
    const relativeY = (event.clientY - rect.top) / rect.height;
    const ratio = clampPanelRatio(relativeY);
    panelRatios.vertical = ratio;
    persistPanelRatio('vertical', ratio);
  } else {
    const relativeX = (event.clientX - rect.left) / rect.width;
    const ratio = clampPanelRatio(relativeX);
    panelRatios.horizontal = ratio;
    persistPanelRatio('horizontal', ratio);
  }

  applyPanelRatios();
}

function stopDraggingPanels(event) {
  if (!isDraggingHandle) return;
  isDraggingHandle = false;
  panelResizeHandle.classList.remove('dragging');
  if (panelResizeHandle.hasPointerCapture(event.pointerId)) {
    panelResizeHandle.releasePointerCapture(event.pointerId);
  }
  window.removeEventListener('pointermove', handlePanelDrag);
  window.removeEventListener('pointerup', stopDraggingPanels);
}

function toggleLayout() {
  const isVertical = workspace.classList.contains('vertical');
  const nextIsVertical = !isVertical;
  workspace.classList.toggle('vertical', nextIsVertical);
  workspace.classList.toggle('horizontal', !nextIsVertical);
  layoutBtn.textContent = nextIsVertical ? '↕️' : '↔️';
  localStorage.setItem(STORAGE_KEYS.layout, nextIsVertical ? 'vertical' : 'horizontal');
  applyPanelRatios();
}

function buildLayoutFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEYS.layout) || 'vertical';
  const isVertical = stored === 'vertical';
  workspace.classList.toggle('vertical', isVertical);
  workspace.classList.toggle('horizontal', !isVertical);
  layoutBtn.textContent = isVertical ? '↕️' : '↔️';
  applyPanelRatios();
}

function buildThemeMenu() {
  themeMenu.innerHTML = '';
  customThemeContainer.className = 'custom-theme-container';
  customThemeContainer.setAttribute('aria-hidden', 'true');

  Object.entries(PRESET_THEMES).forEach(([name, cfg]) => {
    const btn = document.createElement('button');
    btn.dataset.themeName = name;
    btn.textContent = formatThemeLabel(name);
    btn.addEventListener('click', () => applyTheme(cfg, name));
    themeMenu.appendChild(btn);
  });

  const customBtn = document.createElement('button');
  customBtn.className = 'custom-theme-toggle';
  customBtn.dataset.themeName = 'custom';
  customBtn.textContent = formatThemeLabel('Custom...', 'custom');
  customBtn.addEventListener('click', () => openCustomTheme(customBtn));
  customBtn.setAttribute('aria-expanded', 'false');

  themeMenu.appendChild(customBtn);
  themeMenu.appendChild(customThemeContainer);
}

function buildFontMenus() {
  fontTypeMenu.innerHTML = '';
  FONT_OPTIONS.forEach((font) => {
    const item = document.createElement('button');
    item.dataset.fontType = font;
    item.textContent = font;
    item.style.fontFamily = font;
    item.addEventListener('click', () => applyFont(font));
    fontTypeMenu.appendChild(item);
  });

  fontSizeMenu.innerHTML = '';
  FONT_SIZES.forEach((size) => {
    const item = document.createElement('button');
    item.dataset.fontSize = size;
    item.textContent = `${size}px`;
    item.addEventListener('click', () => applyFontSize(size));
    fontSizeMenu.appendChild(item);
  });

  updateFontSelections();
}

function applyTheme(theme, themeName = 'custom') {
  const themeTarget = document.documentElement;
  themeTarget.style.setProperty('--panel-bg', theme.bg);
  themeTarget.style.setProperty('--bg', theme.bg);
  themeTarget.style.setProperty('--text', theme.fg);
  themeTarget.style.setProperty('--accent', theme.accent || theme.fg);
  if (theme.font) {
    applyFont(theme.font);
  }
  if (theme.size) {
    applyFontSize(theme.size);
  }
  currentThemeName = themeName;
  updateThemeSelections();
  persistTheme({ themeName, ...theme });
  closeAllMenus();
}

async function openCustomTheme(toggleBtn) {
  const isOpen = customThemeContainer.classList.contains('open');
  if (isOpen) {
    collapseCustomTheme(toggleBtn);
    return;
  }

  customThemeContainer.innerHTML = '';
  const tpl = document.getElementById('customThemeTemplate');
  const node = tpl.content.cloneNode(true);
  const fontSelect = node.querySelector('#customFontSelect');
  const fontSize = node.querySelector('#customFontSize');
  const fontSizeValue = node.querySelector('#customFontSizeValue');
  const bgInput = node.querySelector('#customBg');
  const fgInput = node.querySelector('#customFg');

  FONT_OPTIONS.forEach((font) => {
    const opt = document.createElement('option');
    opt.value = font;
    opt.textContent = font;
    fontSelect.appendChild(opt);
  });

  const storedTheme = await getStoredTheme();
  fontSelect.value = storedTheme.font || FONT_OPTIONS[0];
  fontSize.value = storedTheme.size || 16;
  fontSizeValue.textContent = `${fontSize.value}px`;
  bgInput.value = storedTheme.bg || '#1e1e1e';
  fgInput.value = storedTheme.fg || '#e5e5e5';

  fontSize.addEventListener('input', () => {
    fontSizeValue.textContent = `${fontSize.value}px`;
  });

  node.querySelector('#applyCustomTheme').addEventListener('click', () => {
    const customTheme = {
      font: fontSelect.value,
      size: Number(fontSize.value),
      bg: bgInput.value,
      fg: fgInput.value
    };
    applyTheme(customTheme, 'custom');
  });

  node.querySelector('#resetCustomTheme').addEventListener('click', () => {
    applyTheme(PRESET_THEMES.Dark, 'Dark');
  });

  customThemeContainer.appendChild(node);
  customThemeContainer.classList.add('open');
  customThemeContainer.setAttribute('aria-hidden', 'false');
  toggleBtn?.setAttribute('aria-expanded', 'true');
  customThemeContainer.scrollIntoView({ block: 'nearest' });
}

function applyFont(font) {
  workspace.style.setProperty('--font-family', font);
  inputArea.style.fontFamily = font;
  outputArea.style.fontFamily = font;
  resizeInputToContent();
  resizeOutputToContent();
  currentFontFamily = font;
  updateFontSelections();
  saveToStorage(STORAGE_KEYS.fontFamily, font);
  closeAllMenus();
}

function applyFontSize(size) {
  workspace.style.setProperty('--font-size', `${size}px`);
  inputArea.style.fontSize = `${size}px`;
  outputArea.style.fontSize = `${size}px`;
  resizeInputToContent();
  resizeOutputToContent();
  currentFontSize = size;
  updateFontSelections();
  saveToStorage(STORAGE_KEYS.fontSize, size);
  closeAllMenus();
}

function persistTheme(theme) {
  saveToStorage(STORAGE_KEYS.theme, theme);
}

function getStoredTheme() {
  return getFromStorage(STORAGE_KEYS.theme, PRESET_THEMES.Dark);
}

async function applyStoredAppearance() {
  const [storedTheme, storedFont, storedSize] = await Promise.all([
    getStoredTheme(),
    getFromStorage(STORAGE_KEYS.fontFamily, ''),
    getFromStorage(STORAGE_KEYS.fontSize, 0)
  ]);

  const resolvedTheme = {
    ...storedTheme,
    font: storedFont || storedTheme.font,
    size: storedSize || storedTheme.size
  };

  applyTheme(resolvedTheme, storedTheme.themeName || 'Dark');
}

function collapseCustomTheme(toggleBtn = themeMenu.querySelector('.custom-theme-toggle')) {
  customThemeContainer.classList.remove('open');
  customThemeContainer.setAttribute('aria-hidden', 'true');
  toggleBtn?.setAttribute('aria-expanded', 'false');
}

function formatThemeLabel(name, key = name) {
  const mark = key === currentThemeName ? '✓ ' : '';
  return `${mark}${name}`;
}

function formatFontLabel(label, isSelected) {
  return `${isSelected ? '✓ ' : ''}${label}`;
}

function updateFontSelections() {
  fontTypeMenu.querySelectorAll('button[data-font-type]').forEach((btn) => {
    const font = btn.dataset.fontType;
    btn.textContent = formatFontLabel(font, font === currentFontFamily);
    btn.style.fontFamily = font;
  });

  fontSizeMenu.querySelectorAll('button[data-font-size]').forEach((btn) => {
    const size = Number(btn.dataset.fontSize);
    btn.textContent = formatFontLabel(`${size}px`, size === currentFontSize);
  });
}

function updateThemeSelections() {
  themeMenu.querySelectorAll('button[data-theme-name]').forEach((btn) => {
    const { themeName } = btn.dataset;
    const label = themeName === 'custom' ? 'Custom...' : themeName;
    btn.textContent = formatThemeLabel(label, themeName);
  });
  const customToggle = themeMenu.querySelector('.custom-theme-toggle');
  if (customToggle) {
    customToggle.textContent = formatThemeLabel('Custom...', 'custom');
  }
}
