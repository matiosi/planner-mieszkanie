export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Brak zmiennych środowiskowych Supabase.");
  return { url, key };
}

export function hasSupabaseEnv() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function normalizeOrigin(value: string) {
  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

function isLocalOrigin(value: string) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(value);
}

export function getPublicSiteUrl(headersList?: Headers) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl && (process.env.NODE_ENV !== "production" || !isLocalOrigin(configuredUrl))) {
    return normalizeOrigin(configuredUrl);
  }

  if (process.env.VERCEL_URL) {
    return normalizeOrigin(process.env.VERCEL_URL);
  }

  const forwardedHost = headersList?.get("x-forwarded-host");
  const host = forwardedHost ?? headersList?.get("host");
  if (host) {
    const forwardedProto = headersList?.get("x-forwarded-proto");
    const proto = forwardedProto ?? (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}
