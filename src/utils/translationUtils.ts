// src/utils/translationUtils.ts

import { AIAnalysisOutput } from "../types/api";

/**
 * Creates a token-efficient, numbered JSON object from a source object,
 * along with a map to reconstruct the original keys later.
 *
 * @param sourceObject The object with string keys and values to be translated.
 * @returns An object containing the numbered JSON and the number-to-key mapping.
 */
export const createNumberedJsonForTranslation = (
  sourceObject: Record<string, string>
): { numberedJson: Record<string, string>; numberToKeyMap: Map<string, string> } => {
  const numberedJson: Record<string, string> = {};
  const numberToKeyMap = new Map<string, string>();
  let counter = 0;

  for (const key in sourceObject) {
    if (Object.prototype.hasOwnProperty.call(sourceObject, key)) {
      const numberKey = counter.toString();
      numberToKeyMap.set(numberKey, key);
      numberedJson[numberKey] = sourceObject[key];
      counter++;
    }
  }

  return { numberedJson, numberToKeyMap };
};

/**
 * Reconstructs a JSON object with its original keys from a translated,
 * numbered JSON object and a number-to-key map.
 *
 * @param translatedNumberedJson The AI-translated object with numbered keys.
 * @param numberToKeyMap The map to convert numbered keys back to original string keys.
 * @returns A new object with the original keys and translated values.
 */
export const reconstructTranslatedJson = (
  translatedNumberedJson: Record<string, string>,
  numberToKeyMap: Map<string, string>
): Record<string, string> => {
  const reconstructedJson: Record<string, string> = {};
  for (const numberKey in translatedNumberedJson) {
    if (Object.prototype.hasOwnProperty.call(translatedNumberedJson, numberKey)) {
      const originalKey = numberToKeyMap.get(numberKey);
      if (originalKey) {
        reconstructedJson[originalKey] = translatedNumberedJson[numberKey];
      } else {
        console.warn(`Could not find original key for numbered key: ${numberKey}`);
      }
    }
  }
  return reconstructedJson;
};

/**
 * Flattens a complex analysis object into a simple key-value record
 * suitable for translation.
 *
 * @param analysis The original analysis response.
 * @returns A flat object with unique keys and text values to be translated.
 */
export const flattenAnalysisForTranslation = (analysis: AIAnalysisOutput): Record<string, string> => {
    const flatSource: Record<string, string> = { 'analysis_summary': analysis.analysis_summary };
    analysis.findings.forEach((finding, index) => {
        flatSource[`finding_${index}_display_name`] = finding.display_name;
        flatSource[`finding_${index}_explanation`] = finding.explanation;
    });
    return flatSource;
};

/**
 * Merges a flat record of translated text back into a deep copy of the
 * original analysis object structure.
 *
 * @param originalAnalysis The original, untranslated analysis object.
 * @param translatedFlat The flat record containing the translated texts.
 * @returns A new analysis object with the translated text merged in.
 */
export const reconstructAnalysisFromTranslation = (
    originalAnalysis: AIAnalysisOutput,
    translatedFlat: Record<string, string>
): AIAnalysisOutput => {
    const translatedAnalysis = JSON.parse(JSON.stringify(originalAnalysis));

    translatedAnalysis.analysis_summary = translatedFlat['analysis_summary'] || originalAnalysis.analysis_summary;

    translatedAnalysis.findings.forEach((finding: any, index: number) => {
        finding.display_name = translatedFlat[`finding_${index}_display_name`] || finding.display_name;
        finding.explanation = translatedFlat[`finding_${index}_explanation`] || finding.explanation;
    });

    return translatedAnalysis;
};
