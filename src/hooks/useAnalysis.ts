// src/hooks/useAnalysis.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../i18n';
import { analyzeText as analyzeWithGoogle } from '../api/google/analysis';
import { translateAnalysisResult as translateWithGoogle } from '../api/google/translation';
import { analyzeTextWithLMStudio, translateAnalysisResultWithLMStudio } from '../api/lm-studio';
import { analyzeTextWithOllama, translateAnalysisResultWithOllama } from '../api/ollama';
import { analyzeText as analyzeTextWithOpenRouter } from '../api/openrouter/analysis';
import { translateAnalysisResult as translateAnalysisResultWithOpenRouter } from '../api/openrouter/translation';
import { AIAnalysisOutput } from '../types/api';
import { ConfigError} from '../utils/errors';

export const useAnalysis = (
  serviceProvider: 'cloud' | 'local',
  localProviderType: 'lm-studio' | 'ollama',
  apiKey: string | null,
  lmStudioUrl: string,
  lmStudioModel: string,
  ollamaUrl: string,
  ollamaModel: string,
  selectedModel: string,
  isCurrentProviderConfigured: boolean,
  setIsConfigCollapsed: (isCollapsed: boolean) => void,
  onRebuttalLoad: (rebuttal: { text: string; lang: string }) => void,
  cloudProvider: 'google' | 'openrouter',
  openRouterApiKey: string | null,
  openRouterModel: string
) => {
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string, type: 'config' | 'general' } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisOutput | null>(null);
  const [currentTextAnalyzed, setCurrentTextAnalyzed] = useState<string | null>(null);
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [pendingAnalysis, setPendingAnalysis] = useState<{ text: string } | null>(null);
  const [translatedResults, setTranslatedResults] = useState<Record<string, AIAnalysisOutput>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const analysisReportRef = useRef<HTMLDivElement>(null);

  const translateAnalysis = useCallback(async (analysis: AIAnalysisOutput, targetLang: string) => {
      if (!isCurrentProviderConfigured || analysis.findings.length === 0) return;
      setIsTranslating(true);
      setError(null);
      try {
          let translatedResult: AIAnalysisOutput;
          if (serviceProvider === 'cloud') {
            if (cloudProvider === 'google') {
              if (!apiKey) throw new Error(t('error_api_key_not_configured'));
              translatedResult = await translateWithGoogle(apiKey, analysis, targetLang, selectedModel, t);
            } else {
              if (!openRouterApiKey) throw new Error(t('error_api_key_not_configured'));
              translatedResult = await translateAnalysisResultWithOpenRouter(openRouterApiKey, analysis, targetLang, openRouterModel, t);
            }
          } else { // Local provider
              if (localProviderType === 'lm-studio') {
                  translatedResult = await translateAnalysisResultWithLMStudio(analysis, lmStudioUrl, lmStudioModel, targetLang);
              } else { // Ollama
                  translatedResult = await translateAnalysisResultWithOllama(analysis, ollamaUrl, ollamaModel, targetLang);
              }
          }
          setTranslatedResults(prev => ({ ...prev, [targetLang]: translatedResult }));
      } catch (err: any) {
          const message = t(err.message, err.details) || err.message;
          if (err instanceof ConfigError) {
            setError({ message, type: 'config' });
          } else {
            setError({ message, type: 'general' });
          }
      } finally {
          setIsTranslating(false);
      }
  }, [
      isCurrentProviderConfigured, serviceProvider, localProviderType,
      apiKey, selectedModel, language, t,
      lmStudioUrl, lmStudioModel, ollamaUrl, ollamaModel, cloudProvider, openRouterApiKey, openRouterModel
  ]);

  const handleAnalyzeText = useCallback(async (text: string) => {
    if (!isCurrentProviderConfigured) {
      setIsConfigCollapsed(false);
      setError({ message: t('error_provider_not_configured'), type: 'config' });
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentTextAnalyzed(text);
    setTranslatedResults({});
    // When starting a new analysis, clear any old rebuttal.
    onRebuttalLoad({ text: '', lang: language });

    try {
      let result: AIAnalysisOutput;
      if (serviceProvider === 'cloud') {
        if (cloudProvider === 'google') {
          if (!apiKey) throw new Error('error_api_key_not_configured');
          result = await analyzeWithGoogle(apiKey, text, selectedModel);
        } else {
          if (!openRouterApiKey) throw new Error('error_api_key_not_configured');
          result = await analyzeTextWithOpenRouter(openRouterApiKey, text, openRouterModel);
        }
      } else {
        if (localProviderType === 'lm-studio') {
          result = await analyzeTextWithLMStudio(text, lmStudioUrl, lmStudioModel);
        } else {
          result = await analyzeTextWithOllama(text, ollamaUrl, ollamaModel);
        }
      }
      setAnalysisResult(result);

      if (language !== 'en') {
        await translateAnalysis(result, language);
      }
    } catch (err: any) {
      const message = t(err.message, err.details) || err.message;
      if (err instanceof ConfigError) {
        setError({ message, type: 'config' });
      } else {
        setError({ message, type: 'general' });
      }
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    isCurrentProviderConfigured, serviceProvider, localProviderType,
    apiKey, selectedModel, lmStudioUrl, lmStudioModel,
    ollamaUrl, ollamaModel, language, t, setIsConfigCollapsed, translateAnalysis, onRebuttalLoad, cloudProvider, openRouterApiKey, openRouterModel
  ]);

  useEffect(() => {
    if (pendingAnalysis) {
      handleAnalyzeText(pendingAnalysis.text);
      setPendingAnalysis(null);
    }
  }, [pendingAnalysis, handleAnalyzeText]);

  useEffect(() => {
    if (analysisResult && language !== 'en' && !translatedResults[language]) {
      translateAnalysis(analysisResult, language);
    }
  }, [language, analysisResult, translatedResults, translateAnalysis]);

  useEffect(() => {
    if (analysisResult && analysisReportRef.current) {
      analysisReportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult]);

  const handleJsonLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (!data.reportId || !data.analysisResult || typeof data.sourceText !== 'string') {
          throw new Error(t('error_invalid_json_file'));
        }

        setError(null);
        setAnalysisResult(data.analysisResult);
        setCurrentTextAnalyzed(data.sourceText);
        setTextToAnalyze(data.sourceText);

        const fileLang = data.languageCode || 'en';

        if (data.rebuttal && typeof data.rebuttal === 'string') {
          onRebuttalLoad({ text: data.rebuttal, lang: fileLang });
        } else {
          onRebuttalLoad({ text: '', lang: language });
        }

        if (fileLang !== language) {
          setTranslatedResults({});
          translateAnalysis(data.analysisResult, language);
        } else {
          setTranslatedResults({ [language]: data.analysisResult });
        }
      } catch (e: any) {
          const message = t(e.message, e.details) || e.message;
          const finalMessage = `${t('error_json_load_failed')} ${message}`;
          setError({ message: finalMessage, type: 'general' });
      }
    };
    reader.readAsText(file);
  };

  const clearError = useCallback(() => { setError(null); }, []);

  return {
    isLoading,
    error,
    analysisResult,
    currentTextAnalyzed,
    textToAnalyze,
    setTextToAnalyze,
    setPendingAnalysis,
    isTranslating,
    handleAnalyzeText,
    handleJsonLoad,
    analysisReportRef,
    displayedAnalysis: translatedResults[language] || analysisResult,
    clearError,
  };
};
