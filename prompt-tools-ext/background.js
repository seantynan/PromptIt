chrome.runtime.onInstalled.addListener(() => {
  // Create main context menu
  chrome.contextMenus.create({
    id: "promptit_root",
    title: "PromptIt",
    contexts: ["selection"]
  });

  // Example submenus (Promptlets)
  const promptlets = [
    { id: "summarize", title: "Summarize" },
    { id: "translate", title: "Translate" },
    { id: "rewrite", title: "Rewrite in a better style" }
  ];

  for (const p of promptlets) {
    chrome.contextMenus.create({
      id: p.id,
      parentId: "promptit_root",
      title: p.title,
      contexts: ["selection"]
    });
  }
});

// Handle clicks on menu items
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "promptit_root") {
    // Open the sidebar
    chrome.sidePanel.open({ tabId: tab.id });

    // Send message directly to the sidebar
    chrome.runtime.sendMessage({
      action: "runPromptlet",
      promptlet: info.menuItemId,
      text: info.selectionText
    });
  }
});
