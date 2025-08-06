// src/hooks/useModels.ts

import { useState, useEffect, useCallback } from 'react';
import { GeminiModel } from '../types/api';
import { fetchModels as fetchGoogleModels } from '../api/google/models';
import { fetchLMStudioModels } from '../api/lm-studio';
import { fetchOllamaModels } from '../api/ollama';
import { GroupedModels } from '../types/api';
interface UseModelsProps {
    serviceProvider: 'google' | 'local';
    localProviderType: 'lm-studio' | 'ollama';
    apiKey: string | null;
    lmStudioUrl: string;
    ollamaUrl: string;
    deduplicateVersions: boolean; // New prop
}

export const useModels = ({ serviceProvider, localProviderType, apiKey, lmStudioUrl, ollamaUrl, deduplicateVersions }: UseModelsProps) => {
  const [models, setModels] = useState<GroupedModels>({ preview: [], stable: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deduplicateVersionsState, setDeduplicateVersions] = useState(false); // New state

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setModels({ preview: [], stable: [] });

    try {
        if (serviceProvider === 'google' && apiKey) {
            const fetchedModels = await fetchGoogleModels(apiKey, !deduplicateVersions); // Pass negated value to align with API's showAllVersions
            setModels(fetchedModels);
        } else if (serviceProvider === 'local') {
            let fetchedModels: GeminiModel[] = [];
            if (localProviderType === 'lm-studio' && lmStudioUrl) {
                fetchedModels = await fetchLMStudioModels(lmStudioUrl);
            } else if (localProviderType === 'ollama' && ollamaUrl) {
                fetchedModels = await fetchOllamaModels(ollamaUrl);
            }
            setModels({ preview: [], stable: fetchedModels });
        }
    } catch (err: any) {
        setError(err.message || 'An unknown error occurred while fetching models.');
        setModels({ preview: [], stable: [] });
    } finally {
        setIsLoading(false);
    }
  }, [serviceProvider, localProviderType, apiKey, lmStudioUrl, ollamaUrl, deduplicateVersions]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    isLoading,
    error,
    refetch: loadModels,
    deduplicateVersions: deduplicateVersionsState,
    setDeduplicateVersions
  };
};
