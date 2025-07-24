// src/components/analysis/RebuttalGenerator.tsx

import React, { useState } from 'react';
import { generateRebuttal } from '../../api/google/analysis';
import { generateRebuttalWithLMStudio } from '../../api/lm-studio';
import { GeminiAnalysisResponse } from '../../types/api';
import { useTranslation } from '../../i18n';
import { SparklesIcon } from '../../assets/icons';

interface RebuttalGeneratorProps {
    analysis: GeminiAnalysisResponse;
    sourceText: string | null;
    rebuttalForDisplay: string | null;
    isTranslating: boolean;
    onUpdate: (newRebuttal: string) => void;
    serviceProvider: 'google' | 'local';
    apiKey: string | null;
    selectedModel: string;
    lmStudioUrl: string;
    lmStudioModel: string;
    isCurrentProviderConfigured: boolean; // Add the master flag
}

const RebuttalGenerator: React.FC<RebuttalGeneratorProps> = ({
    analysis,
    sourceText,
    rebuttalForDisplay,
    isTranslating,
    onUpdate,
    serviceProvider,
    apiKey,
    selectedModel,
    lmStudioUrl,
    lmStudioModel,
    isCurrentProviderConfigured, // Use the master flag
}) => {
    const { t, language } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!isCurrentProviderConfigured || !sourceText) return;
        setIsGenerating(true);
        setError(null);
        try {
          let result: string;
            if (serviceProvider === 'local') {
                result = await generateRebuttalWithLMStudio(sourceText, analysis, lmStudioUrl, lmStudioModel, language, t);
            } else {
                if (!apiKey) throw new Error(t('error_api_key_not_configured'));
                result = await generateRebuttal(apiKey, sourceText, analysis, selectedModel, language);
            }
            onUpdate(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('rebuttal_title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('rebuttal_description')}
            </p>
            <button
                onClick={handleGenerate}
                disabled={isGenerating || isTranslating || !isCurrentProviderConfigured}
                className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
                {isGenerating ? (
                    <>
                        <div className="spinner w-5 h-5 border-t-white mr-2"></div>
                        {t('rebuttal_button_generating')}
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {t('rebuttal_button_generate')}
                    </>
                )}
            </button>

            {error && (
                <div className="my-4 p-4 bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500 rounded-md shadow-md" role="alert">
                    <strong className="font-bold">{t('error_prefix')}</strong>
                    <span>{error}</span>
                </div>
            )}

            {rebuttalForDisplay && !isGenerating && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-md shadow border border-gray-200 dark:border-gray-700">
                    <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-50">{rebuttalForDisplay}</p>
                </div>
            )}
        </div>
    );
};

export default RebuttalGenerator;