chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "runPromptlet") {
    runPromptlet(msg.text, msg.prompt);
  }
});

async function runPromptlet(selectedText, prompt) {
  const statusDiv = document.getElementById("status");
  const outputDiv = document.getElementById("output");

  statusDiv.textContent = "Processing…";

  try {
    const { apiKey } = await chrome.storage.local.get("apiKey");
    if (!apiKey) throw new Error("Missing API key. Please add it in settings.");

    const combinedPrompt = `${prompt}\n\n${selectedText}`;
    const result = await callOpenAI(combinedPrompt, apiKey);

    statusDiv.textContent = "Done!";
    outputDiv.textContent = result;
  } catch (err) {
    statusDiv.textContent = "Error";
    outputDiv.textContent = err.message;
  }
}

async function callOpenAI(prompt, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    })
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content.trim();
}
