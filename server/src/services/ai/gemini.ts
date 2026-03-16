/**
 * Google Gemini API Client
 *
 * Handles direct communication with the Gemini API.
 * Only called through the AI router — never from route handlers.
 */

const GEMINI_MODEL = 'gemini-2.5-flash';

export interface GeminiChatOptions {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface GeminiChatResult {
  content: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
}

export async function geminiChat(
  options: GeminiChatOptions,
): Promise<GeminiChatResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  // Convert messages to Gemini format
  const contents = options.messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const body = {
    system_instruction: {
      parts: [{ text: options.systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };

  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const inputTokens = data.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0;

  return {
    content,
    modelUsed: GEMINI_MODEL,
    inputTokens,
    outputTokens,
  };
}
