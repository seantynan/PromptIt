# Prompt It! 🧠⚡

AI in your right-click. Run custom AI "Promptlets" on any selected text, instantly.

📖 Overview

Prompt It! is a powerful Chrome/Brave/Edge/Opera browser extension that integrates AI directly into your browsing workflow. Instead of copying text, switching tabs to an AI chatbot, and pasting context, simply select text, right-click, and choose a Promptlet. The results appear within seconds in a dedicated browser Side Panel.

Built with Manifest V3, it is fast, secure, and fully customizable. It comes with a suite of useful default promptlets (Summarise, Verify, Translate, etc.), but its true power lies in the Manage Promptlets page, where you can create, edit, and delete your own custom AI commands.

✨ Features

🖱️ Seamless Integration: Adds a "Prompt It!" submenu to your browser's native right-click context menu.

📑 Side Panel Results: AI responses appear in a clean, resizeable side panel that doesn't block your view of the webpage.

⚙️ Fully Customizable: Create your own "Promptlets" with custom system prompts.

🌑 Dark Mode UI: A sleek, modern dark-themed interface for the Side Panel, Manager, and Help pages. Light and Dark mode are automatically driven by your browser or OS settings.

🚀 Pre-loaded Promptlets: Comes ready to use with tools for summarization, fact-checking, language learning, and more.

🛠️ Installation (Developer Mode)

Since this extension is currently in development/local version:

Clone or Download this repository to your local machine.

Open Google Chrome and navigate to chrome://extensions/.

Toggle Developer mode in the top right corner.

Click Load unpacked.

Select the folder where you cloned/downloaded this repository.

The Prompt It! icon (P) should appear in your toolbar!

🚀 Usage

Running a Promptlet:

Highlight any text on a webpage.

Right-click to open the context menu.

Hover over Prompt It! and select a tool (e.g., 💡 Summarise or 🌍 Learn a Language).

The Side Panel will open automatically with the AI's response.

Managing Promptlets
Click the Prompt It! (P) icon in your browser toolbar.

Select ⚙️ Manage Promptlets.

Create: Enter a Name and your Prompt text (ensure you include [SELECTED_TEXT]).

Delete: Remove any promptlets you no longer need.

Toggle: Active promptlets appear in the menu; inactive ones are saved but hidden.

📦 Default Promptlets

The extension installs with these powerful defaults:

Emoji	Name	Description
💡	Summarise	Concisely captures main ideas and key details.
✏️	Rephrase	Improves clarity and flow while preserving meaning.
✅	Verify	Analyzes claims for truthfulness, bias, and missing context.
👑	Max Reasoning	Deep, step-by-step analysis for complex problems.
🌍	Learn a Language	Detects, translates, and provides grammar notes for learners.
🍽️	Recipe Creator	Turns food descriptions into structured recipes.
🍎	Nutrition Analyser	Breaks down macros and suggests healthier alternatives.
🧩	Crossword Solver	Solves cryptic clues with explanations.

🏗️ Project Structure

prompt-it/
├── manifest.json        # Extension configuration (Manifest V3)
├── src/
│   ├── background.js    # Handles context menus and API calls
│   ├── popup.html       # Toolbar popup menu
│   ├── popup.js         # Popup logic
│   ├── popup.css        # Popup styling
│   ├── manage.html      # Options page for CRUD operations
│   ├── manage.js        # Logic for saving/deleting promptlets
│   ├── help.html        # User Guide
│   ├── sidepanel.html   # The output view
│   ├── sidepanel.js     # Displays AI results
│   ├── defaultPromptlets.js # Configuration for default tools
│   └── style/
│       ├── main.css     # Global dark theme styles
│       └── help.css     # Specific styles for the help page
└── assets/
    └── icons/           # App icons

🔒 Permissions
contextMenus: To add the right-click menu items.

sidePanel: To display results in the browser side panel.

storage: To save your custom promptlets and settings.

activeTab & scripting: To read the selected text from the current page.

📄 License
MIT License © 2025 Prompt It! Team