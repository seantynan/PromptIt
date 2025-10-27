const titleInput = document.getElementById("promptletTitle");
const textInput = document.getElementById("promptletText");
const addBtn = document.getElementById("addPromptletBtn");
const listDiv = document.getElementById("userPromptletsList");

// Load user promptlets from storage
function loadUserPromptlets() {
  chrome.storage.local.get({ userPromptlets: [] }, (result) => {
    listDiv.innerHTML = "";
    result.userPromptlets.forEach(p => {
      const div = document.createElement("div");
      div.className = "promptlet";
      div.innerHTML = `
        <strong>${p.title}</strong>
        <pre>${p.prompt}</pre>
        <button data-id="${p.id}">Delete</button>
      `;
      listDiv.appendChild(div);
    });

    // Attach delete listeners
    listDiv.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => deletePromptlet(btn.dataset.id));
    });
  });
}

// Add new promptlet
addBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const prompt = textInput.value.trim();
  if (!title || !prompt) return alert("Title and prompt text are required.");

  const id = `user_${Date.now()}`; // unique ID
  const newPromptlet = { id, title, prompt };

  chrome.runtime.sendMessage({ action: "addUserPromptlet", promptlet: newPromptlet }, () => {
    titleInput.value = "";
    textInput.value = "";
    loadUserPromptlets();
  });
});

// Delete promptlet
function deletePromptlet(id) {
  chrome.runtime.sendMessage({ action: "deleteUserPromptlet", id }, () => {
    loadUserPromptlets();
  });
}

// Initial load
loadUserPromptlets();
