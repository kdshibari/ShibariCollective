import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

  // Keep the latest path in a ref so the auth subscription below is created ONCE.
  // Previously the effect depended on location.href, so every in-app navigation
  // tore down and re-created the Supabase listener and re-ran getSession().
  const currentHref = useRef(location.href);
  currentHref.current = location.href;
  const redirected = useRef(false);

  useEffect(() => {
    const goToAuth = () => {
      if (redirected.current) return; // avoid double navigation (getSession + INITIAL_SESSION both firing)
      redirected.current = true;
      setIsAuthenticated(false);
      navigate({ to: "/auth", search: { redirect: currentHref.current }, replace: true });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsAuthenticated(true);
      else goToAuth();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (!session && event !== "TOKEN_REFRESHED")) {
        goToAuth();
      } else if (session) {
        redirected.current = false;
        setIsAuthenticated(true);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [navigate]);

  if (!isAuthenticated) {
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
