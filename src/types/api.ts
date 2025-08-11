// src/types/api.ts
export interface PatternFinding {
  pattern_name: string;
  display_name: string; // The translated name for UI display
  specific_quote: string;
  explanation: string;
  strength: number; // A score from 1 (subtle) to 10 (overt)
  category: string; // Will contain a key like "category_interpersonal_psychological"
}

export interface AIAnalysisOutput {
  analysis_summary: string;
  findings: PatternFinding[];
}

export interface AIModel {
  name: string;
  displayName: string;
  supportedGenerationMethods: string[];
  version: string;
  description: string;
}

export interface GroupedModels {
  preview: AIModel[];
  stable: AIModel[];
  experimental?: AIModel[]; // Added experimental category
}
