import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createSupabaseServer } from "@/integrations/supabase/server.server";

const requireSession = createServerFn("GET", async () => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
});

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const session = await requireSession();
    if (!session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
