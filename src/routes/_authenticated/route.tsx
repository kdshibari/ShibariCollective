import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { requireSession } from "@/integrations/supabase/server";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const session = await requireSession();
    if (!session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
