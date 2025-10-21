chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runPromptlet") {
    // Show processing
    document.getElementById('status').innerText = "Processing...";
    document.getElementById('output').innerText = "";

    const promptlet = message.promptlet;
    const text = message.text;

    // Simulate processing delay for now
    setTimeout(() => {
      document.getElementById('status').innerText = "Done!";
      document.getElementById('output').innerText = `Selected Text: ${text}\nPromptlet: ${promptlet}`;
    }, 1000); // 1 second delay
  }
});
