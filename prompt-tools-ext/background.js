// Register promptlets
const promptlets = [
  { id: "clean", title: "✨ Text Clean Up", prompt: "Clean up and format the selected text clearly." },
  { id: "learn", title: "🌍 Learn a Language", prompt: "Translate this text and explain it simply." },
  { id: "nutrition", title: "🌿 Food & Nutrition Analyser", prompt: "Analyze the nutritional aspects of this text." },
  { id: "compose", title: "💪 Compose a Motion", prompt: "Turn this text into a formal written motion or argument." }
];

chrome.runtime.onInstalled.addListener(() => {
  // Remove old menus to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create the parent menu (the main icon)
    chrome.contextMenus.create({
      id: "promptItRoot",
      title: "PromptIt!",
      contexts: ["action"]
    });

    // Add child menus (the promptlets)
    for (const p of promptlets) {
      chrome.contextMenus.create({
        id: p.id,
        parentId: "promptItRoot",
        title: p.title,
        contexts: ["action"]
      });
    }
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const promptlet = promptlets.find(p => p.id === info.menuItemId);
  if (!promptlet) return;

  // Get selected text (if any)
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString()
  });

  const selectedText = result?.result || "";

  // Send data to side panel
  await chrome.sidePanel.open({ tabId: tab.id });
  chrome.tabs.sendMessage(tab.id, {
    action: "runPromptlet",
    promptlet,
    selectedText
  });
});
