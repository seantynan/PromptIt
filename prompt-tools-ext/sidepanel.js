document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const outputDiv = document.getElementById("output");

  // Initial message
  statusDiv.textContent = "Waiting for input…";
  outputDiv.textContent = "";

  // Listen for messages from background.js
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "runPromptlet") {
      statusDiv.textContent = "Received!";
      outputDiv.textContent = `Selected Text: ${msg.text}\nPromptlet: ${msg.promptlet}`;
    }
  });
});
