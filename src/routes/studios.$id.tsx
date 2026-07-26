import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Mail, Globe, Instagram, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

export const Route = createFileRoute("/studios/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Studio — Shibari Collective` },
      { name: "description", content: `Shibari studio details on Shibari Collective (${params.id.slice(0, 8)}).` },
      { property: "og:title", content: "Shibari studio" },
      { property: "og:description", content: "Discover this Shibari studio on Shibari Collective." },
    ],
  }),
  component: StudioPage,
});

interface Studio {
  id: string;
  name: string;
  description: string | null;
  continent: string;
  country: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  hours: Record<string, string> | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  socials: Record<string, string> | null;
  studio_photos: { url: string; position: number }[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function StudioPage() {
  const { id } = Route.useParams();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    supabase
      .from("studios")
      .select("*, studio_photos(url, position)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setStudio(data as any);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16">Loading…</div>;
  if (!studio) return <div className="mx-auto max-w-4xl px-4 py-16">Studio not found.</div>;

  const photos = (studio.studio_photos ?? []).sort((a, b) => a.position - b.position);
  const mapUrl =
    studio.latitude != null && studio.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${studio.latitude},${studio.longitude}`
      : studio.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${studio.address}, ${studio.city}, ${studio.country}`)}`
        : null;

  return (
    <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All studios
      </Link>

      <header className="mt-6">
        <p className="text-xs uppercase tracking-[0.25em] text-secondary">
          {studio.continent} · {studio.country}
        </p>
        <h1 className="mt-2 font-serif text-5xl text-foreground sm:text-6xl">{studio.name}</h1>
        <div className="mt-3 flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {studio.city}
            {studio.address ? ` · ${studio.address}` : ""}
          </span>
        </div>
      </header>

      {/* Gallery */}
      {photos.length > 0 && (
        <div className="relative mt-8">
          <div ref={emblaRef} className="overflow-hidden rounded-2xl">
            <div className="flex">
              {photos.map((p, i) => (
                <div key={i} className="min-w-0 shrink-0 basis-full">
                  <img
                    src={p.url}
                    alt={`${studio.name} photo ${i + 1}`}
                    className="aspect-[16/10] w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>
          </div>
          {photos.length > 1 && (
            <>
              <button
                onClick={() => embla?.scrollPrev()}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow hover:bg-background"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => embla?.scrollNext()}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow hover:bg-background"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {studio.description && (
            <>
              <h2 className="font-serif text-2xl text-foreground">About</h2>
              <p className="mt-3 whitespace-pre-line text-foreground/80">{studio.description}</p>
            </>
          )}
          {studio.hours && Object.keys(studio.hours).length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-2xl text-foreground">Hours</h2>
              <dl className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
                {DAYS.map((d) => (
                  <div key={d} className="flex justify-between px-4 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{d}</dt>
                    <dd className="font-medium">{studio.hours?.[d] || "Closed"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card-warm rounded-xl p-5">
            <h3 className="font-serif text-xl text-foreground">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {studio.email && <Row icon={<Mail className="h-4 w-4" />} href={`mailto:${studio.email}`}>{studio.email}</Row>}
              {studio.phone && <Row icon={<Phone className="h-4 w-4" />} href={`tel:${studio.phone}`}>{studio.phone}</Row>}
              {studio.website && <Row icon={<Globe className="h-4 w-4" />} href={studio.website}>Website</Row>}
              {studio.socials?.instagram && (
                <Row icon={<Instagram className="h-4 w-4" />} href={studio.socials.instagram}>Instagram</Row>
              )}
              {studio.socials?.facebook && (
                <Row icon={<Globe className="h-4 w-4" />} href={studio.socials.facebook}>Facebook</Row>
              )}
              {studio.socials?.other && (
                <Row icon={<Globe className="h-4 w-4" />} href={studio.socials.other}>Other</Row>
              )}
            </ul>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-md bg-secondary px-4 py-2 text-center text-sm font-medium text-secondary-foreground hover:opacity-90"
              >
                Open in maps
              </a>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function Row({ icon, href, children }: { icon: React.ReactNode; href: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-foreground hover:text-secondary">
        {icon}
        <span>{children}</span>
      </a>
    </li>
  );
}
