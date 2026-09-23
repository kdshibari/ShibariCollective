import { Menu, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/"; 
  }

  const linkClass = "text-sm text-foreground/80 hover:text-secondary transition-colors font-medium";
  const mobileLinkClass = "text-2xl font-serif text-foreground hover:text-secondary transition-colors";

  return (
    <>
      <header className="border-b border-white/10 bg-background/70 backdrop-blur-2xl sticky top-0 z-50 transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 group z-50">
            <span className="inline-block h-2 w-8 rounded-full bg-secondary group-hover:w-12 transition-all duration-500 ease-out" />
            <span className="font-serif text-xl tracking-tight text-foreground">
              Shibari Collective
            </span>
          </Link>

          {/* Desktop Navigation */}
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
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-rose-500 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
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

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden z-50 p-2 -mr-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-3xl md:hidden flex flex-col items-center justify-center gap-8 px-4"
          >
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>Explore Studios</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className={mobileLinkClass}>Contact Us</Link>
            
            <div className="w-12 h-px bg-white/20 my-4" />

            {signedIn ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full bg-white/10 border border-white/20 px-8 py-4 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-white/20 transition-all"
                >
                  My Dashboard
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-rose-500 transition-colors mt-4"
                >
                  <LogOut className="w-4 h-4" /> Disconnect
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/auth" 
                  search={{ intent: "owner" }} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="text-sm font-bold uppercase tracking-widest text-foreground/70"
                >
                  List Your Studio
                </Link>
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full bg-secondary px-10 py-4 text-sm font-bold uppercase tracking-widest text-secondary-foreground shadow-2xl mt-4"
                >
                  Sign In / Register
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
