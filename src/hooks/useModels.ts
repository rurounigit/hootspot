// src/hooks/useModels.ts

import { useState, useEffect, useCallback } from 'react';
import { GeminiModel, GroupedModels } from '../types/api';
import { fetchModels as fetchGoogleModels } from '../api/google/models';
import { fetchLMStudioModels } from '../api/lm-studio';
import { fetchOllamaModels } from '../api/ollama';

import { getOpenRouterModels } from '../api/open-router';

interface UseModelsProps {
    serviceProvider: 'cloud' | 'local';
    cloudProvider: 'google' | 'openrouter';
    localProviderType: 'lm-studio' | 'ollama';
    apiKey: string | null;
    openRouterApiKey: string | null;
    lmStudioUrl: string;
    ollamaUrl: string;
    showAllVersions: boolean;
}

export const useModels = ({ serviceProvider, cloudProvider, localProviderType, apiKey, openRouterApiKey, lmStudioUrl, ollamaUrl, showAllVersions }: UseModelsProps) => {
  const [models, setModels] = useState<GroupedModels>({ preview: [], stable: [], experimental: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setModels({ preview: [], stable: [], experimental: [] });

    try {
        if (serviceProvider === 'cloud') {
            if (cloudProvider === 'google' && apiKey) {
                const fetchedModels = await fetchGoogleModels(apiKey, showAllVersions);
                setModels(fetchedModels);
            } else if (cloudProvider === 'openrouter' && openRouterApiKey) {
                const fetchedModels = await getOpenRouterModels(openRouterApiKey);
                setModels({ preview: [], stable: fetchedModels, experimental: [] });
            }
        } else if (serviceProvider === 'local') {
            let fetchedModels: GeminiModel[] = [];
            if (localProviderType === 'lm-studio' && lmStudioUrl) {
                fetchedModels = await fetchLMStudioModels(lmStudioUrl);
            } else if (localProviderType === 'ollama' && ollamaUrl) {
                fetchedModels = await fetchOllamaModels(ollamaUrl);
            }
            // Local providers don't have categories, so we put them all in stable
            setModels({ preview: [], stable: fetchedModels, experimental: [] });
        }
    } catch (err: any) {
        setError(err.message || 'An unknown error occurred while fetching models.');
        setModels({ preview: [], stable: [], experimental: [] });
    } finally {
        setIsLoading(false);
    }
  }, [serviceProvider, cloudProvider, localProviderType, apiKey, openRouterApiKey, lmStudioUrl, ollamaUrl, showAllVersions]);

  useEffect(() => {
    // Determine if the necessary conditions to fetch models are met.
    const shouldFetch = (serviceProvider === 'cloud' && ((cloudProvider === 'google' && apiKey) || (cloudProvider === 'openrouter' && openRouterApiKey))) || (serviceProvider === 'local' && (lmStudioUrl || ollamaUrl));

    if (shouldFetch) {
      // If conditions are met, call the function that handles the API request.
      loadModels();
    } else {
      // **This is the crucial part that was missing.**
      // If conditions are NOT met (e.g., the API key was just cleared),
      // explicitly reset the hook's state to its clean, initial values.
      // This prevents stale errors or model lists from being shown.
      setIsLoading(false);
      setError(null);
      setModels({ preview: [], stable: [], experimental: [] });
    }
  }, [serviceProvider, cloudProvider, apiKey, openRouterApiKey, lmStudioUrl, ollamaUrl, loadModels]);

  return {
    models,
    isLoading,
    error,
    refetch: loadModels
  };
};