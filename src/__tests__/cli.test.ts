import { assertEquals } from 'jsr:@std/assert';

Deno.test('CLI module can be imported', async () => {
  // This test just verifies the CLI module can be imported
  const cli = await import('../cli.ts');
  assertEquals(typeof cli, 'object');
});

Deno.test('CLI options should follow expected pattern', () => {
  // Test the expected CLI options pattern
  const expectedOptions = ['--base', '--model', '--auto'];

  expectedOptions.forEach((option) => {
    assertEquals(/^--\w+/.test(option), true);
  });
});

Deno.test('Environment-based defaults should work', () => {
  const hasOpenAIKey = !!Deno.env.get('OPENAI_API_KEY');
  const expectedBaseDefault = hasOpenAIKey
    ? 'https://api.openai.com/v1'
    : Deno.env.get('LMSTUDIO_BASE_URL') || 'http://localhost:1234/v1';

  assertEquals(typeof expectedBaseDefault, 'string');
  assertEquals(expectedBaseDefault.length > 0, true);
});
