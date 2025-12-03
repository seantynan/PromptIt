// =========================================================================
// PromptIt Manage Page
// Handles promptlet CRUD operations
// =========================================================================

let allPromptlets = [];
let editingPromptletName = null; // Track which promptlet we're editing
const model = "gpt-4o"; // New recommended default for speed and cost-efficiency

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
  document.getElementById('addNewBtn').addEventListener('click', () => showEditor());
  document.getElementById('cancelBtn').addEventListener('click', hideEditor);
  document.getElementById('saveBtn').addEventListener('click', savePromptlet);
  document.getElementById('nameInput').addEventListener('input', validateName);
  document.getElementById('advancedToggle').addEventListener('click', toggleAdvanced);

  document.getElementById('tempInput').addEventListener('input', (e) => {
    document.getElementById('tempValue').textContent = e.target.value;
  });

  document.getElementById('tokensInput').addEventListener('input', (e) => {
    document.getElementById('tokensValue').textContent = e.target.value;
  });

  document.getElementById('saveKeyBtn').addEventListener('click', saveApiKey);
  
  // Add listener for Reset button
  const resetBtn = document.getElementById('resetDefaultsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetDefaults);
  }
}

// -------------------------
// Load promptlets
// -------------------------
function loadPromptlets() {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
// Ensure every promptlet has necessary properties (defaulting to safe values)
    allPromptlets = (data.promptlets || []).map(p => ({
      ...p,
      // Default to true if the property is missing
      isActive: p.isActive === undefined ? true : p.isActive,
      // Default createdAt to 0 for old/defaults so they appear first if custom sort fails
      createdAt: p.createdAt || 0 
    }));
    renderPromptlets();
  });
}

// -------------------------
// Render promptlets
// -------------------------
function renderPromptlets() {
  const defaultList = document.getElementById('defaultPromptlets');
  const userList = document.getElementById('userPromptlets');
  const emptyState = document.getElementById('emptyState');

  // Clear current lists
  defaultList.innerHTML = '';
  userList.innerHTML = '';

  // 1. Separate Promptlets
  let defaults = allPromptlets.filter(p => p.isDefault);
  let customs = allPromptlets.filter(p => !p.isDefault);

  // 2. Sort Promptlets (Matching background.js logic for consistency)
  // Defaults: Sort by defaultIndex (set in background.js helper)
  defaults.sort((a, b) => (a.defaultIndex || 0) - (b.defaultIndex || 0));

  // Customs: Sort by creation date (oldest first)
  // If createdAt is missing, treat it as very old (0)
  customs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  // Toggle empty state visibility
  if (emptyState) {
    emptyState.classList.toggle('hidden', customs.length > 0);
  }

  // Render Default Promptlets
  defaults.forEach(p => {
    defaultList.appendChild(createPromptletElement(p));
  });

  // Render User Promptlets
  customs.forEach(p => {
    userList.appendChild(createPromptletElement(p));
  });
}

// -------------------------
// Create promptlet element (Card)
// -------------------------
// [manage.js] - Replace the 'createPromptletElement' function entirely

function createPromptletElement(promptlet) {
    const item = document.createElement('div');

    // 1. Determine active state (default to true if undefined)
    const isActive = promptlet.isActive !== false;

    // 2. Apply 'disabled' class only if inactive
    item.className = `promptlet-card ${!isActive ? 'disabled' : ''}`;

    item.dataset.name = promptlet.name;

    item.innerHTML = `
     <div class="promptlet-header">
      <label class="toggle-switch" title="${isActive ? 'On' : 'Off'}">
        <input 
          type="checkbox" 
          class="toggle-input" 
          data-name="${promptlet.name}" 
          ${isActive ? 'checked' : ''} 
        >
        <span class="toggle-slider"></span>
      </label>

      <span class="promptlet-emoji">${promptlet.emoji || '📝'}</span>
      <span class="promptlet-name">${promptlet.name}</span>
      
      <div class="promptlet-actions">
        ${promptlet.isDefault
            ? '<span style="font-size:11px; color:#888; margin-right:5px;">LOCKED</span>'
            : `<button class="btn btn-small btn-secondary edit-btn">Edit</button>
             <button class="btn btn-small btn-danger delete-btn">Delete</button>`
        }
        <button class="btn btn-small btn-secondary clone-btn">Clone</button>
      </div>
    </div>
    
    ${promptlet.isDefault
            ? ''
            : `<div class="promptlet-prompt">${promptlet.prompt}</div>`
        }
   `;

    // --- Attach Event Listeners ---

    // 1. Toggle Switch
    const toggleInput = item.querySelector('.toggle-input');
    toggleInput.addEventListener('change', () => togglePromptletActive(promptlet.name));

    // 2. Clone Button (Always Active)
    const cloneBtn = item.querySelector('.clone-btn');
    cloneBtn.addEventListener('click', (e) => {
        // Prevent the click from triggering parent events if any
        e.stopPropagation();
        clonePromptlet(promptlet);
    });

    // 3. Edit/Delete (Only for custom)
    if (!promptlet.isDefault) {
        item.querySelector('.edit-btn').addEventListener('click', () => editPromptlet(promptlet));
        item.querySelector('.delete-btn').addEventListener('click', () => deletePromptlet(promptlet.name));
    }

    return item;
}

// -------------------------
// Toggle Active State
// -------------------------
function togglePromptletActive(name) {
  const index = allPromptlets.findIndex(p => p.name === name);
  if (index > -1) {
    // Flip state
    allPromptlets[index].isActive = !allPromptlets[index].isActive;
    
    // Save immediately
    saveAllPromptlets();
  }
}

// -------------------------
// Save promptlet (Add or Edit)
// -------------------------
function savePromptlet() {
  const name = document.getElementById('nameInput').value.trim();
  const prompt = document.getElementById('promptInput').value.trim();
  
  if (!name) {
    alert("Name is required");
    return;
  }
  
  if (!validateName()) return;

  const newPromptletData = {
    name: name,
    emoji: document.getElementById('emojiInput').value.trim() || '📝',
    prompt: prompt,
    model: document.getElementById('modelInput').value,
    temperature: parseFloat(document.getElementById('tempInput').value),
    maxTokens: parseInt(document.getElementById('tokensInput').value),
    outputStructure: ["main"],
    isActive: true, // New/Edited are active by default
    isDefault: false,
    lastModified: Date.now()
  };

  if (editingPromptletName) {
    // Update existing
    const index = allPromptlets.findIndex(p => p.name === editingPromptletName);
    if (index > -1) {
      // Preserve original creation date or other hidden props if any
      allPromptlets[index] = { ...allPromptlets[index], ...newPromptletData };
    }
  } else {
    // Add new
    newPromptletData.createdAt = Date.now();
    allPromptlets.push(newPromptletData);
  }

  saveAllPromptlets();
  hideEditor();
}

// -------------------------
// Save All to Storage
// -------------------------
function saveAllPromptlets() {
  chrome.storage.local.set({ promptlets: allPromptlets }, () => {
    // Re-render UI to reflect changes (e.g. toggle switch state / ordering)
    renderPromptlets();
  });
}

// -------------------------
// Clone
// -------------------------
function clonePromptlet(promptlet) {
  const clonedName = promptlet.name + ' (Copy)';
  const clone = { 
    ...promptlet, 
    name: clonedName, 
    isDefault: false, 
    isActive: true, // Clones start active
    createdAt: Date.now() 
  };
  showEditor(clone, true);
}

// -------------------------
// Edit
// -------------------------
function editPromptlet(promptlet) {
  showEditor(promptlet);
}

// -------------------------
// Delete
// -------------------------
function deletePromptlet(name) {
  if (!confirm(`Delete "${name}"?`)) return;
  allPromptlets = allPromptlets.filter(p => p.name !== name);
  saveAllPromptlets();
}

// -------------------------
// Reset Defaults
// -------------------------
function handleResetDefaults() {
  if (!confirm("Are you sure you want to reset? Custom promptlets will be deleted.")) {
    return;
  }
  chrome.runtime.sendMessage({ action: 'resetToDefaults' }, (response) => {
    if (response && response.success) {
      alert("Reset successful.");
      loadPromptlets(); // Reload from storage
    } else {
      alert("Reset failed.");
    }
  });
}

// -------------------------
// Editor UI Helpers
// -------------------------
function showEditor(promptlet = null, isClone = false) {
  const panel = document.getElementById('editorPanel');
  const title = document.getElementById('editorTitle');

  // --- ADD OR UPDATE THIS BLOCK FOR MAX TOKENS ---
  const tokensInput = document.getElementById('tokensInput');
  const tokensValue = document.getElementById('tokensValue');

  // Load the Max Tokens value from the promptlet object (4000 for Verify)
  // or fall back to the default 1500 for a completely new promptlet.
  // CRITICAL FIX: Add (promptlet && ...) to check if the promptlet object exists 
  // before trying to access its property.
  const currentTokens = (promptlet && promptlet.maxTokens !== undefined) 
      ? promptlet.maxTokens 
      : 1500;
      
  tokensInput.value = currentTokens;
  tokensValue.textContent = currentTokens;
  
  // Also ensure the event listener updates the display
  tokensInput.dispatchEvent(new Event('input'));

  if (promptlet && !isClone) {
    title.textContent = 'Edit Promptlet';
    editingPromptletName = promptlet.name;
    populateEditor(promptlet);
  } else if (promptlet && isClone) {
    title.textContent = 'New Promptlet (Clone)';
    editingPromptletName = null;
    populateEditor(promptlet);
  } else {
    title.textContent = 'Add New Promptlet';
    editingPromptletName = null;
    clearEditor();
  }

  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideEditor() {
  document.getElementById('editorPanel').classList.add('hidden');
  editingPromptletName = null;
  clearEditor();
}

function populateEditor(promptlet) {
  document.getElementById('emojiInput').value = promptlet.emoji || '';
  document.getElementById('nameInput').value = promptlet.name;
  document.getElementById('promptInput').value = promptlet.prompt;
  document.getElementById('modelInput').value = promptlet.model || model;
  document.getElementById('tempInput').value = promptlet.temperature ?? 1.0;
  document.getElementById('tempValue').textContent = promptlet.temperature ?? 1.0;
  document.getElementById('tokensInput').value = promptlet.maxTokens || 1500;
  document.getElementById('tokensValue').textContent = promptlet.maxTokens || 1500;
}

function clearEditor() {
  document.getElementById('emojiInput').value = '';
  document.getElementById('nameInput').value = '';
  document.getElementById('promptInput').value = '';
  document.getElementById('modelInput').value = model;
  document.getElementById('tempInput').value = 1.0;
  document.getElementById('tempValue').textContent = '1.0';
  document.getElementById('tokensInput').value = 1500;
  document.getElementById('tokensValue').textContent = '1500';
  document.getElementById('nameValidation').classList.add('hidden');
}

// -------------------------
// Name Validation
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

  // Check uniqueness (ignoring self if editing)
  const exists = allPromptlets.some(p =>
    p.name.toLowerCase() === name.toLowerCase() &&
    p.name !== editingPromptletName
  );

  if (exists) {
    validation.textContent = `⚠️ "${name}" already exists`;
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
// API Key Handling
// -------------------------
function loadApiKey() {
  chrome.storage.local.get({ apiKey: '' }, (data) => {
    document.getElementById('apiKeyInput').value = data.apiKey || '';
  });
}

function saveApiKey() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  chrome.storage.local.set({ apiKey }, () => alert('API key saved!'));
}

// -------------------------
// Toggle Advanced UI
// -------------------------
function toggleAdvanced() {
  const content = document.getElementById('advancedContent');
  const icon = document.getElementById('advancedIcon');
  content.classList.toggle('show');
  icon.classList.toggle('open');
}