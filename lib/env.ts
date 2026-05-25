import "server-only";

const clean = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export function hasFmpApiKey(): boolean {
  return Boolean(clean(process.env.FMP_API_KEY));
}

export function hasOpenAiApiKey(): boolean {
  return Boolean(clean(process.env.OPENAI_API_KEY));
}

export function getFmpApiKey(): string | undefined {
  return clean(process.env.FMP_API_KEY);
}

export function getOpenAiApiKey(): string | undefined {
  return clean(process.env.OPENAI_API_KEY);
}

export function getOpenAiModel(): string | undefined {
  return clean(process.env.OPENAI_MODEL);
}

export function hasSupabaseServerConfig(): boolean {
  return Boolean(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

export function getSupabaseUrl(): string | undefined {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getCronSecret(): string | undefined {
  return clean(process.env.CRON_SECRET);
}
