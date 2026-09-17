import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import heroRope from "@/assets/hero-rope.jpg";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/dashboard" },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      setSubmitted(true);
      toast.success("Magic link sent successfully!");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Aesthetic */}
      <div className="absolute inset-0 pointer-events-none bg-background">
        <img src={heroRope} alt="Background" className="h-full w-full object-cover mix-blend-soft-light opacity-60 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_30px_60px_-15px_rgba(78,44,35,0.25)]">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl text-foreground">Welcome Back</h1>
            <p className="mt-3 text-sm font-medium text-foreground/70">
              Access the Shibari Collective portal securely. No passwords required.
            </p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="h-16 w-16 bg-secondary/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-secondary" />
              </div>
              <h2 className="font-bold text-lg text-foreground">Check your inbox</h2>
              <p className="text-sm font-medium text-foreground/60">
                We've sent a magic link to <span className="font-bold text-foreground">{email}</span>. Click it to instantly sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <label className="block group">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-secondary transition-colors">
                  Email Address
                </span>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 h-5 w-5 text-foreground/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="studio@example.com"
                    className="w-full rounded-full border border-white/40 bg-white/50 backdrop-blur-sm pl-12 pr-5 py-4 text-sm font-medium outline-none focus:border-white/80 focus:bg-white/80 transition-all shadow-sm"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 rounded-full bg-secondary px-6 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:scale-[1.02] disabled:opacity-50 transition-all"
              >
                {loading ? "Sending..." : "Send Magic Link"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
