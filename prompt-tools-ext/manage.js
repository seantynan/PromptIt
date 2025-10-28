function renderPromptlets(list) {
  const container = document.getElementById("promptlets");
  container.innerHTML = "";

  list.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "promptlet";
    div.innerHTML = `
      <input value="${p.emoji}" placeholder="Emoji" maxlength="2" />
      <input value="${p.name}" placeholder="Name" />
      <textarea placeholder="Prompt text...">${p.prompt}</textarea>
      <button data-index="${i}" class="delete">Delete</button>
    `;
    container.appendChild(div);
  });

  document.querySelectorAll(".delete").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      list.splice(index, 1);
      chrome.storage.local.set({ promptlets: list }, () => renderPromptlets(list));
    })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get({ promptlets: [], apiKey: "" }, (data) => {
    renderPromptlets(data.promptlets);
    document.getElementById("apiKey").value = data.apiKey || "";
  });

  document.getElementById("add").addEventListener("click", () => {
    chrome.storage.local.get({ promptlets: [] }, (data) => {
      data.promptlets.push({ emoji: "✨", name: "New Promptlet", prompt: "" });
      chrome.storage.local.set({ promptlets: data.promptlets }, () =>
        renderPromptlets(data.promptlets)
      );
    });
  });

  document.getElementById("saveKey").addEventListener("click", () => {
    const key = document.getElementById("apiKey").value.trim();
    chrome.storage.local.set({ apiKey: key });
    alert("API key saved locally.");
  });
});
