function Header() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/"; // Force a clean state reset to the homepage
  }

  const linkClass = "text-sm text-foreground/80 hover:text-secondary transition-colors font-medium";

  return (
    <header className="border-b border-white/10 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="inline-block h-2 w-8 rounded-full bg-secondary group-hover:w-10 transition-all duration-300" />
          <span className="font-serif text-xl tracking-tight text-foreground">
            Shibari Collective
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className={linkClass}>Studios</Link>
          <Link to="/contact" className={linkClass}>Contact</Link>
          {signedIn ? (
            <div className="flex items-center gap-4 border-l border-white/10 pl-6 ml-2">
              <Link
                to="/dashboard"
                className="rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-white/20 transition-all"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-rose-500 transition-colors"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l border-white/10 pl-6 ml-2">
              <Link to="/auth" search={{ intent: "owner" }} className={linkClass}>List Studio</Link>
              <Link
                to="/auth"
                className="rounded-full bg-secondary px-6 py-2 text-sm font-bold uppercase tracking-widest text-secondary-foreground hover:scale-105 transition-all shadow-lg"
              >
                Sign in
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
