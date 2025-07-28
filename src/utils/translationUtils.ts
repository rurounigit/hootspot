// src/utils/translationUtils.ts

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