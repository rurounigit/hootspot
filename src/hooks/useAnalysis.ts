// src/hooks/useAnalysis.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../i18n';
import { analyzeText } from '../api/google/analysis';
import { translateAnalysisResult } from '../api/google/translation';
import { analyzeTextWithLMStudio } from '../api/lm-studio';
import { GeminiAnalysisResponse } from '../types/api';

export const useAnalysis = (
  serviceProvider: 'google' | 'local',
  apiKey: string | null,
  lmStudioUrl: string,
  lmStudioModel: string,
  selectedModel: string,
  isCurrentProviderConfigured: boolean,
  setIsConfigCollapsed: (isCollapsed: boolean) => void
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

    try {
      let result;
      if (serviceProvider === 'local') {
        result = await analyzeTextWithLMStudio(text, lmStudioUrl, lmStudioModel, t);
      } else {
        if (!apiKey) throw new Error('error_api_key_not_configured');
        result = await analyzeText(apiKey, text, selectedModel);
      }
      setAnalysisResult(result);

      if (language !== 'en' && result.findings.length > 0 && serviceProvider === 'google' && apiKey) {
        setIsTranslating(true);
        const translatedResult = await translateAnalysisResult(apiKey, result, language, selectedModel, t);
        setTranslatedResults({ [language]: translatedResult });
        setIsTranslating(false);
      }
    } catch (err: any) {
      const errorMessage = (err as Error).message || "An unknown error occurred during analysis.";
      setError(errorMessage);
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [isCurrentProviderConfigured, serviceProvider, lmStudioUrl, lmStudioModel, apiKey, selectedModel, language, t, setIsConfigCollapsed]);

  useEffect(() => {
    // This effect now correctly and simply triggers an analysis whenever
    // a pending analysis is set by the parent component.
    if (pendingAnalysis) {
      handleAnalyzeText(pendingAnalysis.text);
      setPendingAnalysis(null);
    }
  }, [pendingAnalysis, handleAnalyzeText]);


  useEffect(() => {
    if (!analysisResult || language === 'en' || serviceProvider === 'local' || !apiKey) return;
    if (translatedResults[language]) return;
    setIsTranslating(true);
    setError(null);
    translateAnalysisResult(apiKey, analysisResult, language, selectedModel, t)
      .then(translated => setTranslatedResults(prev => ({ ...prev, [language]: translated })))
      .catch(err => setError(err.message))
      .finally(() => setIsTranslating(false));
  }, [language, analysisResult, translatedResults, apiKey, selectedModel, t, serviceProvider]);

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
        if (data.reportId && data.analysisResult && typeof data.sourceText === 'string') {
          setAnalysisResult(data.analysisResult);
          setCurrentTextAnalyzed(data.sourceText);
          setTextToAnalyze(data.sourceText);
          setTranslatedResults({});
          setError(null);
        } else { throw new Error(t('error_invalid_json_file')); }
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
    pendingAnalysis,
    setPendingAnalysis,
    translatedResults,
    isTranslating,
    handleAnalyzeText,
    handleJsonLoad,
    analysisReportRef,
    displayedAnalysis: translatedResults[language] || analysisResult,
  };
};