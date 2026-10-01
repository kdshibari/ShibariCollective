import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // FIX: location.href safely captures the full path and query string without object concatenation errors
    const targetRedirect = location.href;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/auth", search: { redirect: targetRedirect } });
      } else {
        setIsAuthenticated(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate({ to: "/auth", search: { redirect: targetRedirect } });
      } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setIsAuthenticated(true);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [navigate, location.href]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-10 w-10 animate-spin text-secondary" />
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-foreground/50">
            Securing Connection...
          </p>
        </motion.div>
      </div>
    );
  }

  return <Outlet />;
}
