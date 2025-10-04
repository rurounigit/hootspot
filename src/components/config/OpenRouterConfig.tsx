// src/components/config/OpenRouterConfig.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n';
import { GroupedModels } from '../../types/api';

interface OpenRouterConfigProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  models: GroupedModels;
  areModelsLoading: boolean;
  modelsError: string | null;
  openRouterLastSearchTerm: string;
  setOpenRouterLastSearchTerm: (term: string) => void;
}

const OpenRouterConfig: React.FC<OpenRouterConfigProps> = ({
  apiKey,
  onApiKeyChange,
  selectedModel,
  onModelChange,
  models,
  areModelsLoading,
  modelsError,
  openRouterLastSearchTerm,
  setOpenRouterLastSearchTerm,
}) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState(openRouterLastSearchTerm);
  const isSelectingModelRef = useRef(false);

  // Get selected model info
  const selectedModelInfo = models.stable?.find(model => model.name === selectedModel);

  // Update search term when last search term changes (e.g., when panel opens)
  useEffect(() => {
    setSearchTerm(openRouterLastSearchTerm);
  }, [openRouterLastSearchTerm]);

  const allModels = models.stable || [];
  const filteredModels = allModels.filter((model) =>
    model.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchFocus = useCallback(() => {
    setIsDropdownOpen(true);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setOpenRouterLastSearchTerm(newSearchTerm);
    setIsDropdownOpen(true); // Keep dropdown open when typing
  };

  const handleModelSelect = (model: string) => {
    isSelectingModelRef.current = true;
    onModelChange(model);
    setIsDropdownOpen(false); // Close dropdown after selection
    // Reset the flag after a short delay to allow click outside processing
    setTimeout(() => {
      isSelectingModelRef.current = false;
    }, 100);
  };

  const handleClearSelection = () => {
    onModelChange('');
    setIsDropdownOpen(true); // Show dropdown after clearing
    setTimeout(() => {
      searchInputRef.current?.focus(); // Focus the search input
    }, 0);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If we're in the middle of selecting a model, don't close the dropdown
      if (isSelectingModelRef.current) {
        return;
      }

      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show dropdown when there's content or when focused
  const shouldShowDropdown = isDropdownOpen && (searchTerm.length > 0 || filteredModels.length > 0);

  // Determine input display value - show selected model name or search term
  const displayValue = selectedModel
    ? (selectedModelInfo?.displayName || selectedModel)
    : searchTerm;

  return (
    <>
      <div className="mb-4">
        <label htmlFor="openRouterApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('config_openrouter_api_key_label')}
        </label>
        <input
          type="password"
          id="openRouterApiKey"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder={t('config_api_key_placeholder')}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('config_model_label')}
        </label>

        {/* Combined search and model display */}
        <div className="relative mb-2">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search models..."
              value={displayValue}
              onFocus={handleSearchFocus}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            {/* Search icon or X button */}
            {selectedModel ? (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Clear model selection"
                title="Clear model selection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          {/* Show model description below the input when a model is selected */}
          {selectedModel && selectedModelInfo && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <p>{selectedModelInfo.description}</p>
            </div>
          )}
        </div>

        {/* Dropdown - shown when search is focused or has content */}
        {shouldShowDropdown && (
          <div
            ref={dropdownRef}
            className="relative z-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
          >
            <div className="max-h-60 overflow-y-auto bg-white dark:bg-gray-800 rounded-md shadow-lg mt-1">
              {areModelsLoading && (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('config_model_loading')}
                </div>
              )}

              {modelsError && (
                <div className="px-4 py-2 text-sm text-red-500 dark:text-red-400">
                  {t('config_model_error')}
                </div>
              )}

              {!areModelsLoading && !modelsError && filteredModels.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('config_openrouter_enter_api_key_to_see_models')}
                </div>
              )}

              {!areModelsLoading && !modelsError && filteredModels.length > 0 && (
                <>
                  {filteredModels.map((model) => (
                    <div
                      key={model.name}
                      onClick={() => handleModelSelect(model.name)}
                      className="px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-normal">{model.displayName}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OpenRouterConfig;
