function renderPromptlets(list) {
  const container = document.getElementById("promptlets");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p style='color: #999;'>No promptlets yet. Click 'Reset to Defaults' or add your own.</p>";
    return;
  }

  list.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "promptlet";
    div.innerHTML = `
      <input value="${p.emoji || ''}" placeholder="Emoji" maxlength="2" data-index="${i}" data-field="emoji" />
      <input value="${p.name || ''}" placeholder="Name" data-index="${i}" data-field="name" />
      <textarea placeholder="Prompt text..." data-index="${i}" data-field="prompt">${p.prompt || ''}</textarea>
      <button data-index="${i}" class="delete">🗑️ Delete</button>
    `;
    container.appendChild(div);
  });

  // Update on change
  document.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", (e) => {
      const index = e.target.dataset.index;
      const field = e.target.dataset.field;
      list[index][field] = e.target.value;
      chrome.storage.local.set({ promptlets: list });
    });
  });

  // Delete button
  document.querySelectorAll(".delete").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      list.splice(index, 1);
      chrome.storage.local.set({ promptlets: list }, () => renderPromptlets(list));
    })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  // Load and render promptlets
  chrome.storage.local.get({ promptlets: [], apiKey: "" }, (data) => {
    renderPromptlets(data.promptlets);
    document.getElementById("apiKey").value = data.apiKey || "";
  });

  // Add new promptlet
  document.getElementById("add").addEventListener("click", () => {
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      data.promptlets.push({ emoji: "✨", name: "New Promptlet", prompt: "" });
      chrome.storage.local.set({ promptlets: data.promptlets }, () =>
        renderPromptlets(data.promptlets)
      );
    });
  });

  // Reset to defaults
  document.getElementById("reset").addEventListener("click", () => {
    if (confirm("Reset to default promptlets? This will remove all your custom promptlets.")) {
      chrome.runtime.sendMessage({ action: "resetToDefaults" }, (response) => {
        if (response && response.success) {
          alert(`Reset complete! Loaded ${response.count} default promptlets.`);
          chrome.storage.local.get({ promptlets: [] }, (data) => {
            renderPromptlets(data.promptlets);
          });
        }
      });
    }
  });

  // Save API key
  document.getElementById("saveKey").addEventListener("click", () => {
    const key = document.getElementById("apiKey").value.trim();
    chrome.storage.local.set({ apiKey: key }, () => {
      alert("API key saved locally.");
    });
  });
});