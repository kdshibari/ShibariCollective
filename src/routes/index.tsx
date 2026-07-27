import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CONTINENTS, haversine } from "@/lib/geo";
import heroRope from "@/assets/hero-rope.jpg";
import { Search, MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shibari Collective, Discover Studios Worldwide" },
      {
        name: "description",
        content: "Browse Shibari studios by continent, country, and city. Find trusted spaces near you.",
      },
      { property: "og:title", content: "Shibari Collective, Discover Studios Worldwide" },
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

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function HomePage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
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

  const countries = useMemo(
    () => Array.from(new Set(studios.filter((s) => !continent || s.continent === continent).map((s) => s.country))).sort(),
    [studios, continent]
  );
  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          studios
            .filter((s) => (!continent || s.continent === continent) && (!country || s.country === country))
            .map((s) => s.city)
        )
      ).sort(),
    [studios, continent, country]
  );

  const filtered = useMemo(() => {
    let list = studios.filter((s) => {
      if (continent && s.continent !== continent) return false;
      if (country && s.country !== country) return false;
      if (city && s.city !== city) return false;
      if (q) {
        const t = q.toLowerCase();
        if (
          !s.name.toLowerCase().includes(t) &&
          !s.city.toLowerCase().includes(t) &&
          !s.country.toLowerCase().includes(t)
        )
          return false;
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroRope}
            alt=""
            className="h-full w-full object-cover opacity-40"
            width={1600}
            height={1000}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">The worldwide directory</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-foreground sm:text-6xl md:text-7xl">
            Find your <em className="text-secondary not-italic">Shibari</em> studio.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            A curated collective of trusted studios across every continent. Rope, wood, and community brought together.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-10 max-w-3xl card-warm rounded-2xl p-2 shadow-sm">
            <div className="flex items-center gap-2 px-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by studio name, city, or country…"
                className="flex-1 border-0 bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 border-t border-border/60 p-2 sm:grid-cols-3">
              <FilterSelect value={continent} onChange={(v) => { setContinent(v); setCountry(""); setCity(""); }} placeholder="All continents" options={CONTINENTS as unknown as string[]} />
              <FilterSelect value={country} onChange={(v) => { setCountry(v); setCity(""); }} placeholder="All countries" options={countries} disabled={!continent && countries.length > 20} />
              <FilterSelect value={city} onChange={setCity} placeholder="All cities" options={cities} />
            </div>
          </div>
          <div className="rope-divider mx-auto mt-12 w-40" />
        </div>
      </section>

      {/* Interactive Map */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl text-foreground">Global Map</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore studios near your location.
            </p>
          </div>
        </div>
        <div className="h-[500px] w-full overflow-hidden rounded-2xl border border-border shadow-sm z-0 relative">
          <MapContainer
            center={userLoc ? [userLoc.lat, userLoc.lng] : [20, 0]}
            zoom={userLoc ? 10 : 2}
            scrollWheelZoom={false}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLoc && <MapUpdater center={[userLoc.lat, userLoc.lng]} />}
            {filtered.map((s) => (
              s.latitude && s.longitude ? (
                <Marker key={s.id} position={[s.latitude, s.longitude]}>
                  <Popup>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.city}, {s.country}</div>
                    <Link to="/studios/$id" params={{ id: s.id }} className="mt-2 block text-xs text-secondary hover:underline">
                      View studio
                    </Link>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </div>
      </section>

      {/* Carousel */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
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
              <div key={i} className="card-warm h-80 animate-pulse rounded-2xl" />
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
      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-secondary disabled:opacity-50"
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
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-6">
          {studios.map((s) => (
            <div key={s.id} className="min-w-0 shrink-0 basis-full sm:basis-1/2 lg:basis-1/3">
              <StudioCard studio={s} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          onClick={() => embla?.scrollPrev()}
          className="rounded-full border border-border bg-card p-2 hover:bg-accent"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => embla?.scrollNext()}
          className="rounded-full border border-border bg-card p-2 hover:bg-accent"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
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
      className="card-warm group block overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {photo ? (
          <img
            src={photo}
            alt={studio.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-serif text-2xl text-foreground">{studio.name}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {studio.city}, {studio.country}
          </span>
        </div>
        {studio.description && (
          <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{studio.description}</p>
        )}
        <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-secondary">
          View studio <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="card-warm rounded-2xl p-12 text-center">
      <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 font-serif text-2xl text-foreground">No studios yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Be the first, submit your studio and help build the collective.
      </p>
      <Link
        to="/submit"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground hover:opacity-90"
      >
        Submit your studio <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
