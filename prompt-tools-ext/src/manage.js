// =========================================================================
// PromptIt Manage Page
// Handles promptlet CRUD operations with improved drag & drop
// =========================================================================

let allPromptlets = [];
let editingPromptletName = null;
const model = "gpt-4o";
let dragState = null;
const EXPORT_VERSION = "1.0";
const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5MB safeguard
let importPreviewData = null;

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

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', openExportModal);
    }

    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', openImportModal);
    }

    initializeExportControls();
    initializeImportControls();

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeExportModal();
            closeImportModal();
        }
    });
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

function getCustomPromptlets() {
    return allPromptlets
        .filter(p => !p.isDefault)
        .sort((a, b) => a.name.localeCompare(b.name));
}

function getDefaultPromptlets() {
    return allPromptlets
        .filter(p => p.isDefault)
        .sort((a, b) => a.name.localeCompare(b.name));
}

function generateUniqueName(baseName, existingNames) {
    let candidate = baseName;
    let suffix = 0;
    while (existingNames.has(candidate)) {
        suffix += 1;
        candidate = `${baseName}${' (Copy)'.repeat(suffix)}`;
    }
    existingNames.add(candidate);
    return candidate;
}

// -------------------------
// Export controls
// -------------------------
function initializeExportControls() {
    const scopeRadios = document.querySelectorAll('input[name="exportScope"]');
    scopeRadios.forEach((radio) => radio.addEventListener('change', handleExportScopeChange));

    const selectAllBtn = document.getElementById('selectAllPromptlets');
    const deselectAllBtn = document.getElementById('deselectAllPromptlets');
    selectAllBtn?.addEventListener('click', () => toggleSelectAllPromptlets(true));
    deselectAllBtn?.addEventListener('click', () => toggleSelectAllPromptlets(false));

    document.getElementById('cancelExportBtn')?.addEventListener('click', closeExportModal);
    document.getElementById('closeExportModal')?.addEventListener('click', closeExportModal);
    document.getElementById('confirmExportBtn')?.addEventListener('click', performExport);
}

function openExportModal() {
    const customPromptlets = getCustomPromptlets();
    if (!customPromptlets.length) {
        alert('No custom promptlets to export.');
        return;
    }

    const modal = document.getElementById('exportModal');
    if (!modal) return;

    document.getElementById('exportFilename').value = 'my-promptlets.pi';
    document.getElementById('exportSelectionPanel').classList.add('hidden');
    document.getElementById('exportSelectionHint').classList.add('hidden');
    document.getElementById('confirmExportBtn').disabled = false;

    const scopeRadios = document.querySelectorAll('input[name="exportScope"]');
    scopeRadios.forEach((radio) => {
        radio.checked = radio.value === 'all';
    });

    buildExportPromptletList();
    updateExportButtonState();
    modal.classList.remove('hidden');
}

function closeExportModal() {
    document.getElementById('exportModal')?.classList.add('hidden');
}

function handleExportScopeChange(event) {
    const panel = document.getElementById('exportSelectionPanel');
    if (!panel) return;
    const isSelectedMode = event.target.value === 'selected';
    panel.classList.toggle('hidden', !isSelectedMode);
    updateExportButtonState();
}

function toggleSelectAllPromptlets(selectAll) {
    document.querySelectorAll('.export-checkbox').forEach((checkbox) => {
        if (!checkbox.disabled) {
            checkbox.checked = selectAll;
        }
    });
    updateExportButtonState();
}

function buildExportPromptletList() {
    const listContainer = document.getElementById('exportPromptletList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const customs = getCustomPromptlets();

    customs.forEach((promptlet) => {
        const item = document.createElement('label');
        item.className = 'selection-item';
        item.innerHTML = `
            <input type="checkbox" class="export-checkbox" value="${promptlet.name}" checked>
            <span class="name">${promptlet.emoji || '📝'} ${promptlet.name}</span>
        `;
        listContainer.appendChild(item);
    });

    listContainer.querySelectorAll('.export-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', updateExportButtonState);
    });
}

function updateExportButtonState() {
    const scope = document.querySelector('input[name="exportScope"]:checked')?.value || 'all';
    const hint = document.getElementById('exportSelectionHint');
    const confirmBtn = document.getElementById('confirmExportBtn');
    const customPromptlets = getCustomPromptlets();

    if (scope === 'all') {
        const hasCustoms = customPromptlets.length > 0;
        confirmBtn.disabled = !hasCustoms;
        hint.classList.toggle('hidden', hasCustoms);
        if (!hasCustoms) {
            hint.textContent = 'No custom promptlets to export.';
        }
        return;
    }

    const selectedCount = Array.from(document.querySelectorAll('.export-checkbox:checked')).length;
    const isValid = selectedCount > 0;
    confirmBtn.disabled = !isValid;
    hint.textContent = 'Select at least one promptlet to export.';
    hint.classList.toggle('hidden', isValid);
}

function performExport() {
    const scope = document.querySelector('input[name="exportScope"]:checked')?.value || 'all';
    const filenameInput = document.getElementById('exportFilename');
    const rawFilename = (filenameInput?.value || 'my-promptlets.pi').trim();
    const filename = rawFilename.toLowerCase().endsWith('.pi') ? rawFilename : `${rawFilename}.pi`;

    const customPromptlets = getCustomPromptlets();
    if (!customPromptlets.length) {
        alert('No custom promptlets to export.');
        closeExportModal();
        return;
    }

    let selectedNames = null;
    if (scope === 'selected') {
        selectedNames = Array.from(document.querySelectorAll('.export-checkbox:checked')).map((input) => input.value);
        if (!selectedNames.length) {
            updateExportButtonState();
            return;
        }
    }

    const promptletsToExport = selectedNames
        ? customPromptlets.filter((p) => selectedNames.includes(p.name))
        : customPromptlets;

    if (!promptletsToExport.length) {
        alert('No promptlets matched your selection.');
        return;
    }

    const exportPayload = {
        version: EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        promptlets: promptletsToExport.map((promptlet) => ({
            name: promptlet.name,
            emoji: promptlet.emoji || '📝',
            prompt: promptlet.prompt || '',
            active: promptlet.isActive !== false,
            model: promptlet.model || model,
            temperature: Number.isFinite(promptlet.temperature) ? promptlet.temperature : 1,
            maxTokens: Number.isFinite(promptlet.maxTokens) ? promptlet.maxTokens : 1500,
            outputStructure: promptlet.outputStructure || ['main']
        })),
    };

    try {
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        closeExportModal();
        alert('Promptlets exported successfully.');
    } catch (err) {
        alert(`Export failed: ${err.message}`);
    }
}

// -------------------------
// Import controls
// -------------------------
function initializeImportControls() {
    document.getElementById('importFileInput')?.addEventListener('change', handleImportFileChange);
    document.getElementById('cancelImportBtn')?.addEventListener('click', closeImportModal);
    document.getElementById('closeImportModal')?.addEventListener('click', closeImportModal);
    document.getElementById('confirmImportBtn')?.addEventListener('click', performImport);
    document.getElementById('selectAllImports')?.addEventListener('click', () => toggleImportSelections(true));
    document.getElementById('deselectAllImports')?.addEventListener('click', () => toggleImportSelections(false));
}

function openImportModal() {
    importPreviewData = null;
    const modal = document.getElementById('importModal');
    if (!modal) return;

    const errorBox = document.getElementById('importError');
    if (errorBox) {
        errorBox.classList.add('hidden');
        errorBox.textContent = '';
    }
    const fileHelpText = document.getElementById('importFileHelp');
    if (fileHelpText) {
        fileHelpText.classList.remove('hidden');
    }
    document.getElementById('importPreviewSection').classList.add('hidden');
    document.getElementById('importPreviewList').innerHTML = '';
    document.getElementById('importSummary').textContent = '';
    document.getElementById('importSelectionHint')?.classList.add('hidden');
    document.getElementById('confirmImportBtn').disabled = true;
    const fileNameLabel = document.getElementById('importFileName');
    if (fileNameLabel) {
        fileNameLabel.textContent = '';
        fileNameLabel.classList.add('hidden');
    }

    const fileInput = document.getElementById('importFileInput');
    if (fileInput) {
        fileInput.value = '';
    }

    modal.classList.remove('hidden');
}

function closeImportModal() {
    importPreviewData = null;
    document.getElementById('importModal')?.classList.add('hidden');
}

function handleImportFileChange(event) {
    const file = event.target.files?.[0];
    const confirmBtn = document.getElementById('confirmImportBtn');
    const previewSection = document.getElementById('importPreviewSection');
    const fileNameLabel = document.getElementById('importFileName');
    const fileHelpText = document.getElementById('importFileHelp');
    const selectionHint = document.getElementById('importSelectionHint');

    if (confirmBtn) {
        confirmBtn.disabled = true;
    }

    document.getElementById('importPreviewList').innerHTML = '';
    document.getElementById('importSummary').textContent = '';
    previewSection?.classList.add('hidden');
    selectionHint?.classList.add('hidden');

    if (fileNameLabel) {
        if (file) {
            fileNameLabel.textContent = `Selected file: ${file.name}`;
            fileNameLabel.classList.remove('hidden');
            fileHelpText?.classList.add('hidden');
        } else {
            fileNameLabel.textContent = '';
            fileNameLabel.classList.add('hidden');
            fileHelpText?.classList.remove('hidden');
        }
    }

    const errorBox = document.getElementById('importError');
    if (errorBox) {
        errorBox.classList.add('hidden');
        errorBox.textContent = '';
    }

    if (!file) {
        return;
    }
    if (file.size > MAX_IMPORT_SIZE) {
        displayImportError('This file is too large. Please use a file under 5MB.');
        return;
    }

    readImportFile(file)
        .then((content) => validateImportPayload(content))
        .then((preview) => {
            const safePreview = {
                ...preview,
                conflicts: Array.isArray(preview.conflicts) ? preview.conflicts : [],
            };

            const selectablePreview = {
                ...safePreview,
                promptlets: safePreview.promptlets.map((promptlet) => ({ ...promptlet, selected: true })),
            };
            importPreviewData = selectablePreview;
            renderImportPreview(selectablePreview);
        })
        .catch((err) => {
            displayImportError(err.message);
            importPreviewData = null;
        });
}

function readImportFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the selected file.'));
        reader.readAsText(file);
    });
}

function validateImportPayload(rawContent) {
    let data;
    try {
        data = JSON.parse(rawContent);
    } catch (err) {
        throw new Error('Invalid JSON format.');
    }

    if (!data || typeof data !== 'object') {
        throw new Error('This file is not a valid Prompt It export.');
    }

    if (!data.version) {
        throw new Error('The file is missing the export version.');
    }

    if (!Array.isArray(data.promptlets)) {
        throw new Error('The file is missing the promptlets array.');
    }

    if (!data.promptlets.length) {
        throw new Error('This file contains no promptlets.');
    }

    const parsedIncoming = parseFloat(data.version);
    const parsedCurrent = parseFloat(EXPORT_VERSION);
    const newerVersion = Number.isFinite(parsedIncoming)
        && Number.isFinite(parsedCurrent)
        && parsedIncoming > parsedCurrent;
    const existingNames = new Set(allPromptlets.map((p) => p.name));
    const workingNames = new Set(existingNames);
    const promptlets = [];
    const conflicts = [];

    data.promptlets.forEach((item) => {
        if (!item || typeof item !== 'object') {
            throw new Error('Invalid promptlet entry encountered.');
        }

        const requiredFields = ['name', 'emoji', 'model', 'temperature', 'maxTokens'];
        const missing = requiredFields.filter((field) => item[field] === undefined || item[field] === null);
        if (missing.length) {
            throw new Error(`The file is missing required fields: ${missing.join(', ')}`);
        }

        const activeValue = item.active !== undefined ? item.active : item.isActive;
        if (typeof activeValue !== 'boolean') {
            throw new Error('Each promptlet must include a boolean "active" field.');
        }

        if (typeof item.name !== 'string' || !item.name.trim()) {
            throw new Error('Promptlet name must be a non-empty string.');
        }

        if (typeof item.emoji !== 'string' || !item.emoji.trim()) {
            throw new Error('Promptlet emoji must be provided.');
        }

        const promptText = typeof item.prompt === 'string' ? item.prompt : '';
        if (item.prompt !== undefined && item.prompt !== null && typeof item.prompt !== 'string') {
            throw new Error('Promptlet prompt text must be a string when provided.');
        }

        if (promptText.length > 7000) {
            throw new Error('Prompt text exceeds the 7000 character limit.');
        }

        if (typeof item.model !== 'string' || !item.model.trim()) {
            throw new Error('Promptlet model must be provided.');
        }

        const temperature = Number(item.temperature);
        if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
            throw new Error('Temperature must be a number between 0 and 2.');
        }

        const maxTokens = Number(item.maxTokens);
        if (!Number.isFinite(maxTokens) || maxTokens < 100 || maxTokens > 16000) {
            throw new Error('Max tokens must be between 100 and 16000.');
        }

        if (item.isDefault) {
            return; // Skip any default promptlets bundled in the file
        }

        const trimmedName = item.name.trim();
        const finalName = generateUniqueName(trimmedName, workingNames);
        if (finalName !== trimmedName) {
            conflicts.push({ originalName: trimmedName, newName: finalName });
        }

        promptlets.push({
            name: finalName,
            emoji: item.emoji.trim(),
            prompt: promptText.trim(),
            model: item.model.trim(),
            temperature,
            maxTokens,
            outputStructure: Array.isArray(item.outputStructure) ? item.outputStructure : ['main'],
            active: activeValue === true,
        });
    });

    if (!promptlets.length) {
        throw new Error('This file contains no importable promptlets.');
    }

    return {
        promptlets,
        conflicts,
        renamedCount: conflicts.length,
        totalCount: promptlets.length,
        newerVersion,
    };
}

function renderImportPreview(preview) {
    const previewList = document.getElementById('importPreviewList');
    const summary = document.getElementById('importSummary');
    const previewSection = document.getElementById('importPreviewSection');
    const confirmBtn = document.getElementById('confirmImportBtn');
    const hint = document.getElementById('importSelectionHint');

    if (!preview || !Array.isArray(preview.promptlets)) {
        displayImportError('Nothing to import. Please choose a valid .pi file.');
        return;
    }

    const conflicts = Array.isArray(preview.conflicts) ? preview.conflicts : [];

    previewList.innerHTML = '';

    const selectedPromptlets = preview.promptlets.filter((promptlet) => promptlet.selected !== false);

    preview.promptlets.forEach((promptlet) => {
        const conflict = conflicts.find((c) => c.newName === promptlet.name);
        const item = document.createElement('label');
        item.className = `selection-item ${conflict ? 'conflict' : ''}`;
        const displayName = conflict ? conflict.originalName : promptlet.name;
        const renameNote = conflict
            ? `<div class="rename-note" aria-label="Renamed promptlet">Will be renamed to: <span class="rename-target">${conflict.newName}</span></div>`
            : '<div class="rename-note placeholder"></div>';
        item.innerHTML = `
            <div class="selection-checkbox">
                <input type="checkbox" class="import-checkbox" value="${promptlet.name}" ${promptlet.selected !== false ? 'checked' : ''}>
            </div>
            <div class="selection-name">
                <span class="name">${promptlet.emoji || '📝'} ${displayName}</span>
            </div>
            ${renameNote}
        `;
        previewList.appendChild(item);
    });

    previewList.querySelectorAll('.import-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', (event) => {
            setImportPromptletSelected(event.target.value, event.target.checked);
        });
    });

    const selectedConflicts = conflicts.filter((conflict) => selectedPromptlets.some((p) => p.name === conflict.newName));
    const renameText = selectedConflicts.length
        ? `${selectedConflicts.length} will be renamed due to naming conflicts.`
        : 'No naming conflicts detected.';

    const versionWarning = preview.newerVersion
        ? ' This file was created by a newer export version. Importing will continue.'
        : '';

    summary.textContent = `Ready to import ${selectedPromptlets.length} of ${preview.totalCount} promptlet(s). ${renameText}${versionWarning}`;

    previewSection.classList.remove('hidden');
    const hasSelection = selectedPromptlets.length > 0;
    confirmBtn.disabled = !hasSelection;
    hint.classList.toggle('hidden', hasSelection);

    const errorBox = document.getElementById('importError');
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
}

function setImportPromptletSelected(name, isSelected) {
    if (!importPreviewData) return;

    importPreviewData = {
        ...importPreviewData,
        promptlets: importPreviewData.promptlets.map((promptlet) => (
            promptlet.name === name ? { ...promptlet, selected: isSelected } : promptlet
        )),
    };

    renderImportPreview(importPreviewData);
}

function toggleImportSelections(selectAll) {
    if (!importPreviewData) return;

    importPreviewData = {
        ...importPreviewData,
        promptlets: importPreviewData.promptlets.map((promptlet) => ({
            ...promptlet,
            selected: selectAll,
        })),
    };

    renderImportPreview(importPreviewData);
}

function displayImportError(message) {
    const errorBox = document.getElementById('importError');
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
    document.getElementById('importPreviewSection').classList.add('hidden');
    document.getElementById('confirmImportBtn').disabled = true;
    document.getElementById('importSelectionHint')?.classList.add('hidden');
}

function performImport() {
    if (!importPreviewData || !importPreviewData.promptlets) {
        return;
    }

    const selectedPromptlets = importPreviewData.promptlets.filter((promptlet) => promptlet.selected !== false);
    const conflicts = Array.isArray(importPreviewData.conflicts) ? importPreviewData.conflicts : [];
    if (!selectedPromptlets.length) {
        return;
    }

    const startIndex = getNextCustomIndex();
    const imported = selectedPromptlets.map((promptlet, index) => ({
        name: promptlet.name,
        emoji: promptlet.emoji || '📝',
        prompt: promptlet.prompt,
        model: promptlet.model || model,
        temperature: promptlet.temperature,
        maxTokens: promptlet.maxTokens,
        outputStructure: promptlet.outputStructure || ['main'],
        isActive: promptlet.active,
        isDefault: false,
        customIndex: startIndex + index,
        createdAt: Date.now(),
        lastModified: Date.now(),
    }));

    allPromptlets = [...allPromptlets, ...imported];

    saveAllPromptlets(() => {
        const renamedSelectedCount = conflicts
            .filter((conflict) => selectedPromptlets.some((p) => p.name === conflict.newName))
            .length;
        closeImportModal();
        const renameMessage = renamedSelectedCount
            ? ` ${renamedSelectedCount} were renamed due to naming conflicts.`
            : '';
        alert(`Successfully imported ${imported.length} promptlet(s).${renameMessage}`);
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

    // Ensure the indicator always belongs to this list even after re-renders
    // or DOM resets (e.g., when import/export refreshes the list contents).
    const ensureIndicatorAttached = () => {
        if (dropIndicator.parentElement !== listElement) {
            listElement.appendChild(dropIndicator);
        }
    };
    ensureIndicatorAttached();

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
            ensureIndicatorAttached();
            if (afterElement && afterElement.parentElement !== listElement) {
                listElement.appendChild(dropIndicator);
                return;
            }

            listElement.insertBefore(dropIndicator, afterElement || null);
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
            ensureIndicatorAttached();

            // If another render detached the indicator, fall back to appending
            // the card to the end of the list to avoid DOM insert errors.
            if (dropIndicator.parentElement !== listElement) {
                listElement.appendChild(draggingCard);
            } else {
                listElement.insertBefore(draggingCard, dropIndicator);
            }

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