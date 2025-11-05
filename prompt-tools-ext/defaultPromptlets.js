// =========================================================================
// Default Promptlets Configuration
// These promptlets are installed on first use
// =========================================================================

const DEFAULT_PROMPTLETS = [
  {
    name: "Summarize",
    emoji: "💡",
    prompt: "Summarize this text clearly and concisely.",
    model: "gpt-3.5-turbo",
    outputStructure: ["main"]
  },
  {
    name: "Rephrase",
    emoji: "✏️",
    prompt: "Rephrase this text to improve clarity and flow.",
    model: "gpt-3.5-turbo",
    outputStructure: ["main"]
  },
  {
    name: "Prettifier",
    emoji: "✨",
    prompt: "Rewrite the text clearly and elegantly, improving structure and readability.",
    model: "gpt-3.5-turbo",
    outputStructure: ["main"]
  },
  {
    name: "FoodAnalyser",
    emoji: "🍎",
    prompt: "Analyze this meal or food entry for nutritional content and health impact. Provide constructive feedback.",
    model: "gpt-3.5-turbo",
    outputStructure: ["main", "notes"]
  },
  {
    name: "Frenchifier",
    emoji: "🇫🇷",
    prompt: "Translate this text to French. Add linguistic notes about interesting translations or idioms used.",
    model: "gpt-3.5-turbo",
    outputStructure: ["main", "notes"]
  },
  {
    name: "TedMotion",
    emoji: "📋",
    prompt: "Draft a concise, formal motion suitable for a council or committee meeting based on this text.",
    model: "gpt-3.5-turbo",
    outputStructure: ["main"]
  }
];

// Export for use in other modules
// Note: In Chrome extensions with manifest v3, we use this pattern
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_PROMPTLETS;
}