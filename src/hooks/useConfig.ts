// src/hooks/useConfig.ts

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n';
import {
  API_KEY_STORAGE_KEY, MAX_CHAR_LIMIT_STORAGE_KEY, SELECTED_MODEL_STORAGE_KEY,
  NIGHT_MODE_STORAGE_KEY, INCLUDE_REBUTTAL_JSON_KEY, INCLUDE_REBUTTAL_PDF_KEY,
  SERVICE_PROVIDER_KEY, LM_STUDIO_URL_KEY, LM_STUDIO_MODEL_KEY,
  LOCAL_PROVIDER_TYPE_KEY, OLLAMA_URL_KEY, OLLAMA_MODEL_KEY, SHOW_ALL_VERSIONS_KEY,
  CLOUD_PROVIDER_KEY, OPEN_ROUTER_API_KEY_STORAGE_KEY, OPEN_ROUTER_MODEL_KEY
} from '../config/storage-keys';
import { GEMINI_MODEL_NAME } from '../config/api-prompts';
import { DEFAULT_MAX_CHAR_LIMIT } from '../constants';
import { testApiKey } from '../api/google/utils';
import { testLMStudioConnection } from '../api/lm-studio';
import { testOllamaConnection } from '../api/ollama';
import { testApiKey as testOpenRouterConnection } from '../api/openrouter/utils';
import { ConfigError } from '../utils/errors';

const getInitialVerifiedState = (): boolean => {
  const providerInStorage = (localStorage.getItem(SERVICE_PROVIDER_KEY) as 'cloud' | 'local') || 'cloud';
  const localTypeInStorage = (localStorage.getItem(LOCAL_PROVIDER_TYPE_KEY) as 'lm-studio' | 'ollama') || 'lm-studio';
  const cloudProviderInStorage = (localStorage.getItem(CLOUD_PROVIDER_KEY) as 'google' | 'openrouter') || 'google';

  let isInitiallyVerified = false;
  if (providerInStorage === 'cloud') {
    if (cloudProviderInStorage === 'google') {
      isInitiallyVerified = !!localStorage.getItem(API_KEY_STORAGE_KEY);
    } else { // 'openrouter'
      isInitiallyVerified = !!localStorage.getItem(OPEN_ROUTER_API_KEY_STORAGE_KEY);
    }
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

    const [serviceProvider, setServiceProviderState] = useState<'cloud' | 'local'>(() => (localStorage.getItem(SERVICE_PROVIDER_KEY) as 'cloud' | 'local') || 'cloud');
  const [cloudProvider, setCloudProviderState] = useState<'google' | 'openrouter'>(() => (localStorage.getItem(CLOUD_PROVIDER_KEY) as 'google' | 'openrouter') || 'google');
  const [localProviderType, setLocalProviderTypeState] = useState<'lm-studio' | 'ollama'>(() => (localStorage.getItem(LOCAL_PROVIDER_TYPE_KEY) as 'lm-studio' | 'ollama') || 'lm-studio');
  const [apiKeyInput, setApiKeyInputState] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [openRouterApiKey, setOpenRouterApiKeyState] = useState<string>(() => localStorage.getItem(OPEN_ROUTER_API_KEY_STORAGE_KEY) || '');
  const [googleModel, setGoogleModelState] = useState<string>(() => localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || GEMINI_MODEL_NAME);
  const [openRouterModel, setOpenRouterModelState] = useState<string>(() => localStorage.getItem(OPEN_ROUTER_MODEL_KEY) || '');
  const [lmStudioUrl, setLmStudioUrlState] = useState<string>(() => localStorage.getItem(LM_STUDIO_URL_KEY) || 'http://localhost:1234');
  const [lmStudioModel, setLmStudioModelState] = useState<string>(() => localStorage.getItem(LM_STUDIO_MODEL_KEY) || '');
  const [ollamaUrl, setOllamaUrlState] = useState<string>(() => localStorage.getItem(OLLAMA_URL_KEY) || 'http://localhost:11434');
  const [ollamaModel, setOllamaModelState] = useState<string>(() => localStorage.getItem(OLLAMA_MODEL_KEY) || '');
  const [isVerified, setIsVerified] = useState(getInitialVerifiedState);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [debouncedApiKey, setDebouncedApiKey] = useState<string>(apiKeyInput);
  const [debouncedOpenRouterApiKey, setDebouncedOpenRouterApiKey] = useState<string>(openRouterApiKey);
  const [isOpenRouterApiKeyValid, setIsOpenRouterApiKeyValid] = useState<boolean>(!!localStorage.getItem(OPEN_ROUTER_API_KEY_STORAGE_KEY));
  const [openRouterApiKeyTestStatus, setOpenRouterApiKeyTestStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
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

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedOpenRouterApiKey(openRouterApiKey.trim()); }, 500);
    return () => clearTimeout(handler);
  }, [openRouterApiKey]);

  useEffect(() => {
    if (serviceProvider === 'cloud' && cloudProvider === 'openrouter') {
      if (debouncedOpenRouterApiKey) {
        const validateApiKey = async () => {
          try {
            // Test with a simple model - we just need to verify the key works
            await testOpenRouterConnection(debouncedOpenRouterApiKey, t, 'openai/gpt-3.5-turbo');
            setIsOpenRouterApiKeyValid(true);
            setOpenRouterApiKeyTestStatus({ message: 'API key is valid', type: 'success' });
          } catch (error: any) {
            setIsOpenRouterApiKeyValid(false);
            // Use the exact same error message text as Google API
            setOpenRouterApiKeyTestStatus({ message: 'API key not valid. Please pass a valid API key.', type: 'error' });
          }
        };
        validateApiKey();
      } else {
        // Empty API key
        setIsOpenRouterApiKeyValid(false);
        setOpenRouterApiKeyTestStatus({ message: t('error_api_key_empty'), type: 'error' });
      }
    } else {
      // Clear validation status when not using OpenRouter
      setIsOpenRouterApiKeyValid(true);
      setOpenRouterApiKeyTestStatus(null);
    }
  }, [debouncedOpenRouterApiKey, serviceProvider, cloudProvider, t]);

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
  const setCloudProvider = setAndDirty(setCloudProviderState);
  const setLocalProviderType = setAndDirty(setLocalProviderTypeState);
  const setApiKeyInput = setAndDirty(setApiKeyInputState);
  const setOpenRouterApiKey = setAndDirty(setOpenRouterApiKeyState);
  const setGoogleModel = setAndDirty(setGoogleModelState);
  const setOpenRouterModel = setAndDirty(setOpenRouterModelState);
  const setLmStudioUrl = setAndDirty(setLmStudioUrlState);
  const setLmStudioModel = setAndDirty(setLmStudioModelState);
  const setOllamaUrl = setAndDirty(setOllamaUrlState);
  const setOllamaModel = setAndDirty(setOllamaModelState);

  const setShowAllVersions = (value: boolean) => {
    setShowAllVersionsState(value);
  };

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
      if (serviceProvider === 'cloud') {
        if (cloudProvider === 'google') {
          const trimmedApiKey = apiKeyInput.trim();
          await testApiKey(trimmedApiKey, t, googleModel);
          localStorage.setItem(API_KEY_STORAGE_KEY, trimmedApiKey);
          localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, googleModel);
        } else { // openrouter
          const trimmedApiKey = openRouterApiKey.trim();
          await testOpenRouterConnection(trimmedApiKey, t, openRouterModel);
          localStorage.setItem(OPEN_ROUTER_API_KEY_STORAGE_KEY, trimmedApiKey);
          localStorage.setItem(OPEN_ROUTER_MODEL_KEY, openRouterModel);
        }
      } else { // local
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
      localStorage.setItem(CLOUD_PROVIDER_KEY, cloudProvider);
      localStorage.setItem(LOCAL_PROVIDER_TYPE_KEY, localProviderType);
      setIsVerified(true);
      setTestStatus(null);
      setIsConfigCollapsed(true);

    } catch (err: any) {
      const message = t(err.message, err.details) || err.message;
      setTestStatus({ message, type: 'error' });
      setIsVerified(false);
    } finally {
      setIsTesting(false);
    }
  }, [
    serviceProvider, cloudProvider, localProviderType, apiKeyInput, googleModel, openRouterApiKey, openRouterModel,
    lmStudioUrl, lmStudioModel, ollamaUrl, ollamaModel, t
  ]);

  return {
    serviceProvider, setServiceProvider,
    cloudProvider, setCloudProvider,
    localProviderType, setLocalProviderType,
    apiKeyInput, setApiKeyInput,
    openRouterApiKey, setOpenRouterApiKey,
    debouncedApiKey,
    debouncedOpenRouterApiKey,
    googleModel, setGoogleModel,
    openRouterModel, setOpenRouterModel,
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
    invalidateConfig,
    isOpenRouterApiKeyValid,
    openRouterApiKeyTestStatus
  };
};
