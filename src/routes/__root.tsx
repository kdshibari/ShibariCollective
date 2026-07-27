import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

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

function ErrorComponent({ error, reset }: { error: Error, reset: () => void }) {
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shibari Collective — Studios & Practitioners Worldwide" },
      {
        name: "description",
        content:
          "Discover Shibari studios around the world. A curated directory connecting practitioners with trusted spaces for rope practice.",
      },
      { name: "author", content: "Shibari Collective" },
      { property: "og:title", content: "Shibari Collective" },
      { property: "og:description", content: "Connecting Shibari practitioners with studios worldwide." },
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
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const linkClass =
    "text-sm text-foreground/80 hover:text-secondary transition-colors font-medium";
  return (
    <header className="border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block h-2 w-8 rounded-full bg-secondary" />
          <span className="font-serif text-xl tracking-tight text-foreground">
            Shibari Collective
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className={linkClass}>Studios</Link>
          <Link to="/submit" className={linkClass}>Submit</Link>
          <Link to="/contact" className={linkClass}>Contact</Link>
          {signedIn ? (
            <Link
              to="/dashboard"
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </nav>
        <Link
          to={signedIn ? "/dashboard" : "/auth"}
          className="md:hidden rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
        >
          {signedIn ? "Dashboard" : "Sign in"}
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-primary/95 text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-8 rounded-full bg-secondary" />
            <span className="font-serif text-xl">Shibari Collective</span>
          </div>
          <p className="mt-3 text-sm opacity-80">
            A worldwide directory connecting practitioners with trusted Shibari studios.
          </p>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-wider opacity-70">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/" className="hover:underline">Browse studios</Link></li>
            <li><Link to="/submit" className="hover:underline">Submit your studio</Link></li>
            <li><Link to="/contact" className="hover:underline">Contact us</Link></li>
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
      <div className="border-t border-primary-foreground/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs opacity-70 sm:px-6">
          Made by Shibari Collective · © {new Date().getFullYear()}
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
      <div className="flex min-h-screen flex-col">
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
