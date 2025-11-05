// =========================================================================
// PromptIt Background Service Worker
// Handles context menus, message routing, and promptlet execution
// =========================================================================

// Import default promptlets
importScripts('defaultPromptlets.js');

// -------------------------
// Constants
// -------------------------
const CONTEXT_MENU_ROOT_ID = "promptit_root";
const MANAGE_PROMPTLETS_ID = "manage_promptlets";

// Store pending promptlet data
let pendingPromptletData = null;

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
  chrome.storage.local.get({ promptlets: [], apiKey: "", hasInitialized: false }, (data) => {
    // Only initialize if this is truly the first run
    if (!data.hasInitialized) {
      chrome.storage.local.set({ 
        promptlets: DEFAULT_PROMPTLETS,
        hasInitialized: true 
      }, () => {
        console.log(`Initialized with ${DEFAULT_PROMPTLETS.length} default promptlets`);
        buildContextMenus();
      });
    } else {
      console.log(`Using ${data.promptlets.length} stored promptlets`);
    }
  });
}

// -------------------------
// Build context menus dynamically based on saved promptlets
// -------------------------
function buildContextMenus() {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error("Error removing menus:", chrome.runtime.lastError);
      return;
    }
    
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      const promptlets = (data.promptlets && data.promptlets.length > 0)
        ? data.promptlets
        : DEFAULT_PROMPTLETS;

      // Create root menu
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ROOT_ID,
        title: "Prompt It!",
        contexts: ["selection"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error creating root menu:", chrome.runtime.lastError);
          return;
        }

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
  });
}

// -------------------------
// Handle context menu clicks
// -------------------------
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("=== CONTEXT MENU CLICKED ===");
  console.log("Menu ID:", info.menuItemId);
  console.log("Selection:", info.selectionText);
  console.log("Tab:", tab);
  
  if (info.menuItemId === MANAGE_PROMPTLETS_ID) {
    console.log("Opening options page");
    chrome.runtime.openOptionsPage();
    return;
  }

  if (!info.selectionText) {
    console.warn("No text selected");
    return;
  }

  // Extract promptlet index from menu ID
  const match = info.menuItemId.match(/^promptlet_(\d+)_/);
  console.log("Regex match:", match);
  
  if (!match) {
    console.error("No match for menu ID pattern");
    return;
  }

  const promptletIndex = parseInt(match[1], 10);
  console.log("Promptlet index:", promptletIndex);
  
  runPromptletByIndex(tab.id, promptletIndex, info.selectionText);
});

// -------------------------
// Run promptlet by index
// -------------------------
function runPromptletByIndex(tabId, index, selectionText) {
  console.log("=== RUN PROMPTLET BY INDEX ===");
  console.log("Index:", index, "TabId:", tabId);
  
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const promptlets = (data.promptlets && data.promptlets.length > 0)
      ? data.promptlets
      : DEFAULT_PROMPTLETS;

    const promptlet = promptlets[index];
    if (!promptlet) {
      console.error(`Promptlet at index ${index} not found`);
      return;
    }

    console.log("Found promptlet:", promptlet.name);
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
  console.log(`Tab ID: ${tabId}`);
  console.log(`Selected text length: ${selectionText?.length || 0}`);

  // Store data for side panel to retrieve
  const promptletData = {
    promptlet: promptlet,
    text: selectionText || "",
    timestamp: Date.now()
  };

  // CRITICAL: Open side panel FIRST, before any async operations
  // This must be synchronous to preserve user gesture context
  try {
    console.log("Opening side panel (synchronous)...");
    chrome.sidePanel.open({ tabId: tabId }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error opening side panel:", chrome.runtime.lastError);
        return;
      }
      
      console.log("Side panel opened!");
      
      // NOW do async storage operations
      chrome.storage.local.set({ pendingPromptlet: promptletData }, () => {
        console.log("Stored pending promptlet data");
        
        // Try sending message as backup
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: "runPromptlet",
            promptlet: promptlet,
            text: selectionText || "",
            timestamp: Date.now()
          }).catch(err => {
            console.log("Message send failed (side panel will read from storage):", err.message);
          });
        }, 200);
      });
    });
  } catch (err) {
    console.error("Failed to open side panel:", err);
  }
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

    case "getPendingPromptlet":
      // Side panel requesting pending data
      sendResponse({ data: pendingPromptletData });
      pendingPromptletData = null; // Clear after retrieval
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

    case "resetToDefaults":
      // Reset to default promptlets
      chrome.storage.local.set({ promptlets: DEFAULT_PROMPTLETS }, () => {
        buildContextMenus();
        sendResponse({ success: true, count: DEFAULT_PROMPTLETS.length });
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