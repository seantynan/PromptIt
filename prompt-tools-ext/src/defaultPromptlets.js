// =========================================================================
// Default Promptlets Configuration
// These promptlets are installed on first use
// =========================================================================

const model = "gpt-5-mini"; // New recommended default for speed and cost-efficiency

const DEFAULT_PROMPTLETS = [
  {
    name: "Summarise",
    emoji: "💡",
    prompt: "You are an expert editor. Summarise the selected text clearly and concisely. Capture the main ideas and key details without losing the original tone. Use bullet points if the text contains multiple distinct topics. Input text: ",
    model: model,
    maxTokens: 1500,
    outputStructure: ["main"]
  },
  {
    name: "Rephrase",
    emoji: "✏️",
      prompt: "Rewrite the selected text to improve clarity, flow, and readability. Ensure the original meaning is strictly preserved. Aim for a professional, natural, and engaging tone. Fix any grammatical errors. Input text: ",
    model: model,
    maxTokens: 1500,
    outputStructure: ["main"]
  },
  {
    name: "Verify",
    emoji: "✅",
      prompt: `You are an evidence-driven analyst. If the following text does not contain a verifiable claim or fact, state 'No verifiable claim detected' and explain why. Evaluate the CLAIM below as TRUE, MOSTLY TRUE, MISLEADING, FALSE, or UNVERIFIABLE, and provide a confidence score (0–100%). 

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
    maxTokens: 4000,
    outputStructure: ["main"]
  },
  {
    // This allows users to test the maximum reasoning capabilities of the model
    name: "Max Reasoning",
    emoji: "👑",
      prompt: `Analyze the following input carefully. Use deep internal reasoning if needed,
but only output the final answer, not your reasoning steps.
Be accurate and concise.

Input: `,
    model: "gpt-5.2",
    maxTokens: 16000,
    outputStructure: ["main"]
  },
  {
    name: "Learn a Language",
    emoji: "🌍",
      prompt: `You are an expert language tutor. 1. Detect the language of the input. 2. Translate it into natural, fluent English. 3. Provide a section called 'Language Notes' explaining key vocabulary, grammar rules, or idioms found in the source text useful for an intermediate learner. Header format: '### Translated from [Language]': 

`,
    model: model,
    maxTokens: 4000,
    outputStructure: ["main"]
  },
  {
    name: "Recipe Creator",
    emoji: "🍽️",
      prompt: `You are a professional chef and recipe developer. Read the text below — it may describe a meal, ingredient combination, or restaurant-style dish — and turn it into a complete, well-structured recipe. If the input is not food-related, creatively invent a metaphorical recipe based on the theme of the text.

Include:

Recipe title.

Serving size.

Short description (style, flavor profile, or context).

Ingredients list with clear quantities and units.

Step-by-step method with numbered instructions.

Optional notes or variations (e.g., substitutions, serving ideas, dietary adjustments):

`,
    model: model,
    maxTokens: 4000,
    outputStructure: ["main", "notes"]
  },
  {
    name: "Nutrition Analyser",
    emoji: "🍎",
    prompt: `You are a **nutrition analyst**. The user will provide a food item, meal description or daily food log. 
    Your task is to **analyze, evaluate, and suggest healthier alternatives.** the diet in a structured way.
    List key nutrients, health benefits, and any concerns (e.g. high fat, sodium). 
    Keep it clear and constructive.
    Force Markdown tables for the nutrient breakdown.
    Finish by rating the nutritional quality out of ten`,
    model: model,
    maxTokens: 4000,
    outputStructure: ["main", "notes"]
    },
    {
        name: "Crossword Solver",
        emoji: "🧩",
        prompt: `You are an expert crossword solver, for both simple and cryptic crosswords.
        Solve the clue step- by - step and give:
        1. The exact answer in ** bold **
        2. A clear explanation of definition + wordplay
        3. Letter count confirmation
        4. Explicitly classify the clue type (Anagram, Double Definition, Hidden Word, etc.).

        Clue: `,
        model: "gpt-5.1",
        maxTokens: 15000,
        outputStructure: ["main"]
    },
];

// Export for use in other modules
// Note: In Chrome extensions with manifest v3, we use this pattern
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_PROMPTLETS;
}