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
      { name: "description", content: "Browse Shibari studios globally." },
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
    const list = studios.filter((s) => !continent || s.continent?.toLowerCase() === continent.toLowerCase()).map((s) => s.country).filter(Boolean); 
    return Array.from(new Set(list)).sort();
  }, [studios, continent]);

  const cities = useMemo(() => {
    const list = studios.filter((s) => {
      const matchCont = !continent || s.continent?.toLowerCase() === continent.toLowerCase();
      const matchCoun = !country || s.country?.toLowerCase() === country.toLowerCase();
      return matchCont && matchCoun;
    }).map((s) => s.city).filter(Boolean);
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
        if (!n.includes(t) && !c.includes(t) && !r.includes(t)) return false;
      }
      return true;
    });

    if (userLoc) {
      list = [...list].sort((a, b) => {
        const da = a.latitude != null && a.longitude != null ? haversine(userLoc, { lat: a.latitude, lng: a.longitude }) : Infinity;
        const db = b.latitude != null && b.longitude != null ? haversine(userLoc, { lat: b.latitude, lng: b.longitude }) : Infinity;
        return da - db;
      });
    }
    return list;
  }, [studios, q, continent, country, city, userLoc]);

  return (
    <div>
      {/* ULTRA-PREMIUM HERO */}
      <section className="relative overflow-hidden pt-24 pb-32 sm:pt-40 sm:pb-48">
        <div className="absolute inset-0 pointer-events-none bg-background">
          {/* Soft-light creates a sexy, high-fashion editorial blend with the apricot background */}
          <img 
            src={heroRope} 
            alt="Shibari background" 
            className="h-full w-full object-cover mix-blend-soft-light opacity-60 grayscale" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.5em] text-secondary font-bold mb-6">
            The Worldwide Directory
          </p>
          <h1 className="font-serif text-6xl leading-[1.05] text-foreground sm:text-7xl md:text-8xl tracking-tight drop-shadow-sm">
            Find your <em className="text-secondary italic font-light">Shibari</em> studio.
          </h1>
          
          {/* SEXY FROSTED SEARCH CONSOLE */}
          <div className="mx-auto mt-16 max-w-2xl bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-4 shadow-[0_30px_60px_-15px_rgba(78,44,35,0.25)] relative">
            <div className="flex items-center gap-3 px-6 bg-white/60 rounded-full border border-white/40 shadow-inner transition-colors focus-within:bg-white/90 focus-within:border-white/80 h-14">
              <Search className="h-5 w-5 text-foreground/60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search studios, cities, or countries..."
                className="flex-1 border-0 bg-transparent py-2 text-base text-foreground outline-none placeholder:text-foreground/50 font-medium"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-3">
              <FilterSelect value={continent} onChange={(v) => { setContinent(v); setCountry(""); setCity(""); }} placeholder="All Continents" options={CONTINENTS as unknown as string[]} />
              <FilterSelect value={country} onChange={(v) => { setCountry(v); setCity(""); }} placeholder="All Countries" options={countries} />
              <FilterSelect value={city} onChange={setCity} placeholder="All Cities" options={cities} />
            </div>
          </div>
        </div>
      </section>

      {/* MAP SECTION */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="h-[550px] w-full overflow-hidden rounded-[2.5rem] border border-white/50 shadow-[0_20px_40px_-10px_rgba(78,44,35,0.1)] z-0 relative bg-white/30 backdrop-blur-xl">
          {isClient ? (
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-foreground/50 font-medium tracking-widest uppercase text-sm">Loading Map...</div>}>
              <MapComponent userLoc={userLoc} filtered={filtered} />
            </Suspense>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-foreground/50">Loading Map...</div>
          )}
        </div>
      </section>

      {/* CAROUSEL SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex items-end justify-between px-2">
          <div>
            <h2 className="font-serif text-4xl text-foreground tracking-tight">
              {userLoc ? "Studios Near You" : "Featured Spaces"}
            </h2>
            <p className="mt-2 text-sm uppercase tracking-widest text-secondary font-bold">
              {filtered.length} {filtered.length === 1 ? "Studio" : "Studios"} Listed
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-white/30 h-96 animate-pulse rounded-[2.5rem] border border-white/40" />)}
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

// ULTRA CLEAN PILL DROPDOWNS
function FilterSelect({ value, onChange, placeholder, options, disabled }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[]; disabled?: boolean; }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-full border border-white/40 bg-white/40 backdrop-blur-md px-5 py-3.5 text-sm outline-none focus:border-white/80 focus:bg-white/80 disabled:opacity-30 transition-all font-semibold text-foreground shadow-sm hover:bg-white/60 cursor-pointer appearance-none"
      style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234E2C23' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1em' }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function StudioCarousel({ studios }: { studios: Studio[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", loop: false });
  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden pb-10">
        <div className="flex gap-8">
          {studios.map((s) => (
            <div key={s.id} className="min-w-0 shrink-0 basis-full sm:basis-1/2 lg:basis-1/3">
              <StudioCard studio={s} />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute top-[-5rem] right-2 flex items-center gap-3">
        <button onClick={() => embla?.scrollPrev()} className="rounded-full border border-white/60 bg-white/40 backdrop-blur-xl p-3 shadow-md hover:bg-white/80 hover:scale-105 transition-all">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <button onClick={() => embla?.scrollNext()} className="rounded-full border border-white/60 bg-white/40 backdrop-blur-xl p-3 shadow-md hover:bg-white/80 hover:scale-105 transition-all">
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
}

function StudioCard({ studio }: { studio: Studio }) {
  const photo = studio.studio_photos?.sort((a, b) => a.position - b.position)[0]?.url;
  return (
    <Link to="/studios/$id" params={{ id: studio.id }} className="group block overflow-hidden rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/60 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(78,44,35,0.2)] hover:bg-white/60 hover:-translate-y-2">
      <div className="aspect-[4/3] overflow-hidden bg-white/50 relative p-2">
        <div className="w-full h-full rounded-[2rem] overflow-hidden">
          {photo ? (
            <img src={photo} alt={studio.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-foreground/40 font-medium">No Image</div>
          )}
        </div>
      </div>
      <div className="p-8">
        <h3 className="font-serif text-3xl text-foreground tracking-tight">{studio.name}</h3>
        <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/60 font-bold">
          <MapPin className="h-4 w-4 text-secondary" />
          <span>{studio.city}, {studio.country}</span>
        </div>
        {studio.description && <p className="mt-5 line-clamp-2 text-sm text-foreground/80 leading-relaxed font-medium">{studio.description}</p>}
        <div className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-secondary group-hover:text-foreground transition-colors uppercase tracking-widest">
          View Studio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[3rem] bg-white/40 backdrop-blur-2xl border border-white/60 p-20 text-center shadow-[0_20px_50px_-10px_rgba(78,44,35,0.15)]">
      <Clock className="mx-auto h-16 w-16 text-secondary/60 mb-6" />
      <h3 className="mt-4 font-serif text-4xl text-foreground">No studios yet</h3>
      <p className="mt-4 text-lg text-foreground/70 max-w-md mx-auto font-medium">
        Be the first in this area! Submit your space and help build the collective.
      </p>
      <Link to="/submit" className="mt-10 inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-4 text-sm font-bold uppercase tracking-widest text-secondary-foreground shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
        Submit Studio <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
