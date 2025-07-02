// src/hooks/useModels.ts

import { useState, useEffect } from 'react';
import { GeminiModel } from '../types';
import { fetchModels } from '../services/geminiService';

export const useModels = (apiKey: string | null) => {
  const [models, setModels] = useState<GeminiModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('1. useModels hook fired. API Key:', apiKey ? 'Exists' : 'None');

  useEffect(() => {
    if (!apiKey) {
      console.log('2. useModels effect: No API key, returning.');
      setModels([]);
      return;
    }

    const loadModels = async () => {
      console.log('3. useModels effect: API key found, starting fetch...');
      setIsLoading(true);
      setError(null);
      try {
        const fetchedModels = await fetchModels(apiKey);
        console.log('6. useModels effect: Fetched models successfully.', fetchedModels);
        setModels(fetchedModels);
      } catch (err: any) {
        console.error('6a. useModels effect: Error fetching models.', err);
        setError(err.message || 'An unknown error occurred while fetching models.');
        setModels([]); // Clear models on error
      } finally {
        console.log('7. useModels effect: Fetch process finished.');
        setIsLoading(false);
      }
    };

    loadModels();
  }, [apiKey]); // This effect runs whenever the apiKey changes

  return { models, isLoading, error };
};