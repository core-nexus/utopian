// Simple OpenAI-compatible client for LM Studio (Deno version)
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export class SimpleOpenAIClient {
  constructor(
    private baseURL: string = 'http://localhost:1234/v1',
    private apiKey: string = Deno.env.get('OPENAI_API_KEY') || 'lm-studio'
  ) {}

  async chat(messages: ChatMessage[], model: string = 'openai/gpt-oss-20b'): Promise<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} ${errorText}`);
    }

    const result: ChatCompletionResponse = await response.json();
    return result.choices[0]?.message?.content || '';
  }
}
