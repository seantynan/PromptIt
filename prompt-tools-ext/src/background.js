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

// Flag to prevent duplicate menu builds
let isRebuildingMenus = false;

// ------------------------
// Helper to apply default flag
// ------------------------
function getPromptletsWithDefaultsFlag() {
  return DEFAULT_PROMPTLETS.map(p => ({
    ...p,
    isDefault: true // Apply the flag here
  }));
}

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
      const initialPromptlets = getPromptletsWithDefaultsFlag();
      chrome.storage.local.set({ 
        promptlets: initialPromptlets,
        hasInitialized: true 
      }, () => {
        console.log(`Initialized with ${initialPromptlets.length} default promptlets`);
        buildContextMenus();
      });
    } else {
      console.log(`Using ${data.promptlets.length} stored promptlets`);
    }
  });
}

// -------------------------
// Securely call OpenAI API
// -------------------------
async function callOpenAI(prompt, apiKey, model = "gpt-4o", temperature = 1, maxTokens = 3000, topP = 1, frequencyPenalty = 0, presencePenalty = 0) {
  console.log(`[BG] Calling OpenAI API:`, { model, maxTokens });
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: temperature,
      max_completion_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `API error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// -------------------------
// Build context menus dynamically based on saved promptlets
// -------------------------
function buildContextMenus() {
  if (isRebuildingMenus) {
    console.log("Menu rebuild already in progress, skipping...");
    return;
  }
  
  isRebuildingMenus = true;
  console.log("Building context menus...");
  
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error("Error removing menus:", chrome.runtime.lastError);
      isRebuildingMenus = false;
      return;
    }
    
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      const promptlets = (data.promptlets && data.promptlets.length > 0)
        ? data.promptlets
        : getPromptletsWithDefaultsFlag();

      // Create root menu
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ROOT_ID,
        title: "Prompt It!",
        contexts: ["selection"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error creating root menu:", chrome.runtime.lastError.message);
          isRebuildingMenus = false;
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
        isRebuildingMenus = false;
      });
    });
  });
}

// -------------------------
// Handle context menu clicks
// -------------------------
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("=== CONTEXT MENU CLICKED ===");
  
  if (info.menuItemId === MANAGE_PROMPTLETS_ID) {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (!info.selectionText) {
    console.warn("No text selected - aborting");
    return;
  }
  
  // Check if tab is invalid (side panel = -1, or missing)
  if (!tab || !tab.id || tab.id === -1) {
    console.log("Side panel selection detected.");
    
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      const promptlets = (data.promptlets && data.promptlets.length > 0)
        ? data.promptlets
        : getPromptletsWithDefaultsFlag();
      
      const match = info.menuItemId.match(/^promptlet_(\d+)_/);
      if (!match) return;
      
      const promptletIndex = parseInt(match[1], 10);
      const promptlet = promptlets[promptletIndex];
      
      if (!promptlet) return;
      
      const promptletData = {
        promptlet: promptlet,
        text: info.selectionText,
        timestamp: Date.now()
      };
      
      chrome.storage.local.set({ pendingPromptlet: promptletData }, () => {
        chrome.runtime.sendMessage({
          action: "runPromptlet",
          promptlet: promptlet,
          text: info.selectionText,
          timestamp: Date.now()
        }).catch(err => {
          console.log("Message send attempted:", err.message);
        });
      });
    });
    return;
  }

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
      : getPromptletsWithDefaultsFlag();

    const promptlet = promptlets[index];
    if (!promptlet) return;

    runPromptlet(tabId, promptlet, selectionText);
  });
}

// -------------------------
// Run promptlet by name
// -------------------------
function runPromptletByName(tabId, promptletName, selectionText) {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const promptlets = (data.promptlets && data.promptlets.length > 0)
      ? data.promptlets
      : getPromptletsWithDefaultsFlag();

    const promptlet = promptlets.find(p => p.name === promptletName);
    if (!promptlet) return;

    runPromptlet(tabId, promptlet, selectionText);
  });
}

// -------------------------
// Core function to execute a promptlet (Opens Panel)
// -------------------------
function runPromptlet(tabId, promptlet, selectionText) {
  console.log(`Running promptlet: ${promptlet.name}`);

  const promptletData = {
    promptlet: promptlet,
    text: selectionText || "",
    timestamp: Date.now()
  };

  try {
    chrome.sidePanel.open({ tabId: tabId }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error opening side panel:", chrome.runtime.lastError);
        return;
      }
      
      chrome.storage.local.set({ pendingPromptlet: promptletData }, () => {
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
    
    // --- NEW: Handle prompt execution request from sidepanel ---
    case "executePrompt":
      console.log("[BG] Executing prompt request from sidepanel.");
      
      (async () => {
        try {
          const { apiKey } = await chrome.storage.local.get("apiKey");

          if (!apiKey || apiKey.trim() === "") {
            throw new Error("API key not found. Please add it in Manage Promptlets.");
          }

          const result = await callOpenAI(
            msg.prompt,
            apiKey,
            msg.promptlet.model || "gpt-4o",
            msg.promptlet.temperature ?? 1,
            msg.promptlet.maxTokens || 3000,
            msg.promptlet.topP ?? 1,
            msg.promptlet.frequencyPenalty ?? 0,
            msg.promptlet.presencePenalty ?? 0
          );
          
          sendResponse({ success: true, result: result });

        } catch (err) {
          console.error("[BG] API Execution Error:", err.message);
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true; // Keep channel open for async response

    case "runPromptlet":
      if (msg.name && msg.tabId) {
        runPromptletByName(msg.tabId, msg.name, msg.text || "");
      }
      sendResponse({ success: true });
      break;

    case "getPendingPromptlet":
      sendResponse({ data: pendingPromptletData });
      pendingPromptletData = null;
      break;

    case "runPromptletChain":
      console.log("Promptlet chaining not yet implemented");
      sendResponse({ success: false, error: "Chaining not implemented" });
      break;

    case "addUserPromptlet":
      chrome.storage.local.get({ promptlets: [] }, (data) => {
        const promptlets = data.promptlets || [];
        promptlets.push(msg.promptlet);
        chrome.storage.local.set({ promptlets }, () => {
          buildContextMenus();
          sendResponse({ success: true });
        });
      });
      return true;

    case "deleteUserPromptlet":
      chrome.storage.local.get({ promptlets: [] }, (data) => {
        const promptlets = data.promptlets || [];
        const filtered = promptlets.filter(p => p.id !== msg.id);
        chrome.storage.local.set({ promptlets: filtered }, () => {
          buildContextMenus();
          sendResponse({ success: true });
        });
      });
      return true;

    case "updatePromptlets":
      chrome.storage.local.set({ promptlets: msg.promptlets }, () => {
        buildContextMenus();
        sendResponse({ success: true });
      });
      return true;

    case "resetToDefaults":
      // Reset to default promptlets (Uses helper)
      const resetPromptlets = getPromptletsWithDefaultsFlag();
      chrome.storage.local.set({ promptlets: resetPromptlets }, () => {
        buildContextMenus();
        sendResponse({ success: true, count: resetPromptlets.length });
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

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log("PromptIt background service worker loaded");