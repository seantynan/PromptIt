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

document.addEventListener('DOMContentLoaded', () => {
    // Buttons defined in src/popup.html
    const manageBtn = document.getElementById('manageBtn');
    const helpBtn = document.getElementById('helpBtn');

    // --- 1. Manage Promptlets Button Logic ---
    manageBtn.addEventListener('click', () => {
        // Since 'options_page' is set in manifest, we use chrome.runtime.openOptionsPage()
        chrome.runtime.openOptionsPage();
        window.close(); // Close the popup window after clicking
    });

    // --- 2. Help/User Guide Button Logic (NEW) ---
    helpBtn.addEventListener('click', () => {
        // Open the help page in a new tab
        // Note: The path is relative to the extension's root directory
        chrome.tabs.create({
            url: 'src/help.html'
        });
        window.close(); // Close the popup window after clicking
    });
});