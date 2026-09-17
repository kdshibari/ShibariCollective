import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CONTINENTS, haversine } from "@/lib/geo";
import heroRope from "@/assets/hero-rope.jpg";
import { Search, MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

const MapComponent = lazy(() => import("@/components/Map"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shibari Collective — Discover Studios Worldwide" },
      {
        name: "description",
        content: "Browse Shibari studios by continent, country, and city. Find trusted spaces near you.",
      },
      { property: "og:title", content: "Shibari Collective — Discover Studios Worldwide" },
      { property: "og:description", content: "Browse Shibari studios by continent, country, and city. Find trusted spaces near you." },
    ],
  }),
  component: HomePage,
});

interface Studio {
  id: string;
  name: string;
  description: string | null;
  continent: string;
  country: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  studio_photos: { url: string; position: number }[];
}

function HomePage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    supabase
      .from("studios")
      .select("id, name, description, continent, country, city, latitude, longitude, studio_photos(url, position)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setStudios((data as any) ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000 }
    );
  }, []);

  const countries = useMemo(() => {
    const list = studios
      .filter((s) => !continent || s.continent?.toLowerCase() === continent.toLowerCase())
      .map((s) => s.country)
      .filter(Boolean); 
    return Array.from(new Set(list)).sort();
  }, [studios, continent]);

  const cities = useMemo(() => {
    const list = studios
      .filter((s) => {
        const matchCont = !continent || s.continent?.toLowerCase() === continent.toLowerCase();
        const matchCoun = !country || s.country?.toLowerCase() === country.toLowerCase();
        return matchCont && matchCoun;
      })
      .map((s) => s.city)
      .filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [studios, continent, country]);

  const filtered = useMemo(() => {
    let list = studios.filter((s) => {
      if (continent && s.continent?.toLowerCase() !== continent.toLowerCase()) return false;
      if (country && s.country?.toLowerCase() !== country.toLowerCase()) return false;
      if (city && s.city?.toLowerCase() !== city.toLowerCase()) return false;
      
      if (q) {
        const t = q.toLowerCase();
        const n = s.name?.toLowerCase() || "";
        const c = s.city?.toLowerCase() || "";
        const r = s.country?.toLowerCase() || "";
        if (!n.includes(t) && !c.includes(t) && !r.includes(t)) {
          return false;
        }
      }
      return true;
    });

    if (userLoc) {
      list = [...list].sort((a, b) => {
        const da = a.latitude != null && a.longitude != null
          ? haversine(userLoc, { lat: a.latitude, lng: a.longitude })
          : Infinity;
        const db = b.latitude != null && b.longitude != null
          ? haversine(userLoc, { lat: b.latitude, lng: b.longitude })
          : Infinity;
        return da - db;
      });
    }
    return list;
  }, [studios, q, continent, country, city, userLoc]);

  return (
    <div>
      {/* PREMIUM HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-28 sm:pt-32 sm:pb-40">
        <div className="absolute inset-0 pointer-events-none bg-background">
          {/* Swapped multiply for luminosity to keep it elegant and textured, not muddy */}
          <img 
            src={heroRope} 
            alt="Shibari background" 
            className="h-full w-full object-cover mix-blend-luminosity opacity-[0.15]" 
            width={1600}
            height={1000}
          />
          {/* Subtle radial glow to draw the eye to the center */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-background)_100%)] opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="text-xs uppercase tracking-[0.4em] text-secondary font-bold">
            The Worldwide Directory
          </p>
          <h1 className="mt-6 font-serif text-6xl leading-[1.1] text-foreground sm:text-7xl md:text-8xl drop-shadow-sm">
            Find your <em className="text-secondary not-italic">Shibari</em> studio.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/80 sm:text-xl font-medium">
            A curated collective of studios across every continent.
          </p>

          {/* FROSTED GLASS SEARCH BAR */}
          <div className="mx-auto mt-12 max-w-3xl bg-white/30 backdrop-blur-2xl border border-white/50 rounded-[2rem] p-3 shadow-[0_20px_40px_-15px_rgba(78,44,35,0.15)] relative">
            <div className="flex items-center gap-3 px-5 bg-white/50 rounded-[1.25rem] border border-white/30 transition-colors focus-within:bg-white/80 focus-within:border-white/80 shadow-sm">
              <Search className="h-5 w-5 text-foreground/60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by studio name, city, or country…"
                className="flex-1 border-0 bg-transparent py-4 text-base text-foreground outline-none placeholder:text-foreground/50 font-medium"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-3">
              <FilterSelect 
                value={continent} 
                onChange={(v) => { setContinent(v); setCountry(""); setCity(""); }} 
                placeholder="All continents" 
                options={CONTINENTS as unknown as string[]} 
              />
              <FilterSelect 
                value={country} 
                onChange={(v) => { setCountry(v); setCity(""); }} 
                placeholder="All countries" 
                options={countries} 
              />
              <FilterSelect 
                value={city} 
                onChange={setCity} 
                placeholder="All cities" 
                options={cities} 
              />
            </div>
          </div>
          <div className="rope-divider mx-auto mt-16 w-48" />
        </div>
      </section>

      {/* Interactive Map */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl text-foreground">Global Map</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore studios near your location.
            </p>
          </div>
        </div>
        <div className="h-[500px] w-full overflow-hidden rounded-[2rem] border border-white/40 shadow-lg z-0 relative bg-white/20 backdrop-blur-md">
          {isClient ? (
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading map...</div>}>
              <MapComponent userLoc={userLoc} filtered={filtered} />
            </Suspense>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading map...</div>
          )}
        </div>
      </section>

      {/* Carousel */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl text-foreground">
              {userLoc ? "Studios near you" : "Featured studios"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "studio" : "studios"} listed
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/20 h-80 animate-pulse rounded-[2rem] border border-white/40 shadow-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <StudioCarousel studios={filtered} />
        )}
      </section>
    </div>
  );
}

// Updated Select Component for Frosted Glass Look
function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-[1.25rem] border border-white/40 bg-white/30 backdrop-blur-sm px-4 py-3.5 text-sm outline-none focus:border-white/80 focus:bg-white/60 disabled:opacity-40 transition-all font-medium text-foreground shadow-sm hover:bg-white/40 cursor-pointer appearance-none"
      style={{ 
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234E2C23' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, 
        backgroundRepeat: 'no-repeat', 
        backgroundPosition: 'right 1rem center', 
        backgroundSize: '1em' 
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function StudioCarousel({ studios }: { studios: Studio[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", loop: false });
  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden pb-4">
        <div className="flex gap-6">
          {studios.map((s) => (
            <div key={s.id} className="min-w-0 shrink-0 basis-full sm:basis-1/2 lg:basis-1/3">
              <StudioCard studio={s} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-3">
        <button
          onClick={() => embla?.scrollPrev()}
          className="rounded-full border border-white/40 bg-white/30 backdrop-blur-sm p-3 shadow-sm hover:bg-white/50 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={() => embla?.scrollNext()}
          className="rounded-full border border-white/40 bg-white/30 backdrop-blur-sm p-3 shadow-sm hover:bg-white/50 transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
}

function StudioCard({ studio }: { studio: Studio }) {
  const photo = studio.studio_photos?.sort((a, b) => a.position - b.position)[0]?.url;
  return (
    <Link
      to="/studios/$id"
      params={{ id: studio.id }}
      className="group block overflow-hidden rounded-[2rem] bg-white/30 backdrop-blur-md border border-white/40 transition-all hover:shadow-[0_15px_30px_-10px_rgba(78,44,35,0.15)] hover:bg-white/40 hover:-translate-y-1"
    >
      <div className="aspect-[4/3] overflow-hidden bg-white/50 relative">
        {photo ? (
          <img
            src={photo}
            alt={studio.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-foreground/40 font-medium">No image</div>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-serif text-2xl text-foreground">{studio.name}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-foreground/70 font-medium">
          <MapPin className="h-4 w-4" />
          <span>
            {studio.city}, {studio.country}
          </span>
        </div>
        {studio.description && (
          <p className="mt-4 line-clamp-2 text-sm text-foreground/80 leading-relaxed">{studio.description}</p>
        )}
        <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-secondary group-hover:text-foreground transition-colors">
          View studio <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] bg-white/30 backdrop-blur-md border border-white/40 p-16 text-center shadow-lg">
      <Clock className="mx-auto h-12 w-12 text-secondary/60 mb-4" />
      <h3 className="mt-4 font-serif text-3xl text-foreground">No studios yet</h3>
      <p className="mt-3 text-base text-foreground/70 max-w-md mx-auto">
        Be the first in this area! Submit your studio and help build the collective.
      </p>
      <Link
        to="/submit"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3.5 text-sm font-bold text-secondary-foreground shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all"
      >
        Submit your studio <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
