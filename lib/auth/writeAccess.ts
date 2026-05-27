import "server-only";

import { getAdminSecret, getCronSecret } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const hasMatchingSecret = (request: Request, secret: string): boolean => {
  const authorization = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-cron-secret");
  const adminHeader = request.headers.get("x-admin-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");

  return (
    authorization === `Bearer ${secret}` ||
    cronHeader === secret ||
    adminHeader === secret ||
    querySecret === secret
  );
};

export async function hasProtectedWriteAccess(request: Request): Promise<boolean> {
  const secrets = [getCronSecret(), getAdminSecret()].filter(
    (secret): secret is string => Boolean(secret),
  );

  if (secrets.some((secret) => hasMatchingSecret(request, secret))) {
    return true;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return Boolean(user);
  } catch {
    return false;
  }
}
