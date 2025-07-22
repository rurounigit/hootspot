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
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem(API_KEY_STORAGE_KEY));
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [debouncedApiKey, setDebouncedApiKey] = useState<string | null>(apiKey);
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || GEMINI_MODEL_NAME);
  const [lmStudioUrl, setLmStudioUrl] = useState<string>(() => localStorage.getItem(LM_STUDIO_URL_KEY) || '');
  const [lmStudioModel, setLmStudioModel] = useState<string>(() => localStorage.getItem(LM_STUDIO_MODEL_KEY) || '');
  const [maxCharLimit, setMaxCharLimit] = useState<number>(DEFAULT_MAX_CHAR_LIMIT);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => localStorage.getItem(NIGHT_MODE_STORAGE_KEY) === 'true');
  const [includeRebuttalInJson, setIncludeRebuttalInJson] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_JSON_KEY) === 'true');
  const [includeRebuttalInPdf, setIncludeRebuttalInPdf] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_PDF_KEY) === 'true');
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(() => !!(localStorage.getItem(API_KEY_STORAGE_KEY) || localStorage.getItem(LM_STUDIO_URL_KEY)));

  const isCurrentProviderConfigured = (serviceProvider === 'google' && !!apiKeyInput.trim()) || (serviceProvider === 'local' && !!lmStudioUrl.trim() && !!lmStudioModel.trim());

  // ADDED: localStorage data migration logic
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

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedApiKey(apiKeyInput.trim()); }, 500);
    return () => clearTimeout(handler);
  }, [apiKeyInput]);

  useEffect(() => { localStorage.setItem(SERVICE_PROVIDER_KEY, serviceProvider); }, [serviceProvider]);
  useEffect(() => { localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, selectedModel); }, [selectedModel]);
  useEffect(() => { localStorage.setItem(NIGHT_MODE_STORAGE_KEY, String(isNightMode)); document.documentElement.classList.toggle('dark', isNightMode); }, [isNightMode]);
  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_JSON_KEY, String(includeRebuttalInJson)); }, [includeRebuttalInJson]);
  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_PDF_KEY, String(includeRebuttalInPdf)); }, [includeRebuttalInPdf]);
  useEffect(() => { if (serviceProvider === 'google') setApiKey(apiKeyInput); }, [apiKeyInput, serviceProvider]);
  useEffect(() => { localStorage.setItem(LM_STUDIO_URL_KEY, lmStudioUrl) }, [lmStudioUrl]);
  useEffect(() => { localStorage.setItem(LM_STUDIO_MODEL_KEY, lmStudioModel) }, [lmStudioModel]);

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
    isCurrentProviderConfigured,
    handleMaxCharLimitSave,
  };
};