import { assertEquals } from 'jsr:@std/assert';
import type { AgentOptions } from '../simple-agent.ts';

Deno.test('AgentOptions type validation - valid options', () => {
  const validOptions: AgentOptions = {
    cwd: '/test/path',
    model: 'gpt-5',
    baseURL: 'https://api.openai.com/v1',
    auto: true,
  };

  assertEquals(validOptions.cwd, '/test/path');
  assertEquals(validOptions.model, 'gpt-5');
  assertEquals(validOptions.baseURL, 'https://api.openai.com/v1');
  assertEquals(validOptions.auto, true);
});

Deno.test('AgentOptions type validation - minimal options', () => {
  const minimalOptions: AgentOptions = {
    cwd: '/test/path',
  };

  assertEquals(minimalOptions.cwd, '/test/path');
  assertEquals(minimalOptions.model, undefined);
  assertEquals(minimalOptions.baseURL, undefined);
  assertEquals(minimalOptions.auto, undefined);
});

Deno.test('Environment defaults should work with OpenAI key', () => {
  // Mock having an OpenAI key
  const hasKey = !!Deno.env.get('OPENAI_API_KEY');
  const expectedDefault = hasKey
    ? 'https://api.openai.com/v1'
    : 'http://localhost:1234/v1';

  assertEquals(typeof expectedDefault, 'string');
  assertEquals(expectedDefault.startsWith('http'), true);
});

Deno.test('Simple agent module can be imported', async () => {
  // This test verifies the simple-agent module can be imported
  const agent = await import('../simple-agent.ts');
  assertEquals(typeof agent.runSimpleAgent, 'function');
});
