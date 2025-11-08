// =========================================================================
// Default Promptlets Configuration
// These promptlets are installed on first use
// =========================================================================

const model = "gpt-4o"; // "gpt-5-mini"; //"gpt-4o-mini";  // Or "gpt-4o" for top-tier

const DEFAULT_PROMPTLETS = [
  {
    name: "Summarise",
    emoji: "💡",
    prompt: "Summarise this text clearly and concisely.",
    model: model,
    outputStructure: ["main"]
  },
  {
    name: "Rephrase",
    emoji: "✏️",
    prompt: "Rephrase this text to improve clarity and flow.",
    model: model,
    outputStructure: ["main"]
  },

    {
    name: "Verify",
    emoji: "✅",
    prompt: `You are an evidence-driven analyst. Evaluate the CLAIM below as TRUE, MOSTLY TRUE, MISLEADING, FALSE, or UNVERIFIABLE, and provide a confidence score (0–100%). 

Method:
1. Break the claim into testable parts.
2. Cite authoritative, recent sources (official statistics, peer-reviewed studies, government data) when possible.
3. Present key numbers clearly (baselines, denominators, sample sizes, margins of error if available).
4. Identify distortions (cherry-picking, correlation-causation errors, emotional framing).
5. Summarize strongest counter-evidence and its impact on your conclusion.

Format:
- VERDICT (CONFIDENCE%)
- Original statistic from source
- Missing context or distortions
- Key counter-evidence

CLAIM:

`,
    model: model,
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

Append some notes in a concise and elegant way for the Intermediate Level student of the language. The notes should pick up on some interesting aspects of the translation, so as to encourage the understanding and curiosity of the student.

The user's text to be translated to English is as follows: 

`,
    model: model,
    outputStructure: ["main"]
  },
    {
    name: "Nutrition Analyser",
    emoji: "🍎",
    prompt: `You are a **nutrition analyst**. The user will provide a food item, meal description or daily food log. 
    Your task is to **analyze, evaluate, and optimize** the diet in a structured way. 
    List key nutrients, health benefits, and any concerns (e.g. high fat, sodium). 
    Keep it clear and constructive.
    Finish by rating the nutritional quality out of ten`,
    model: model,
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
    model: model,
    outputStructure: ["main", "notes"]
  },
];

// Export for use in other modules
// Note: In Chrome extensions with manifest v3, we use this pattern
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_PROMPTLETS;
}