import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowRight, CheckCircle2, User, Building, ExternalLink, Lock } from "lucide-react";
import heroRope from "@/assets/hero-rope.jpg";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type AuthMode = "participant" | "owner";

// Staggered Animation Configuration
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("participant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Instantly detect if you are logging in with a developer test account
  const isTestAccount = email === "knottydaddy24@gmail.com" || email === "iradi@me.com";
  
  useEffect(() => {
    // BUG FIX: Parse the URL intent so the correct tab is selected automatically
    const params = new URLSearchParams(window.location.search);
    const intent = params.get('intent');
    if (intent === 'owner' || intent === 'participant') {
      setMode(intent);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    
    // Developer Backdoor: Bypass Magic Link and use explicit password authentication
    if (isTestAccount) {
      if (!password) {
        toast.error("Developer password required.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message || "Invalid test credentials.");
        setLoading(false);
      } else {
        navigate({ to: "/dashboard", search: { intent: mode }, replace: true });
      }
      return;
    }

    // Standard Production Flow: Magic Link
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
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
                <p className="text-sm font-medium text-foreground/70 leading-relaxed mb-4">
                  We've sent a magic link to <br/><span className="font-bold text-foreground">{email}</span>
                </p>
                
                {/* BUG FIX: Direct Mail App Deep Link */}
                <a 
                  href="mailto:"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary hover:text-foreground transition-colors"
                >
                  Open Mail App <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            ) : (
              <motion.form 
                key="form" 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                <motion.div variants={itemVariants} className="flex p-1 bg-white/40 backdrop-blur-md rounded-full border border-white/50 relative">
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
                </motion.div>

                <motion.label variants={itemVariants} className="block group mt-6">
                  <div className="relative flex items-center">
                    <Mail className="absolute left-5 h-5 w-5 text-foreground/40 transition-colors group-focus-within:text-secondary" />
                    {/* BUG FIX: Added autoFocus for instant keyboard pop */}
                    <input
                      type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      className="w-full rounded-full border border-white/40 bg-white/50 backdrop-blur-md pl-14 pr-5 py-4 text-sm font-medium outline-none focus:border-secondary focus:bg-white/80 transition-all shadow-sm valid:border-secondary/50"
                    />
                  </div>
                </motion.label>

                {/* Developer Backdoor Password Field */}
                <AnimatePresence>
                  {isTestAccount && (
                    <motion.label 
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      className="block group overflow-hidden"
                    >
                      <div className="relative flex items-center">
                        <Lock className="absolute left-5 h-5 w-5 text-rose-500 transition-colors" />
                        <input
                          type="password" required={isTestAccount} value={password} onChange={(e) => setPassword(e.target.value)}
                          placeholder="Developer Password"
                          className="w-full rounded-full border border-rose-400/50 bg-rose-50/50 backdrop-blur-md pl-14 pr-5 py-4 text-sm font-medium outline-none focus:border-rose-500 focus:bg-white/80 transition-all shadow-sm"
                        />
                      </div>
                    </motion.label>
                  )}
                </AnimatePresence>

                <motion.button variants={itemVariants} type="submit" disabled={loading} className="w-full flex justify-center items-center gap-3 rounded-full bg-secondary px-6 py-4 text-sm font-bold uppercase tracking-widest text-secondary-foreground shadow-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-80 disabled:hover:scale-100 transition-all">
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isTestAccount ? "Developer Login" : "Send Magic Link"} 
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
