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

  // FIX: Initialize inputs from localStorage but allow them to be changed without saving immediately.
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [lmStudioUrl, setLmStudioUrl] = useState<string>(() => localStorage.getItem(LM_STUDIO_URL_KEY) || '');
  const [lmStudioModel, setLmStudioModel] = useState<string>(() => localStorage.getItem(LM_STUDIO_MODEL_KEY) || '');

  // FIX: The "active" apiKey is now only the one from localStorage. Debounced key is for model fetching.
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem(API_KEY_STORAGE_KEY));
  const [debouncedApiKey, setDebouncedApiKey] = useState<string>(apiKeyInput);

  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || GEMINI_MODEL_NAME);
  const [maxCharLimit, setMaxCharLimit] = useState<number>(DEFAULT_MAX_CHAR_LIMIT);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => localStorage.getItem(NIGHT_MODE_STORAGE_KEY) === 'true');
  const [includeRebuttalInJson, setIncludeRebuttalInJson] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_JSON_KEY) === 'true');
  const [includeRebuttalInPdf, setIncludeRebuttalInPdf] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_PDF_KEY) === 'true');

  // --- START OF MAJOR FIX ---
  // The source of truth for "is configured" is now ONLY what is in localStorage.
  const isGoogleConfigured = !!localStorage.getItem(API_KEY_STORAGE_KEY);
  const isLocalConfigured = !!localStorage.getItem(LM_STUDIO_URL_KEY) && !!localStorage.getItem(LM_STUDIO_MODEL_KEY);

  // This determines if the "Analyze" button should be enabled.
  const isCurrentProviderConfigured = (serviceProvider === 'google' && isGoogleConfigured) || (serviceProvider === 'local' && isLocalConfigured);

  // This determines if the config section should be collapsed by default.
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(isCurrentProviderConfigured);
  // --- END OF MAJOR FIX ---

  // Migration effect remains the same.
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

  // Debounce effect for fetching models remains. It does not save the key.
  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedApiKey(apiKeyInput.trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [apiKeyInput]);

  // FIX: Remove automatic saving useEffects for provider, model, lmstudio url/model.
  // These will now be saved explicitly in ConfigurationManager on successful test.
  useEffect(() => { localStorage.setItem(NIGHT_MODE_STORAGE_KEY, String(isNightMode)); document.documentElement.classList.toggle('dark', isNightMode); }, [isNightMode]);
  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_JSON_KEY, String(includeRebuttalInJson)); }, [includeRebuttalInJson]);
  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_PDF_KEY, String(includeRebuttalInPdf)); }, [includeRebuttalInPdf]);

  useEffect(() => {
    // When the service provider changes, update the active API key from storage.
    setApiKey(localStorage.getItem(API_KEY_STORAGE_KEY));
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
    isCurrentProviderConfigured, // This is now the reliable flag for the rest of the app
    handleMaxCharLimitSave,
  };
};