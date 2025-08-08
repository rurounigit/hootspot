import { OPENROUTER_API_BASE_URL } from '../constants';

export const getOpenRouterModels = async (apiKey: string) => {
  const response = await fetch(`${OPENROUTER_API_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch OpenRouter models: ${errorData.error.message}`);
  }

  const { data } = await response.json();
  return data;
};

export const testOpenRouterConnection = async (apiKey: string, model: string) => {
  if (!apiKey) {
    throw new Error('OpenRouter API key is missing.');
  }

  if (!model) {
    throw new Error('OpenRouter model is not selected.');
  }

  const response = await fetch(`${OPENROUTER_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Hello' }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter API request failed: ${errorData.error.message}`);
  }
};
