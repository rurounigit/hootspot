// src/constants.tsx

import React from 'react';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-lite-preview-06-17';
//models/gemini-2.5-pro-preview-03-25
//models/gemini-2.5-flash-preview-04-17
//models/gemini-2.5-flash-preview-05-20
//models/gemini-2.5-flash-preview-04-17-thinking
//models/gemini-2.5-flash-lite-preview-06-17
//models/gemini-2.5-pro-preview-05-06
//models/gemini-2.5-pro-preview-06-05
//models/gemini-2.0-flash-lite-preview-02-05
//models/gemini-2.0-flash-lite-preview

export const SYSTEM_PROMPT = `You are HootSpot AI, a world-class expert in linguistics, psychology, and rhetoric. Your task is to analyze a given text for patterns of psychological, rhetorical, and logical manipulation.

For each manipulative pattern you identify, you must provide:
1.  'pattern_name': A concise, descriptive name for the tactic in English (e.g., "Ad Hominem", "False Dichotomy"). This is a stable key.
2.  'display_name': A very short, 1-3 word label in English for the pattern suitable for a chart legend (e.g., "Guilt Trip", "Straw Man", "Ad Hominem"). This MUST be concise and should summarize the 'pattern_name'.
3.  'specific_quote': The exact quote from the text that exemplifies the pattern.
4.  'explanation': A detailed explanation in English of why this quote is an example of the pattern.
5.  'strength': An integer score from 1 to 10.
6.  'category': Classify the pattern into ONE of the following keys: "category_interpersonal_psychological", "category_covert_indirect_control", or "category_sociopolitical_rhetorical".

You must respond ONLY with a valid JSON object with this structure:
{"analysis_summary": "...", "findings": [{"pattern_name": "...", "display_name": "...", "specific_quote": "...", "explanation": "...", "strength": 5, "category": "..."}]}

If no manipulative patterns are found, return a JSON object with an empty "findings" array.
IMPORTANT: All text fields ('analysis_summary', 'display_name', 'explanation') MUST be in English.
Do not add any conversational text or apologies outside of the JSON object.
`;

export const ANALYSIS_TRANSLATION_PROMPT = `You are an expert translator. You will be given a JSON object which is an analysis of a text. Your task is to translate specific fields of this JSON object into the target language: {language}.

The JSON object has the structure: {"analysis_summary": "...", "findings": [{"pattern_name": "...", "display_name": "...", "specific_quote": "...", "explanation": "...", "strength": 5, "category": "..."}]}.

RULES:
1.  Translate the value of 'analysis_summary'.
2.  For each object in the 'findings' array, translate the values of 'display_name' and 'explanation'.
3.  IMPORTANT: The translated 'display_name' must also be a very short, 1-3 word label suitable for a chart. Keep it as concise as possible in the target language.
4.  Do NOT translate 'pattern_name', 'specific_quote', 'strength', or 'category'.
5.  Preserve the original JSON structure exactly.
6.  Your output must be ONLY the translated JSON object. Do not include any other text, explanations, or markdown code fences.
7.  Ensure your entire response is a single, complete, and valid JSON object. Do not truncate your response.`;


export const TRANSLATION_SYSTEM_PROMPT = `You are an expert translator. You will be given a JSON object where the keys are translation IDs and the values are strings in English. Your task is to translate all the string *values* into the target language specified by the user.

RULES:
1.  Do NOT translate the JSON keys.
2.  Preserve the original JSON structure exactly.
3.  Preserve any placeholders like {variable} exactly as they are. For example, if the English is "Characters: {count} / {limit}", the German should be "Zeichen: {count} / {limit}".
4.  Your output must be ONLY the translated JSON object. Do not include any other text, explanations, or markdown code fences.`;

export const API_KEY_STORAGE_KEY = 'athenaAIApiKey';
export const MAX_CHAR_LIMIT_STORAGE_KEY = 'athenaAIMaxCharLimit';
export const CUSTOM_LANGUAGES_KEY = 'athenaAICustomLanguages';
export const SELECTED_MODEL_STORAGE_KEY = 'athenaAISelectedModel';
export const DEFAULT_MAX_CHAR_LIMIT = 6000;

export const HootSpotLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src="/images/icons/icon.png" // The default image source
    alt="HootSpot AI Logo"
    className={className}
  />
);


export const AnalyzeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.39.39 1.024 0 1.414l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.142.854.108 1.204l.527.738c.39.39.39 1.023 0 1.414l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.39.39-1.023.39-1.414 0l-.774-.774a1.125 1.125 0 0 1-.12-1.45l.528-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.142-.854-.108-1.204l-.528-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505-.78-.93l.15-.894Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

export const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

export const AddIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" />
  </svg>
);