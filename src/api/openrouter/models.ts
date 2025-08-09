import { OPENROUTER_API_BASE_URL } from '../../constants';

export const fetchModels = async (apiKey: string): Promise<any[]> => {
  try {
    const response = await fetch(`${OPENROUTER_API_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch models:", error);
    throw error;
  }
};