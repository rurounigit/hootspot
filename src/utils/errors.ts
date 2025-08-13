// src/utils/errors.ts

/**
 * Base error class for the application to allow for specific error catching.
 */
export class HootSpotError extends Error {
  constructor(messageKey: string) {
    super(messageKey); // The messageKey is the translation key, e.g., 'error_api_key_empty'
    this.name = 'HootSpotError';
  }
}

/**
 * Represents an error that the user can likely resolve by changing their configuration.
 * Examples: Invalid API key, wrong server URL, model not loaded.
 */
export class ConfigError extends HootSpotError {
  // This property will carry dynamic data for the error message.
  public details: Record<string, any>;

  constructor(messageKey: string, details: Record<string, any> = {}) {
    super(messageKey);
    this.name = 'ConfigError';
    this.details = details; // e.g., { url: 'http://bad-url' }
  }
}

/**
 * Represents a general runtime error that is not related to user configuration.
 * Examples: API safety block, context length exceeded, failed translation.
 */
export class GeneralError extends HootSpotError {
  public details: Record<string, any>;

  constructor(messageKey: string, details: Record<string, any> = {}) {
    super(messageKey);
    this.name = 'GeneralError';
    this.details = details;
  }
}
