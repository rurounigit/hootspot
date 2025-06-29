// src/lexicon-structure.ts

// This file is now the single source of truth for all pattern definitions.

// 1. Define simple, programmatic keys for each pattern.
export const PATTERN_KEYS = {
  GUILT_TRIPPING: "Guilt Tripping",
  GASLIGHTING: "Gaslighting",
  THREATENING_COERCION: "Threatening / Coercion",
  INVALIDATION_MINIMIZING: "Invalidation / Minimizing",
  DEFLECTION_BLAME: "Deflection / Shifting Blame",
  DARVO: "DARVO (Deny, Attack, and Reverse Victim and Offender)",
  MOVING_GOALPOSTS: "Moving the Goalposts",
  LOVE_BOMBING: "Love Bombing",
  PROJECTION: "Projection",
  SPLITTING: "Splitting (or Black-and-White Thinking)",
  BACKHANDED_COMPLIMENT: "The Backhanded Compliment",
  WEAPONIZED_INCOMPETENCE: "Weaponized Incompetence",
  SILENT_TREATMENT: "The Silent Treatment (Stonewalling)",
  STRAW_MAN: "The Straw Man Fallacy",
  CO_OPTATION_DISSENT: "The Co-optation of Dissent: \"Radical\" Language for Status Quo Ends",
  REDEFINING_TERRAIN: "Redefining the Terrain: The \"Culture War\" as Economic Distraction",
  FORECLOSURE_ALTERNATIVES: "The Foreclosure of Alternatives: \"There Is No Alternative\" (TINA) 2.0",
  REFLEXIVE_IMPOTENCE: "Manufacturing Reflexive Impotence: \"Both Sides\" and Information Overload",
  PERSONALIZATION_SYSTEMIC: "The Personalization of Systemic Problems",
  DOG_WHISTLING: "Dog-Whistling",
  EUPHEMISM_JARGON: "Euphemism & Jargon",
};

// 2. Create a reverse map to easily get the simple key from the full API name.
const fullNameToKeyMap = new Map<string, string>();
for (const key in PATTERN_KEYS) {
  const fullName = (PATTERN_KEYS as any)[key];
  fullNameToKeyMap.set(fullName, key);
}
export { fullNameToKeyMap };


// 3. Define the chart sections using the simple, reliable keys.
export const LEXICON_SECTIONS_BY_KEY: Record<string, Record<string, string>> = {
  "Interpersonal & Psychological": {
    GUILT_TRIPPING: "Guilt Tripping",
    GASLIGHTING: "Gaslighting",
    THREATENING_COERCION: "Threatening",
    INVALIDATION_MINIMIZING: "Invalidation",
    DEFLECTION_BLAME: "Deflection",
    DARVO: "DARVO",
    MOVING_GOALPOSTS: "Moving Goalposts",
    LOVE_BOMBING: "Love Bombing",
    PROJECTION: "Projection",
    SPLITTING: "Splitting",
  },
  "Covert & Indirect Control": {
    BACKHANDED_COMPLIMENT: "Backhanded Compliment",
    WEAPONIZED_INCOMPETENCE: "Weaponized Incompetence",
    SILENT_TREATMENT: "Silent Treatment",
  },
  "Sociopolitical & Rhetorical": {
    STRAW_MAN: "Straw Man",
    CO_OPTATION_DISSENT: "Co-optation of Dissent",
    REDEFINING_TERRAIN: "Redefining Terrain",
    FORECLOSURE_ALTERNATIVES: "Foreclosure of Alternatives",
    REFLEXIVE_IMPOTENCE: "Reflexive Impotence",
    PERSONALIZATION_SYSTEMIC: "Personalization",
    DOG_WHISTLING: "Dog-Whistling",
    EUPHEMISM_JARGON: "Euphemism/Jargon",
  }
};