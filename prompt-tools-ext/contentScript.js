window.prettifierReplaceSelection = (text) => {
  const activeEl = document.activeElement;

  // 1️⃣ TEXTAREA or INPUT
  if (activeEl && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT")) {
    const start = activeEl.selectionStart;
    const end = activeEl.selectionEnd;
    activeEl.value =
      activeEl.value.slice(0, start) + text + activeEl.value.slice(end);
    activeEl.selectionStart = activeEl.selectionEnd = start + text.length;
    activeEl.focus();
    return;
  }

  // 2️⃣ Gmail / Google Keep or other contenteditable
  // Gmail editor: div[aria-label="Message Body"] inside contenteditable
  const editor = activeEl.closest('[contenteditable="true"]') ||
                 document.querySelector('[aria-label="Message Body"] [contenteditable="true"]');

  if (!editor) {
    // fallback: try any contenteditable
    const anyEditable = document.querySelector('[contenteditable="true"]');
    if (anyEditable) {
      insertTextAtSelection(anyEditable, text);
    }
    return;
  }

  insertTextAtSelection(editor, text);
};

// Helper function to insert text with line breaks
function insertTextAtSelection(editor, text) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const fragment = document.createDocumentFragment();
  text.split("\n").forEach((line, i) => {
    fragment.appendChild(document.createTextNode(line));
    if (i < text.split("\n").length - 1) fragment.appendChild(document.createElement("br"));
  });

  range.insertNode(fragment);
  sel.collapseToEnd();
  editor.focus();
}
