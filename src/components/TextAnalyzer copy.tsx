
import React, { useState } from 'react';
import { AnalyzeIcon } from '../constants';

interface TextAnalyzerProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
  maxCharLimit: number;
  hasApiKey: boolean;
}

const TextAnalyzer: React.FC<TextAnalyzerProps> = ({ onAnalyze, isLoading, maxCharLimit, hasApiKey }) => {
  const [text, setText] = useState('');
  const charCount = text.length;
  const exceedsLimit = charCount > maxCharLimit;

  const handleAnalyze = () => {
    if (!exceedsLimit && hasApiKey && text.trim().length > 0) {
      onAnalyze(text);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-1">Analyze Text</h2>
      <p className="text-sm text-gray-500 mb-4">Paste the text you want to analyze below.</p>

      {!hasApiKey && (
        <div className="mb-4 p-3 rounded-md text-sm bg-yellow-50 text-yellow-700 border border-yellow-200">
          Please configure your API Key in the settings above to enable analysis.
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text here for analysis..."
        rows={8}
        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
        maxLength={maxCharLimit + 500} // Allow some overtyping to show message, actual limit enforced by logic
        disabled={!hasApiKey || isLoading}
      />
      <div className="flex justify-between items-center mt-2 text-sm">
        <p className={`
          ${exceedsLimit ? 'text-red-600 font-semibold' : 'text-gray-600'}
          ${charCount > maxCharLimit * 0.9 ? 'font-medium' : ''}
        `}>
          Characters: {charCount} / {maxCharLimit}
          {exceedsLimit && ` (Over limit by ${charCount - maxCharLimit})`}
        </p>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || exceedsLimit || !hasApiKey || text.trim().length === 0}
          className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
        >
          {isLoading ? (
            <div className="spinner w-5 h-5 border-t-white mr-2"></div>
          ) : (
            <AnalyzeIcon className="w-5 h-5 mr-2" />
          )}
          {isLoading ? 'Analyzing...' : 'Analyze Text'}
        </button>
      </div>
    </div>
  );
};

export default TextAnalyzer;
