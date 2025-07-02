
export interface GeminiFinding {
  pattern_name: string;
  specific_quote: string;
  explanation: string;
}

export interface GeminiAnalysisResponse {
  analysis_summary: string;
  findings: GeminiFinding[];
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of chunks can be added here if needed
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Other grounding metadata fields can be added here
}

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
  // Other candidate fields can be added here
}

// This represents the structure we expect from the Gemini API response
// when grounding metadata is involved.
export interface GeminiApiResponseWithGrounding {
  text: string; // The main textual response
  candidates?: Candidate[];
  // Include other relevant fields from GenerateContentResponse if needed
}

export interface GeminiModel {
  name: string;
  displayName: string;
  supportedGenerationMethods: string[];
  thinking?: boolean;
  version: string;
}
