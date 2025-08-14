import { OPENROUTER_API_BASE_URL } from '../../constants';
import { AIModel } from '../../types/api';

export const fetchModels = async (apiKey: string = ''): Promise<AIModel[]> => {
  try {
    const headers: Record<string, string> = {};
    // Only add Authorization header if apiKey is provided (not empty)
    if (apiKey && apiKey.trim() !== '') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${OPENROUTER_API_BASE_URL}/models`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    const { data } = await response.json();
    // Transform the OpenRouter model data to fit the AIModel interface
    return data.map((model: any) => ({
      name: model.id,
      displayName: model.name,
      supportedGenerationMethods: model.supported_generation_methods || ["generateContent"],
      version: model.version || "1.0", // Version might not always be available
      description: model.description || "",
    }));
  } catch (error) {
    console.error("Failed to fetch models:", error);
    throw error;
  }
};
