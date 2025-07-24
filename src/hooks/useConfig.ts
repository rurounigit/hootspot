// src/hooks/useConfig.ts

import { useState, useEffect, useCallback } from 'react';
import {
  API_KEY_STORAGE_KEY,
  MAX_CHAR_LIMIT_STORAGE_KEY,
  SELECTED_MODEL_STORAGE_KEY,
  NIGHT_MODE_STORAGE_KEY,
  INCLUDE_REBUTTAL_JSON_KEY,
  INCLUDE_REBUTTAL_PDF_KEY,
  SERVICE_PROVIDER_KEY,
  LM_STUDIO_URL_KEY,
  LM_STUDIO_MODEL_KEY
} from '../config/storage-keys';
import { GEMINI_MODEL_NAME } from '../config/api-prompts';
import { DEFAULT_MAX_CHAR_LIMIT } from '../constants';

export const useConfig = () => {
  const [serviceProvider, setServiceProvider] = useState<'google' | 'local'>(() => (localStorage.getItem(SERVICE_PROVIDER_KEY) as 'google' | 'local') || 'google');
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [lmStudioUrl, setLmStudioUrl] = useState<string>(() => localStorage.getItem(LM_STUDIO_URL_KEY) || '');
  const [lmStudioModel, setLmStudioModel] = useState<string>(() => localStorage.getItem(LM_STUDIO_MODEL_KEY) || '');

  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem(API_KEY_STORAGE_KEY));
  const [debouncedApiKey, setDebouncedApiKey] = useState<string>(apiKeyInput);
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || GEMINI_MODEL_NAME);
  const [maxCharLimit, setMaxCharLimit] = useState<number>(DEFAULT_MAX_CHAR_LIMIT);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => localStorage.getItem(NIGHT_MODE_STORAGE_KEY) === 'true');
  const [includeRebuttalInJson, setIncludeRebuttalInJson] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_JSON_KEY) === 'true');
  const [includeRebuttalInPdf, setIncludeRebuttalInPdf] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_PDF_KEY) === 'true');

  // --- START OF "DIRTY FLAG" IMPLEMENTATION ---
  const [isConfigDirty, setIsConfigDirty] = useState(false);

  useEffect(() => {
    // Check if the current input value differs from the saved value in localStorage.
    if (serviceProvider === 'google') {
      const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
      setIsConfigDirty(apiKeyInput !== savedApiKey);
    } else { // 'local' provider
      const savedUrl = localStorage.getItem(LM_STUDIO_URL_KEY) || '';
      const savedModel = localStorage.getItem(LM_STUDIO_MODEL_KEY) || '';
      setIsConfigDirty(lmStudioUrl !== savedUrl || lmStudioModel !== savedModel);
    }
  }, [apiKeyInput, lmStudioUrl, lmStudioModel, serviceProvider]);

  // Check if a valid configuration is currently stored in localStorage.
  const isGoogleConfiguredInStorage = !!localStorage.getItem(API_KEY_STORAGE_KEY);
  const isLocalConfiguredInStorage = !!localStorage.getItem(LM_STUDIO_URL_KEY) && !!localStorage.getItem(LM_STUDIO_MODEL_KEY);

  // The final, reliable flag. The app is "ready to analyze" only if the active provider has a stored config AND it's not dirty.
  const isReadyToAnalyze = ((serviceProvider === 'google' && isGoogleConfiguredInStorage) || (serviceProvider === 'local' && isLocalConfiguredInStorage)) && !isConfigDirty;

  // This is used just to determine if the panel should start collapsed.
  const isAConfiguredProviderStored = isGoogleConfiguredInStorage || isLocalConfiguredInStorage;
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(isAConfiguredProviderStored);
  // --- END OF "DIRTY FLAG" IMPLEMENTATION ---


  // Migration effects remain the same
  useEffect(() => {
    const oldApiKey = localStorage.getItem('athenaAIApiKey');
    if (oldApiKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, oldApiKey);
      localStorage.removeItem('athenaAIApiKey');
    }
    const oldModel = localStorage.getItem('athenaAISelectedModel');
    if (oldModel) {
        localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, oldModel);
        localStorage.removeItem('athenaAISelectedModel');
    }
    const oldMaxChar = localStorage.getItem('athenaAIMaxCharLimit');
    if(oldMaxChar) {
        localStorage.setItem(MAX_CHAR_LIMIT_STORAGE_KEY, oldMaxChar);
        localStorage.removeItem('athenaAIMaxCharLimit');
    }
  }, []);

  // Debounce effect for fetching models remains.
  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedApiKey(apiKeyInput.trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [apiKeyInput]);

  // Persistent settings that can be changed live.
  useEffect(() => { localStorage.setItem(NIGHT_MODE_STORAGE_KEY, String(isNightMode)); document.documentElement.classList.toggle('dark', isNightMode); }, [isNightMode]);
  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_JSON_KEY, String(includeRebuttalInJson)); }, [includeRebuttalInJson]);
  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_PDF_KEY, String(includeRebuttalInPdf)); }, [includeRebuttalInPdf]);

  useEffect(() => {
    // When the service provider changes, update the active API key from storage.
    if (serviceProvider === 'google') {
        setApiKey(localStorage.getItem(API_KEY_STORAGE_KEY));
    } else {
        setApiKey(null);
    }
  }, [serviceProvider]);

  useEffect(() => {
    const storedMaxCharLimit = localStorage.getItem(MAX_CHAR_LIMIT_STORAGE_KEY);
    if (storedMaxCharLimit) { setMaxCharLimit(parseInt(storedMaxCharLimit, 10) || DEFAULT_MAX_CHAR_LIMIT); }
  }, []);

  const handleMaxCharLimitSave = useCallback((newLimit: number) => {
    localStorage.setItem(MAX_CHAR_LIMIT_STORAGE_KEY, newLimit.toString());
    setMaxCharLimit(newLimit);
  }, []);

  return {
    serviceProvider,
    setServiceProvider,
    apiKey,
    apiKeyInput,
    setApiKeyInput,
    debouncedApiKey,
    selectedModel,
    setSelectedModel,
    lmStudioUrl,
    setLmStudioUrl,
    lmStudioModel,
    setLmStudioModel,
    maxCharLimit,
    setMaxCharLimit,
    isNightMode,
    setIsNightMode,
    includeRebuttalInJson,
    setIncludeRebuttalInJson,
    includeRebuttalInPdf,
    setIncludeRebuttalInPdf,
    isConfigCollapsed,
    setIsConfigCollapsed,
    isCurrentProviderConfigured: isReadyToAnalyze, // This is the new reliable flag for the rest of the app.
    isConfigDirty, // Pass this down for UI feedback
    handleMaxCharLimitSave,
  };
};