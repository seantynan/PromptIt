// utils.js
// General-purpose helper utilities for the Prettifier app.

/**
 * Copy text to clipboard and show feedback in the Feedback Box.
 * @param {string} text - The text to copy.
 * @param {HTMLElement} feedbackBox - The feedback box element.
 */
export function copyToClipboard(text, feedbackBox) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showFeedback(feedbackBox, "✅ Output copied to clipboard.", "success");
    })
    .catch(err => {
      showFeedback(feedbackBox, `❌ Failed to copy text: ${err}`, "error");
    });
}

/**
 * Show a feedback message in the Feedback Box with status highlighting.
 * @param {HTMLElement} box - The feedback box element.
 * @param {string} message - The feedback text.
 * @param {string} type - "info", "success", or "error".
 */
export function showFeedback(box, message, type = "info") {
  box.textContent = message;
  box.className = `feedback-box ${type}`;
}

/**
 * Dynamically resize a textarea to fit its content.
 * @param {HTMLTextAreaElement} textarea - The textarea element.
 */
export function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

/**
 * Prevent input if text exceeds limit.
 * @param {HTMLTextAreaElement} textarea
 * @param {number} limit
 * @param {HTMLElement} feedbackBox
 */
export function enforceMaxLength(textarea, limit, feedbackBox) {
  textarea.addEventListener("input", () => {
    if (textarea.value.length > limit) {
      textarea.value = textarea.value.slice(0, limit);
      showFeedback(feedbackBox, `⚠️ Input limited to ${limit.toLocaleString()} characters.`, "error");
    }
  });
}
