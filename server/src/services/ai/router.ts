/**
 * AI Service Router
 *
 * Routes AI tasks to the correct model/provider.
 * All AI calls go through this layer — never call providers directly from routes.
 */

import { geminiChat, type GeminiChatOptions } from './gemini';

export type AiTaskType =
  | 'onboarding'
  | 'morning_brief'
  | 'reflection'
  | 'vision_refine'
  | 'chat';

interface AiRouterOptions {
  taskType: AiTaskType;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId: string;
}

interface AiRouterResult {
  content: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
}

export async function routeAiTask(
  options: AiRouterOptions,
): Promise<AiRouterResult> {
  // In v1, all tasks go to Gemini
  // This layer exists so we can swap providers without app changes
  const chatOptions: GeminiChatOptions = {
    systemPrompt: options.systemPrompt,
    messages: options.messages,
  };

  const result = await geminiChat(chatOptions);

  return {
    content: result.content,
    modelUsed: result.modelUsed,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}
