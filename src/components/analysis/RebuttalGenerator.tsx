// src/components/analysis/RebuttalGenerator.tsx

import React, { useState } from 'react';
import { generateRebuttal } from '../../api/google';
import { GeminiAnalysisResponse } from '../../types/api';
import { useTranslation } from '../../i18n';
import { SparklesIcon } from '../../assets/icons';

interface RebuttalGeneratorProps {
    analysis: GeminiAnalysisResponse;
    sourceText: string | null;
    apiKey: string | null;
    selectedModel: string;
    rebuttalForDisplay: string | null;
    isTranslating: boolean; // Renamed to be more generic, but only used for display
    onUpdate: (newRebuttal: string) => void;
}

const RebuttalGenerator: React.FC<RebuttalGeneratorProps> = ({
    analysis,
    sourceText,
    apiKey,
    selectedModel,
    rebuttalForDisplay,
    isTranslating,
    onUpdate
}) => {
    const { t, language } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!apiKey || !sourceText) return;
        setIsGenerating(true);
        setError(null);
        try {
            const result = await generateRebuttal(apiKey, sourceText, analysis, selectedModel, language);
            onUpdate(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="mt-8 pt-6 border-t border-divider-light dark:border-divider-dark">
            <h3 className="text-lg font-semibold text-text-label-light dark:text-text-label-dark mb-2">
                {t('rebuttal_title')}
            </h3>
            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">
                {t('rebuttal_description')}
            </p>
            <button
                onClick={handleGenerate}
                disabled={isGenerating || isTranslating || !apiKey}
                className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-button-disabled-bg-light dark:disabled:bg-button-disabled-bg-dark"
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
                <div className="my-4 p-4 bg-error-bg-light border border-error-border-light text-error-text-light dark:bg-error-bg-dark dark:text-error-text-dark dark:border-error-border-dark rounded-md shadow-md" role="alert">
                    <strong className="font-bold">{t('error_prefix')}</strong>
                    <span>{error}</span>
                </div>
            )}

            {rebuttalForDisplay && !isGenerating && (
                <div className="mt-4 p-4 bg-panel-bg-light dark:bg-panel-bg-dark rounded-md shadow border border-panel-border-light dark:border-panel-border-dark">
                    <p className="whitespace-pre-wrap text-text-main-light dark:text-text-main-dark">{rebuttalForDisplay}</p>
                </div>
            )}
        </div>
    );
};

export default RebuttalGenerator;
