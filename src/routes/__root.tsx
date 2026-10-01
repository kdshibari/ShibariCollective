import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
  ScrollRestoration,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "The Shibari Collective | Studios & Practitioners Worldwide" },
      {
        name: "description",
        content:
          "Discover Shibari studios around the world. A curated directory connecting users with trusted spaces for rope practice.",
      },
      { name: "author", content: "The Shibari Collective" },
      { property: "og:title", content: "The Shibari Collective" },
      { property: "og:description", content: "Connecting users with studios worldwide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Work+Sans:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Close mobile menu automatically on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
            <MicroLogo className="h-8 w-8 text-secondary transition-transform duration-700 ease-out group-hover:rotate-90" />
            <span className="font-serif text-xl tracking-tight text-foreground">
              The Shibari Collective
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
            className="fixed inset-0 z-[45] bg-background/95 backdrop-blur-3xl md:hidden flex flex-col items-center justify-center gap-8 px-4"
          >
            <Link to="/" className={mobileLinkClass}>Explore Studios</Link>
            <Link to="/contact" className={mobileLinkClass}>Contact Us</Link>
            
            <div className="w-12 h-px bg-white/20 my-4" />

            {signedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="rounded-full bg-white/10 border border-white/20 px-8 py-4 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-white/20 transition-all"
                >
                  My Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-rose-500 transition-colors mt-4"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/auth" 
                  search={{ intent: "owner" }} 
                  className="text-sm font-bold uppercase tracking-widest text-foreground/70"
                >
                  List Your Studio
                </Link>
                <Link
                  to="/auth"
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

function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-primary/95 text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <MicroLogo className="h-6 w-6 text-secondary" />
            <span className="font-serif text-xl">The Shibari Collective</span>
          </div>
          <p className="mt-3 text-sm opacity-80">
            A worldwide directory connecting users with trusted Shibari studios.
          </p>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-wider opacity-70">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/" className="hover:underline">Browse studios</Link></li>
            <li><Link to="/submit" className="hover:underline">Submit your studio</Link></li>
            <li><Link to="/contact" className="hover:underline">Contact us</Link></li>
            <li><Link to="/faq" className="hover:underline">FAQ</Link></li>
            <li><Link to="/disclaimer" className="hover:underline">Disclaimer & Terms</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-wider opacity-70">Account</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/auth" className="hover:underline">Sign in</Link></li>
            <li><Link to="/dashboard" className="hover:underline">My dashboard</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-primary-foreground/10 pb-[env(safe-area-inset-bottom)]">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs opacity-70 sm:px-6">
          Made by The Shibari Collective © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col pb-[env(safe-area-inset-bottom)]">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

function MicroLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
      <g transform="translate(50, 50)" fill="none" stroke="currentColor" strokeWidth="6">
        <circle cx="16" cy="0" r="22" transform="rotate(0)" />
        <circle cx="16" cy="0" r="22" transform="rotate(60)" />
        <circle cx="16" cy="0" r="22" transform="rotate(120)" />
        <circle cx="16" cy="0" r="22" transform="rotate(180)" />
        <circle cx="16" cy="0" r="22" transform="rotate(240)" />
        <circle cx="16" cy="0" r="22" transform="rotate(300)" />
      </g>
    </svg>
  );
}
