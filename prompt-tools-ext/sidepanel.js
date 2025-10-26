// sidepanel.js
// Side panel logic: wait for runPromptlet messages, call OpenAI (dev key), and show results.

// OpenAI API key import (dev only - replace with your own key in api_key.js)
importScripts('api_key.js');

const apiKey = OPENAI_API_KEY;

document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const outputDiv = document.getElementById("output");

  statusDiv.textContent = "Waiting for input…";
  outputDiv.textContent = "";

  // Listen for messages from background.js (runPromptlet)
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === "runPromptlet") {
      handleRunPromptlet(msg.promptlet, msg.text);
    }
  });

  // Main handler
  async function handleRunPromptlet(promptletId, selectedText) {
    // Clear & show processing status
    statusDiv.textContent = `Processing "${promptletId}"…`;
    outputDiv.textContent = "";
    showSpinner(true);

    // Build the actual prompt text per promptlet
    const prompt = buildPrompt(promptletId, selectedText);

    try {
      // Call OpenAI (dev-only hard-coded key)
      const result = await callOpenAIWithTimeout(prompt, 30000); // 30s timeout

      // Display result
      statusDiv.textContent = "Done!";
      outputDiv.textContent = result;
    } catch (err) {
      // Friendly error handling
      console.error("PromptIt error:", err);
      statusDiv.textContent = "Error";
      outputDiv.textContent = err.message || String(err);
    } finally {
      showSpinner(false);
    }
  }

  // Build prompt templates — keep these short; you'll expand later
  function buildPrompt(promptletId, text) {
    switch ((promptletId || "").toLowerCase()) {
      case "translate":
      case "🇫🇷 learn french":
        return `You are a concise translator. Translate the following English text to French. Keep the meaning accurate and natural:\n\n${text}\n\nOutput only the translation.`;
      case "prettify":
      case "✨ text clean up":
        return `You are an editor. Improve clarity, grammar, and flow without changing meaning. Keep tone similar. Output only the edited text:\n\n${text}`;
      case "foodanalyser":
      case "🥦 food & nutrition analyse":
        return `You are a meal & nutrition evaluator. Analyse this meal and provide a short summary and key flags (protein, micronutrients, improvements):\n\n${text}`;
      // default fallback: ask model to transform gently
      default:
        return `Transform the following text according to the requested operation (${promptletId}). If unsure, rewrite for clarity:\n\n${text}`;
    }
  }

  // Small spinner UI helper (inserts/removes a simple spinner)
  function showSpinner(visible) {
    let spinner = document.getElementById("pi-spinner");
    if (visible) {
      if (!spinner) {
        spinner = document.createElement("div");
        spinner.id = "pi-spinner";
        spinner.style.margin = "8px 0";
        spinner.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border:2px solid #ccc;border-top-color:#333;border-radius:50%;animation:spin 1s linear infinite"></span>`;
        // attach spinner styles
        const style = document.createElement("style");
        style.id = "pi-spinner-style";
        style.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
        document.head.appendChild(style);
        statusDiv.after(spinner);
      }
    } else {
      if (spinner) spinner.remove();
      const style = document.getElementById("pi-spinner-style");
      if (style) style.remove();
    }
  }

  // OpenAI call with timeout using AbortController
  async function callOpenAIWithTimeout(prompt, timeoutMs = 30000) {
    // DEV: hard-coded key (temporary). Replace or remove before publishing.
    const OPENAI_API_KEY = "sk-REPLACE_WITH_YOUR_DEV_KEY";

    if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith("sk-REPLACE")) {
      throw new Error("No OpenAI API key configured in sidepanel.js (dev only).");
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const body = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    };

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(id);

      if (!res.ok) {
        // Try to extract error detail
        let text = await res.text().catch(() => "");
        try {
          const j = JSON.parse(text || "{}");
          if (j.error && j.error.message) throw new Error(j.error.message);
        } catch (e) {
          // fall through to generic message
        }
        throw new Error(`OpenAI API returned status ${res.status}`);
      }

      const data = await res.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("OpenAI response missing expected fields.");
      }

      const content = String(data.choices[0].message.content || "").trim();
      return content;
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Request timed out (30s).");
      throw err;
    }
  }
});
