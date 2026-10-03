import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://theshibaricollective.com";

const xmlEscape = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// Same slug format the directory cards link to (see StudioCard in index.tsx).
const studioSlug = (name: string, id: string) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}`;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // FIX: /submit and /auth were listed, but /submit requires login (search engines only see
        // a redirect) and login pages shouldn't be indexed. /privacy was missing, and no studio
        // pages were listed at all, which is the content people actually search for.
        const entries: { path: string; changefreq: string; priority: string; lastmod?: string }[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/faq", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
          { path: "/session", changefreq: "monthly", priority: "0.5" },
          { path: "/disclaimer", changefreq: "yearly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
        ];

        try {
          const { data: studios } = await supabase
            .from("studios")
            .select("id, name, created_at")
            .eq("status", "approved");

          for (const st of (studios ?? []) as any[]) {
            entries.push({
              path: `/studios/${studioSlug(st.name, st.id)}`,
              changefreq: "weekly",
              priority: "0.8",
              lastmod: st.created_at?.slice(0, 10),
            });
          }
        } catch (err) {
          // Never fail the whole sitemap because the DB was unreachable.
          console.error("Sitemap: failed to load studios", err);
        }

        const urls = entries.map(
          (e) =>
            `  <url>\n    <loc>${xmlEscape(BASE_URL + e.path)}</loc>\n` +
            (e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : "") +
            `    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
        );
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
