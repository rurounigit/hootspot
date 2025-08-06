// src/hooks/useConfig.ts

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n';
import {
  API_KEY_STORAGE_KEY, MAX_CHAR_LIMIT_STORAGE_KEY, SELECTED_MODEL_STORAGE_KEY,
  NIGHT_MODE_STORAGE_KEY, INCLUDE_REBUTTAL_JSON_KEY, INCLUDE_REBUTTAL_PDF_KEY,
  SERVICE_PROVIDER_KEY, LM_STUDIO_URL_KEY, LM_STUDIO_MODEL_KEY,
  LOCAL_PROVIDER_TYPE_KEY, OLLAMA_URL_KEY, OLLAMA_MODEL_KEY, SHOW_ALL_VERSIONS_KEY
} from '../config/storage-keys';
import { GEMINI_MODEL_NAME } from '../config/api-prompts';
import { DEFAULT_MAX_CHAR_LIMIT } from '../constants';
import { testApiKey } from '../api/google/utils';
import { testLMStudioConnection } from '../api/lm-studio';
import { testOllamaConnection } from '../api/ollama';

const getInitialVerifiedState = (): boolean => {
  const providerInStorage = (localStorage.getItem(SERVICE_PROVIDER_KEY) as 'google' | 'local') || 'google';
  const localTypeInStorage = (localStorage.getItem(LOCAL_PROVIDER_TYPE_KEY) as 'lm-studio' | 'ollama') || 'lm-studio';

  let isInitiallyVerified = false;
  if (providerInStorage === 'google') {
    isInitiallyVerified = !!localStorage.getItem(API_KEY_STORAGE_KEY);
  } else { // 'local'
    if (localTypeInStorage === 'lm-studio') {
      isInitiallyVerified = !!localStorage.getItem(LM_STUDIO_URL_KEY) && !!localStorage.getItem(LM_STUDIO_MODEL_KEY);
    } else { // 'ollama'
      isInitiallyVerified = !!localStorage.getItem(OLLAMA_URL_KEY) && !!localStorage.getItem(OLLAMA_MODEL_KEY);
    }
  }
  return isInitiallyVerified;
};

export const useConfig = () => {
  const { t } = useTranslation();

  const [serviceProvider, setServiceProviderState] = useState<'google' | 'local'>(() => (localStorage.getItem(SERVICE_PROVIDER_KEY) as 'google' | 'local') || 'google');
  const [localProviderType, setLocalProviderTypeState] = useState<'lm-studio' | 'ollama'>(() => (localStorage.getItem(LOCAL_PROVIDER_TYPE_KEY) as 'lm-studio' | 'ollama') || 'lm-studio');
  const [apiKeyInput, setApiKeyInputState] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [selectedModel, setSelectedModelState] = useState<string>(() => localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || GEMINI_MODEL_NAME);
  const [lmStudioUrl, setLmStudioUrlState] = useState<string>(() => localStorage.getItem(LM_STUDIO_URL_KEY) || 'http://localhost:1234');
  const [lmStudioModel, setLmStudioModelState] = useState<string>(() => localStorage.getItem(LM_STUDIO_MODEL_KEY) || '');
  const [ollamaUrl, setOllamaUrlState] = useState<string>(() => localStorage.getItem(OLLAMA_URL_KEY) || 'http://localhost:11434');
  const [ollamaModel, setOllamaModelState] = useState<string>(() => localStorage.getItem(OLLAMA_MODEL_KEY) || '');
  const [isVerified, setIsVerified] = useState(getInitialVerifiedState);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [debouncedApiKey, setDebouncedApiKey] = useState<string>(apiKeyInput);
  const [maxCharLimit, setMaxCharLimit] = useState<number>(DEFAULT_MAX_CHAR_LIMIT);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => localStorage.getItem(NIGHT_MODE_STORAGE_KEY) === 'true');
  const [includeRebuttalInJson, setIncludeRebuttalInJson] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_JSON_KEY) === 'true');
  const [includeRebuttalInPdf, setIncludeRebuttalInPdf] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_PDF_KEY) === 'true');
  const [showAllVersions, setShowAllVersionsState] = useState<boolean>(() =>
    localStorage.getItem(SHOW_ALL_VERSIONS_KEY) === 'true'
  );
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);

  useEffect(() => {
    setIsConfigCollapsed(isVerified);
    const storedMaxCharLimit = localStorage.getItem(MAX_CHAR_LIMIT_STORAGE_KEY);
    if (storedMaxCharLimit) {
      setMaxCharLimit(parseInt(storedMaxCharLimit, 10) || DEFAULT_MAX_CHAR_LIMIT);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedApiKey(apiKeyInput.trim()); }, 500);
    return () => clearTimeout(handler);
  }, [apiKeyInput]);

  const setAndDirty = <T extends (...args: any[]) => void>(setter: T) => (...args: Parameters<T>): void => {
      setter(...args);
      setIsVerified(false);
      setTestStatus(null);
  };

  useEffect(() => { document.documentElement.classList.toggle('dark', isNightMode); localStorage.setItem(NIGHT_MODE_STORAGE_KEY, String(isNightMode)); }, [isNightMode]);
  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_JSON_KEY, String(includeRebuttalInJson)); }, [includeRebuttalInJson]);
  useEffect(() => { localStorage.setItem(INCLUDE_REBUTTAL_PDF_KEY, String(includeRebuttalInPdf)); }, [includeRebuttalInPdf]);
  useEffect(() => { localStorage.setItem(SHOW_ALL_VERSIONS_KEY, String(showAllVersions)); }, [showAllVersions]);

  const setServiceProvider = setAndDirty(setServiceProviderState);
  const setLocalProviderType = setAndDirty(setLocalProviderTypeState);
  const setApiKeyInput = setAndDirty(setApiKeyInputState);
  const setSelectedModel = setAndDirty(setSelectedModelState);
  const setLmStudioUrl = setAndDirty(setLmStudioUrlState);
  const setLmStudioModel = setAndDirty(setLmStudioModelState);
  const setOllamaUrl = setAndDirty(setOllamaUrlState);
  const setOllamaModel = setAndDirty(setOllamaModelState);
  const setShowAllVersions = setAndDirty(setShowAllVersionsState);

  const handleMaxCharLimitSave = useCallback((newLimit: number) => {
    localStorage.setItem(MAX_CHAR_LIMIT_STORAGE_KEY, newLimit.toString());
    setMaxCharLimit(newLimit);
  }, []);

  const invalidateConfig = useCallback((errorMessage: string) => {
      setIsVerified(false);
      setTestStatus({ message: errorMessage, type: 'error' });
      setIsConfigCollapsed(false);
  }, []);

  const saveAndTestConfig = useCallback(async () => {
    setIsTesting(true);
    setTestStatus(null);

    try {
      if (serviceProvider === 'google') {
        const trimmedApiKey = apiKeyInput.trim();
        await testApiKey(trimmedApiKey, t, selectedModel);
        localStorage.setItem(API_KEY_STORAGE_KEY, trimmedApiKey);
        localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, selectedModel);
      } else {
        if (localProviderType === 'lm-studio') {
          await testLMStudioConnection(lmStudioUrl.trim(), lmStudioModel);
          localStorage.setItem(LM_STUDIO_URL_KEY, lmStudioUrl.trim());
          localStorage.setItem(LM_STUDIO_MODEL_KEY, lmStudioModel);
        } else { // ollama
          await testOllamaConnection(ollamaUrl.trim(), ollamaModel);
          localStorage.setItem(OLLAMA_URL_KEY, ollamaUrl.trim());
          localStorage.setItem(OLLAMA_MODEL_KEY, ollamaModel);
        }
      }
      localStorage.setItem(SERVICE_PROVIDER_KEY, serviceProvider);
      localStorage.setItem(LOCAL_PROVIDER_TYPE_KEY, localProviderType);
      setIsVerified(true);
      setTestStatus(null);
      setIsConfigCollapsed(true);

    } catch (err: any) {
      setTestStatus({ message: (err as Error).message, type: 'error' });
      setIsVerified(false);
    } finally {
      setIsTesting(false);
    }
  }, [
    serviceProvider, localProviderType, apiKeyInput, selectedModel,
    lmStudioUrl, lmStudioModel, ollamaUrl, ollamaModel, t
  ]);

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
    showAllVersions, setShowAllVersions,
    isConfigCollapsed, setIsConfigCollapsed,
    isTesting, testStatus,
    isCurrentProviderConfigured: isVerified,
    handleMaxCharLimitSave,
    saveAndTestConfig,
    invalidateConfig
  };
};