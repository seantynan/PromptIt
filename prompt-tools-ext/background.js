// =========================================================================
// PromptIt Background Service Worker
// Handles context menus, message routing, and promptlet execution
// =========================================================================

// -------------------------
// Constants
// -------------------------
const DEFAULT_PROMPTLETS = [
  { 
    name: "Summarize", 
    emoji: "💡", 
    prompt: "Summarize this text clearly and concisely.",
    model: "gpt-3.5-turbo"
  },
  { 
    name: "Rephrase", 
    emoji: "✏️", 
    prompt: "Rephrase this text to improve clarity and flow.",
    model: "gpt-3.5-turbo"
  },
  { 
    name: "Prettifier", 
    emoji: "✨", 
    prompt: "Rewrite the text clearly and elegantly, improving structure and readability.",
    model: "gpt-3.5-turbo"
  }
];

const CONTEXT_MENU_ROOT_ID = "promptit_root";
const MANAGE_PROMPTLETS_ID = "manage_promptlets";

// -------------------------
// Initialization
// -------------------------
chrome.runtime.onInstalled.addListener(() => {
  console.log("PromptIt installed");
  initializeDefaults();
  buildContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("PromptIt started");
  buildContextMenus();
});

// -------------------------
// Ensure default promptlets exist on first install
// -------------------------
function initializeDefaults() {
  chrome.storage.local.get({ promptlets: [], apiKey: "" }, (data) => {
    if (!data.promptlets || data.promptlets.length === 0) {
      chrome.storage.local.set({ promptlets: DEFAULT_PROMPTLETS }, () => {
        console.log("Default promptlets initialized");
      });
    }
  });
}

// -------------------------
// Build context menus dynamically based on saved promptlets
// -------------------------
function buildContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      const promptlets = (data.promptlets && data.promptlets.length > 0)
        ? data.promptlets
        : DEFAULT_PROMPTLETS;

      // Create root menu
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ROOT_ID,
        title: "PromptIt",
        contexts: ["selection"]
      });

      // Create promptlet submenus
      promptlets.forEach((p, index) => {
        const menuId = `promptlet_${index}_${p.name}`;
        chrome.contextMenus.create({
          id: menuId,
          parentId: CONTEXT_MENU_ROOT_ID,
          title: `${p.emoji || "📝"} ${p.name}`,
          contexts: ["selection"]
        });
      });

      // Separator
      chrome.contextMenus.create({
        id: "separator",
        parentId: CONTEXT_MENU_ROOT_ID,
        type: "separator",
        contexts: ["selection"]
      });

      // Manage promptlets option
      chrome.contextMenus.create({
        id: MANAGE_PROMPTLETS_ID,
        parentId: CONTEXT_MENU_ROOT_ID,
        title: "⚙️ Manage Promptlets",
        contexts: ["selection"]
      });

      console.log(`Built ${promptlets.length} context menu items`);
    });
  });
}

// -------------------------
// Handle context menu clicks
// -------------------------
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MANAGE_PROMPTLETS_ID) {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (!info.selectionText) {
    console.warn("No text selected");
    return;
  }

  // Extract promptlet index from menu ID
  const match = info.menuItemId.match(/^promptlet_(\d+)_/);
  if (!match) return;

  const promptletIndex = parseInt(match[1], 10);
  runPromptletByIndex(tab.id, promptletIndex, info.selectionText);
});

// -------------------------
// Run promptlet by index
// -------------------------
function runPromptletByIndex(tabId, index, selectionText) {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const promptlets = (data.promptlets && data.promptlets.length > 0)
      ? data.promptlets
      : DEFAULT_PROMPTLETS;

    const promptlet = promptlets[index];
    if (!promptlet) {
      console.error(`Promptlet at index ${index} not found`);
      return;
    }

    runPromptlet(tabId, promptlet, selectionText);
  });
}

// -------------------------
// Run promptlet by name (for popup/other triggers)
// -------------------------
function runPromptletByName(tabId, promptletName, selectionText) {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const promptlets = (data.promptlets && data.promptlets.length > 0)
      ? data.promptlets
      : DEFAULT_PROMPTLETS;

    const promptlet = promptlets.find(p => p.name === promptletName);
    if (!promptlet) {
      console.error(`Promptlet "${promptletName}" not found`);
      return;
    }

    runPromptlet(tabId, promptlet, selectionText);
  });
}

// -------------------------
// Core function to execute a promptlet
// -------------------------
function runPromptlet(tabId, promptlet, selectionText) {
  console.log(`Running promptlet: ${promptlet.name}`);

  // Open side panel
  if (chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ tabId });
  }

  // Send message to side panel
  chrome.runtime.sendMessage({
    action: "runPromptlet",
    promptlet: promptlet,
    text: selectionText || "",
    timestamp: Date.now()
  }).catch(err => {
    console.error("Failed to send message to side panel:", err);
  });
}

// -------------------------
// Handle messages from other extension components
// -------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Background received message:", msg.action);

  switch (msg.action) {
    case "runPromptlet":
      // From popup or other sources
      if (msg.name && msg.tabId) {
        runPromptletByName(msg.tabId, msg.name, msg.text || "");
      }
      sendResponse({ success: true });
      break;

    case "runPromptletChain":
      // Future: chain multiple promptlets
      console.log("Promptlet chaining not yet implemented");
      sendResponse({ success: false, error: "Chaining not implemented" });
      break;

    case "addUserPromptlet":
      // Add new promptlet
      chrome.storage.local.get({ promptlets: [] }, (data) => {
        const promptlets = data.promptlets || [];
        promptlets.push(msg.promptlet);
        chrome.storage.local.set({ promptlets }, () => {
          buildContextMenus();
          sendResponse({ success: true });
        });
      });
      return true; // Keep channel open for async response

    case "deleteUserPromptlet":
      // Delete promptlet by ID
      chrome.storage.local.get({ promptlets: [] }, (data) => {
        const promptlets = data.promptlets || [];
        const filtered = promptlets.filter(p => p.id !== msg.id);
        chrome.storage.local.set({ promptlets: filtered }, () => {
          buildContextMenus();
          sendResponse({ success: true });
        });
      });
      return true; // Keep channel open for async response

    case "updatePromptlets":
      // Update entire promptlet list
      chrome.storage.local.set({ promptlets: msg.promptlets }, () => {
        buildContextMenus();
        sendResponse({ success: true });
      });
      return true;

    case "ping":
      sendResponse({ status: "alive" });
      break;

    default:
      console.warn("Unknown action:", msg.action);
      sendResponse({ success: false, error: "Unknown action" });
  }
});

// -------------------------
// Handle toolbar icon click
// -------------------------
chrome.action.onClicked.addListener((tab) => {
  // Try to open side panel, fallback to options page
  if (chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    chrome.runtime.openOptionsPage();
  }
});

// -------------------------
// Rebuild context menus when storage changes
// -------------------------
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.promptlets) {
    console.log("Promptlets changed, rebuilding menus");
    buildContextMenus();
  }
});

// -------------------------
// Error handling for unhandled promise rejections
// -------------------------
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log("PromptIt background service worker loaded");