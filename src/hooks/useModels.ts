// src/hooks/useModels.ts

import { useState, useEffect } from 'react';
import { GeminiModel } from '../types/api';
import { fetchModels } from '../api/google/models';

// Define the new shape for our models state, which will be returned by fetchModels
export interface GroupedModels {
  preview: GeminiModel[];
  stable: GeminiModel[];
}

export const useModels = (apiKey: string | null) => {
  // The state now holds the new grouped structure
  const [models, setModels] = useState<GroupedModels>({ preview: [], stable: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If there's no API key, reset the state and do nothing.
    if (!apiKey) {
      setModels({ preview: [], stable: [] });
      setIsLoading(false);
      setError(null); // FIX: Explicitly clear error when API key is removed.
      return;
    }

    const loadModels = async () => {
      setIsLoading(true);
      setError(null); // FIX: Ensure previous errors are cleared on every new attempt.
      try {
        // fetchModels will now return the { preview: [], stable: [] } object
        const fetchedModels = await fetchModels(apiKey);
        setModels(fetchedModels);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred while fetching models.');
        // Ensure state is reset on error
        setModels({ preview: [], stable: [] });
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, [apiKey]); // This effect re-runs only when the apiKey changes

  return { models, isLoading, error };
};