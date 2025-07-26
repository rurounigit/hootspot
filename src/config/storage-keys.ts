// src/config/storage-keys.ts

export const API_KEY_STORAGE_KEY = 'hootspot-api-key';
export const MAX_CHAR_LIMIT_STORAGE_KEY = 'hootspot-max-char-limit';
export const CUSTOM_LANGUAGES_KEY = 'hootspot-custom-languages';
export const SELECTED_MODEL_STORAGE_KEY = 'hootspot-selected-model';
export const LANGUAGE_KEY = 'hootspot-language';
export const INCLUDE_REBUTTAL_JSON_KEY = 'hootspot-rebuttal-in-json';
export const INCLUDE_REBUTTAL_PDF_KEY = 'hootspot-rebuttal-in-pdf';
export const NIGHT_MODE_STORAGE_KEY = 'hootspot-night-mode';
export const SERVICE_PROVIDER_KEY = 'hootspot-service-provider';

// === Keys for Local Providers ===

// Keys for LM Studio
export const LM_STUDIO_URL_KEY = 'hootspot-lmstudio-url';
export const LM_STUDIO_MODEL_KEY = 'hootspot-lmstudio-model';

// ADDED: Key to remember which local provider is selected
export const LOCAL_PROVIDER_TYPE_KEY = 'hootspot-local-provider-type';

// ADDED: New keys for Ollama configuration
export const OLLAMA_URL_KEY = 'hootspot-ollama-url';
export const OLLAMA_MODEL_KEY = 'hootspot-ollama-model';