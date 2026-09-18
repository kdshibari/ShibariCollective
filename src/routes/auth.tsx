import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowRight, CheckCircle2, User, Building } from "lucide-react";
import heroRope from "@/assets/hero-rope.jpg";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type AuthMode = "participant" | "owner";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("participant");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard?intent=${mode}` },
    });

    if (error) {
      toast.error(error.message || "Failed to send verification link.");
      setLoading(false);
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-background">
        <img src={heroRope} alt="Background" className="h-full w-full object-cover mix-blend-soft-light opacity-60 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_30px_60px_-15px_rgba(78,44,35,0.25)]"
        >
          <motion.div layout className="text-center mb-8">
            <h1 className="font-serif text-4xl text-foreground">Secure Portal</h1>
            <p className="mt-3 text-sm font-medium text-foreground/70">
              Select your path to enter the Collective.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div 
                key="success" 
                initial={{ scale: 0.85, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex flex-col items-center text-center space-y-5 py-6"
              >
                <div className="h-20 w-20 bg-secondary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-secondary" />
                </div>
                <h2 className="font-serif text-2xl text-foreground">Check your inbox</h2>
                <p className="text-sm font-medium text-foreground/70 leading-relaxed">
                  We've sent a magic link to <br/><span className="font-bold text-foreground">{email}</span>
                </p>
              </motion.div>
            ) : (
              <motion.form 
                key="form" 
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                {/* Premium Physics-Based Segmented Control */}
                <div className="flex p-1 bg-white/40 backdrop-blur-md rounded-full border border-white/50 relative">
                  {(['participant', 'owner'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setMode(tab)}
                      className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest rounded-full transition-colors z-10 ${mode === tab ? 'text-foreground' : 'text-foreground/50 hover:text-foreground/80'}`}
                    >
                      {mode === tab && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-white rounded-full shadow-sm"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-20 flex items-center gap-2">
                        {tab === 'participant' ? <User className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                        {tab === 'participant' ? 'Participant' : 'Studio'}
                      </span>
                    </button>
                  ))}
                </div>

                <label className="block group mt-6">
                  <div className="relative flex items-center">
                    <Mail className="absolute left-5 h-5 w-5 text-foreground/40 transition-colors group-focus-within:text-secondary" />
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      className="w-full rounded-full border border-white/40 bg-white/50 backdrop-blur-md pl-14 pr-5 py-4 text-sm font-medium outline-none focus:border-white/80 focus:bg-white/80 transition-all shadow-sm"
                    />
                  </div>
                </label>

                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-3 rounded-full bg-secondary px-6 py-4 text-sm font-bold uppercase tracking-widest text-secondary-foreground shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all">
                  {loading ? "Dispatching..." : "Send Magic Link"} <ArrowRight className="h-4 w-4" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
