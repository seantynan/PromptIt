// =========================================================================
// PromptIt Manage Page
// Handles promptlet CRUD operations
// =========================================================================

let allPromptlets = [];
let editingPromptletName = null; // Track which promptlet we're editing

// -------------------------
// Initialize
// -------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadPromptlets();
  loadApiKey();
  setupEventListeners();
});

// -------------------------
// Event Listeners
// -------------------------
function setupEventListeners() {
  // Add new promptlet
  document.getElementById('addNewBtn').addEventListener('click', () => {
    showEditor();
  });

  // Cancel editing
  document.getElementById('cancelBtn').addEventListener('click', () => {
    hideEditor();
  });

  // Save promptlet
  document.getElementById('saveBtn').addEventListener('click', () => {
    savePromptlet();
  });

  // Name validation
  document.getElementById('nameInput').addEventListener('input', validateName);

  // Advanced settings toggle
  document.getElementById('advancedToggle').addEventListener('click', toggleAdvanced);

  // Temperature slider
  document.getElementById('tempInput').addEventListener('input', (e) => {
    document.getElementById('tempValue').textContent = e.target.value;
  });

  // Tokens slider
  document.getElementById('tokensInput').addEventListener('input', (e) => {
    document.getElementById('tokensValue').textContent = e.target.value;
  });

  // Save API key
  document.getElementById('saveKeyBtn').addEventListener('click', saveApiKey);
}

// -------------------------
// Load promptlets from storage
// -------------------------
function loadPromptlets() {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    allPromptlets = data.promptlets;
    renderPromptlets();
  });
}

// -------------------------
// Render promptlet lists
// -------------------------
function renderPromptlets() {
  const defaultList = document.getElementById('defaultPromptlets');
  const userList = document.getElementById('userPromptlets');
  const emptyState = document.getElementById('emptyState');

  // Separate default and user promptlets
  const defaults = allPromptlets.filter(p => p.isDefault);
  const customs = allPromptlets.filter(p => !p.isDefault);

  // Render defaults
  defaultList.innerHTML = '';
  defaults.forEach(p => {
    defaultList.appendChild(createPromptletCard(p, true));
  });

  // Render customs
  userList.innerHTML = '';
  if (customs.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    customs.forEach(p => {
      userList.appendChild(createPromptletCard(p, false));
    });
  }
}

// -------------------------
// Create promptlet card element
// -------------------------
function createPromptletCard(promptlet, isDefault) {
  const card = document.createElement('div');
  card.className = `promptlet-card ${promptlet.isEnabled ? '' : 'disabled'}`;

  const header = document.createElement('div');
  header.className = 'promptlet-header';

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'promptlet-checkbox';
  checkbox.checked = promptlet.isEnabled;
  checkbox.addEventListener('change', () => toggleEnabled(promptlet.name, checkbox.checked));

  // Emoji
  const emoji = document.createElement('span');
  emoji.className = 'promptlet-emoji';
  emoji.textContent = promptlet.emoji || '📝';

  // Name
  const name = document.createElement('span');
  name.className = 'promptlet-name';
  name.textContent = promptlet.name;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'promptlet-actions';

  if (!isDefault) {
    // Edit button (user promptlets only)
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-small btn-secondary';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editPromptlet(promptlet));
    actions.appendChild(editBtn);
  }

  // Clone button (all promptlets)
  const cloneBtn = document.createElement('button');
  cloneBtn.className = 'btn btn-small btn-secondary';
  cloneBtn.textContent = 'Clone';
  cloneBtn.addEventListener('click', () => clonePromptlet(promptlet));
  actions.appendChild(cloneBtn);

  if (!isDefault) {
    // Delete button (user promptlets only)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-small btn-danger';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => deletePromptlet(promptlet.name));
    actions.appendChild(deleteBtn);
  }

  header.appendChild(checkbox);
  header.appendChild(emoji);
  header.appendChild(name);
  header.appendChild(actions);

  // Prompt preview
  const prompt = document.createElement('div');
  prompt.className = 'promptlet-prompt';
  prompt.textContent = promptlet.prompt;

  card.appendChild(header);
  card.appendChild(prompt);

  return card;
}

// -------------------------
// Toggle promptlet enabled/disabled
// -------------------------
function toggleEnabled(name, isEnabled) {
  const promptlet = allPromptlets.find(p => p.name === name);
  if (promptlet) {
    promptlet.isEnabled = isEnabled;
    saveAllPromptlets();
  }
}

// -------------------------
// Show editor panel
// -------------------------
function showEditor(promptlet = null, isClone = false) {
  const panel = document.getElementById('editorPanel');
  const title = document.getElementById('editorTitle');

  if (promptlet && !isClone) {
    // Editing existing promptlet
    title.textContent = 'Edit Promptlet';
    editingPromptletName = promptlet.name;
    populateEditor(promptlet);
  } else if (promptlet && isClone) {
    // Cloning promptlet
    title.textContent = 'Add New Promptlet (Cloned)';
    editingPromptletName = null; // Important: this is a new promptlet
    populateEditor(promptlet);
  } else {
    // Adding new promptlet
    title.textContent = 'Add New Promptlet';
    editingPromptletName = null;
    clearEditor();
  }

  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// -------------------------
// Hide editor panel
// -------------------------
function hideEditor() {
  document.getElementById('editorPanel').classList.add('hidden');
  editingPromptletName = null;
  clearEditor();
}

// -------------------------
// Populate editor with promptlet data
// -------------------------
function populateEditor(promptlet) {
  document.getElementById('emojiInput').value = promptlet.emoji || '';
  document.getElementById('nameInput').value = promptlet.name;
  document.getElementById('promptInput').value = promptlet.prompt;
  document.getElementById('modelInput').value = promptlet.model || 'gpt-4o';
  
  const temp = promptlet.temperature ?? 1.0;
  document.getElementById('tempInput').value = temp;
  document.getElementById('tempValue').textContent = temp;
  
  const tokens = promptlet.maxTokens || 1500;
  document.getElementById('tokensInput').value = tokens;
  document.getElementById('tokensValue').textContent = tokens;
}

// -------------------------
// Clear editor
// -------------------------
function clearEditor() {
  document.getElementById('emojiInput').value = '';
  document.getElementById('nameInput').value = '';
  document.getElementById('promptInput').value = '';
  document.getElementById('modelInput').value = 'gpt-4o';
  document.getElementById('tempInput').value = 1.0;
  document.getElementById('tempValue').textContent = '1.0';
  document.getElementById('tokensInput').value = 1500;
  document.getElementById('tokensValue').textContent = '1500';
  
  const validation = document.getElementById('nameValidation');
  validation.classList.add('hidden');
}

// -------------------------
// Validate name uniqueness
// -------------------------
function validateName() {
  const nameInput = document.getElementById('nameInput');
  const validation = document.getElementById('nameValidation');
  const name = nameInput.value.trim();

  if (!name) {
    validation.textContent = '❌ Name is required';
    validation.className = 'validation-message validation-error';
    validation.classList.remove('hidden');
    return false;
  }

  // Check if name already exists (case-insensitive)
  const exists = allPromptlets.some(p => 
    p.name.toLowerCase() === name.toLowerCase() && 
    p.name !== editingPromptletName // Allow same name if editing
  );

  if (exists) {
    validation.textContent = `⚠️ A promptlet named "${name}" already exists`;
    validation.className = 'validation-message validation-error';
    validation.classList.remove('hidden');
    return false;
  }

  validation.textContent = '✓ Available';
  validation.className = 'validation-message validation-success';
  validation.classList.remove('hidden');
  return true;
}

// -------------------------
// Save promptlet (add or edit)
// -------------------------
function savePromptlet() {
  const name = document.getElementById('nameInput').value.trim();
  const emoji = document.getElementById('emojiInput').value.trim();
  const prompt = document.getElementById('promptInput').value.trim();

  // Validate
  if (!name) {
    alert('Please enter a name');
    return;
  }

  if (!prompt) {
    alert('Please enter a prompt');
    return;
  }

  if (!validateName()) {
    return;
  }

  const promptletData = {
    name: name,
    emoji: emoji || '📝',
    prompt: prompt,
    model: document.getElementById('modelInput').value,
    temperature: parseFloat(document.getElementById('tempInput').value),
    maxTokens: parseInt(document.getElementById('tokensInput').value),
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    isDefault: false,
    isEnabled: true,
    createdAt: Date.now(),
    lastModified: Date.now()
  };

  if (editingPromptletName) {
    // Edit existing
    const index = allPromptlets.findIndex(p => p.name === editingPromptletName);
    if (index !== -1) {
      promptletData.createdAt = allPromptlets[index].createdAt; // Preserve creation date
      allPromptlets[index] = promptletData;
    }
  } else {
    // Add new
    allPromptlets.push(promptletData);
  }

  saveAllPromptlets();
  hideEditor();
}

// -------------------------
// Clone promptlet
// -------------------------
function clonePromptlet(promptlet) {
  const clonedName = promptlet.name + ' (Copy)';
  
  const clone = {
    ...promptlet,
    name: clonedName,
    isDefault: false,
    isEnabled: true,
    createdAt: Date.now(),
    lastModified: Date.now()
  };

  // Show editor with cloned data (isClone = true)
  showEditor(clone, true);
}

// -------------------------
// Edit promptlet
// -------------------------
function editPromptlet(promptlet) {
  showEditor(promptlet);
}

// -------------------------
// Delete promptlet
// -------------------------
function deletePromptlet(name) {
  if (!confirm(`Delete "${name}"?`)) {
    return;
  }

  allPromptlets = allPromptlets.filter(p => p.name !== name);
  saveAllPromptlets();
}

// -------------------------
// Save all promptlets to storage
// -------------------------
function saveAllPromptlets() {
  chrome.storage.local.set({ promptlets: allPromptlets }, () => {
    renderPromptlets();
    // Notify background to rebuild menus
    chrome.runtime.sendMessage({ action: 'updatePromptlets', promptlets: allPromptlets });
  });
}

// -------------------------
// Toggle advanced settings
// -------------------------
function toggleAdvanced() {
  const content = document.getElementById('advancedContent');
  const icon = document.getElementById('advancedIcon');
  
  if (content.classList.contains('show')) {
    content.classList.remove('show');
    icon.classList.remove('open');
  } else {
    content.classList.add('show');
    icon.classList.add('open');
  }
}

// -------------------------
// Load API key
// -------------------------
function loadApiKey() {
  chrome.storage.local.get({ apiKey: '' }, (data) => {
    document.getElementById('apiKeyInput').value = data.apiKey || '';
  });
}

// -------------------------
// Save API key
// -------------------------
function saveApiKey() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  chrome.storage.local.set({ apiKey }, () => {
    alert('API key saved successfully!');
  });
}