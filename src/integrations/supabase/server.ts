import { createServerFn } from "@tanstack/react-start";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getWebRequest } from "@tanstack/react-start/server";

export const requireSession = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();
  const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");

  const supabase = createServerClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.keys(cookies).map((name) => ({ name, value: cookies[name] }));
        },
        setAll() {
          // Read-only phase on the server; cookie setting is handled exclusively on the client
        },
      },
    }
  );

  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
});
