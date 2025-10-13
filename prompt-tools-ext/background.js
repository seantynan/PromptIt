// ---------------------------
// 1️⃣ Define prompts
// ---------------------------
const PROMPTS = {
  prettify: `Your role: Text Document Prettifier

Objective:
You receive a text document that may contain typos, formatting issues, grammatical errors, or inconsistent syntax. Your job is to return a professional, corrected, and consistently formatted version without altering any intended meaning or phrasing beyond what is strictly necessary for correctness.

Instructions

Analyse the supplied text carefully.

Correct only the following:

- Spelling, grammar, and punctuation errors
- Incorrect capitalization and sentence starts
- List numbering, indentation, and alignment
- Extra spaces, inconsistent spacing, or errant line breaks

Do not modify vocabulary choice, phrasing, tone, or sentence structure unless absolutely required for grammatical correctness.

Preserve meaning, nuance, and stylistic intent precisely.

Maintain all original sections, headings, and paragraph breaks.

Return results in the exact structured format below:

CLEAN VERSION:

<fully corrected and neatly formatted text here>

CHANGE LOG:

<short, factual description of each correction made>
<list by category: spelling, punctuation, formatting, etc.>

TEXT DOCUMENT:
<paste user text here>`
};

// ---------------------------
// 2️⃣ API key retrieval
// ---------------------------
async function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("openaiKey", (result) => {
      if (result.openaiKey) resolve(result.openaiKey);
      else reject("No API key stored. Use chrome.storage.local.set({ openaiKey: 'YOUR_KEY' }) first.");
    });
  });
}

// ---------------------------
// 3️⃣ OpenAI API call
// ---------------------------
async function callOpenAI(apiKey, prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ---------------------------
// 4️⃣ Toolbar button click
// ---------------------------
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 1️⃣ Get selected text
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString(),
      world: "MAIN"
    });

    const selText = results[0]?.result || "";
    if (!selText) return;

    // 2️⃣ Build prompt
    const fullPrompt = PROMPTS.prettify.replace("<paste user text here>", selText.trim());

    // 3️⃣ Get API key
    //const apiKey = await getApiKey();
    const apiKey = "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"; // directly in background.js

    // 4️⃣ Call OpenAI
    const cleanedText = await callOpenAI(apiKey, fullPrompt);

    // 5️⃣ Insert back into page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => {
        if (window.prettifierReplaceSelection) {
          window.prettifierReplaceSelection(text);
        } else {
          // fallback for simple textarea insertion
          const activeEl = document.activeElement;
          if (activeEl && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT")) {
            const start = activeEl.selectionStart;
            const end = activeEl.selectionEnd;
            activeEl.value = activeEl.value.slice(0, start) + text + activeEl.value.slice(end);
            activeEl.selectionStart = activeEl.selectionEnd = start + text.length;
            activeEl.focus();
          }
        }
      },
      args: [cleanedText],
      world: "MAIN"
    });

  } catch (err) {
    console.error("Error in Prettifier extension:", err);
  }
});
