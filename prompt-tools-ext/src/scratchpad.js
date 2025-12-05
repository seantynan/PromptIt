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
const promptletList = document.getElementById('promptletList');
const themeBtn = document.getElementById('themeBtn');
const themeMenu = document.getElementById('themeMenu');
const fontTypeBtn = document.getElementById('fontTypeBtn');
const fontTypeMenu = document.getElementById('fontTypeMenu');
const fontSizeBtn = document.getElementById('fontSizeBtn');
const fontSizeMenu = document.getElementById('fontSizeMenu');

const STORAGE_KEYS = {
  input: 'scratchpad-input',
  output: 'scratchpad-output',
  layout: 'scratchpad-layout',
  theme: 'scratchpad-theme',
  fontFamily: 'scratchpad-font-family',
  fontSize: 'scratchpad-font-size'
};

const PRESET_THEMES = {
  Dark: { font: 'Segoe UI', size: 16, bg: '#111217', fg: '#e5e5e5' },
  Light: { font: 'Segoe UI', size: 16, bg: '#f7f8fb', fg: '#1e1f29' },
  Solarized: { font: '"Helvetica Neue", Arial, sans-serif', size: 16, bg: '#002b36', fg: '#eee8d5' },
  'High Contrast': { font: 'Arial Black, Arial, sans-serif', size: 17, bg: '#000000', fg: '#ffffff' },
  'Warm Cream': { font: 'Georgia, serif', size: 17, bg: '#f9f5eb', fg: '#2d2418' },
  'Hacker Night': { font: '"Fira Code", monospace', size: 15, bg: '#0b0f0c', fg: '#5ce38a' }
};

const FONT_OPTIONS = [
  'Segoe UI',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Fira Code',
  'Inter'
];

const FONT_SIZES = [12, 14, 16, 18, 20, 22];

let undoBuffer = '';
let availablePromptlets = [];
let copyTimeout = null;
let saveTimeout = null;

init();

async function init() {
  restoreInput();
  await restoreOutput();
  buildLayoutFromStorage();
  attachInputHandlers();
  attachButtons();
  buildPromptletSidebar();
  buildChainMenu();
  buildThemeMenu();
  buildFontMenus();
  applyStoredAppearance();
  updateOverlays();
}

function attachInputHandlers() {
  inputArea.addEventListener('input', () => {
    queueSave();
    updateOverlays();
    setClearState();
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

function restoreInput() {
  const saved = localStorage.getItem(STORAGE_KEYS.input);
  if (saved) {
    inputArea.value = saved;
  }
  setClearState();
}

function saveInput() {
  localStorage.setItem(STORAGE_KEYS.input, inputArea.value);
}

async function restoreOutput() {
  const saved = await getStoredOutput();
  if (saved) {
    renderOutput(saved);
  } else {
    updateOverlays();
  }
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

function setClearState() {
  if (inputArea.value.trim()) {
    clearBtn.textContent = '🧹 Clear';
    clearBtn.setAttribute('aria-label', 'Clear Input');
  } else if (undoBuffer) {
    clearBtn.textContent = '↩️ Undo';
    clearBtn.setAttribute('aria-label', 'Undo clear');
  } else {
    clearBtn.textContent = '📄 New';
    clearBtn.setAttribute('aria-label', 'New scratchpad');
  }
}

function handleClear() {
  const hasInput = !!inputArea.value.trim();
  if (hasInput) {
    undoBuffer = inputArea.value;
    inputArea.value = '';
    saveInput();
    setClearState();
    updateOverlays();
    return;
  }

  if (!hasInput && undoBuffer) {
    inputArea.value = undoBuffer;
    undoBuffer = '';
    saveInput();
    setClearState();
    updateOverlays();
    return;
  }
}

function handleCopy() {
  if (!outputArea.textContent.trim()) return;
  navigator.clipboard.writeText(outputArea.textContent).then(() => {
    const feedback = document.createElement('span');
    feedback.className = 'copy-feedback';
    feedback.textContent = 'Copied!';
    copyBtn.after(feedback);
    clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => feedback.remove(), 2000);
  });
}

function toggleChainMenu() {
  toggleMenu(chainMenu, chainBtn);
}

function toggleMenu(menu, btn) {
  const isOpen = menu.classList.contains('open');
  closeAllMenus();
  if (!isOpen) {
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
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      const list = (data.promptlets && data.promptlets.length ? data.promptlets : DEFAULT_PROMPTLETS || []);
      resolve(list);
    });
  });
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

function getInputSelectionOrAll() {
  const selection = inputArea.value.substring(inputArea.selectionStart, inputArea.selectionEnd);
  return selection.trim() ? selection : inputArea.value;
}

function getOutputSelectionOrAll() {
  const selection = window.getSelection().toString();
  return selection.trim() ? selection : outputArea.textContent;
}

async function runPromptletOnInput(promptlet) {
  const text = getInputSelectionOrAll();
  await executePromptlet(text, promptlet);
}

async function runPromptletOnOutput(promptlet) {
  const text = getOutputSelectionOrAll();
  await executePromptlet(text, promptlet);
  closeAllMenus();
}

async function executePromptlet(text, promptlet) {
  if (!text || !text.trim()) return;

  outputArea.textContent = '';
  outputOverlay.style.display = 'none';
  outputArea.classList.remove('markdown');
  copyBtn.disabled = true;
  outputArea.textContent = 'Processing...';

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
  } catch (err) {
    outputArea.textContent = `Error: ${err.message}`;
    saveOutput(outputArea.textContent);
  } finally {
    updateOverlays();
  }
}

function simulateResult(promptlet, text) {
  const mocked = `${promptlet.name} preview:\n\n${text}`;
  renderOutput(mocked);
}

function renderOutput(text) {
  outputArea.innerHTML = '';
  outputArea.classList.add('markdown');
  const html = basicMarkdown(text);
  outputArea.innerHTML = html;
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

function toggleLayout() {
  const isVertical = workspace.classList.contains('vertical');
  workspace.classList.toggle('vertical', !isVertical);
  workspace.classList.toggle('horizontal', isVertical);
    layoutBtn.textContent = isVertical ? '↔️' : '↕️';
  localStorage.setItem(STORAGE_KEYS.layout, isVertical ? 'horizontal' : 'vertical');
}

function buildLayoutFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEYS.layout) || 'horizontal';
  const isVertical = stored === 'vertical';
  workspace.classList.toggle('vertical', isVertical);
  workspace.classList.toggle('horizontal', !isVertical);
    layoutBtn.textContent = isVertical ? '↔️' : '↕️';
}

function buildThemeMenu() {
  themeMenu.innerHTML = '';
  Object.entries(PRESET_THEMES).forEach(([name, cfg]) => {
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.addEventListener('click', () => applyTheme(cfg, name));
    themeMenu.appendChild(btn);
  });

  const customBtn = document.createElement('button');
  customBtn.textContent = 'Custom...';
  customBtn.addEventListener('click', () => openCustomTheme());
  themeMenu.appendChild(customBtn);
}

function buildFontMenus() {
  fontTypeMenu.innerHTML = '';
  FONT_OPTIONS.forEach((font) => {
    const item = document.createElement('button');
    item.textContent = font;
    item.style.fontFamily = font;
    item.addEventListener('click', () => applyFont(font));
    fontTypeMenu.appendChild(item);
  });

  fontSizeMenu.innerHTML = '';
  FONT_SIZES.forEach((size) => {
    const item = document.createElement('button');
    item.textContent = `${size}px`;
    item.addEventListener('click', () => applyFontSize(size));
    fontSizeMenu.appendChild(item);
  });
}

function applyTheme(theme, themeName = 'custom') {
  const themeTarget = document.documentElement;
  themeTarget.style.setProperty('--panel-bg', theme.bg);
  themeTarget.style.setProperty('--bg', theme.bg);
  themeTarget.style.setProperty('--text', theme.fg);
  applyFont(theme.font);
  applyFontSize(theme.size);
  persistTheme({ themeName, ...theme });
  closeAllMenus();
}

function openCustomTheme() {
  themeMenu.classList.add('open');
  const existing = themeMenu.querySelector('.custom-theme');
  if (existing) return;
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

  const storedTheme = getStoredTheme();
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

  themeMenu.appendChild(node);
}

function applyFont(font) {
  workspace.style.setProperty('--font-family', font);
  inputArea.style.fontFamily = font;
  outputArea.style.fontFamily = font;
  localStorage.setItem(STORAGE_KEYS.fontFamily, font);
  closeAllMenus();
}

function applyFontSize(size) {
  workspace.style.setProperty('--font-size', `${size}px`);
  inputArea.style.fontSize = `${size}px`;
  outputArea.style.fontSize = `${size}px`;
  localStorage.setItem(STORAGE_KEYS.fontSize, size);
  closeAllMenus();
}

function persistTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    return stored ? JSON.parse(stored) : PRESET_THEMES.Dark;
  } catch (err) {
    return PRESET_THEMES.Dark;
  }
}

function applyStoredAppearance() {
  const storedTheme = getStoredTheme();
  applyTheme(storedTheme, storedTheme.themeName || 'Dark');
  const storedFont = localStorage.getItem(STORAGE_KEYS.fontFamily);
  if (storedFont) applyFont(storedFont);
  const storedSize = localStorage.getItem(STORAGE_KEYS.fontSize);
  if (storedSize) applyFontSize(Number(storedSize));
}
