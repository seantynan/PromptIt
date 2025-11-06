// =========================================================================
// Default Promptlets Configuration
// These promptlets are installed on first use
// =========================================================================

const DEFAULT_PROMPTLETS = [
  {
    name: "Summarise",
    emoji: "💡",
    prompt: "Summarise this text clearly and concisely.",
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
    name: "Learn a Language",
    emoji: "🌍",
    prompt: `You are an ai translator that translates from from any language to English. 

The user will provide some text input. 

Your role is to:

Detect the language of the user's text.

Translate the text to English.

Display the translated text, starting with the header: "Translated from <the detected language>"

Append some notes in a concise and elegantly way for the Intermediate Level student of the language. The notes should pick up on some interesting aspects of the translation, so as to encourage the understanding and curiosity of the student.

The user's text to be translated to English is as follows: 

`,
    model: "gpt-3.5-turbo",
    outputStructure: ["main"]
  },
    {
    name: "Food Analyser",
    emoji: "🍎",
    prompt: "Analyze this meal or food entry. List key nutrients, health benefits, and any concerns (e.g. high fat, sodium). Keep it clear and constructive.",
    model: "gpt-3.5-turbo",
    outputStructure: ["main", "notes"]
  },
    {
    name: "Recipe Creator",
    emoji: "🍽️",
    prompt: `You are a professional chef and recipe developer. Read the text below — it may describe a meal, ingredient combination, or restaurant-style dish — and turn it into a complete, well-structured recipe.

Include:

Recipe title.

Serving size.

Short description (style, flavor profile, or context).

Ingredients list with clear quantities and units.

Step-by-step method with numbered instructions.

Optional notes or variations (e.g., substitutions, serving ideas, dietary adjustments):

`,
    model: "gpt-3.5-turbo",
    outputStructure: ["main", "notes"]
  }
];

// Export for use in other modules
// Note: In Chrome extensions with manifest v3, we use this pattern
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_PROMPTLETS;
}