---

# 🧩 **PromptIt Functional Specification (v0.11 — 11 Oct 2025)**

---

## 🧭 1. Overview

**PromptIt** is a modular AI interface that allows users to create, manage, and chain *Promptlets* — small, reusable text-processing units — inside host environments such as **Google Docs** or web browsers.

Each Promptlet accepts **text input**, applies a **user-defined prompt**, and returns **text output** — optionally divided into UI sections such as “Main Output,” “Notes,” or “Change Log.”

The current implementation operates as a **Google Docs Add-on**, with plans to expand to **browser extensions** and other host platforms (e.g., Gmail, Word, Salesforce).

---

## ⚙️ 2. Core Functionality

### 2.1. Promptlets

A **Promptlet** (PLT) is the atomic unit of PromptIt.

**Schema (v1.0 draft):**

```json
{
  "name": "Prettifier",
  "menuItem": "Prettify Selection",
  "prompt": "Rewrite the text clearly and elegantly...",
  "outputStructure": ["main", "notes"],
  "model": "gpt-4-turbo",
  "chainedPromptlets": []
}
```

**Key Features:**

* **Text-in / Text-out:** all transformations operate purely on text.
* **User-defined:** users can create and edit their own Promptlets directly in the UI.
* **Composable:** Promptlets can be chained sequentially to form mini workflows.
* **Context-independent:** operates on arbitrary text regardless of domain.

---

### 2.2. Input Handling

* The user **selects text** in Google Docs (or highlights text in a webpage, in future versions).
* PromptIt retrieves the plain text using the host API.
* Text is sanitized for whitespace, paragraph consistency, and hidden characters.
* In multi-paragraph inputs, each paragraph is normalized to prevent collapsed or merged output (→ *fix for paragraph bug*).

---

### 2.3. Output Handling

PromptIt no longer overwrites text in the document.

* **Output appears in sidebar.**
* If the model returns structured content (e.g., “Notes: …”), PromptIt parses it into **UI sections**.
* Each section is displayed in its own box:

  * **Main Output**
  * **Notes / Commentary**
  * **Change Log**
  * **Warnings or Errors**

This ensures safe, **non-destructive editing** while maintaining clarity and reproducibility.

---

### 2.4. Chaining of Promptlets

PromptIt supports **Promptlet workflows**, enabling users to chain multiple transformations in sequence.

**Example chain:**

```
Input Text → FoodAnalyser → Prettifier → Frenchifier
```

The system executes each Promptlet’s transformation sequentially, passing the output of one as the input of the next.
Future UI will feature a **visual workflow designer** (drag/drop pipeline builder).

---

### 2.5. Built-in Promptlets (Seed Set)

PromptIt includes several built-in Promptlets to demonstrate capability:

* **Prettifier:** Cleans and reformats text.
* **FoodAnalyser:** Evaluates meal entries for nutrition.
* **Frenchifier:** Translates text to French and adds linguistic notes.
* **TedMotion:** Drafts concise, formal motions for councils or committees.

Each one illustrates a distinct pattern of text transformation, output structuring, and practical use.

---

### 2.6. User Interface

#### A. Sidebar (Main Interaction Panel)

* Displays output sections for the current run.
* Includes dropdowns for:

  * Selecting Promptlets
  * Building chains
  * Managing saved Promptlets
* Offers copy, insert, and export actions for results.

#### B. Menu Integration

* Google Docs Add-on menu:

  ```
  Extensions → PromptIt → [Run Promptlet] / [Manage Promptlets]
  ```
* Each user-defined Promptlet automatically appears as a menu item.

#### C. Promptlet Manager

* CRUD interface for user promptlets (Create, Edit, Delete, Chain).
* Stored via `PropertiesService` (local to the user).

---

## 🧩 3. Architecture

| Layer                        | Function                           | Example                      |
| ---------------------------- | ---------------------------------- | ---------------------------- |
| **Host Layer**               | Provides context & text access     | Google Docs API, Browser API |
| **Core Engine**              | Manages text flow, prompt chaining | `runPromptletChain()`        |
| **Promptlet Schema**         | Defines behavior and metadata      | JSON schema (see §2.1)       |
| **UI Layer**                 | Sidebar rendering and user actions | HTML + CSS (Apps Script UI)  |
| **Persistence Layer**        | Saves promptlets & API keys        | Script / local storage       |
| **Extension Layer (Future)** | Cross-platform host adapters       | Chrome, Word, etc.           |

All transformations are stateless between runs. Chains may be stored for reuse, but each run is atomic and isolated.

---

## 🔮 4. Future Extensions

| Category                    | Description                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| **Browser Extension**       | Highlight → right-click → “Run in PromptIt” → Output in side panel |
| **Visual Workflow Builder** | User drags and connects Promptlets to form custom chains           |
| **Output Typing System**    | Detect structured segments (“Notes”, “Glossary”, etc.) dynamically |
| **Multi-modal Promptlets**  | Text + image inputs (e.g., OCR or chart analysis)                  |
| **Prompt Marketplace**      | Users share/export `.plt.json` Promptlets                          |
| **Offline/Edge Mode**       | Optional local LLM connectors for privacy-conscious use            |

---

## 🧠 5. Philosophy

PromptIt is not a “prompt launcher.”
It is a **bridge between human text and AI reasoning**, formalizing the ephemeral act of prompting into a **repeatable, composable unit** — the Promptlet.

Key principles:

* **Simplicity:** every feature stems from “text in, text out.”
* **Transparency:** show what the AI did, don’t overwrite.
* **Composability:** let users chain reasoning like Lego blocks.
* **Extensibility:** adaptable to any host or context.
* **Playfulness:** built for experimentation, not enterprise bureaucracy.

---

## ⚖️ 6. Caveats & Opportunities

| Caveat                  | Opportunity                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| Unpredictable AI output | Treat as generative variability → channel via structured UI parsing |
| Text-only limitation    | Guarantees cross-platform compatibility                             |
| Paragraph parsing       | Fix once → consistent UX across all hosts                           |
| Stateless sessions      | Enables deterministic audit trails per Promptlet                    |
| No deep context memory  | Encourages self-contained, explicit prompting                       |
| Latency / API limits    | “Preview mode” or local models can mitigate                         |

---

## 💡 7. Value & Position (as of Oct 2025)

| Attribute                      | PromptIt              | Existing Tools (e.g., Notion AI, ChatGPT sidebar, Word CoPilot) |
| ------------------------------ | --------------------- | --------------------------------------------------------------- |
| User-defined prompts           | ✅ Full control        | ⚠️ Limited                                                      |
| Chaining of custom prompts     | ✅ Core feature        | ❌ Rare                                                          |
| Host flexibility               | ✅ (Docs → Web → More) | ⚠️ Platform-bound                                               |
| Non-destructive UI             | ✅ Sidebar output      | ⚠️ Mixed                                                        |
| Transparency / Reproducibility | ✅ Structured I/O      | ⚠️ Minimal                                                      |
| Price / Accessibility          | ✅ Free-tier friendly  | ❌ Often paid or gated                                           |

PromptIt’s value lies in its **modularity**, **text-first universality**, and **curious-user orientation** — empowering users to build micro-tools from prompts.

---

## 🧩 8. Current Status (as of Oct 11, 2025)

| Area               | State                          |
| ------------------ | ------------------------------ |
| Core Add-on logic  | ✅ Working                      |
| Sidebar output     | 🚧 Transition in progress      |
| Paragraph bug      | ⚠️ Outstanding                 |
| Chaining mechanism | 🔜 Prototype planned           |
| Cloud linkage      | ⚙️ GCP conversion required     |
| Documentation      | 🕓 Paused (concept stage only) |

---

## 🧩 9. Summary

PromptIt stands as a **conceptual and practical experiment** in AI composability.
Its greatest power lies not in what it automates, but in **how it lets users think with AI**, constructing layered, transparent reasoning pipelines — one Promptlet at a time.

It is a hobby project — but one that embodies deep software principles:

* Minimal interface, maximal leverage.
* Clarity over cleverness.
* A genuine augmentation of thought.

---
