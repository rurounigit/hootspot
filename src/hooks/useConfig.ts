// src/hooks/useConfig.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../i18n';
import {
  API_KEY_STORAGE_KEY, MAX_CHAR_LIMIT_STORAGE_KEY, SELECTED_MODEL_STORAGE_KEY,
  NIGHT_MODE_STORAGE_KEY, INCLUDE_REBUTTAL_JSON_KEY, INCLUDE_REBUTTAL_PDF_KEY,
  SERVICE_PROVIDER_KEY, LM_STUDIO_URL_KEY, LM_STUDIO_MODEL_KEY,
  LOCAL_PROVIDER_TYPE_KEY, OLLAMA_URL_KEY, OLLAMA_MODEL_KEY
} from '../config/storage-keys';
import { GEMINI_MODEL_NAME } from '../config/api-prompts';
import { DEFAULT_MAX_CHAR_LIMIT } from '../constants';
import { testApiKey } from '../api/google/utils';
import { testLMStudioConnection } from '../api/lm-studio';
import { testOllamaConnection } from '../api/ollama';

export const useConfig = () => {
  const { t } = useTranslation();

  // --- Core State ---
  const [serviceProvider, setServiceProvider] = useState<'google' | 'local'>(() => (localStorage.getItem(SERVICE_PROVIDER_KEY) as 'google' | 'local') || 'google');
  const [localProviderType, setLocalProviderType] = useState<'lm-studio' | 'ollama'>(() => (localStorage.getItem(LOCAL_PROVIDER_TYPE_KEY) as 'lm-studio' | 'ollama') || 'lm-studio');

  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || GEMINI_MODEL_NAME);

  const [lmStudioUrl, setLmStudioUrl] = useState<string>(() => localStorage.getItem(LM_STUDIO_URL_KEY) || 'http://localhost:1234');
  const [lmStudioModel, setLmStudioModel] = useState<string>(() => localStorage.getItem(LM_STUDIO_MODEL_KEY) || '');

  const [ollamaUrl, setOllamaUrl] = useState<string>(() => localStorage.getItem(OLLAMA_URL_KEY) || 'http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState<string>(() => localStorage.getItem(OLLAMA_MODEL_KEY) || '');

  // --- Verification and Dirty State ---
  const [isVerified, setIsVerified] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const isMounted = useRef(false);

  // --- UI and Other Settings State ---
  const [debouncedApiKey, setDebouncedApiKey] = useState<string>(apiKeyInput);
  const [maxCharLimit, setMaxCharLimit] = useState<number>(DEFAULT_MAX_CHAR_LIMIT);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => localStorage.getItem(NIGHT_MODE_STORAGE_KEY) === 'true');
  const [includeRebuttalInJson, setIncludeRebuttalInJson] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_JSON_KEY) === 'true');
  const [includeRebuttalInPdf, setIncludeRebuttalInPdf] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_PDF_KEY) === 'true');
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const googleConfigured = !!localStorage.getItem(API_KEY_STORAGE_KEY);
    const lmStudioConfigured = !!localStorage.getItem(LM_STUDIO_URL_KEY) && !!localStorage.getItem(LM_STUDIO_MODEL_KEY);
    const ollamaConfigured = !!localStorage.getItem(OLLAMA_URL_KEY) && !!localStorage.getItem(OLLAMA_MODEL_KEY);

    const providerInStorage = (localStorage.getItem(SERVICE_PROVIDER_KEY) as 'google' | 'local') || 'google';
    const localTypeInStorage = (localStorage.getItem(LOCAL_PROVIDER_TYPE_KEY) as 'lm-studio' | 'ollama') || 'lm-studio';

    let isInitiallyVerified = false;
    if (providerInStorage === 'google' && googleConfigured) {
        isInitiallyVerified = true;
    } else if (providerInStorage === 'local') {
        if (localTypeInStorage === 'lm-studio' && lmStudioConfigured) isInitiallyVerified = true;
        if (localTypeInStorage === 'ollama' && ollamaConfigured) isInitiallyVerified = true;
    }

    setIsVerified(isInitiallyVerified);
    setIsConfigCollapsed(isInitiallyVerified);
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      setIsVerified(false);
      setTestStatus(null);
    }
  }, [apiKeyInput, selectedModel, serviceProvider, localProviderType, lmStudioUrl, lmStudioModel, ollamaUrl, ollamaModel]);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedApiKey(apiKeyInput.trim()); }, 500);
    return () => clearTimeout(handler);
  }, [apiKeyInput]);

  useEffect(() => {
    const storedMaxCharLimit = localStorage.getItem(MAX_CHAR_LIMIT_STORAGE_KEY);
    if (storedMaxCharLimit) { setMaxCharLimit(parseInt(storedMaxCharLimit, 10) || DEFAULT_MAX_CHAR_LIMIT); }
    localStorage.setItem(NIGHT_MODE_STORAGE_KEY, String(isNightMode));
    document.documentElement.classList.toggle('dark', isNightMode);
  }, [isNightMode]);

  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_JSON_KEY, String(includeRebuttalInJson)); }, [includeRebuttalInJson]);
  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_PDF_KEY, String(includeRebuttalInPdf)); }, [includeRebuttalInPdf]);
  useEffect(() => { localStorage.setItem(SERVICE_PROVIDER_KEY, serviceProvider); setIsVerified(false); }, [serviceProvider]);
  useEffect(() => { localStorage.setItem(LOCAL_PROVIDER_TYPE_KEY, localProviderType); setIsVerified(false); }, [localProviderType]);

  useEffect(() => { localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, selectedModel); }, [selectedModel]);
  useEffect(() => { localStorage.setItem(LM_STUDIO_MODEL_KEY, lmStudioModel); }, [lmStudioModel]);
  useEffect(() => { localStorage.setItem(OLLAMA_MODEL_KEY, ollamaModel); }, [ollamaModel]);


  const handleMaxCharLimitSave = useCallback((newLimit: number) => {
    localStorage.setItem(MAX_CHAR_LIMIT_STORAGE_KEY, newLimit.toString());
    setMaxCharLimit(newLimit);
  }, []);

  const saveAndTestConfig = useCallback(async () => {
    setIsTesting(true);
    setTestStatus(null);
    setIsVerified(false);

    try {
      if (serviceProvider === 'google') {
        const trimmedApiKey = apiKeyInput.trim();
        await testApiKey(trimmedApiKey, t, selectedModel);
        localStorage.setItem(API_KEY_STORAGE_KEY, trimmedApiKey);
      } else { // serviceProvider is 'local'
        if (localProviderType === 'lm-studio') {
            const trimmedUrl = lmStudioUrl.trim();
            await testLMStudioConnection(trimmedUrl, lmStudioModel, t);
            localStorage.setItem(LM_STUDIO_URL_KEY, trimmedUrl);
        } else if (localProviderType === 'ollama') {
            const trimmedUrl = ollamaUrl.trim();
            await testOllamaConnection(trimmedUrl, ollamaModel, t);
            localStorage.setItem(OLLAMA_URL_KEY, trimmedUrl);
        }
      }
      setIsVerified(true);
      setTestStatus(null);
      setIsConfigCollapsed(true);

    } catch (err: any) {
      setTestStatus({ message: (err as Error).message, type: 'error' });
      setIsVerified(false);
    } finally {
      setIsTesting(false);
    }
  }, [serviceProvider, localProviderType, apiKeyInput, selectedModel, lmStudioUrl, lmStudioModel, ollamaUrl, ollamaModel, t, setIsConfigCollapsed]);

  return {
    serviceProvider, setServiceProvider,
    localProviderType, setLocalProviderType,
    apiKeyInput, setApiKeyInput,
    debouncedApiKey,
    selectedModel, setSelectedModel,
    lmStudioUrl, setLmStudioUrl,
    lmStudioModel, setLmStudioModel,
    ollamaUrl, setOllamaUrl,
    ollamaModel, setOllamaModel,
    maxCharLimit,
    isNightMode, setIsNightMode,
    includeRebuttalInJson, setIncludeRebuttalInJson,
    includeRebuttalInPdf, setIncludeRebuttalInPdf,
    isConfigCollapsed, setIsConfigCollapsed,
    isTesting, testStatus,
    isCurrentProviderConfigured: isVerified,
    handleMaxCharLimitSave,
    saveAndTestConfig
  };
};