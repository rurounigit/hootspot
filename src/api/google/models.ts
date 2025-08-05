// src/api/google/models.ts
import { GeminiModel } from "../../types/api";
import { GroupedModels } from "../../hooks/useModels";

export const fetchModels = async (apiKey: string): Promise<GroupedModels> => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!Array.isArray(data.models)) {
        if (data.error) throw new Error(data.error.message);
        console.warn("API did not return a models array. Response:", data);
        return { preview: [], stable: [] };
    }

    const filteredModels = (data.models as GeminiModel[]).filter(model => {
      const name = model.name.toLowerCase();
      const displayName = model.displayName.toLowerCase();

      if (!model.supportedGenerationMethods.includes("generateContent")) return false;
      if (name.includes("embedding") || name.includes("aqa") || name.includes("imagen") || name.includes("tts") || name.includes("vision")) return false;
      if (displayName.includes("exp")) return false;
      if (displayName.includes("gemini 1.0")) return false;
      if (displayName.includes("cursor testing")) return false;

      return true;
    });

    const modelMap = new Map<string, GeminiModel>();

    filteredModels.forEach(model => {
      const baseName = model.displayName.toLowerCase()
        .replace(/(\s\d{3})$/, '')
        .replace(/(\s\d{2}-\d{2})$/, '')
        .replace(/(-latest)$/, '')
        .trim();

      const existingModel = modelMap.get(baseName);

      if (!existingModel || model.version > existingModel.version) {
        modelMap.set(baseName, model);
      }
    });

    const uniqueModels = Array.from(modelMap.values());

    const sorter = (a: GeminiModel, b: GeminiModel): number => {
        const aIsGemini = a.displayName.toLowerCase().includes('gemini');
        const bIsGemini = b.displayName.toLowerCase().includes('gemini');

        if (aIsGemini && !bIsGemini) return -1;
        if (!aIsGemini && bIsGemini) return 1;

        const regex = /(gemini|gemma)\s(3n|[\d.]+)/i;
        const aMatch = a.displayName.match(regex);
        const bMatch = b.displayName.match(regex);

        if (aMatch && bMatch) {
            const aVersion = aMatch[2].toLowerCase() === '3n' ? 3.1 : parseFloat(aMatch[2]);
            const bVersion = bMatch[2].toLowerCase() === '3n' ? 3.1 : parseFloat(bMatch[2]);
            if (aVersion !== bVersion) return bVersion - aVersion;
        }

        return b.displayName.localeCompare(a.displayName);
    };

    const preview = uniqueModels.filter(m => m.displayName.toLowerCase().includes('preview')).sort(sorter);
    const stable = uniqueModels.filter(m => !m.displayName.toLowerCase().includes('preview')).sort(sorter);

    return { preview, stable };

  } catch (error) {
    console.error("Failed to fetch models:", error);
    throw error;
  }
};