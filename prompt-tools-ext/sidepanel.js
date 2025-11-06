// =========================================================================
// PromptIt Side Panel
// Receives promptlet requests and displays AI output
// =========================================================================

const statusDiv = document.getElementById("status");
const outputDiv = document.getElementById("output");

// -------------------------
// Initialize - Check for pending promptlet data
// -------------------------
console.log("PromptIt side panel loaded");
updateStatus("Ready. Select text and run a promptlet.");

// Check if there's a pending promptlet when side panel opens
checkForPendingPromptlet();

async function checkForPendingPromptlet() {
  try {
    // First try storage
    const { pendingPromptlet } = await chrome.storage.local.get("pendingPromptlet");
    
    if (pendingPromptlet && pendingPromptlet.timestamp) {
      // Check if it's recent (within last 5 seconds)
      const age = Date.now() - pendingPromptlet.timestamp;
      if (age < 5000) {
        console.log("Found pending promptlet in storage");
        await chrome.storage.local.remove("pendingPromptlet");
        runPromptlet(pendingPromptlet.text, pendingPromptlet.promptlet);
        return;
      }
    }

    // Also try asking background script
    chrome.runtime.sendMessage({ action: "getPendingPromptlet" }, (response) => {
      if (response && response.data) {
        console.log("Received pending promptlet from background");
        runPromptlet(response.data.text, response.data.promptlet);
      }
    });
  } catch (err) {
    console.error("Error checking for pending promptlet:", err);
  }
}

// -------------------------
// Listen for messages from background script
// -------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Side panel received message:", msg);

  if (msg.action === "runPromptlet") {
    runPromptlet(msg.text, msg.promptlet);
    sendResponse({ received: true });
  }
});

// -------------------------
// Update status message
// -------------------------
function updateStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.className = isError ? "error" : "";
}

// -------------------------
// Main promptlet execution
// -------------------------
async function runPromptlet(selectedText, promptlet) {
  console.log(`Running: ${promptlet.name}`);
  
  if (!selectedText || selectedText.trim() === "") {
    updateStatus("No text selected", true);
    outputDiv.textContent = "Please select some text and try again.";
    return;
  }

  updateStatus(`Processing with ${promptlet.name}...`);
  outputDiv.textContent = "";

  try {
    // Get API key from storage
    const { apiKey } = await chrome.storage.local.get("apiKey");
    
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("API key not found. Please add it in Manage Promptlets.");
    }

    // Build the combined prompt
    const combinedPrompt = `${promptlet.prompt}\n\n${selectedText}`;
    
    // Call OpenAI API
    const result = await callOpenAI(combinedPrompt, apiKey, promptlet.model || "gpt-3.5-turbo");

    // Display result
    updateStatus("✓ Done!");
    displayOutput(result, promptlet);

  } catch (err) {
    console.error("Error running promptlet:", err);
    updateStatus("Error", true);
    outputDiv.innerHTML = `
      <div style="color: red; padding: 10px; background: #fee; border-radius: 4px;">
        <strong>Error:</strong> ${err.message}
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #666;">
        ${err.message.includes("API key") ? 
          'Go to <a href="#" id="openManage">Manage Promptlets</a> to set your API key.' : 
          'Check the console for details.'}
      </div>
    `;

    // Add click handler for manage link
    const manageLink = document.getElementById("openManage");
    if (manageLink) {
      manageLink.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
    }
  }
}

// -------------------------
// Display output with structure parsing
// -------------------------
function displayOutput(text, promptlet) {
  // Simple structured output parsing
  const sections = parseStructuredOutput(text);
  
  if (sections.length > 1) {
    // Multiple sections detected
    outputDiv.innerHTML = "";
    sections.forEach(section => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className = "section";
      
      if (section.title) {
        const titleEl = document.createElement("strong");
        titleEl.textContent = section.title;
        sectionDiv.appendChild(titleEl);
      }
      
      const contentEl = document.createElement("pre");
      contentEl.textContent = section.content;
      sectionDiv.appendChild(contentEl);
      
      outputDiv.appendChild(sectionDiv);
    });
  } else {
    // Single output - display as plain text with proper wrapping
    outputDiv.innerHTML = "";
    const textNode = document.createTextNode(text);
    outputDiv.appendChild(textNode);
  }

  // Add copy button
  addCopyButton(text);
}

// -------------------------
// Parse structured output (basic implementation)
// -------------------------
function parseStructuredOutput(text) {
  const sections = [];
  
  // Check for common section markers
  const sectionRegex = /^(Main Output|Notes|Commentary|Change Log|Warnings?):\s*$/gim;
  const matches = [...text.matchAll(sectionRegex)];
  
  if (matches.length === 0) {
    // No sections found, return as single section
    return [{ title: null, content: text }];
  }
  
  // Split into sections
  let lastIndex = 0;
  matches.forEach((match, i) => {
    const title = match[1];
    const startIndex = match.index + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index : text.length;
    const content = text.substring(startIndex, endIndex).trim();
    
    sections.push({ title, content });
  });
  
  return sections;
}

// -------------------------
// Add copy button
// -------------------------
function addCopyButton(text) {
  const existingCopyBtn = document.getElementById("copyBtn");
  if (existingCopyBtn) existingCopyBtn.remove();
  
  const existingCloseBtn = document.getElementById("closeBtn");
  if (existingCloseBtn) existingCloseBtn.remove();

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.id = "copyBtn";
  copyBtn.textContent = "📋 Copy Output";
  
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = "✓ Copied!";
      setTimeout(() => {
        copyBtn.textContent = "📋 Copy Output";
      }, 2000);
    });
  });
  
  document.body.appendChild(copyBtn);
  
  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.id = "closeBtn";
  closeBtn.textContent = "✕ Close";
  
  closeBtn.addEventListener("click", () => {
    window.close();
  });
  
  document.body.appendChild(closeBtn);
}

// -------------------------
// Call OpenAI API
// -------------------------
async function callOpenAI(prompt, apiKey, model = "gpt-3.5-turbo") {
  console.log(`Calling OpenAI with model: ${model}`);
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `API error: ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// -------------------------
// Handle connection from background script (alternative method)
// -------------------------
chrome.runtime.onConnect.addListener((port) => {
  console.log("Port connected:", port.name);
  
  if (port.name === "PromptItChannel") {
    port.onMessage.addListener((msg) => {
      console.log("Message via port:", msg);
      if (msg.action === "runPromptlet") {
        runPromptlet(msg.text, msg.promptlet);
      }
    });
  }
});

console.log("PromptIt side panel ready");