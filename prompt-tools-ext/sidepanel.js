document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const outputDiv = document.getElementById("output");

  // Initial message
  statusDiv.textContent = "Waiting for input…";
  outputDiv.textContent = "";

  // Listen for messages from background.js
  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.action === "runPromptlet") {
      // Show temporary status
      statusDiv.textContent = `Processing "${msg.promptlet}"...`;
      outputDiv.textContent = msg.text;

      try {
        // Call OpenAI API with selected text and promptlet
        const prompt = `${msg.promptlet}:\n${msg.text}`;
        const result = await callOpenAI(prompt);

        // Update sidebar with result
        statusDiv.textContent = "Done!";
        outputDiv.textContent = result;

      } catch (error) {
        statusDiv.textContent = "Error!";
        outputDiv.textContent = error.message;
        console.error(error);
      }
    }
  });
});

// Temporary dev key, hardcoded for now
async function callOpenAI(prompt) {
  const apiKey = "sk-YOUR-HARDCODED-KEY-HERE"; // Replace with your dev key
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
