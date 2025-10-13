import { PROMPTS } from './prompts.js';
import { callOpenAI } from './openai.js';

// Current selected mode
let currentMode = 'prettify';

// --- MODE SELECTION ---
document.querySelectorAll('#modeSelector button').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons
    document.querySelectorAll('#modeSelector button').forEach(b => b.classList.remove('active'));
    // Highlight selected button
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    console.log(`Mode selected: ${currentMode}`);
  });
});

// --- RUN BUTTON ---
const runButton = document.getElementById('prettifyBtn');
const inputBox = document.getElementById('leftBox');
const outputBox = document.getElementById('rightBox');
const feedbackBox = document.getElementById('feedbackBox');

runButton.addEventListener('click', async () => {
  const inputText = inputBox.value.trim();
  if (!inputText) {
    feedbackBox.textContent = '⚠️ Please enter some text first.';
    return;
  }

  feedbackBox.textContent = '⏳ Processing...';

  try {
    const promptTemplate = PROMPTS[currentMode] || PROMPTS.prettify;
    const fullPrompt = `${promptTemplate}\n\n${inputText}`;

    const result = await callOpenAI(fullPrompt);

    outputBox.value = result.output || '';
    feedbackBox.textContent = result.changeLog || '✅ Done';
  } catch (err) {
    console.error(err);
    feedbackBox.textContent = `❌ Error: ${err.message}`;
  }
});
