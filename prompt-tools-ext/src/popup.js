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
        const helpUrl = chrome.runtime.getURL('src/help.html');
        chrome.tabs.query({ url: helpUrl }, (tabs) => {
            if (tabs && tabs.length > 0) {
                const [helpTab] = tabs;
                chrome.tabs.update(helpTab.id, { active: true });
                chrome.windows.update(helpTab.windowId, { focused: true });
            } else {
                chrome.tabs.create({ url: helpUrl });
            }
            window.close();
        });
    });
});
