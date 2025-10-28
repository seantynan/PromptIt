const apiKey = "YOUR_OPENAI_API_KEY";
let currentPromptlet = null;
let currentText = "";

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "PromptItChannel") {
    port.onMessage.addListener((msg) => {
      currentPromptlet = msg.promptlet;
      currentText = msg.selectedText || "";
      document.getElementById("promptletName").textContent = msg.promptlet.title;
      document.getElementById("input").value = currentText;
      document.getElementById("status").textContent = "Ready";
    });
  }
});

document.getElementById("runBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("input").value.trim();
  if (!inputText) return;

  document.getElementById("status").textContent = "Processing…";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: currentPromptlet.prompt },
        { role: "user", content: inputText }
      ]
    })
  });

  const data = await response.json();
  const output = data.choices?.[0]?.message?.content || "No response.";
  document.getElementById("output").textContent = output;
  document.getElementById("status").textContent = "Done!";
});
