MVP roadmap

Here’s a **one-page MVP roadmap** for **PromptIt**, capturing priorities and phasing — clear enough to guide the next implementation sprint without drifting into documentation territory.

---

## 🧭 **PromptIt MVP Roadmap — October 2025**

### 🎯 Core Objective

Deliver a **robust, extensible PromptIt Add-in / Extension** that demonstrates the **Promptlet** concept — small, user-definable text transformers with composable workflows — operating entirely within a clean text-in, text-out framework.

---

### **Phase 1 — Stability & Core UX (Weeks 1-2)**

**Goal:** Eliminate destructive edits, fix the paragraph bug, and move output into a structured, reliable UI.

| Priority | Feature                           | Purpose                                                                                    |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| 🟥 1     | **Non-destructive workflow**      | Output always appears in sidebar, never overwrites document text.                          |
| 🟥 2     | **Paragraph handling fix**        | Normalize line breaks and spacing when extracting from Docs.                               |
| 🟥 3     | **Output channel separation**     | Detect “Notes”, “Change Log”, etc., via markers or heuristics → render in dedicated boxes. |
| 🟧 4     | **Basic Promptlet schema (JSON)** | Standardize prompt storage: `{name, prompt, outputs[], model}`.                            |
| 🟧 5     | **Secure API key storage**        | Migrate to `PropertiesService` in Apps Script.                                             |

**Deliverable:**
Stable Google Docs add-in with sidebar output, promptlet save/load, and multi-section parsing.

---

### **Phase 2 — Composition & Extensibility (Weeks 3-5)**

**Goal:** Demonstrate Promptlet chaining and extensibility.

| Priority | Feature                         | Purpose                                                        |
| -------- | ------------------------------- | -------------------------------------------------------------- |
| 🟥 1     | **Promptlet chaining (linear)** | Select & run multiple promptlets sequentially.                 |
| 🟧 2     | **Import/Export promptlets**    | Enable JSON sharing between users.                             |
| 🟧 3     | **“Show steps” toggle**         | Inspect intermediate outputs for debugging or curiosity.       |
| 🟨 4     | **Cheap/fast “preview mode”**   | Optionally use lighter model or truncated text for quick runs. |

**Deliverable:**
Functional prototype of chained Promptlets — e.g., *Prettify → Translate → Annotate*.

---

### **Phase 3 — Browser Extension Transition (Weeks 6-8)**

**Goal:** Migrate from Docs add-in to browser environment with side panel UI.

| Priority | Feature                                    | Purpose                                           |
| -------- | ------------------------------------------ | ------------------------------------------------- |
| 🟥 1     | **Text extraction from webpage selection** | Capture highlighted text reliably in Chrome/Edge. |
| 🟧 2     | **Unified sidebar**                        | Reuse PromptIt sidebar UX for cross-page use.     |
| 🟧 3     | **Secure key/token handling**              | Local storage + optional proxy token vault.       |

**Deliverable:**
Early browser extension that mirrors add-in capabilities.

---

### **Phase 4 — UX Polish & Blue-Sky Proof (Weeks 9-12)**

**Goal:** Showcase PromptIt’s power through small-scale “wow” features.

| Priority | Feature                                  | Purpose                                                                       |
| -------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| 🟧 1     | **Visual workflow designer (prototype)** | Drag-drop promptlets → chain visually.                                        |
| 🟧 2     | **Contextual output rendering**          | Smart panels (e.g., Notes pane auto-opens for “Frenchifier”).                 |
| 🟨 3     | **Usage analytics (local only)**         | Log runs, latency, token cost, success rate.                                  |
| 🟩 4     | **Template library**                     | Bundle several example promptlets (Prettifier, Frenchifier, TedMotion, etc.). |

**Deliverable:**
Demonstration-ready, hobby-grade app illustrating the PromptIt vision.

---

### 🧩 Design Tenets

* **Everything is text:** simple I/O keeps PromptIt language-agnostic and platform-agnostic.
* **LLM unpredictability is power:** structured parsing and UI channels turn variance into useful expressiveness.
* **Composable, transparent, non-destructive:** trust and user control over every transformation.
* **Hobbyist ethos:** elegance > scale; curiosity > enterprise polish.

---

