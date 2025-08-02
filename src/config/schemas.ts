// src/config/schemas.ts
// Manual JSON schemas for structured outputs across all AI providers

export interface GeminiAnalysisResponseSchema {
  analysis_summary: string;
  findings: GeminiFindingSchema[];
}

export interface GeminiFindingSchema {
  pattern_name: string;        // A concise, descriptive name for the tactic in English
  display_name: string;        // A very short, 1-3 word label in English for chart legend
  specific_quote: string;      // The exact quote from the text that exemplifies the pattern
  explanation: string;         // A detailed explanation in English of why this quote is an example
  strength: number;            // An integer score from 1 to 10
  category: string;            // One of: "category_interpersonal_psychological", "category_covert_indirect_control", or "category_sociopolitical_rhetorical"
}

// JSON Schema for GeminiAnalysisResponse
export const ANALYSIS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    analysis_summary: {
      type: "string",
      description: "A comprehensive summary of the text analysis"
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pattern_name: {
            type: "string",
            description: "A concise, descriptive name for the tactic in English"
          },
          display_name: {
            type: "string",
            description: "A very short, 1-3 word label in English for chart legend"
          },
          specific_quote: {
            type: "string",
            description: "The exact quote from the text that exemplifies the pattern"
          },
          explanation: {
            type: "string",
            description: "A detailed explanation in English of why this quote is an example"
          },
          strength: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "An integer score from 1 to 10 indicating manipulation strength"
          },
          category: {
            type: "string",
            enum: [
              "category_interpersonal_psychological",
              "category_covert_indirect_control",
              "category_sociopolitical_rhetorical"
            ],
            description: "Classification of the pattern into one of three categories"
          }
        },
        required: ["pattern_name", "display_name", "specific_quote", "explanation", "strength", "category"],
        additionalProperties: false
      }
    }
  },
  required: ["analysis_summary", "findings"],
  additionalProperties: false
};

// JSON Schema for UI translation files
export const UI_TRANSLATION_SCHEMA = {
  type: "object",
  description: "UI translation file with string keys and translated values",
  additionalProperties: {
    type: "string"
  }
};

// JSON Schema for analysis translation
export const ANALYSIS_TRANSLATION_SCHEMA = {
  type: "object",
  description: "Analysis translation with numbered keys mapping to translated strings",
  additionalProperties: {
    type: "string"
  }
};
