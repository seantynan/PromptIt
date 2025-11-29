---

# 🧩 **PromptIt Functional Specification (v0.11 — 11 Oct 2025)**

---

## 🧭 1. Overview

**PromptIt** is a modular AI interface that allows users to create, manage, and chain *Promptlets* — small, reusable text-processing units — inside host environments such as **Google Docs** or web browsers.

Each Promptlet accepts **text input**, applies a **user-defined prompt**, and returns **text output** — optionally divided into UI sections such as “Main Output,” “Notes,” or “Change Log.”

The current implementation operates as a Chromium based **browser extensions**

The AI engine used is the OpenAI API. The user will provide their own OpenAI API Key. (BYOK: Bring Your Own Key model).
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

* The user **selects text** in a webpage.
* PromptIt retrieves the plain text using the host API.
* Text is sanitized for whitespace, paragraph consistency, and hidden characters.
* In multi-paragraph inputs, each paragraph is normalized to prevent collapsed or merged output (→ *fix for paragraph bug*).

---

### 2.3. Output Handling

* **Output appears in sidebar.**
* Each section is displayed in its own box:

  * **Main Output**
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

This chaining is ad-hoc: the user can run the text ouput, or part of the output, through another promptlet.

---

### 2.5. Built-in Promptlets (Seed Set)

PromptIt includes several built-in Promptlets to demonstrate capability:

* **Summarise:** Cleans and reformats text.
* **Rephrase:** Evaluates meal entries for nutrition.
* **Learn a Language:** Translates text in a nonEnglish langiuage )the language is auto-detected), translates to English and adds linguistic notes.
etc

Each one illustrates a distinct pattern of text transformation, output structuring, and practical use.

---

### 2.6. User Interface

#### A. Sidebar (Main Interaction Panel)

* Displays output sections for the current run.
* Includes buttons for:

  * Copy Output
  * Dropdown to run another promptlet (ad-hoc chaining feature)
  * Close (closes the side panel)

#### B. Menu Integration

* Each user-defined Promptlet automatically appears as a menu item in the browser context menu (right-click).

#### C. Promptlet Manager

* CRUD interface for user promptlets (Create, Edit, Delete).
* Stored via `PropertiesService` (local to the user).

---

## 🧩 3. Architecture

| Layer                        | Function                           | Example                      |
| ---------------------------- | ---------------------------------- | ---------------------------- |
| **Host Layer**               | Provides context & text access     | Google Docs API, Browser API |
| **Core Engine**              | Manages text flow, prompt chaining | `schema (see §2.1)       |
| **UI Layer**                 | Sidebar rendering and user actions | HTML + CSS (Apps Script UI)  |
| **Persistence Layer**        | Saves promptlets & API keys        | Script / local storage       |


All transformations are stateless between runs.

---


## 🧩 4. Manage Promptlets

The browser extension wiull be packaged with a few default promptlets. These cannot be modified, but can be disabled.

The user can add/edit/delete their own promptlets. There will be the ability to Clone an existing promptlet (default or custom) which copies the settings, crates a new promptlet and copies those settings into the newly created promptlet. Each promptlet name needs to be uniue, so the cloned promptlet name will be a modified version of the name of the cloned promptlet.


For each promoptlet, there will be an option to expand to advanced settings. This will list the parameters to the OpenAI API call, with appropriate defaults.

Each setting will have an appropriate UI widget to allow the user to customise each promptlet. For example the Temperature option may have a slider widget.

Parameter Type  Suggested Default Notes
model string  e.g. "gpt-3.5-turbo" Choice of model; pick a lighter option for faster/cheaper output.
messages  array of {role,content} — Required: your conversation history. No default.
temperature number (0-2)  0.7 Creativity vs predictability. Lower → deterministic, higher → creative.
top_p number (0-1)  1.0 Nucleus sampling alternative to temperature. Use 1.0 to disable.
n integer 1 Number of completions to generate. Higher → more outputs but more cost.
max_tokens  integer 256 Maximum number of tokens for the output. Adjust based on expected size.
presence_penalty  number (-2.0-2.0) 0.0 Penalizes new topics. Leave 0 unless you want less topic drift.
frequency_penalty number (-2.0-2.0) 0.0 Penalizes repetition. Leave 0 unless you see repeated phrases.
---

## 🧠 5. Philosophy

PromptIt is not a “prompt launcher.”
It is a **bridge between human text and AI reasoning**, formalizing the ephemeral act of prompting into a **repeatable, composable unit** — the Promptlet.

Key principles:

* **Simplicity:** every feature stems from “text in, text out.”
* **Transparency:** show what the AI did, don’t overwrite.
* **Composability:** let users chain reasoning like Lego blocks.
* **Extensibility:** the user can create their own promptlets.
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

## 🧩 8. Current Status (as of NOv 29, 2025)

Default prompts are working. User defined prompts are not yet working.

---

## 🧩 9. Summary

PromptIt stands as a **conceptual and practical experiment** in AI composability.
Its greatest power lies not in what it automates, but in **how it lets users think with AI**, constructing layered, transparent reasoning pipelines — one Promptlet at a time.

It is a hobby project — but one that embodies deep software principles:

* Minimal interface, maximal leverage.
* Clarity over cleverness.
* A genuine augmentation of thought.

---
