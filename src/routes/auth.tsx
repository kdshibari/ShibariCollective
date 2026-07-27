import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) toast.error(error.message ?? "Google sign in failed");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="card-warm w-full max-w-md rounded-2xl p-8 text-center">
        <h1 className="font-serif text-3xl text-foreground">Sign In</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage your studios.
        </p>
        <button
          onClick={handleGoogle}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-md bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:opacity-90"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
