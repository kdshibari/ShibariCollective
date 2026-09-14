import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getWebRequest } from "@tanstack/start/server";

export async function createSupabaseServer() {
  const request = getWebRequest();
  const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");

  return createServerClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.keys(cookies).map((name) => ({ name, value: cookies[name] }));
        },
        setAll() {
          // Read-only phase on server; setting cookies happens on the client
        },
      },
    }
  );
}
