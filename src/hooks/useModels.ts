// src/hooks/useModels.ts

import { useState, useEffect, useCallback } from 'react';
import { GeminiModel } from '../types/api';
import { fetchModels as fetchGoogleModels } from '../api/google/models';
import { fetchLMStudioModels } from '../api/lm-studio';

export interface GroupedModels {
  preview: GeminiModel[];
  stable: GeminiModel[];
}

interface UseModelsProps {
    serviceProvider: 'google' | 'local';
    apiKey: string | null;
    lmStudioUrl: string;
}

export const useModels = ({ serviceProvider, apiKey, lmStudioUrl }: UseModelsProps) => {
  const [models, setModels] = useState<GroupedModels>({ preview: [], stable: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    let shouldFetch = false;
    if (serviceProvider === 'google' && apiKey) {
        shouldFetch = true;
    } else if (serviceProvider === 'local' && lmStudioUrl) {
        try {
            new URL(lmStudioUrl); // Basic validation
            shouldFetch = true;
        } catch (e) {
            setError('Invalid LM Studio URL format.');
            setModels({ preview: [], stable: [] });
            return;
        }
    }

    if (!shouldFetch) {
        setModels({ preview: [], stable: [] });
        setIsLoading(false);
        setError(null);
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
        if (serviceProvider === 'google' && apiKey) {
            const fetchedModels = await fetchGoogleModels(apiKey);
            setModels(fetchedModels);
        } else if (serviceProvider === 'local' && lmStudioUrl) {
            const fetchedModels = await fetchLMStudioModels(lmStudioUrl);
            // For local models, we put them all in the 'stable' group for simplicity
            setModels({ preview: [], stable: fetchedModels });
        }
    } catch (err: any) {
        setError(err.message || 'An unknown error occurred while fetching models.');
        setModels({ preview: [], stable: [] });
    } finally {
        setIsLoading(false);
    }
  }, [serviceProvider, apiKey, lmStudioUrl]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const refetch = () => {
    loadModels();
  };

  return { models, isLoading, error, refetch };
};