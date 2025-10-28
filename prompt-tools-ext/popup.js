document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("promptlets");
  const manageBtn = document.getElementById("manage");

  chrome.storage.local.get({ promptlets: [] }, (data) => {
    const list = data.promptlets;
    if (list.length === 0) {
      container.textContent = "No promptlets yet.";
      return;
    }

    list.forEach((p) => {
      const div = document.createElement("div");
      div.className = "promptlet";
      div.innerHTML = `<span class="emoji">${p.emoji || ""}</span> ${p.name}`;
      div.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (prompt, name) => {
              chrome.runtime.sendMessage({ action: "triggerPromptlet", prompt, name });
            },
            args: [p.prompt, p.name]
          });
        });
        window.close();
      });
      container.appendChild(div);
    });
  });

  manageBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});
