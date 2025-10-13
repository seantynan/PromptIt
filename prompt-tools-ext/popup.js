const keyEl = document.getElementById("key");
const saveBtn = document.getElementById("save");
const clearBtn = document.getElementById("clear");

chrome.storage.sync.get("openai_key", data => {
  if (data.openai_key) keyEl.value = data.openai_key;
});

saveBtn.addEventListener("click", () => {
  const v = keyEl.value.trim();
  if (!v) {
    alert("Please paste your OpenAI API key (starting with sk-...)");
    return;
  }
  chrome.storage.sync.set({ openai_key: v }, () => {
    saveBtn.textContent = "Saved ✓";
    setTimeout(() => (saveBtn.textContent = "Save API key"), 1200);
  });
});

clearBtn.addEventListener("click", () => {
  chrome.storage.sync.remove("openai_key", () => {
    keyEl.value = "";
    clearBtn.textContent = "Removed";
    setTimeout(() => (clearBtn.textContent = "Remove API key"), 1200);
  });
});
