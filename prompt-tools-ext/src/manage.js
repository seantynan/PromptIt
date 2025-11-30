// =========================================================================
// PromptIt Manage Page
// Handles promptlet CRUD operations
// =========================================================================

let allPromptlets = [];
let editingPromptletName = null; // Track which promptlet we're editing
const model = "gpt-5-mini"; // New recommended default for speed and cost-efficiency

// manage.js (Near the top, after the 'model' definition)

const EMOJI_CATEGORIES = {
    'Faces': '😀',
    'People': '🧑',
    'Objects': '💡',
    'Food': '🍕',
    'Travel': '✈️',
    'Symbols': '⭐'
};

const EMOJI_DATA = [
    // Faces & People
    { emoji: '💡', category: 'Objects', keywords: ['light', 'idea', 'thought'] },
    { emoji: '📝', category: 'Objects', keywords: ['note', 'document', 'write'] },
    { emoji: '✏️', category: 'Objects', keywords: ['edit', 'pen', 'write'] },
    { emoji: '✅', category: 'Symbols', keywords: ['check', 'verify', 'correct'] },
    { emoji: '📚', category: 'Objects', keywords: ['book', 'read', 'learn'] },
    { emoji: '⚙️', category: 'Symbols', keywords: ['settings', 'gear', 'manage'] },
    { emoji: '✨', category: 'Symbols', keywords: ['sparkle', 'magic', 'enhance'] },
    { emoji: '💬', category: 'Symbols', keywords: ['chat', 'comment', 'discuss'] },
    { emoji: '🌐', category: 'Symbols', keywords: ['web', 'world', 'global'] },
    { emoji: '🧠', category: 'Objects', keywords: ['brain', 'smart', 'thinking'] },
    { emoji: '📈', category: 'Symbols', keywords: ['chart', 'trend', 'analytics'] },
    { emoji: '🍎', category: 'Food', keywords: ['apple', 'fruit', 'nutrition'] },
    { emoji: '🍽️', category: 'Food', keywords: ['eat', 'dinner', 'recipe'] },
    { emoji: '👨‍💻', category: 'People', keywords: ['developer', 'coder', 'man'] },
    { emoji: '👩‍💻', category: 'People', keywords: ['developer', 'coder', 'woman'] },
    { emoji: '😀', category: 'Faces', keywords: ['happy', 'face'] },
    { emoji: '🤔', category: 'Faces', keywords: ['think', 'hmm'] },
    { emoji: '🚀', category: 'Travel', keywords: ['rocket', 'launch', 'fast'] },
    { emoji: '⭐', category: 'Symbols', keywords: ['star', 'favorite', 'rating'] },
    // Add more emojis as needed, following the same structure
];

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
// -------------------------
// Event Listeners
// -------------------------
function setupEventListeners() {
    // --- Core UI Listeners ---
    document.getElementById('addNewBtn').addEventListener('click', () => showEditor());
    document.getElementById('cancelBtn').addEventListener('click', hideEditor);
    document.getElementById('saveBtn').addEventListener('click', savePromptlet);
    document.getElementById('nameInput').addEventListener('input', validateName);
    document.getElementById('advancedToggle').addEventListener('click', toggleAdvanced);

    // --- Editor Control Listeners ---
    document.getElementById('tempInput').addEventListener('input', (e) => {
        document.getElementById('tempValue').textContent = e.target.value;
    });
    document.getElementById('tokensInput').addEventListener('input', (e) => {
        document.getElementById('tokensValue').textContent = e.target.value;
    });

    // --- API Key Listeners ---
    document.getElementById('saveKeyBtn').addEventListener('click', saveApiKey);
    
    // --- Reset Button Listener ---
    const resetBtn = document.getElementById('resetDefaultsBtn');
    if (resetBtn) {
        // Assuming you want the correct function name here
        resetBtn.addEventListener('click', handleResetDefaults); 
    }

    // =======================================================
    // 🔥 EMOJI PICKER LISTENERS (DEFENSIVELY WRAPPED) 🔥
    // =======================================================
    const emojiDisplay = document.getElementById('emojiDisplay');
    const emojiInput = document.getElementById('emojiInput');
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiSearchInput = document.getElementById('emojiSearchInput');
    const pickerTriggerIcon = document.getElementById('pickerTriggerIcon');

    // CRITICAL FIX: Only add listeners and call helpers if ALL five elements exist
    if (emojiDisplay && emojiInput && emojiPicker && emojiSearchInput && pickerTriggerIcon) {
        
        // 1. Toggle Picker Visibility (Action is now only on the new trigger icon)
        pickerTriggerIcon.addEventListener('click', (e) => {
            e.stopPropagation(); 
            emojiPicker.classList.toggle('hidden');
            if (!emojiPicker.classList.contains('hidden')) {
                // Ensure the list is populated when opened
                renderEmojis(EMOJI_DATA, 'Objects'); 
            }
        });

        // 2. Close picker if user clicks outside of it
        document.addEventListener('click', (e) => {
            if (!emojiPicker.classList.contains('hidden') && 
                !emojiPicker.contains(e.target) && 
                e.target !== emojiDisplay && // Don't close if we click the large display area
                e.target !== pickerTriggerIcon) { // Don't close if we click the trigger
                emojiPicker.classList.add('hidden');
            }
        });

        // 3. Handle Search Input
        emojiSearchInput.addEventListener('input', () => {
            const query = emojiSearchInput.value.toLowerCase();
            const filtered = EMOJI_DATA.filter(p => 
                p.keywords.some(k => k.includes(query)) || p.emoji.includes(query)
            );
            renderEmojis(filtered);
        });

        // 4. Handle Manual Text/Emoji Input (Updates the large display area)
        emojiInput.addEventListener('input', (e) => {
            emojiDisplay.textContent = e.target.value.substring(0, 2) || '❓'; 
        });

        // 5. Final Setup: Only call rendering function once, inside the safe block
        renderCategoryButtons();
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
function createPromptletElement(promptlet) {
  const item = document.createElement('div');
  // Add 'disabled' class only for visual styling if you want opacity changes
  item.className = `promptlet-card ${promptlet.isActive === false ? 'inactive' : ''}`;
  item.dataset.name = promptlet.name;

  // Determine active state (default to true)
  const isActive = promptlet.isActive !== false;

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

  // 1. Toggle Switch (Works for BOTH Default and Custom)
  const toggleInput = item.querySelector('.toggle-input');
  toggleInput.addEventListener('change', () => togglePromptletActive(promptlet.name));

  // 2. Clone Button
  const cloneBtn = item.querySelector('.clone-btn');
  cloneBtn.addEventListener('click', () => clonePromptlet(promptlet));

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
    // 1. Get all the form values using the new helper
    const formValues = getPromptletFormValues();
    
    // Use the name from the form values for validation
    const name = formValues.name;

    if (!name) {
        alert("Name is required");
        return;
    }
    
    // Note: Assuming validateName checks the 'nameInput' field directly
    if (!validateName()) return;

    // 2. Assemble the final promptlet object, adding metadata
    const newPromptletData = {
        ...formValues, // Contains name, emoji, prompt, model, etc.
        isActive: true, // New/Edited are active by default
        isDefault: false,
        lastModified: Date.now()
    };

    if (editingPromptletName) {
        // Update existing
        const index = allPromptlets.findIndex(p => p.name === editingPromptletName);
        if (index > -1) {
            // Preserve original properties (like createdAt) then apply new data
            allPromptlets[index] = { 
                ...allPromptlets[index], 
                ...newPromptletData 
            };
        }
    } else {
        // Add new
        newPromptletData.createdAt = Date.now();
        allPromptlets.push(newPromptletData);
    }

    saveAllPromptlets();
    hideEditor();
}

/**
 * Gathers user-editable form data from the Promptlet Editor.
 * This is where the emoji input logic (max 2 chars) is enforced.
 * @returns {object} An object containing the current values of the editor fields.
 */
function getPromptletFormValues() {
    // Enforce max length of 2 characters and provide a fallback '📝'
    const emojiValue = document.getElementById('emojiInput').value.trim().substring(0, 2);

    return {
        name: document.getElementById('nameInput').value.trim(),
        emoji: emojiValue || '📝',
        prompt: document.getElementById('promptInput').value.trim(),
        model: document.getElementById('modelInput').value,
        temperature: parseFloat(document.getElementById('tempInput').value),
        maxTokens: parseInt(document.getElementById('tokensInput').value, 10),
        // Assuming 'outputStructure' is currently always set to ["main"]
        outputStructure: ["main"] 
    };
}

/**
 * Gathers all data from the Promptlet Editor form fields.
 * @returns {object} A promptlet object containing all current form values.
 */
function getPromptletData() {
    // You likely have a function to get the current model and output structure, 
    // but we'll use sensible defaults and focus on the key fields.
    const modelSelect = document.getElementById('modelSelect');
    const outputStructureSelect = document.getElementById('outputStructureSelect');
    
    // Ensure the emoji is only 1 or 2 characters
    const emojiValue = document.getElementById('emojiInput').value.trim().substring(0, 2);

    return {
        // --- New Emoji Field ---
        emoji: emojiValue || '📝', 
        // -----------------------
        
        name: document.getElementById('nameInput').value.trim(),
        prompt: document.getElementById('promptInput').value.trim(),

        // --- Advanced Settings ---
        // Assuming you have these elements:
        model: modelSelect ? modelSelect.value : 'gpt-5-mini',
        maxTokens: parseInt(document.getElementById('tokensInput').value, 10),
        temperature: parseFloat(document.getElementById('tempInput').value),
        outputStructure: outputStructureSelect 
                         ? Array.from(outputStructureSelect.options).filter(opt => opt.selected).map(opt => opt.value)
                         : ['main']
    };
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
function showEditor(promptlet = null) {
    // Determine the emoji to display (using '❓' as the new default)
    const currentEmoji = promptlet ? promptlet.emoji : '❓';

    // ------------------------------------------
    // Set Emoji Values (Defensively)
    // ------------------------------------------
    const emojiDisplay = document.getElementById('emojiDisplay');
    const emojiInput = document.getElementById('emojiInput');

    if (emojiDisplay) {
        emojiDisplay.textContent = currentEmoji;
    }
    if (emojiInput) {
        emojiInput.value = currentEmoji;
    }
    // ------------------------------------------

    // --- Existing Logic for Editor UI ---
    editingPromptletName = promptlet ? promptlet.name : null;

    // Set other promptlet fields
    document.getElementById('nameInput').value = promptlet ? promptlet.name : '';
    document.getElementById('promptInput').value = promptlet ? promptlet.prompt : '';

    // Set advanced settings (assuming these exist and have default fallbacks)
    const model = promptlet ? promptlet.model : 'gpt-5-mini';
    const maxTokens = promptlet ? promptlet.maxTokens : 1500;
    const temperature = promptlet ? promptlet.temperature : 1.0;

    document.getElementById('modelInput').value = model;
    document.getElementById('tokensInput').value = maxTokens;
    document.getElementById('tokensValue').textContent = maxTokens;
    document.getElementById('tempInput').value = temperature;
    document.getElementById('tempValue').textContent = temperature;
    
    // If we're creating a new one, ensure the advanced panel is collapsed
    const advancedContent = document.getElementById('advancedContent');
    if (advancedContent && !promptlet) {
        advancedContent.classList.add('hidden');
    }
    
    // 🔥 CRITICAL FIX: Get the element and check for null before showing it
    const editorPanel = document.getElementById('editorPanel');

    if (!editorPanel) {
        // This is primarily for console clarity, but the script will likely crash below if this is null.
        console.error("CRITICAL ERROR: Editor Panel (#editorPanel) not found.");
        return; 
    }

    // Final Action: Show the Panel
    editorPanel.classList.remove('hidden');
    editorPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

// -------------------------
// Emoji picker functions
// -------------------------

function renderCategoryButtons() {
    const groupsContainer = document.getElementById('emojiGroups');

    // 🔥 CRITICAL FIX: If the element isn't found, stop here to prevent the crash.
    if (!groupsContainer) {
        console.error("Error: Could not find element with ID 'emojiGroups'. Please check manage.html.");
        return; 
    }

    groupsContainer.innerHTML = ''; 

    for (const category in EMOJI_CATEGORIES) {
        const button = document.createElement('button');
        button.className = 'emoji-group-button';
        button.textContent = EMOJI_CATEGORIES[category];
        button.title = category;
        button.setAttribute('data-category', category);

        button.addEventListener('click', () => {
            // Highlight the active button
            document.querySelectorAll('.emoji-group-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter and render the emojis for this category
            const filtered = EMOJI_DATA.filter(p => p.category === category);
            renderEmojis(filtered);
        });
        groupsContainer.appendChild(button);
    }
}

function renderEmojis(data, initialCategory = null) {
    const grid = document.getElementById('emojiGrid');
    grid.innerHTML = '';
    
    // If an initial category is provided, filter the data
    if (initialCategory) {
        data = data.filter(p => p.category === initialCategory);
        // Highlight the initial category button
        document.querySelectorAll('.emoji-group-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-category') === initialCategory) {
                btn.classList.add('active');
            }
        });
    }

    data.forEach(item => {
        const span = document.createElement('span');
        span.className = 'emoji-item';
        span.textContent = item.emoji;
        span.title = item.keywords.join(', ');

        span.addEventListener('click', () => {
            // Set the value in the display and the hidden input
            document.getElementById('emojiDisplay').textContent = item.emoji;
            document.getElementById('emojiInput').value = item.emoji;
            document.getElementById('emojiPicker').classList.add('hidden');
        });

        grid.appendChild(span);
    });
}