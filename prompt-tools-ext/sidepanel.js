chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runPromptlet") {
    document.getElementById("output").textContent =
      `Running promptlet: ${message.promptlet}\n\nText:\n${message.text}`;
  }
});
