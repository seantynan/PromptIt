# Prompt It! v0.4 🧠⚡

AI in your right-click. Run custom AI "Promptlets" on any selected text, instantly.

## Overview
Prompt It! is a Manifest V3 extension for Chrome/Brave/Edge/Opera that lets you run AI-powered workflows without leaving the page. Highlight text, pick a promptlet from the context menu, and view the response in a focused side panel. Manage your own promptlets, tune model settings, and import/export libraries so your AI toolbox stays portable.

## Highlights
- 🖱️ **Native context menu** – Adds a `Prompt It!` submenu to the right-click menu for one-click runs.
- 📑 **Side Panel UI** – Results open in a resizable, non-blocking side panel with copy + chain actions.
- 🔗 **Promptlet chaining** – Re-run additional promptlets on the generated output without leaving the panel.
- ⚙️ **Promptlet manager** – Add, edit, clone, delete, and toggle promptlets; reset built-ins at any time.
- 🎚️ **Advanced model controls** – Per-promptlet settings for model, temperature, and max tokens (OpenAI Responses API).
- 🔑 **Local API key storage** – Save your OpenAI API key in extension storage (never sent anywhere else).
- 📥 **Import/Export** – Share promptlet libraries via `.pi` JSON files; choose all or selected entries.
- 🌑 **Adaptive theming** – Dark-first UI with automatic light/dark support across popup, manager, and help pages.
- 🚀 **Preloaded defaults** – A starter pack of versatile promptlets for writing, fact-checking, learning, and puzzles.

## Installation (Developer Mode)
1. Clone or download this repository.
2. Open your Chromium-based browser and visit `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `prompt-tools-ext` folder.
5. Pin the **Prompt It! (P)** action icon for quick access.

## Usage
### Run a promptlet
1. Highlight text on any webpage.
2. Right-click → **Prompt It!** → choose a promptlet (e.g., 💡 Summarise).
3. The side panel opens with live status, usage badge, and output.

### Chain or copy results
- Use **Copy** to grab the response.
- Use **Chain** to run another promptlet on either your selection or the generated output.

### Manage promptlets
1. Click the **Prompt It! (P)** toolbar icon → **⚙️ Manage Promptlets** (or open the options page).
2. Create/edit promptlets with emoji, name, prompt text, and advanced settings (model, temperature, max tokens).
3. Toggle visibility to control what appears in the context menu; clone defaults to customize safely.
4. Import/export `.pi` files to back up or share promptlets; reset built-ins if you want a clean slate.
5. Save your **OpenAI API key** (stored locally only) to enable API calls.

## Default Promptlets (v0.4)
| Emoji | Name | Purpose | Default model |
| --- | --- | --- | --- |
| 💡 | Summarise | Concise summaries with key details. | gpt-5-mini |
| ✏️ | Rephrase | Improve clarity and flow while preserving meaning. | gpt-5-mini |
| ✅ | Verify | Evidence-driven fact check with confidence scoring. | gpt-5-mini |
| 👑 | Max Reasoning | Deep, step-by-step reasoning for complex problems. | gpt-5.1 |
| 🌍 | Learn a Language | Detect, translate, and teach language notes. | gpt-5-mini |
| 🍽️ | Recipe Creator | Turn food ideas into complete recipes (with notes). | gpt-5-mini |
| 🍎 | Nutrition Analyser | Structured nutrition breakdowns plus healthier alternatives. | gpt-5-mini |
| 🧩 | Crossword Solver | Solve and explain crossword clues with classification. | gpt-5.1 |

## Project Structure
```
prompt-tools-ext/
├── manifest.json             # Extension manifest (MV3)
├── assets/                   # Icons, screenshots, functional specs
├── src/
│   ├── background.js         # Service worker: context menus, OpenAI calls, storage
│   ├── defaultPromptlets.js  # Built-in promptlet definitions
│   ├── promptletUtils.js     # Shared helpers (combining promptlets, parsing output)
│   ├── popup.html/js         # Toolbar popup entry point
│   ├── manage.html/js        # Promptlet manager + API key UI
│   ├── sidepanel.html/js     # Results side panel with copy + chaining
│   ├── help.html             # In-extension help page
│   ├── scratchpad.html/js    # Dev scratchpad for rapid testing
│   └── style/                # CSS for popup, manager, help, scratchpad, global theme
└── README.md
```

## Permissions
- `contextMenus` – Add right-click menu entries.
- `sidePanel` – Display results in the browser side panel.
- `storage` – Persist promptlets, settings, and API key locally.
- `activeTab`, `scripting`, `tabs` – Read selected text and route messages between pages.

## Notes
- Prompt It! v0.4 uses the OpenAI Responses API; ensure your API key has access to the chosen models.
- Light/Dark mode follows your OS/browser preference automatically.

## License
MIT License © 2025 Prompt It! Team
