import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 1. Detect if the URL contains a Supabase Magic Link hash
    const isMagicLinkPresent = window.location.hash.includes("access_token");

    // 2. Safely check the initial session
    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
      } else if (!isMagicLinkPresent) {
        // Only redirect to login if there is no session AND no magic link currently processing
        navigate({ to: "/auth", replace: true });
      }
      
      setIsProcessing(false);
    };

    verifySession();

    // 3. Listen for the Magic Link resolving in real-time
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) {
        setIsAuthenticated(true);
        setIsProcessing(false);
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        navigate({ to: "/auth", replace: true });
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [navigate]);

  // Premium loading state while resolving the Magic Link
  if (isProcessing || !isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full blur-xl bg-secondary/20 animate-pulse" />
            <Loader2 className="relative h-12 w-12 animate-spin text-secondary" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-foreground/50">
            Authenticating Connection...
          </p>
        </motion.div>
      </div>
    );
  }

  // Once verified, seamlessly render the Dashboard or Submit page
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Outlet />
    </motion.div>
  );
}
