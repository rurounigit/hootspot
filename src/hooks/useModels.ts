// src/hooks/useModels.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../i18n'; // Added import for useTranslation
import { AIModel, GroupedModels } from '../types/api';
import { fetchModels as fetchGoogleModels } from '../api/google/models';
import { fetchLMStudioModels } from '../api/lm-studio';
import { fetchOllamaModels } from '../api/ollama';
import { fetchModels } from '../api/openrouter/models';

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
  const { t } = useTranslation(); // Added to get the translation function
  const [models, setModels] = useState<GroupedModels>({ preview: [], stable: [], experimental: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setModels({ preview: [], stable: [], experimental: [] });
    stopPolling(); // Stop any existing polling before a new manual/initial attempt

    try {
        if (serviceProvider === 'cloud') {
            if (cloudProvider === 'google' && apiKey) {
                const fetchedModels = await fetchGoogleModels(apiKey, showAllVersions);
                setModels(fetchedModels);
            } else if (cloudProvider === 'openrouter') {
                // OpenRouter models can be loaded without authentication
                const fetchedModels = await fetchModels();
                setModels({ preview: [], stable: fetchedModels, experimental: [] });
            }
        } else if (serviceProvider === 'local') {
            let fetchedModels: AIModel[] = [];
            if (localProviderType === 'lm-studio' && lmStudioUrl) {
                fetchedModels = await fetchLMStudioModels(lmStudioUrl);
                if (fetchedModels.length === 0 && lmStudioUrl) {
                    setError(t('config_model_error')); // Generic "Model Load Error."
                } else {
                    setError(null); // Clear error if models are found or if URL was empty (handled by outer logic)
                }
            } else if (localProviderType === 'ollama' && ollamaUrl) {
                fetchedModels = await fetchOllamaModels(ollamaUrl);
                 if (fetchedModels.length === 0 && ollamaUrl) {
                    setError(t('config_model_error')); // Generic "Model Load Error."
                } else {
                    setError(null); // Clear error if models are found or if URL was empty (handled by outer logic)
                }
            }
            // Local providers don't have categories, so we put them all in stable
            setModels({ preview: [], stable: fetchedModels, experimental: [] });
        }
    } catch (err: any) {
        const errorMessage = err.message || 'An unknown error occurred while fetching models.';
        setError(errorMessage);
        setModels({ preview: [], stable: [], experimental: [] });

        // If it's a local provider and a connection error, start polling
        if (serviceProvider === 'local' && (err instanceof TypeError || errorMessage.includes('Failed to fetch'))) {
            pollingIntervalRef.current = setInterval(() => {
                (async () => {
                    try {
                        if (localProviderType === 'lm-studio' && lmStudioUrl) {
                            await fetchLMStudioModels(lmStudioUrl);
                        } else if (localProviderType === 'ollama' && ollamaUrl) {
                            await fetchOllamaModels(ollamaUrl);
                        }
                        // If successful, stop polling and trigger a full reload to update the UI
                        stopPolling();
                        loadModels();
                    } catch (pollError) {
                        // Server is still down, the interval will try again.
                    }
                })();
            }, 5000); // Poll every 5 seconds
        }
    } finally {
        setIsLoading(false);
    }
  }, [serviceProvider, cloudProvider, localProviderType, apiKey, lmStudioUrl, ollamaUrl, showAllVersions, stopPolling]);

  useEffect(() => {
    // Determine if the necessary conditions to fetch models are met.
    const shouldFetch = (serviceProvider === 'cloud' && ((cloudProvider === 'google' && apiKey) || (cloudProvider === 'openrouter'))) || (serviceProvider === 'local' && (lmStudioUrl || ollamaUrl));

    if (shouldFetch) {
      // If conditions are met, call the function that handles the API request.
      loadModels();
    } else {
      // If conditions are NOT met (e.g., the API key was just cleared),
      // explicitly reset the hook's state to its clean, initial values.
      setIsLoading(false);
      setError(null);
      setModels({ preview: [], stable: [], experimental: [] });
      stopPolling();
    }

    // Cleanup function to stop polling when dependencies change or component unmounts
    return () => {
      stopPolling();
    };
  }, [serviceProvider, cloudProvider, apiKey, lmStudioUrl, ollamaUrl, loadModels, stopPolling]);

  return {
    models,
    isLoading,
    error,
    refetch: loadModels
  };
};
