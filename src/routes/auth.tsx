async function handleGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    }
  });
  if (error) toast.error(error.message ?? "Google sign in failed");
}
