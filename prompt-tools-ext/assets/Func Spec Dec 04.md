# PromptIt Browser Extension — Functional Specification (2025-12-04)

## Executive Summary
PromptIt is a Chrome/Chromium extension that lets users run reusable "promptlets"—parameterized prompts—against any selected text on a page. A context-menu entry launches a side panel where the selected text is processed by the chosen promptlet through the OpenAI Chat Completions API using the user’s stored API key. Users can manage built-in and custom promptlets via a dedicated management page, toggle their availability in the context menu, and chain multiple promptlets on generated output from within the side panel.
Add a comment

Cancel

Comment

## Product Goals
- Provide a fast, low-friction way to run AI promptlets on highlighted webpage content.
- Keep users in control of models, temperature, and token limits per promptlet.
- Make promptlets discoverable through right-click menus and easy to manage through a dedicated options page.
- Support iterative workflows by allowing users to chain promptlets on previous results inside the side panel.

## Key User Roles
- **End users:** run promptlets from the context menu, view results in the side panel, and copy or chain outputs.
- **Prompt authors:** create, edit, clone, activate/deactivate, and delete promptlets; set model/temperature/token defaults.

## Feature Specifications

### 1) Installation & Initialization
- On install/startup, the background service worker registers the side panel path and builds context menus based on stored promptlets, seeding defaults on first run.【F:prompt-tools-ext/src/background.js†L38-L101】
- Default promptlets (e.g., Summarise, Rephrase, Verify, Max Reasoning) are flagged as system defaults, start active, and are stored with ordering metadata for sorting.【F:prompt-tools-ext/src/defaultPromptlets.js†L6-L133】【F:prompt-tools-ext/src/background.js†L23-L204】

### 2) Context Menu Integration
- A root "Prompt It!" context menu appears when text is selected; active promptlets become submenu items labeled with their emoji and name.【F:prompt-tools-ext/src/background.js†L202-L235】
- Menu ordering groups defaults before custom promptlets, preserving predefined ordering for defaults and creation time for customs.【F:prompt-tools-ext/src/background.js†L184-L200】
- A submenu item opens the manage page for promptlet administration.【F:prompt-tools-ext/src/background.js†L237-L240】

### 3) Promptlet Management (Options Page)
- The manage page lists defaults (locked) and user promptlets separately, reflecting active/inactive state with toggles and a card UI.【F:prompt-tools-ext/src/manage.html†L16-L70】【F:prompt-tools-ext/src/manage.js†L63-L171】
- Users can add, edit, clone, and delete custom promptlets; new or edited promptlets default to active and record timestamps for ordering.【F:prompt-tools-ext/src/manage.js†L187-L270】
- Advanced settings expose model selection, temperature slider, and max token slider with live value previews.【F:prompt-tools-ext/src/manage.html†L41-L68】【F:prompt-tools-ext/src/manage.js†L292-L359】
- API key storage is provided locally via the manage page; a reset button restores the default promptlet set through the background script.【F:prompt-tools-ext/src/manage.html†L71-L92】【F:prompt-tools-ext/src/manage.js†L398-L417】【F:prompt-tools-ext/src/manage.js†L272-L288】

### 4) Prompt Execution Flow
- Selecting a promptlet from the context menu triggers the background worker to open the side panel, persist the selection/promptlet, and notify the panel to execute.【F:prompt-tools-ext/src/background.js†L206-L370】
- The side panel assembles the prompt (promptlet prompt + selected text) and asks the background worker to call the OpenAI Chat Completions API with the promptlet’s model/temperature/token settings.【F:prompt-tools-ext/src/sidepanel.js†L85-L170】【F:prompt-tools-ext/src/background.js†L103-L135】
- If the side panel opened independently (e.g., from within itself), it retrieves pending promptlet data from storage as a fallback to ensure the request runs.【F:prompt-tools-ext/src/sidepanel.js†L10-L48】

### 5) Output Display & Controls (Side Panel)
- Results render in a styled side panel with status updates and basic structured-output parsing that splits content into sections (e.g., Main Output, Notes).【F:prompt-tools-ext/src/sidepanel.html†L13-L105】【F:prompt-tools-ext/src/sidepanel.js†L182-L217】
- Users can copy results to the clipboard via an inline button and close the panel with a dedicated control.【F:prompt-tools-ext/src/sidepanel.js†L248-L362】
- If execution fails (e.g., missing API key), the panel surfaces inline error messaging with a link to open the manage page for key entry.【F:prompt-tools-ext/src/sidepanel.js†L153-L179】

### 6) Prompt Chaining
- After viewing output, users can open a dropdown of all promptlets and run another promptlet on either selected output text or the full result, enabling manual chaining workflows from the side panel.【F:prompt-tools-ext/src/sidepanel.js†L248-L380】

### 7) Data Persistence & Synchronization
- Promptlets and the API key are stored in `chrome.storage.local`; changes trigger context-menu rebuilds to keep the right-click UI in sync.【F:prompt-tools-ext/src/manage.js†L46-L239】【F:prompt-tools-ext/src/background.js†L136-L215】【F:prompt-tools-ext/src/background.js†L401-L410】
- Pending promptlet data is cached both in-memory and in storage to bridge side panel activation timing and ensure execution continuity.【F:prompt-tools-ext/src/background.js†L17-L369】【F:prompt-tools-ext/src/sidepanel.js†L10-L48】

### 8) Security & Error Handling
- API calls require a user-supplied API key; missing or failing calls propagate explicit error messages to the side panel.【F:prompt-tools-ext/src/sidepanel.js†L153-L179】【F:prompt-tools-ext/src/background.js†L103-L135】
- Unhandled promise rejections in the background worker are logged to aid debugging.【F:prompt-tools-ext/src/background.js†L419-L421】

## Non-Functional Notes
- **Platform:** Chrome/Chromium Manifest V3 extension with service worker background, side panel, and options/popup UIs.【F:prompt-tools-ext/manifest.json†L1-L19】
- **Host permissions:** Declares `<all_urls>` to enable context-menu execution on any page.【F:prompt-tools-ext/manifest.json†L6-L7】
- **UI Responsiveness:** Side panel layout supports both light/dark modes via CSS media queries.【F:prompt-tools-ext/src/sidepanel.html†L1-L105】