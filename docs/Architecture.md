──────────────────────────────────────────────
                USER LAYER
──────────────────────────────────────────────
👤 User
   │
   ▼
🧩 Chooses / Creates Promptlet(s)
   │
   ▼
🪶 Selects Text in Host App
   │
   ▼
[ Execute Prompt Chain ]
   │
   ▼
──────────────────────────────────────────────
                HOST / SUBSTRATE LAYER
──────────────────────────────────────────────
🌐 Host Integration (e.g. Google Docs, Browser, Gmail)
   │
   ├── Input Adapter → Extracts user-selected text
   │
   ├── Output Adapter → Inserts or displays AI response
   │
   └── Context Manager → Maintains info about cursor, file, etc.
   │
   ▼
──────────────────────────────────────────────
                PROMPTIT CORE ENGINE
──────────────────────────────────────────────
⚙️  PromptIt Core
   │
   ├── Input Pipeline
   │     • Receives raw text from Host
   │     • Attaches metadata (user ID, timestamp, etc.)
   │
   ├── Promptlet Chain Processor
   │     • Executes one or more promptlets sequentially
   │     • Handles intermediate chaining (output → next input)
   │
   ├── AI Gateway
   │     • Sends prompt to LLM (OpenAI, local model, etc.)
   │     • Receives structured text output
   │
   ├── Output Parser / Section Splitter
   │     • Detects labeled sections (e.g. “Notes:”)
   │     • Splits into structured components:
   │           → main_output
   │           → notes
   │           → metadata
   │
   └── Control Hooks & Error Catcher
         • Detects malformed output or API errors
         • Applies auto-repair or fallback prompts
   │
   ▼
──────────────────────────────────────────────
                UI / PRESENTATION LAYER
──────────────────────────────────────────────
🪟 Side Panel Interface
   │
   ├── Displays: 
   │     → Input text
   │     → Final output
   │     → Notes / secondary fields
   │
   ├── Navigation:
   │     → “Next” / “Previous” for multi-step chains
   │     → “Re-run” / “Edit Promptlet”
   │
   └── Context Buttons:
         → “Insert Output”
         → “Copy Notes”
         → “Save as New Promptlet”
   │
   ▼
──────────────────────────────────────────────
                STORAGE / EXTENSION LAYER
──────────────────────────────────────────────
💾 Local Storage (per user)
   │
   ├── promptlets.json  ←  list of all promptlets
   ├── user_settings.json
   └── execution_logs.json
   │
   ▼
🌐 (Optional Future)
   ├── Promptlet Exchange API
   ├── Shared Libraries / Team Workflows
   └── Offline or Local AI Runtime
──────────────────────────────────────────────
