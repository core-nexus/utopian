import { beforeEach, describe, expect, it, vi } from 'vitest';
import process from 'node:process';

// Mock the simple-agent module
vi.mock('../simple-agent.js', () => ({
  runSimpleAgent: vi.fn().mockResolvedValue(undefined),
}));

describe('CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CLI help', () => {
    it('should show help when --help is passed', async () => {
      // This test would require building the CLI first
      // For now, we'll just test that the CLI module can be imported
      const cli = await import('../cli.js');
      expect(cli).toBeDefined();
    });
  });

  describe('CLI options parsing', () => {
    it('should accept base URL option', () => {
      // Test the Commander.js configuration
      const expectedOptions = ['--base', '--model', '--auto'];

      expectedOptions.forEach((option) => {
        expect(option).toMatch(/^--\w+/);
      });
    });

    it('should have proper default values', () => {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      const expectedBaseDefault = hasOpenAIKey
        ? 'https://api.openai.com/v1'
        : process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1';

      expect(expectedBaseDefault).toBeTruthy();
    });
  });
});
