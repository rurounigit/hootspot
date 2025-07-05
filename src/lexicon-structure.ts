// src/lexicon-structure.ts

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

// Maps the full pattern name from the API to its translation key for the title.
export const patternNameToI18nKeyMap = new Map<string, string>([
    ["Guilt Tripping", "pattern_guilt_tripping"],
    ["Gaslighting", "pattern_gaslighting"],
    ["Threatening / Coercion", "pattern_threatening_coercion"],
    ["Invalidation / Minimizing", "pattern_invalidation_minimizing"],
    ["Deflection / Shifting Blame", "pattern_deflection_shifting_blame"],
    ["DARVO (Deny, Attack, and Reverse Victim and Offender)", "pattern_darvo"],
    ["Moving the Goalposts", "pattern_moving_the_goalposts"],
    ["Love Bombing", "pattern_love_bombing"],
    ["Projection", "pattern_projection"],
    ["Splitting (or Black-and-White Thinking)", "pattern_splitting"],
    ["The Backhanded Compliment", "pattern_the_backhanded_compliment"],
    ["Weaponized Incompetence", "pattern_weaponized_incompetence"],
    ["The Silent Treatment (Stonewalling)", "pattern_the_silent_treatment"],
    ["The Straw Man Fallacy", "pattern_the_straw_man_fallacy"],
    ["The Co-optation of Dissent: \"Radical\" Language for Status Quo Ends", "pattern_the_co_optation_of_dissent"],
    ["Redefining the Terrain: The \"Culture War\" as Economic Distraction", "pattern_redefining_the_terrain"],
    ["The Foreclosure of Alternatives: \"There Is No Alternative\" (TINA) 2.0", "pattern_the_foreclosure_of_alternatives"],
    ["Manufacturing Reflexive Impotence: \"Both Sides\" and Information Overload", "pattern_manufacturing_reflexive_impotence"],
    ["The Personalization of Systemic Problems", "pattern_the_personalization_of_systemic_problems"],
    ["Dog-Whistling", "pattern_dog-whistling"],
    ["Euphemism & Jargon", "pattern_euphemism_jargon"]
]);

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

// The values are now i18n keys for the short names on the chart.
// The structure maps a section's i18n key to its patterns.
export const LEXICON_SECTIONS_BY_KEY: Record<string, Record<string, string>> = {
  "category_interpersonal_psychological": {
    GUILT_TRIPPING: "pattern_short_guilt_trip",
    GASLIGHTING: "pattern_short_gaslighting",
    THREATENING_COERCION: "pattern_short_threatening",
    INVALIDATION_MINIMIZING: "pattern_short_invalidation",
    DEFLECTION_BLAME: "pattern_short_deflection",
    DARVO: "pattern_short_darvo",
    MOVING_GOALPOSTS: "pattern_short_goalposts",
    LOVE_BOMBING: "pattern_short_love_bomb",
    PROJECTION: "pattern_short_projection",
    SPLITTING: "pattern_short_splitting",
  },
  "category_covert_indirect_control": {
    BACKHANDED_COMPLIMENT: "pattern_short_backhanded_compliment",
    WEAPONIZED_INCOMPETENCE: "pattern_short_weaponized_incompetence",
    SILENT_TREATMENT: "pattern_short_silent_treatment",
  },
  "category_sociopolitical_rhetorical": {
    STRAW_MAN: "pattern_short_straw_man",
    CO_OPTATION_DISSENT: "pattern_short_co-optation",
    REDEFINING_TERRAIN: "pattern_short_redefinition",
    FORECLOSURE_ALTERNATIVES: "pattern_short_foreclosure",
    REFLEXIVE_IMPOTENCE: "pattern_short_reflexive_impotence",
    PERSONALIZATION_SYSTEMIC: "pattern_short_personalization",
    DOG_WHISTLING: "pattern_short_dog-whistling",
    EUPHEMISM_JARGON: "pattern_short_euphemism_jargon",
  }
};