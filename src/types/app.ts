// General application types will be defined here.

export interface AnalysisReportData {
    title: string;
    text: string;
    report: any;
    highlighted_text: string;
    rebuttal: string;
    is_pdf: boolean;
}

export interface Language {
    code: string;
    name: string;
}

export interface TranslationResult {
    translatedText: string;
}

export interface TranslationRequest {
    text: string;
    targetLanguage: string;
}

export interface TranslationManagerProps {
    serviceProvider: 'cloud' | 'local';
    cloudProvider: 'google' | 'openrouter';
    localProviderType: 'lm-studio' | 'ollama';
    apiKey: string;
    openRouterApiKey: string;
    lmStudioConfig: { url: string; model: string };
    ollamaConfig: { url: string; model: string };
    isCurrentProviderConfigured: boolean;
}

export interface LanguageManagerProps extends TranslationManagerProps {}

export interface LanguageSwitcherProps {
    currentLanguage: string;
    onLanguageChange: (languageCode: string) => void;
    supportedLanguages: Language[];
}

export interface TextAnalysisRequest {
    text: string;
    serviceProvider: 'cloud' | 'local';
    cloudProvider: 'google' | 'openrouter';
    localProviderType: 'lm-studio' | 'ollama';
    apiKey: string;
    openRouterApiKey: string;
    model: string;
    lmStudioConfig: { url: string; model: string };
    ollamaConfig: { url: string; model: string };
    language: string;
    noteToLlm: string;
}

export interface TextAnalysisResponse {
    report: any;
    highlighted_text: string;
}

export interface RebuttalGenerationRequest {
    text: string;
    report: any;
    serviceProvider: 'cloud' | 'local';
    cloudProvider: 'google' | 'openrouter';
    localProviderType: 'lm-studio' | 'ollama';
    apiKey: string;
    openRouterApiKey: string;
    model: string;
    lmStudioConfig: { url: string; model: string };
    ollamaConfig: { url: string; model: string };
    language: string;
}

export interface RebuttalGenerationResponse {
    rebuttal: string;
}

export interface AnalysisResult {
    report: any;
    highlightedText: string;
    rebuttal: string;
}

export interface AnalysisError {
    message: string;
}

export interface AnalysisReportProps {
    report: any;
    isLoading: boolean;
    text: string;
    highlightedText: string;
    rebuttal: string;
    isRebuttalLoading: boolean;
    onGenerateRebuttal: () => void;
    onShare: (format: 'json' | 'pdf' | 'png' | 'jpeg') => void;
    isCurrentProviderConfigured: boolean;
}

export interface HighlightedTextProps {
    highlightedText: string;
    isLoading: boolean;
}

export interface RebuttalGeneratorProps {
    rebuttal: string;
    isLoading: boolean;
    onGenerate: () => void;
    isCurrentProviderConfigured: boolean;
}

export interface ManipulationBubbleChartProps {
    data: any;
    isLoading: boolean;
}

export interface ShareMenuProps {
    onShare: (format: 'json' | 'pdf' | 'png' | 'jpeg') => void;
}

export interface ExportableBubbleChartProps {
    data: any;
    id: string;
}

export interface ReportPdfDocumentProps {
    title: string;
    text: string;
    report: any;
    highlightedText: string;
    rebuttal: string;
    chartImage: string | null;
}

export interface PdfGeneratorProps {
    data: AnalysisReportData;
}

export interface UseAnalysisReportDataProps {
    title: string;
    text: string;
    report: any;
    highlightedText: string;
    rebuttal: string;
}

export interface UsePdfGeneratorProps {
    data: AnalysisReportData;
}

export interface UseAnalysisProps {
    text: string;
    isCurrentProviderConfigured: boolean;
    serviceProvider: 'cloud' | 'local';
    cloudProvider: 'google' | 'openrouter';
    localProviderType: 'lm-studio' | 'ollama';
    apiKey: string;
    openRouterApiKey: string;
    model: string;
    lmStudioConfig: { url: string; model: string };
    ollamaConfig: { url: string; model: string };
    language: string;
    noteToLlm: string;
    onConfigError: (message: string) => void;
}

export interface UseModelsProps {
    serviceProvider: 'cloud' | 'local';
    cloudProvider: 'google' | 'openrouter';
    localProviderType: 'lm-studio' | 'ollama';
    apiKey: string;
    openRouterApiKey: string;
    lmStudioUrl: string;
    ollamaUrl: string;
    showAllVersions: boolean;
}

export interface UseTranslationManagerProps {
    serviceProvider: 'cloud' | 'local';
    cloudProvider: 'google' | 'openrouter';
    localProviderType: 'lm-studio' | 'ollama';
    apiKey: string;
    openRouterApiKey: string;
    lmStudioConfig: { url: string; model: string };
    ollamaConfig: { url: string; model: string };
    isCurrentProviderConfigured: boolean;
}

export interface UseConfigReturn {
    serviceProvider: 'cloud' | 'local';
    setServiceProvider: (provider: 'cloud' | 'local') => void;
    cloudProvider: 'google' | 'openrouter';
    setCloudProvider: (provider: 'google' | 'openrouter') => void;
    localProviderType: 'lm-studio' | 'ollama';
    setLocalProviderType: (type: 'lm-studio' | 'ollama') => void;
    apiKeyInput: string;
    setApiKeyInput: (key: string) => void;
    debouncedApiKey: string;
    googleModel: string;
    setGoogleModel: (model: string) => void;
    openRouterApiKey: string;
    setOpenRouterApiKey: (key: string) => void;
    openRouterModel: string;
    setOpenRouterModel: (model: string) => void;
    lmStudioUrl: string;
    setLmStudioUrl: (url: string) => void;
    lmStudioModel: string;
    setLmStudioModel: (model: string) => void;
    ollamaUrl: string;
    setOllamaUrl: (url: string) => void;
    ollamaModel: string;
    setOllamaModel: (model: string) => void;
    maxCharLimit: number;
    isNightMode: boolean;
    setIsNightMode: (value: boolean) => void;
    includeRebuttalInJson: boolean;
    setIncludeRebuttalInJson: (value: boolean) => void;
    includeRebuttalInPdf: boolean;
    setIncludeRebuttalInPdf: (value: boolean) => void;
    showAllVersions: boolean;
    setShowAllVersions: (value: boolean) => void;
    isConfigCollapsed: boolean;
    setIsConfigCollapsed: (value: boolean) => void;
    isTesting: boolean;
    testStatus: { message: string; type: 'success' | 'error' } | null;
    isCurrentProviderConfigured: boolean;
    handleMaxCharLimitSave: (newLimit: number) => void;
    saveAndTestConfig: () => Promise<void>;
    invalidateConfig: (errorMessage: string) => void;
}