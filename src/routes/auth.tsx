import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  User,
  Building,
  ExternalLink,
  Lock,
} from "lucide-react";
import heroRope from "@/assets/hero-rope.jpg";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type AuthMode = "participant" | "owner";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("participant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("intent");

    if (intent === "owner" || intent === "participant") {
      setMode(intent);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate({ to: "/dashboard" });
      }
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        setSubmitted(true);
        navigate({ to: "/dashboard" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const tabs: AuthMode[] = ["participant", "owner"];

 return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(194,141,98,0.18),_transparent_42%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        
        {/* Left Column */}
        <div className="relative flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          
          {/* Left Column Image with CSS Alpha Masking */}
          <div 
            className="absolute inset-0 hidden lg:block"
            style={{ 
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' 
            }}
          >
            <div 
              className="h-full w-full"
              style={{ 
                WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 100%)',
                maskImage: 'linear-gradient(to right, black 40%, transparent 100%)' 
              }}
            >
              <img
                src={heroRope.src ?? heroRope}
                alt="Shibari rope details"
                className="h-full w-full object-cover opacity-65"
              />
            </div>
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="relative z-10 max-w-xl rounded-3xl border border-white/10 bg-background/65 p-8 shadow-2xl backdrop-blur-xl"
          >
            <motion.p variants={itemVariants} className="text-xs font-semibold uppercase tracking-[0.38em] text-secondary">
              Shibari Collective
            </motion.p>
            <motion.h1 variants={itemVariants} className="mt-6 font-serif text-4xl leading-tight sm:text-5xl">
              Find your studio. Build your practice.
            </motion.h1>
            <motion.p variants={itemVariants} className="mt-5 max-w-lg text-base text-muted-foreground">
              Access curated studios, save favorites, and manage your profile in one place.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8 space-y-4">
              {[
                "Private studio directory",
                "Search by territories",
                "Need one more to add",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-foreground/90">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Welcome back</p>
                <h2 className="mt-2 font-serif text-3xl text-foreground">Sign in</h2>
              </div>
              <div className="rounded-full bg-secondary/10 p-2 text-secondary">
                <Lock className="h-5 w-5" />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-full border border-border bg-muted/50 p-1">
              {tabs.map((tab) => {
                const active = mode === tab;
                const label = tab === "participant" ? "Participant" : "Studio owner";

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMode(tab)}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "participant" ? <User className="mr-2 inline h-4 w-4" /> : <Building className="mr-2 inline h-4 w-4" />}
                    {label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-3 text-sm outline-none transition focus:border-secondary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-3 text-sm outline-none transition focus:border-secondary"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing in..." : `Continue as ${mode === "owner" ? "studio owner" : "participant"}`}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </motion.form>
            </AnimatePresence>

            {submitted && (
              <p className="mt-4 text-center text-sm text-green-600">Signed in successfully. Redirecting...</p>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Need an account? <button type="button" className="font-medium text-secondary hover:underline">Contact us</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
