// src/popup.js

document.addEventListener('DOMContentLoaded', () => {
    // Buttons defined in src/popup.html
    const manageBtn = document.getElementById('manageBtn');
    const scratchpadBtn = document.getElementById('scratchpadBtn');
    const helpBtn = document.getElementById('helpBtn');

    // --- 1. Manage Promptlets Button Logic ---
    manageBtn.addEventListener('click', () => {
        // Since 'options_page' is set in manifest, we use chrome.runtime.openOptionsPage()
        chrome.runtime.openOptionsPage();
        window.close(); // Close the popup window after clicking
    });

    // --- 1.5 Scratchpad Page Button Logic ---
    if (scratchpadBtn) {
        scratchpadBtn.addEventListener('click', () => {
            const scratchpadUrl = chrome.runtime.getURL('src/scratchpad.html');
            chrome.tabs.query({ url: scratchpadUrl }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    const [scratchpadTab] = tabs;
                    chrome.tabs.update(scratchpadTab.id, { active: true });
                    chrome.windows.update(scratchpadTab.windowId, { focused: true });
                } else {
                    chrome.tabs.create({ url: scratchpadUrl });
                }
                window.close();
            });
        });
    }

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