import React, { useState, useEffect, useCallback, useRef } from 'react';
import ApiKeyManager from './components/ApiKeyManager';
import TextAnalyzer from './components/TextAnalyzer';
import AnalysisReport from './components/AnalysisReport';
import { analyzeText } from './services/geminiService';
import { GeminiAnalysisResponse } from './types';
import {
  API_KEY_STORAGE_KEY,
  MAX_CHAR_LIMIT_STORAGE_KEY,
  DEFAULT_MAX_CHAR_LIMIT,
  AthenaLogoIcon
} from './constants';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [maxCharLimit, setMaxCharLimit] = useState<number>(DEFAULT_MAX_CHAR_LIMIT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResponse | null>(null);
  const [currentTextAnalyzed, setCurrentTextAnalyzed] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean>(false);

  const analysisReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsKeyValid(true);
    }
    const storedMaxCharLimit = localStorage.getItem(MAX_CHAR_LIMIT_STORAGE_KEY);
    if (storedMaxCharLimit) {
      setMaxCharLimit(parseInt(storedMaxCharLimit, 10) || DEFAULT_MAX_CHAR_LIMIT);
    }
  }, []);

  useEffect(() => {
    if (analysisResult && analysisReportRef.current) {
      analysisReportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult]);

  const handleApiKeySave = useCallback(async (newApiKey: string) => {
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
      setApiKey(newApiKey);
      setIsKeyValid(true);
      setError(null);
      return {success: true};
    } catch (e) {
      console.error("Error saving API key to localStorage:", e);
      return {success: false, error: "Failed to save API Key to local storage."};
    }
  }, []);

  const handleMaxCharLimitSave = useCallback((newLimit: number) => {
    localStorage.setItem(MAX_CHAR_LIMIT_STORAGE_KEY, newLimit.toString());
    setMaxCharLimit(newLimit);
  }, []);

  const handleAnalyzeText = async (text: string) => {
    if (!apiKey) {
      setError("API Key is not set. Please configure it in settings.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null); // Clear previous results before new analysis
    setCurrentTextAnalyzed(text);

    try {
      const result = await analyzeText(apiKey, text);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during analysis.");
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-athena-logo-bg to-athena-logo-bg">
      <div className="flex flex-col flex-1 w-full p-2 md:p-4 overflow-y-auto">
        <header className="mb-6 text-center">
          <div className="inline-flex items-center justify-center">
             <AthenaLogoIcon className="w-12 h-12 md:w-16 md:h-16 text-blue-600 mr-2 md:mr-3" />
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Athena AI</h1>
                <p className="text-md md:text-lg text-gray-600">Your Personal AI Text Analyst</p>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <ApiKeyManager
            currentApiKey={apiKey}
            onApiKeySave={handleApiKeySave}
            currentMaxCharLimit={maxCharLimit}
            onMaxCharLimitSave={handleMaxCharLimitSave}
          />

          <TextAnalyzer
            onAnalyze={handleAnalyzeText}
            isLoading={isLoading}
            maxCharLimit={maxCharLimit}
            hasApiKey={!!apiKey && isKeyValid}
          />

          {error && (
            <div className="my-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-md" role="alert">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
            </div>
          )}

          <div ref={analysisReportRef} className="mt-2"> {/* Added small margin-top for spacing */}
            {(!isLoading && !error && analysisResult) && (
               <AnalysisReport analysis={analysisResult} sourceText={currentTextAnalyzed} />
            )}
          </div>

          {(!isLoading && !error && !analysisResult && currentTextAnalyzed && !apiKey) && (
            <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md shadow-md">
                Please set up your API key to view analysis results.
            </div>
          )}

          {(!isLoading && !error && !analysisResult && !currentTextAnalyzed && apiKey) && (
            <div className="mt-6 p-6 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-md text-center">
                <p className="text-lg">Enter some text above and click "Analyze Text" to see the AI's insights.</p>
                <p className="text-sm mt-2">Athena AI will help you uncover hidden psychological and rhetorical patterns.</p>
            </div>
          )}
        </main>
        <footer className="mt-auto pt-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Athena AI Text Analyzer. For demonstration purposes.</p>
          <p>User is responsible for all Google Gemini API costs.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;