// -------------------
// 1️⃣ Get selected text safely
// -------------------
function getSelectedText() {
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  if (!selection) {
    DocumentApp.getUi().alert("Please select some text first.");
    return null;
  }

  const elements = selection.getRangeElements();
  let selectedText = "";

  elements.forEach(el => {
    const textEl = el.getElement().editAsText?.();
    if (!textEl) return;

    let start = el.getStartOffset();
    let end = el.getEndOffsetInclusive();

    // If start/end are -1, the whole element is selected
    if (start === -1 || end === -1) {
      selectedText += textEl.getText() + "\n";
    } else {
      selectedText += textEl.getText().substring(start, end + 1) + "\n";
    }
  });

  return selectedText.trim();
}

// -------------------
// 2️⃣ Replace selected text safely
// -------------------
function replaceSelection(newText) {
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  if (!selection) return;

  const elements = selection.getRangeElements();
  if (elements.length === 0) return;

  const firstEl = elements[0].getElement().editAsText();
  const firstStart = elements[0].getStartOffset();
  const firstEnd = elements[0].getEndOffsetInclusive();

  // Safe check
  const firstTextLength = firstEl.getText().length;
  const safeStart = Math.max(0, firstStart);
  const safeEnd = Math.min(firstEnd, firstTextLength - 1);

  firstEl.deleteText(safeStart, safeEnd);
  firstEl.insertText(safeStart, newText);

  // Clear remaining elements
  for (let i = 1; i < elements.length; i++) {
    const el = elements[i].getElement().editAsText?.();
    if (!el) continue;
    let start = elements[i].getStartOffset();
    let end = elements[i].getEndOffsetInclusive();
    if (start < 0 || end < 0) {
      el.setText(""); // whole element selected, clear it
    } else {
      const textLength = el.getText().length;
      if (end >= textLength) end = textLength - 1;
      el.deleteText(start, end);
    }
  }

  // Restore selection on new text
  const newRange = doc.newRange()
    .addElement(firstEl, safeStart, safeStart + newText.length - 1)
    .build();
  doc.setSelection(newRange);
}

// -------------------
// 3️⃣ Prettify selected text
// -------------------
function prettifySelectedText() {
  let selectedText = getSelectedText();
  if (!selectedText) return;

  selectedText = selectedText.trim();

  // Build prompt for OpenAI (example)
  const prompt = `You are the Prettifier Engine. Improve clarity, flow, and formatting without altering meaning:\n\n${selectedText}`;

  // Call OpenAI API (replace with your actual call)
  const newText = callOpenAITool(prompt); // synchronous or async depending on your setup

  replaceSelection(newText);
}

// -------------------
// 4️⃣ Menu setup
// -------------------
function onOpen() {
  DocumentApp.getUi()
    .createMenu('📝 PromptIt')
    .addItem('✨ Prettify… Clean up text', 'prettifySelectedText')
    .addItem('🇫🇷 Frenchify… Translate to French', 'frenchifySelectedText')
    .addItem('✉️ Writer… Compose a letter', 'writerSelectedText')
    .addToUi();
}
