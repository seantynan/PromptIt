chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runPromptlet") {
    document.getElementById("status").textContent =
      `Running promptlet: ${message.promptletId}`;
    document.getElementById("output").textContent =
      `You selected:\n"${message.text}"`;
  }
});
