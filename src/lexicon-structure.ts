// This file is the single source of truth for all pattern definitions.

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

export const fullNameToKeyMap = new Map<string, string>();
for (const key in PATTERN_KEYS) {
  fullNameToKeyMap.set((PATTERN_KEYS as any)[key], key);
}

// Maps the simple key (e.g., "GASLIGHTING") to its description key
export const keyToDescKeyMap = new Map<string, string>([
  ["GUILT_TRIPPING", "pattern_guilt_tripping_desc"],
  ["GASLIGHTING", "pattern_gaslighting_desc"],
  ["THREATENING_COERCION", "pattern_threatening_coercion_desc"],
  ["INVALIDATION_MINIMIZING", "pattern_invalidation_minimizing_desc"],
  ["DEFLECTION_BLAME", "pattern_deflection_shifting_blame_desc"],
  ["DARVO", "pattern_darvo_desc"],
  ["MOVING_GOALPOSTS", "pattern_moving_the_goalposts_desc"],
  ["LOVE_BOMBING", "pattern_love_bombing_desc"],
  ["PROJECTION", "pattern_projection_desc"],
  ["SPLITTING", "pattern_splitting_desc"],
  ["BACKHANDED_COMPLIMENT", "pattern_the_backhanded_compliment_desc"],
  ["WEAPONIZED_INCOMPETENCE", "pattern_weaponized_incompetence_desc"],
  ["SILENT_TREATMENT", "pattern_the_silent_treatment_desc"],
  ["STRAW_MAN", "pattern_the_straw_man_fallacy_desc"],
  ["CO_OPTATION_DISSENT", "pattern_the_co_optation_of_dissent_desc"],
  ["REDEFINING_TERRAIN", "pattern_redefining_the_terrain_desc"],
  ["FORECLOSURE_ALTERNATIVES", "pattern_the_foreclosure_of_alternatives_desc"],
  ["REFLEXIVE_IMPOTENCE", "pattern_manufacturing_reflexive_impotence_desc"],
  ["PERSONALIZATION_SYSTEMIC", "pattern_the_personalization_of_systemic_problems_desc"],
  ["DOG_WHISTLING", "pattern_dog-whistling_desc"],
  ["EUPHEMISM_JARGON", "pattern_euphemism_jargon_desc"],
]);

export const shortNameToKeyMap = new Map<string, string>();

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

// Populate the shortNameToKeyMap automatically
for (const section in LEXICON_SECTIONS_BY_KEY) {
  for (const key in LEXICON_SECTIONS_BY_KEY[section]) {
    shortNameToKeyMap.set((LEXICON_SECTIONS_BY_KEY[section] as any)[key], key);
  }
}