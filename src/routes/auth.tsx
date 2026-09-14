import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message || "Failed to send magic link");
    } else {
      toast.success("Check your email for the secure login link!");
      setEmail("");
    }
    
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="card-warm w-full max-w-md rounded-2xl p-8 text-center border border-white/10 bg-background/50 backdrop-blur-md shadow-xl">
        <h1 className="font-serif text-3xl text-foreground">Sign In</h1>
        <p className="mt-2 text-sm text-muted-foreground mb-6">
          Enter your email to receive a secure sign-in link. No password required.
        </p>
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md bg-background/80 border border-white/10 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 text-foreground"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? "Sending Link..." : "Send Magic Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
