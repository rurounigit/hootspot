import { testLMStudioConnection, analyzeTextWithLMStudio } from './lm-studio';
import { GeminiAnalysisResponse } from '../types/api';

// Mock the fetch function
global.fetch = vi.fn();

// Mock the t function
const mockT = vi.fn((key: string, replacements?: Record<string, string | number>) => {
  if (key === 'error_local_model_not_loaded' && replacements) {
    return `Model ${replacements.model} not loaded: ${replacements.message}`;
  }
  if (key === 'error_local_server_connection' && replacements) {
    return `Cannot connect to server at ${replacements.url}`;
  }
  if (key === 'test_query_returned_empty') {
    return 'Test query returned empty';
  }
  if (key === 'error_unexpected_json_structure') {
    return 'Unexpected JSON structure';
  }
  if (key === 'error_json_parse' && replacements) {
    return `JSON parse error: ${replacements.message}`;
  }
  return key;
});

describe('testLMStudioConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if serverUrl or modelName is missing', async () => {
    await expect(testLMStudioConnection('', 'model', mockT)).rejects.toThrow('error_local_server_config_missing');
    await expect(testLMStudioConnection('http://localhost:1234', '', mockT)).rejects.toThrow('error_local_server_config_missing');
  });

  it('throws an error if the fetch request fails with a non-ok status', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue({ error: { message: 'Model not found' } }),
    });

    await expect(testLMStudioConnection('http://localhost:1234', 'model', mockT)).rejects.toThrow('Model model not loaded: Model not found');
    expect(fetch).toHaveBeenCalledWith('http://localhost:1234/v1/chat/completions', expect.any(Object));
  });

  it('throws an error if the fetch request throws a TypeError', async () => {
    (fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

    await expect(testLMStudioConnection('http://localhost:1234', 'model', mockT)).rejects.toThrow('Cannot connect to server at http://localhost:1234');
  });

  it('resolves successfully if the fetch request is successful', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'Hello' } }] }),
    });

    await expect(testLMStudioConnection('http://localhost:1234', 'model', mockT)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith('http://localhost:1234/v1/chat/completions', expect.any(Object));
  });
});

describe('analyzeTextWithLMStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if serverUrl or modelName is missing', async () => {
    await expect(analyzeTextWithLMStudio('text', '', 'model', mockT)).rejects.toThrow('error_local_server_config_missing');
    await expect(analyzeTextWithLMStudio('text', 'http://localhost:1234', '', mockT)).rejects.toThrow('error_local_server_config_missing');
  });

  it('returns an empty analysis if the text is empty', async () => {
    const result = await analyzeTextWithLMStudio('', 'http://localhost:1234', 'model', mockT);
    expect(result).toEqual({ analysis_summary: "No text provided for analysis.", findings: [] });
  });

  it('throws an error if the fetch request fails with a non-ok status', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue({ error: { message: 'Model not found' } }),
    });

    await expect(analyzeTextWithLMStudio('text', 'http://localhost:1234', 'model', mockT)).rejects.toThrow('Model model not loaded: Model not found');
    expect(fetch).toHaveBeenCalledWith('http://localhost:1234/v1/chat/completions', expect.any(Object));
  });

  it('throws an error if the fetch request throws a TypeError', async () => {
    (fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

    await expect(analyzeTextWithLMStudio('text', 'http://localhost:1234', 'model', mockT)).rejects.toThrow('Cannot connect to server at http://localhost:1234');
  });

  it('throws an error if the response content is missing', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [] }),
    });

    await expect(analyzeTextWithLMStudio('text', 'http://localhost:1234', 'model', mockT)).rejects.toThrow('Unexpected JSON structure');
  });

  it('throws an error if the JSON parsing fails', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'Invalid JSON' } }] }),
    });

    await expect(analyzeTextWithLMStudio('text', 'http://localhost:1234', 'model', mockT)).rejects.toThrow('JSON parse error: ');
    expect(mockT).toHaveBeenCalledWith('error_json_parse', expect.any(Object));
  });

  it('returns the parsed JSON data if the response is valid', async () => {
    const mockResponse: GeminiAnalysisResponse = {
      analysis_summary: 'This is a test summary.',
      findings: [
        {
          pattern_name: 'pattern1',
          display_name: 'Pattern One',
          category: 'Category A',
          explanation: 'Test explanation',
          specific_quote: 'Test quote',
          strength: 5,
        },
      ],
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify(mockResponse) } }] }),
    });

    const result = await analyzeTextWithLMStudio('text', 'http://localhost:1234', 'model', mockT);
    expect(result).toEqual(mockResponse);
  });
});
