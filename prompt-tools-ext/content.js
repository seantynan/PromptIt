chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.action === "runPromptlet") {
    const sidePanel = chrome.runtime.connect({ name: "PromptItChannel" });
    sidePanel.postMessage(msg);
  }
});
