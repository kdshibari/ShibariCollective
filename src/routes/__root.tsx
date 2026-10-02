import { createRootRouteWithContext, Outlet, ScrollRestoration, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { CookieBanner } from "@/components/CookieBanner";
import appCss from "@/styles.css?url";

export const Route = createRootRouteWithContext<any>()({
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
      { rel: "preload", href: "https://grainy-gradients.vercel.app/noise.svg", as: "image" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Work+Sans:wght@300;400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {isOffline && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-rose-500/90 backdrop-blur-md text-white py-2 text-center text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
            <WifiOff className="w-4 h-4" /> You are currently offline
          </div>
        )}

        <Outlet />
        
        <CookieBanner />
        
        <Toaster 
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(20, 20, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              color: '#fff',
              fontFamily: '"Work Sans", sans-serif',
              borderRadius: '1rem',
              padding: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            },
          }}
        />

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
