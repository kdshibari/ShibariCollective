import { createServerFn } from "@tanstack/react-start";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { supabaseAdmin } from "./client.server";

// 1. Session Verification
export const requireSession = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const cookieHeader = ctx.request.headers.get("cookie") || "";
  const cookies = parseCookieHeader(cookieHeader);

  const supabase = createServerClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => Object.keys(cookies).map((name) => ({ name, value: cookies[name] })),
        setAll: () => {}, // Read-only on server
      },
    }
  );

  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
});

// 2. Secure Role Elevation (Bypasses RLS safely on the backend)
export const grantStudioOwnerRole = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const cookieHeader = ctx.request.headers.get("cookie") || "";
  const cookies = parseCookieHeader(cookieHeader);

  const supabase = createServerClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => Object.keys(cookies).map((name) => ({ name, value: cookies[name] })),
        setAll: () => {}, 
      },
    }
  );

  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) throw new Error("Unauthorized");

  const { error } = await supabaseAdmin.from("user_roles").insert({
    user_id: data.session.user.id,
    role: "studio_owner",
  });

  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }

  return { success: true };
});
