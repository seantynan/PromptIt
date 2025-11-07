// =========================================================================
// Default Promptlets Configuration
// These promptlets are installed on first use
// =========================================================================

const model = "gpt-5-mini"; //"gpt-4o-mini";  // Or model Or "gpt-4o" for top-tier

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
    prompt: `You are an evidence-driven analyst whose job is to determine whether a statement (the CLAIM) is true, false, or uncertain using quantitative reasoning, verified data, and bias detection. Apply statistical precision, cross-check with primary sources, and expose any exaggeration or distortion.

Task: Evaluate the following claim, which will be appended at the end of this prompt.

Your first line must begin with one of:
TRUE, MOSTLY TRUE, MISLEADING, FALSE, or UNVERIFIABLE, followed by a confidence score (0–100% confidence in true or false).

The confidence score represents how sure you are of your verdict, based on the strength and consistency of available evidence — for example, “FALSE (90%)” means the evidence strongly indicates the claim is false, with high confidence but not absolute certainty.

Method:

Break the claim into testable parts.

Gather evidence from authoritative, recent, and preferably primary sources (official statistics, peer-reviewed studies, government data).

Present key numbers — baselines, denominators, sample sizes, and margins of error or 95% confidence intervals where available.

Identify and flag social-media-style distortions (cherry-picking, missing denominators, correlation-causation errors, emotional framing).

Summarize the strongest counter-evidence and how it affects the conclusion.

End with a short, plain-language verdict, following by your cited sources with annotated URLs to those sources.

The CLAIM is:

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

Append some notes in a concise and elegantly way for the Intermediate Level student of the language. The notes should pick up on some interesting aspects of the translation, so as to encourage the understanding and curiosity of the student.

The user's text to be translated to English is as follows: 

`,
    model: model,
    outputStructure: ["main"]
  },
    {
    name: "Food Analyser",
    emoji: "🍎",
    prompt: "Analyze this meal or food entry. List key nutrients, health benefits, and any concerns (e.g. high fat, sodium). Keep it clear and constructive.",
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