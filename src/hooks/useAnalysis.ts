// src/hooks/useAnalysis.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../i18n';
import { analyzeText as analyzeWithGoogle } from '../api/google/analysis';
import { translateAnalysisResult as translateWithGoogle } from '../api/google/translation';
import { analyzeTextWithLMStudio, translateAnalysisResultWithLMStudio } from '../api/lm-studio';
import { analyzeTextWithOllama, translateAnalysisResultWithOllama } from '../api/ollama';
import { GeminiAnalysisResponse } from '../types/api';

export const useAnalysis = (
  serviceProvider: 'google' | 'local',
  localProviderType: 'lm-studio' | 'ollama',
  apiKey: string | null,
  lmStudioUrl: string,
  lmStudioModel: string,
  ollamaUrl: string,
  ollamaModel: string,
  selectedModel: string,
  isCurrentProviderConfigured: boolean,
  setIsConfigCollapsed: (isCollapsed: boolean) => void,
  onRebuttalLoad: (rebuttal: { text: string; lang: string }) => void
) => {
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResponse | null>(null);
  const [currentTextAnalyzed, setCurrentTextAnalyzed] = useState<string | null>(null);
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [pendingAnalysis, setPendingAnalysis] = useState<{ text: string } | null>(null);
  const [translatedResults, setTranslatedResults] = useState<Record<string, GeminiAnalysisResponse>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const analysisReportRef = useRef<HTMLDivElement>(null);

  const translateAnalysis = useCallback(async (analysis: GeminiAnalysisResponse, targetLang: string) => {
      if (!isCurrentProviderConfigured || analysis.findings.length === 0) return;
      setIsTranslating(true);
      setError(null);
      try {
          let translatedResult: GeminiAnalysisResponse;
          if (serviceProvider === 'google') {
              if (!apiKey) throw new Error(t('error_api_key_not_configured'));
              translatedResult = await translateWithGoogle(apiKey, analysis, targetLang, selectedModel, t);
          } else { // Local provider
              if (localProviderType === 'lm-studio') {
                  translatedResult = await translateAnalysisResultWithLMStudio(analysis, lmStudioUrl, lmStudioModel, targetLang, t);
              } else { // Ollama
                  translatedResult = await translateAnalysisResultWithOllama(analysis, ollamaUrl, ollamaModel, targetLang, t);
              }
          }
          setTranslatedResults(prev => ({ ...prev, [targetLang]: translatedResult }));
      } catch (err: any) {
          setError((err as Error).message);
      } finally {
          setIsTranslating(false);
      }
  }, [
      isCurrentProviderConfigured, serviceProvider, localProviderType,
      apiKey, selectedModel, language, t,
      lmStudioUrl, lmStudioModel, ollamaUrl, ollamaModel
  ]);

  const handleAnalyzeText = useCallback(async (text: string) => {
    if (!isCurrentProviderConfigured) {
      setIsConfigCollapsed(false);
      setError(t('error_provider_not_configured'));
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
      let result: GeminiAnalysisResponse;
      if (serviceProvider === 'google') {
        if (!apiKey) throw new Error('error_api_key_not_configured');
        result = await analyzeWithGoogle(apiKey, text, selectedModel);
      } else {
        if (localProviderType === 'lm-studio') {
          result = await analyzeTextWithLMStudio(text, lmStudioUrl, lmStudioModel, t);
        } else {
          result = await analyzeTextWithOllama(text, ollamaUrl, ollamaModel, t);
        }
      }
      setAnalysisResult(result);

      if (language !== 'en') {
        await translateAnalysis(result, language);
      }
    } catch (err: any) {
      setError((err as Error).message);
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    isCurrentProviderConfigured, serviceProvider, localProviderType,
    apiKey, selectedModel, lmStudioUrl, lmStudioModel,
    ollamaUrl, ollamaModel, language, t, setIsConfigCollapsed, translateAnalysis, onRebuttalLoad
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
      } catch (e: any) { setError(`${t('error_json_load_failed')} ${e.message}`); }
    };
    reader.readAsText(file);
  };

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
  };
};