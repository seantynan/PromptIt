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
  return DEFAULT_PROMPTLETS.map((p, index) => ({
    ...p,
    isDefault: true, // System flag
    isActive: true,   // Default promptlets start active
    defaultIndex: index // Stable index for ordering
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


// Function to open the management page
function openManagePage() {
  const optionsUrl = chrome.runtime.getURL('src/manage.html');

  // Check if the page is already open
  chrome.tabs.query({ url: optionsUrl }, (tabs) => {
    if (tabs.length > 0) {
      // If found, activate the existing tab
      chrome.tabs.update(tabs[0].id, { active: true });
    } else {
      // Otherwise, open a new tab
      chrome.tabs.create({ url: optionsUrl });
    }
  });
}

// Add the listener for the browser action (icon) click
chrome.action.onClicked.addListener(() => {
  openManagePage();
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

  // ... (Code to clear old menus)

  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const promptlets = data.promptlets || [];

    promptlets.forEach((promptlet) => {
      // Check the logic here. Does it only use fields that existed before?
      // For example, if it's using a `for...in` loop, you might need checks:

      if (promptlet.name) { // Ensures it's a valid promptlet object
          // Create the context menu item here.
          // Your context menu logic should not rely on maxTokens, 
          // but if it uses object iteration, ensure it's safe.
          
          chrome.contextMenus.create({
              id: promptlet.name, // Use the promptlet name
              title: `${promptlet.emoji} ${promptlet.name}`, // Use emoji and name
              // ... and so on
          });
      }
    });
  });
  
  isRebuildingMenus = true;
  console.log("Building context menus...");
  
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error("Error removing menus:", chrome.runtime.lastError);
      isRebuildingMenus = false;
      return;
    }
    
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      // Fallback if empty
      const allPromptlets = (data.promptlets && data.promptlets.length > 0)
        ? data.promptlets
        : getPromptletsWithDefaultsFlag();

        // Composite Sort Logic
        const sortedPromptlets = [...allPromptlets].sort((a, b) => {
        // 1. Grouping: Defaults always come before Customs (Defaults = 0, Customs = 1)
        const aGroup = a.isDefault ? 0 : 1;
        const bGroup = b.isDefault ? 0 : 1;
        if (aGroup !== bGroup) return aGroup - bGroup;

        // 2. Ordering within groups
        if (a.isDefault && b.isDefault) {
          // Defaults: Sort by explicit defaultIndex
          return (a.defaultIndex || 0) - (b.defaultIndex || 0);
        } else {
          // Customs: Sort by createdAt (oldest/first created should be first)
          // If createdAt is missing, treat as latest (highest timestamp)
          return (a.createdAt || Infinity) - (b.createdAt || Infinity);
        }
      });

      // FILTER: Only show active promptlets in the right-click menu
      // Treats undefined as true (legacy support)
      const activePromptlets = allPromptlets.filter(p => p.isActive !== false);

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
        activePromptlets.forEach((p, index) => {
          // Construct ID using name to allow robust lookup later
          // Replace spaces with underscores for ID safety
          const safeName = p.name.replace(/\s/g, '_');
          const menuId = `promptlet_${index}_${safeName}`;

          // Get the description, fallback to the prompt snippet if empty
          const descriptionText = p.description || 
                                  (p.prompt ? p.prompt.substring(0, 80) + '...' : '');
          
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

        console.log(`Built ${activePromptlets.length} active context menu items`);
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

  // Parse the promptlet name from the menu ID
  // Expected format: promptlet_INDEX_Name_With_Underscores
  const match = info.menuItemId.match(/^promptlet_\d+_(.+)$/);
  
  if (!match) {
    console.error("Could not parse promptlet ID from menu item");
    return;
  }

  // Revert underscores to spaces to get original name
  const promptletName = match[1].replace(/_/g, ' '); 

  // Check if tab is invalid (side panel = -1, or missing)
  if (!tab || !tab.id || tab.id === -1) {
    console.log("Side panel selection detected.");
    handleSidePanelSelection(promptletName, info.selectionText);
    return;
  }

  // Normal browser tab execution
  runPromptletByName(tab.id, promptletName, info.selectionText);
});

// -------------------------
// Helper: Handle execution when selecting text INSIDE the side panel
// -------------------------
function handleSidePanelSelection(promptletName, text) {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const allPromptlets = data.promptlets || getPromptletsWithDefaultsFlag();
    const promptlet = allPromptlets.find(p => p.name === promptletName);
    
    if (!promptlet) return;
    
    const promptletData = {
      promptlet: promptlet,
      text: text,
      timestamp: Date.now()
    };
    
    // Store data and notify side panel
    chrome.storage.local.set({ pendingPromptlet: promptletData }, () => {
      chrome.runtime.sendMessage({
        action: "runPromptlet",
        promptlet: promptlet,
        text: text,
        timestamp: Date.now()
      }).catch(err => {
        // Message might fail if panel is closed/reloading; storage is the backup
        console.log("Message send attempted:", err.message);
      });
    });
  });
}

// -------------------------
// Run promptlet by Name (Robust lookup)
// -------------------------
function runPromptletByName(tabId, promptletName, selectionText) {
  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const allPromptlets = data.promptlets || getPromptletsWithDefaultsFlag();

    const promptlet = allPromptlets.find(p => p.name === promptletName);
    if (!promptlet) {
      console.error(`Promptlet "${promptletName}" not found`);
      return;
    }

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
    // Open the Side Panel
    chrome.sidePanel.open({ tabId: tabId }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error opening side panel:", chrome.runtime.lastError);
        return;
      }
      
      // Store data for the panel to pick up
      chrome.storage.local.set({ pendingPromptlet: promptletData }, () => {
        // Short delay to ensure panel is listening
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
    
    // --- EXECUTE PROMPT (Secure API Call) ---
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

    // --- OTHER ACTIONS ---
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

    case "resetToDefaults":
      // Reset to default promptlets (Uses helper to ensure flags)
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

// Error handling
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log("PromptIt background service worker loaded");