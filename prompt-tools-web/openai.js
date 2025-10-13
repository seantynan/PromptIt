// openai.js
// Handles OpenAI API interaction and parsing of model responses.

import { DEFAULT_MODE, MODES } from "./modes.js";

// ⚙️ API Settings
const MODEL = "gpt-4o-mini"; // Lightweight, cost-effective, high quality
const MAX_TOKENS = 2000; // Allow enough room for long outputs

/**
 * Calls the OpenAI API with the user input and selected mode.
 * @param {string} apiKey - The user's OpenAI API key.
 * @param {string} modeKey - Selected mode key (e.g., "prettify", "summarize").
 * @param {string} userInput - Text input from the user.
 * @returns {Promise<{ output: string, feedback: string }>} The cleaned text and changelog/feedback.
 */
export async function callOpenAI(apiKey, modeKey, userInput) {
  const mode = MODES[modeKey] || MODES[DEFAULT_MODE];

  if (!apiKey) throw new Error("API key is missing.");
  if (!userInput.trim()) throw new Error("Input text is empty.");

  const systemPrompt = mode.systemPrompt;
  const userPrompt = `
Process the following text according to your system instructions.

Input Text:
${userInput}
`.trim();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: MAX_TOKENS
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) throw new Error("No content returned from model.");

  // Parse output into main text + changelog/feedback sections
  const parsed = parseOutput(content);
  return parsed;
}

/**
 * Attempts to separate the prettified output from the change log / feedback.
 * Expected format:
 *  <main text>
 *  --- CHANGE LOG: ---
 *  <feedback section>
 */
function parseOutput(content) {
  const dividerRegex = /---\s*(CHANGE\s*LOG|FEEDBACK)\s*[:\-]?\s*/i;
  const parts = content.split(dividerRegex);

  if (parts.length > 1) {
    return {
      output: parts[0].trim(),
      feedback: parts.slice(2).join(" ").trim()
    };
  }

  // fallback: return all content as main output
  return {
    output: content.trim(),
    feedback: "(No change log provided)"
  };
}
