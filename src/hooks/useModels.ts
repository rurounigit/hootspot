// src/hooks/useModels.ts

import { useState, useEffect, useCallback } from 'react';
import { GeminiModel, GroupedModels } from '../types/api';
import { fetchModels as fetchGoogleModels } from '../api/google/models';
import { fetchLMStudioModels } from '../api/lm-studio';
import { fetchOllamaModels } from '../api/ollama';

interface UseModelsProps {
    serviceProvider: 'google' | 'local';
    localProviderType: 'lm-studio' | 'ollama';
    apiKey: string | null;
    lmStudioUrl: string;
    ollamaUrl: string;
    showAllVersions: boolean;
}

export const useModels = ({ serviceProvider, localProviderType, apiKey, lmStudioUrl, ollamaUrl, showAllVersions }: UseModelsProps) => {
  const [models, setModels] = useState<GroupedModels>({ preview: [], stable: [], experimental: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setModels({ preview: [], stable: [], experimental: [] });

    try {
        if (serviceProvider === 'google' && apiKey) {
            const fetchedModels = await fetchGoogleModels(apiKey, showAllVersions);
            setModels(fetchedModels);
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
  }, [serviceProvider, localProviderType, apiKey, lmStudioUrl, ollamaUrl, showAllVersions]);

  useEffect(() => {
    // Only load Google models if an API key is present.
    // Local models are loaded if their respective URL is present.
    if ( (serviceProvider === 'google' && apiKey) || (serviceProvider === 'local' && (lmStudioUrl || ollamaUrl) ) ) {
      loadModels();
    }
  }, [loadModels, serviceProvider, apiKey, lmStudioUrl, ollamaUrl]);

  return {
    models,
    isLoading,
    error,
    refetch: loadModels
  };
};