// src/popup.js

document.getElementById('manageBtn').addEventListener('click', () => {
    // 1. Get the URL for the Manage Page
    // Note: We cannot use chrome.tabs.query here because the popup closes too fast.
    const manageUrl = chrome.runtime.getURL('src/manage.html');
    
    // 2. Open the URL in a new tab
    chrome.tabs.create({ url: manageUrl });
    
    // The popup will close automatically after the handler finishes.
});

document.getElementById('helpBtn').addEventListener('click', () => {
    // For now, use a placeholder URL. You can change this to your documentation site.
    const helpUrl = "https://github.com/your-repo/PromptIt/wiki"; 
    
    // Open the help page in a new tab
    chrome.tabs.create({ url: helpUrl });
});