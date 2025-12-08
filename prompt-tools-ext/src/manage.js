// =========================================================================
// PromptIt Manage Page
// Handles promptlet CRUD operations with improved drag & drop
// =========================================================================

let allPromptlets = [];
let editingPromptletName = null;
const model = "gpt-4o";
let dragState = null;

function savePromptletBuckets(defaults, customs, callback = null) {
    const combined = [...defaults, ...customs];
    chrome.storage.local.set({
        defaultPromptlets: defaults,
        customPromptlets: customs,
        promptlets: combined
    }, () => {
        if (typeof callback === 'function') {
            callback();
        }
    });
}

function formatModelLabel(promptlet) {
    const modelValue = promptlet.model || model;
    return modelValue ? modelValue.toUpperCase() : '';
}

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

    const resetBtn = document.getElementById('resetDefaultsBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetDefaults);
    }
}

// -------------------------
// Load promptlets
// -------------------------
function loadPromptlets() {
    chrome.storage.local.get({ defaultPromptlets: [], customPromptlets: [], promptlets: [] }, (data) => {
        const { allPromptlets: combined, defaults, customs } = combineStoredPromptlets(data, { fillCreatedAt: true });

        allPromptlets = combined.map(p => ({
            ...p,
            isActive: p.isActive === undefined ? true : p.isActive,
            createdAt: p.createdAt || 0
        }));

        savePromptletBuckets(defaults, customs, renderPromptlets);
    });
}

// -------------------------
// Render promptlets
// -------------------------
function renderPromptlets() {
    const defaultList = document.getElementById('defaultPromptlets');
    const userList = document.getElementById('userPromptlets');
    const emptyState = document.getElementById('emptyState');

    defaultList.innerHTML = '';
    userList.innerHTML = '';

    let defaults = allPromptlets.filter(p => p.isDefault);
    let customs = allPromptlets.filter(p => !p.isDefault);

    defaults.sort((a, b) => (a.defaultIndex ?? 0) - (b.defaultIndex ?? 0));
    customs.sort((a, b) => (a.customIndex ?? 0) - (b.customIndex ?? 0));

    if (emptyState) {
        emptyState.classList.toggle('hidden', customs.length > 0);
    }

    defaults.forEach(p => {
        defaultList.appendChild(createPromptletElement(p));
    });

    customs.forEach(p => {
        userList.appendChild(createPromptletElement(p));
    });

    setupSortableLists();
}

// -------------------------
// Create promptlet element (Card) - IMPROVED
// -------------------------
function createPromptletElement(promptlet) {
    const item = document.createElement('div');
    const isActive = promptlet.isActive !== false;
    const modelLabel = formatModelLabel(promptlet);

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
          ${modelLabel ? `<span class="promptlet-badge">${modelLabel}</span>` : ''}
          ${promptlet.isDefault
            ? '<span class="promptlet-badge">DEFAULT</span>'
            : `<button class="btn btn-small btn-secondary edit-btn">Edit</button>`
        }
          <button class="btn btn-small btn-danger delete-btn">Delete</button>
          <button class="btn btn-small btn-secondary clone-btn">Clone</button>
        </div>
        <div class="drag-handle" draggable="true" title="Drag to reorder" aria-label="Drag to reorder">
          <span class="drag-grip" aria-hidden="true"></span>
        </div>
      </div>
    
    ${promptlet.isDefault
            ? ''
            : `<div class="promptlet-prompt">${promptlet.prompt}</div>`
        }
   `;

    const bucket = promptlet.isDefault ? 'default' : 'custom';
    item.dataset.bucket = bucket;

    // IMPROVED: Drag handle with smooth visual feedback
    const dragHandle = item.querySelector('.drag-handle');

    dragHandle.addEventListener('dragstart', (event) => {
        dragState = { name: promptlet.name, bucket };

        // Add dragging class with slight delay for smoother animation
        requestAnimationFrame(() => {
            item.classList.add('dragging');
        });

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', promptlet.name);

        // OPTIONAL: Create custom drag image for cleaner look
        const dragImage = item.cloneNode(true);
        dragImage.style.opacity = '0.8';
        dragImage.style.transform = 'rotate(2deg)';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(dragImage, event.offsetX, event.offsetY);

        setTimeout(() => {
            if (dragImage.parentNode) {
                document.body.removeChild(dragImage);
            }
        }, 0);
    });

    dragHandle.addEventListener('dragend', () => {
        dragState = null;
        item.classList.remove('dragging');
        clearDragOverStates();
    });

    // Hover feedback on drag handle
    dragHandle.addEventListener('mouseenter', () => {
        if (!item.classList.contains('dragging')) {
            dragHandle.style.transform = 'translateY(-2px) scale(1.05)';
        }
    });

    dragHandle.addEventListener('mouseleave', () => {
        dragHandle.style.transform = '';
    });

    // Toggle Switch
    const toggleInput = item.querySelector('.toggle-input');
    toggleInput.addEventListener('change', () => togglePromptletActive(promptlet.name));

    // Clone Button
    const cloneBtn = item.querySelector('.clone-btn');
    cloneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clonePromptlet(promptlet);
    });

    // Edit/Delete
    if (!promptlet.isDefault) {
        item.querySelector('.edit-btn').addEventListener('click', () => editPromptlet(promptlet));
    }

    const deleteButton = item.querySelector('.delete-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => deletePromptlet(promptlet));
    }

    return item;
}

// -------------------------
// Setup Sortable Lists
// -------------------------
function setupSortableLists() {
    const defaultList = document.getElementById('defaultPromptlets');
    const userList = document.getElementById('userPromptlets');

    if (defaultList) {
        createBucketSortable(defaultList, 'default');
    }

    if (userList) {
        createBucketSortable(userList, 'custom');
    }
}

// -------------------------
// IMPROVED: Create Sortable Bucket
// -------------------------
function createBucketSortable(listElement, bucket) {
    if (listElement.dataset.sortableInitialized === 'true') {
        listElement.dataset.bucket = bucket;
        return;
    }

    listElement.dataset.bucket = bucket;
    listElement.dataset.sortableInitialized = 'true';

    const dropIndicator = listElement.querySelector('.drop-indicator') || document.createElement('div');
    dropIndicator.className = 'drop-indicator hidden';
    if (!dropIndicator.parentElement) {
        listElement.appendChild(dropIndicator);
    }

    let originalCardHeight = 0;

    // IMPROVED: Dragover with smooth placeholder
    listElement.addEventListener('dragover', (event) => {
        if (!dragState || dragState.bucket !== bucket) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        const draggingCard = document.querySelector('.promptlet-card.dragging');
        if (!draggingCard) return;

        // Set placeholder height to match dragged card
        if (originalCardHeight === 0) {
            originalCardHeight = draggingCard.offsetHeight;
        }
        dropIndicator.style.height = `${originalCardHeight}px`;
        dropIndicator.classList.remove('hidden');
        dropIndicator.classList.add('active');

        const afterElement = getDragAfterElement(listElement, event.clientY);

        // Smooth insertion
        requestAnimationFrame(() => {
            if (afterElement == null) {
                listElement.appendChild(dropIndicator);
            } else {
                listElement.insertBefore(dropIndicator, afterElement);
            }
        });

        listElement.classList.add('drag-over');
    });

    listElement.addEventListener('dragenter', (event) => {
        if (!dragState || dragState.bucket !== bucket) return;
        event.preventDefault();
    });

    // IMPROVED: Only remove drag-over if actually leaving
    listElement.addEventListener('dragleave', (event) => {
        const rect = listElement.getBoundingClientRect();
        if (
            event.clientX < rect.left ||
            event.clientX >= rect.right ||
            event.clientY < rect.top ||
            event.clientY >= rect.bottom
        ) {
            listElement.classList.remove('drag-over');
            dropIndicator.classList.add('hidden');
            dropIndicator.classList.remove('active');
            dropIndicator.style.height = '';
        }
    });

    // IMPROVED: Drop with smooth animation and flash
    listElement.addEventListener('drop', (event) => {
        if (!dragState || dragState.bucket !== bucket) return;
        event.preventDefault();

        listElement.classList.remove('drag-over');
        const draggingCard = document.querySelector('.promptlet-card.dragging');

        if (draggingCard) {
            listElement.insertBefore(draggingCard, dropIndicator);

            // Add flash effect with slight delay
            setTimeout(() => {
                draggingCard.classList.add('sorted-flash');
            }, 50);

            setTimeout(() => {
                draggingCard.classList.remove('sorted-flash');
            }, 1250);
        }

        // Reset indicator
        dropIndicator.classList.add('hidden');
        dropIndicator.classList.remove('active');
        dropIndicator.style.height = '';
        originalCardHeight = 0;

        const orderedNames = Array.from(listElement.querySelectorAll('.promptlet-card'))
            .map(card => card.dataset.name);

        updatePromptletOrder(orderedNames, bucket);
        saveAllPromptlets();
    });

    // Cleanup on dragend
    listElement.addEventListener('dragend', () => {
        clearDragOverStates();
        originalCardHeight = 0;
    });
}

// -------------------------
// IMPROVED: Clear drag states thoroughly
// -------------------------
function clearDragOverStates() {
    document.querySelectorAll('.promptlet-list').forEach((list) => {
        list.classList.remove('drag-over');
    });

    document.querySelectorAll('.drop-indicator').forEach((indicator) => {
        indicator.classList.add('hidden');
        indicator.classList.remove('active');
        indicator.style.height = '';
    });

    document.querySelectorAll('.promptlet-card').forEach((card) => {
        card.classList.remove('dragging');
    });
}

// -------------------------
// Get element after drag position
// -------------------------
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.promptlet-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

// -------------------------
// Update promptlet order
// -------------------------
function updatePromptletOrder(names, bucket) {
    const isDefaultBucket = bucket === 'default';

    const bucketPromptlets = allPromptlets.filter(p => p.isDefault === isDefaultBucket);
    const otherPromptlets = allPromptlets.filter(p => p.isDefault !== isDefaultBucket);

    const orderedPromptlets = names.map((name, index) => {
        const promptlet = bucketPromptlets.find(p => p.name === name);
        if (!promptlet) return null;

        if (promptlet.isDefault) {
            promptlet.defaultIndex = index;
        } else {
            promptlet.customIndex = index;
        }
        return promptlet;
    }).filter(Boolean);

    bucketPromptlets
        .filter(p => !names.includes(p.name))
        .forEach((promptlet) => {
            const index = orderedPromptlets.length;
            if (promptlet.isDefault) {
                promptlet.defaultIndex = index;
            } else {
                promptlet.customIndex = index;
            }
            orderedPromptlets.push(promptlet);
        });

    allPromptlets = isDefaultBucket
        ? [...orderedPromptlets, ...otherPromptlets]
        : [...otherPromptlets, ...orderedPromptlets];
}

// -------------------------
// Toggle Active State
// -------------------------
function togglePromptletActive(name) {
    const index = allPromptlets.findIndex(p => p.name === name);
    if (index > -1) {
        allPromptlets[index].isActive = !allPromptlets[index].isActive;
        saveAllPromptlets();
    }
}

function getNextCustomIndex() {
    const customs = allPromptlets.filter(p => !p.isDefault);
    if (!customs.length) return 0;
    const maxIndex = Math.max(...customs.map(p => p.customIndex ?? 0));
    return maxIndex + 1;
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

    const existingPromptlet = editingPromptletName
        ? allPromptlets.find(p => p.name === editingPromptletName)
        : null;

    const customIndex = existingPromptlet && !existingPromptlet.isDefault
        ? existingPromptlet.customIndex ?? getNextCustomIndex()
        : getNextCustomIndex();

    const newPromptletData = {
        name: name,
        emoji: document.getElementById('emojiInput').value.trim() || '📝',
        prompt: prompt,
        model: document.getElementById('modelInput').value,
        temperature: parseFloat(document.getElementById('tempInput').value),
        maxTokens: parseInt(document.getElementById('tokensInput').value),
        outputStructure: ["main"],
        isActive: true,
        isDefault: false,
        customIndex,
        lastModified: Date.now()
    };

    if (editingPromptletName) {
        const index = allPromptlets.findIndex(p => p.name === editingPromptletName);
        if (index > -1) {
            allPromptlets[index] = { ...allPromptlets[index], ...newPromptletData };
        }
    } else {
        newPromptletData.createdAt = Date.now();
        allPromptlets.push(newPromptletData);
    }

    saveAllPromptlets();
    hideEditor();
}

// -------------------------
// Save All to Storage
// -------------------------
function saveAllPromptlets(callback = null) {
    const defaults = allPromptlets.filter(p => p.isDefault).map((p, index) => ({
        ...p,
        isDefault: true,
        defaultIndex: p.defaultIndex ?? index
    }));

    const customs = allPromptlets.filter(p => !p.isDefault).map((p) => ({
        ...p,
        isDefault: false,
        customIndex: p.customIndex ?? 0
    }));

    savePromptletBuckets(defaults, customs, () => {
        renderPromptlets();
        if (typeof callback === 'function') {
            callback();
        }
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
        isActive: true,
        createdAt: Date.now(),
        customIndex: getNextCustomIndex()
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
function deletePromptlet(promptlet) {
    const warningMessage = promptlet.isDefault
        ? `⚠️ "${promptlet.name}" is a default promptlet. Deleting it will remove it from your defaults. Continue?`
        : `Delete "${promptlet.name}"?`;

    if (!confirm(warningMessage)) return;

    allPromptlets = allPromptlets.filter(p => p.name !== promptlet.name);
    saveAllPromptlets(() => {
        if (promptlet.isDefault) {
            loadPromptlets();
        }
    });
}

// -------------------------
// Reset Defaults
// -------------------------
function handleResetDefaults() {
    if (!confirm("Reload default promptlets? Your custom promptlets will be kept.")) {
        return;
    }
    chrome.runtime.sendMessage({ action: 'resetToDefaults' }, (response) => {
        if (response && response.success) {
            alert("Reset successful.");
            loadPromptlets();
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
    const tokensInput = document.getElementById('tokensInput');
    const tokensValue = document.getElementById('tokensValue');

    const currentTokens = (promptlet && promptlet.maxTokens !== undefined)
        ? promptlet.maxTokens
        : 1500;

    tokensInput.value = currentTokens;
    tokensValue.textContent = currentTokens;
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