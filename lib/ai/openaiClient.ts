import "server-only";

import { getOpenAiApiKey, getOpenAiModel } from "@/lib/env";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.4-mini";

type OpenAIResponsesResult = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

const extractText = (result: OpenAIResponsesResult): string => {
  if (result.output_text) {
    return result.output_text;
  }

  return (
    result.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ?? ""
  );
};

export async function generateJsonWithOpenAI<T>(
  prompt: string,
): Promise<T | null> {
  try {
    const apiKey = getOpenAiApiKey();

    if (!apiKey) {
      return null;
    }

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getOpenAiModel() ?? DEFAULT_MODEL,
        input: prompt,
        temperature: 0.2,
        max_output_tokens: 1200,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as OpenAIResponsesResult;
    const text = extractText(result);

    if (!text) {
      return null;
    }

    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
