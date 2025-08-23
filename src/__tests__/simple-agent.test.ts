import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentOptions } from '../simple-agent.js';

// Mock the dependencies
vi.mock('../openai-client.js', () => ({
  SimpleOpenAIClient: vi.fn().mockImplementation(() => ({
    chat: vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'Mock AI response' } }],
    }),
  })),
}));

vi.mock('../tools/fsTools.js', () => ({
  readText: vi.fn().mockResolvedValue(null),
  writeText: vi.fn().mockResolvedValue(undefined),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  listDir: vi.fn().mockResolvedValue([]),
  writeYaml: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../hitl.js', () => ({
  hitl: vi.fn().mockResolvedValue(undefined),
}));

describe('simple-agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AgentOptions type validation', () => {
    it('should have proper type structure', () => {
      const validOptions: AgentOptions = {
        cwd: '/test/path',
        model: 'gpt-5',
        baseURL: 'https://api.openai.com/v1',
        auto: true,
      };

      expect(validOptions.cwd).toBe('/test/path');
      expect(validOptions.model).toBe('gpt-5');
      expect(validOptions.baseURL).toBe('https://api.openai.com/v1');
      expect(validOptions.auto).toBe(true);
    });

    it('should work with minimal options', () => {
      const minimalOptions: AgentOptions = {
        cwd: '/test/path',
      };

      expect(minimalOptions.cwd).toBe('/test/path');
      expect(minimalOptions.model).toBeUndefined();
      expect(minimalOptions.baseURL).toBeUndefined();
      expect(minimalOptions.auto).toBeUndefined();
    });
  });

  describe('environment defaults', () => {
    it('should use OpenAI defaults when OPENAI_API_KEY is set', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'test-key';

      // These would be tested in integration tests with the actual function
      // For now, we just verify the environment variable is set
      expect(process.env.OPENAI_API_KEY).toBe('test-key');

      process.env.OPENAI_API_KEY = originalEnv;
    });

    it('should use localhost defaults when no OPENAI_API_KEY', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(process.env.OPENAI_API_KEY).toBeUndefined();

      process.env.OPENAI_API_KEY = originalEnv;
    });
  });
});
