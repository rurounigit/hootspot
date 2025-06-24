
import React, { useState, useEffect } from 'react';
import { SaveIcon, SettingsIcon, ExternalLinkIcon, InfoIcon } from '../constants';
import { testApiKey } from '../services/geminiService';
// ... imports and interface ...
import LanguageManager from './LanguageManager;

interface ApiKeyManagerProps {
  currentApiKey: string | null;
  onApiKeySave: (key: string) => Promise<{success: boolean, error?: string}>;
  currentMaxCharLimit: number;
  onMaxCharLimitSave: (limit: number) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  currentApiKey,
  onApiKeySave,
  currentMaxCharLimit,
  onMaxCharLimitSave,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey || '');
  const [maxCharLimitInput, setMaxCharLimitInput] = useState(currentMaxCharLimit.toString());
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{message: string, type: 'success' | 'error' } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(!!currentApiKey); // Collapse if API key is already set

  useEffect(() => {
    setApiKeyInput(currentApiKey || '');
  }, [currentApiKey]);

  useEffect(() => {
    setMaxCharLimitInput(currentMaxCharLimit.toString());
  }, [currentMaxCharLimit]);

  const handleSave = async () => {
    setIsTesting(true);
    setTestStatus(null);
    const trimmedApiKey = apiKeyInput.trim();
    if (!trimmedApiKey) {
      setTestStatus({ message: "API Key cannot be empty.", type: 'error'});
      setIsTesting(false);
      return;
    }

    const { isValid, error: testError } = await testApiKey(trimmedApiKey);
    if (isValid) {
      const {success, error: saveError} = await onApiKeySave(trimmedApiKey);
      if (success) {
        setTestStatus({ message: "API Key saved and validated successfully!", type: 'success' });
        setIsCollapsed(true); // Collapse after successful save
      } else {
         setTestStatus({ message: saveError || "Failed to save API Key.", type: 'error' });
      }
    } else {
      setTestStatus({ message: testError || "API Key validation failed.", type: 'error' });
    }

    const newLimit = parseInt(maxCharLimitInput, 10);
    if (!isNaN(newLimit) && newLimit > 0) {
      onMaxCharLimitSave(newLimit);
      // Can add a message for limit save if desired, but API key is primary
    } else {
      setTestStatus(prev => ({
        message: `${prev ? prev.message + " " : ""}Invalid character limit. Using previous or default.`,
        type: prev?.type === 'success' ? 'success' : 'error' // Keep success if API key was fine
      }));
      setMaxCharLimitInput(currentMaxCharLimit.toString()); // Reset to valid value
    }
    setIsTesting(false);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-700">Configuration</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-blue-500 hover:text-blue-700"
          aria-label={isCollapsed ? "Expand settings" : "Collapse settings"}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <InfoIcon className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700">
                  Your Google Gemini API Key is required to use Athena AI. It is stored locally in your browser and never sent to our servers.
                  You are responsible for any costs associated with its use.
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                >
                  Get your API Key from Google AI Studio <ExternalLinkIcon className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKeyInput}
              onChange={(e) => { setApiKeyInput(e.target.value); setTestStatus(null); }}
              placeholder="Enter your API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="maxCharLimit" className="block text-sm font-medium text-gray-700 mb-1">
              Max Characters for Analysis
            </label>
            <input
              type="number"
              id="maxCharLimit"
              value={maxCharLimitInput}
              onChange={(e) => setMaxCharLimitInput(e.target.value)}
              min="100"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Helps prevent accidentally analyzing very large texts.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={isTesting}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isTesting ? (
              <div className="spinner w-5 h-5 border-t-white mr-2"></div>
            ) : (
              <SaveIcon className="w-5 h-5 mr-2" />
            )}
            {isTesting ? 'Testing & Saving...' : 'Save & Test Configuration'}
          </button>

          {testStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm ${testStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {testStatus.message}
            </div>
          )}
        </>
      )}
       {isCollapsed && currentApiKey && (
         <p className="text-sm text-green-600">API Key is configured. Expand to change settings.</p>
       )}
       {isCollapsed && !currentApiKey && (
         <p className="text-sm text-red-600">API Key not configured. Please expand and enter your key.</p>
       )}
    </div>
  );
};

export default ApiKeyManager;
