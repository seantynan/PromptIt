document.addEventListener("DOMContentLoaded", () => {
  const outputDiv = document.getElementById("output");
  const statusDiv = document.getElementById("status");

  statusDiv.textContent = "Waiting for input…";

  // Signal background that side panel is ready
  chrome.runtime.sendMessage({ action: "sidepanelReady" });

  // Listen for incoming messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "testMessage") {
      statusDiv.textContent = "Received!";
      outputDiv.textContent = `Selected Text: ${msg.text}\nPromptlet: ${msg.promptlet}`;

      // Call OpenAI API
      handlePromptlet(msg.text, msg.promptlet);
    } else if (msg.action === "promptletResult") {
      statusDiv.textContent = "Done!";
      outputDiv.textContent = msg.result;
    }
  });
});

// --- Helper functions ---

async function getApiKey() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getApiKey" }, (response) => {
      resolve(response.apiKey);
    });
  });
}

async function callOpenAI(prompt, apiKey) {
  const url = "https://api.openai.com/v1/chat/completions";
  const payload = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function handlePromptlet(selectedText, promptlet) {
  const statusDiv = document.getElementById("status");
  const outputDiv = document.getElementById("output");

  statusDiv.textContent = "Processing…";

  try {
    const apiKey = await getApiKey();
    const combinedPrompt = `${promptlet}\n\n${selectedText}`;
    const result = await callOpenAI(combinedPrompt, apiKey);

    statusDiv.textContent = "Done!";
    outputDiv.textContent = result;
  } catch (error) {
    statusDiv.textContent = "Error";
    outputDiv.textContent = error.message;
  }
}
