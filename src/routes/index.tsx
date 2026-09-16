import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { haversine } from "@/lib/geo";
import heroRope from "@/assets/hero-rope.jpg";
import { Search, MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

const libraries: ("places")[] = ["places"];
const mapContainerStyle = { width: "100%", height: "100%" };
const SEARCH_RADIUS_KM = 100;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shibari Collective — Discover Studios Worldwide" },
      {
        name: "description",
        content: "Browse Shibari studios globally. Find trusted spaces near you.",
      },
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
  distance?: number;
}

function HomePage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

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

  // Proximity filtering using Haversine
  const filtered = useMemo(() => {
    if (!userLoc) return studios; // Show all if no search location is set

    return studios
      .map((s) => {
        if (s.latitude == null || s.longitude == null) return { ...s, distance: Infinity };
        const distance = haversine(userLoc, { lat: s.latitude, lng: s.longitude });
        return { ...s, distance };
      })
      .filter((s) => s.distance! <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.distance! - b.distance!);
  }, [studios, userLoc]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroRope} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">The worldwide directory</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-foreground sm:text-6xl md:text-7xl">
            Find your <em className="text-secondary not-italic">Shibari</em> studio.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            A curated collective of studios across every continent.
          </p>

          {/* Google Places Search Bar */}
          <div className="mx-auto mt-10 max-w-2xl card-warm rounded-2xl p-2 shadow-sm">
            {isLoaded ? (
              <PlacesSearch onSelectLocation={(lat, lng) => setUserLoc({ lat, lng })} />
            ) : (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading search...
              </div>
            )}
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
        <div className="h-[500px] w-full overflow-hidden rounded-2xl border border-border shadow-sm z-0 relative bg-muted">
          {loadError ? (
            <div className="flex h-full items-center justify-center">Error loading maps</div>
          ) : !isLoaded ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">Loading map...</div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={userLoc ? 10 : 2}
              center={userLoc ? userLoc : { lat: 20, lng: 0 }}
              options={{ disableDefaultUI: true, zoomControl: true }}
            >
              {filtered.map((s) =>
                s.latitude && s.longitude ? (
                  <Marker
                    key={s.id}
                    position={{ lat: s.latitude, lng: s.longitude }}
                    onClick={() => setSelectedStudio(s)}
                  />
                ) : null
              )}
              {selectedStudio && selectedStudio.latitude && selectedStudio.longitude && (
                <InfoWindow
                  position={{ lat: selectedStudio.latitude, lng: selectedStudio.longitude }}
                  onCloseClick={() => setSelectedStudio(null)}
                >
                  <div className="p-1 text-black">
                    <div className="font-semibold text-sm">{selectedStudio.name}</div>
                    <div className="text-xs">{selectedStudio.city}, {selectedStudio.country}</div>
                    <Link to="/studios/$id" params={{ id: selectedStudio.id }} className="mt-2 block text-xs font-medium text-blue-600 hover:underline">
                      View studio
                    </Link>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
      </section>

      {/* Carousel */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl text-foreground">
              {userLoc ? "Studios within 100km" : "Featured studios"}
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

// Places Autocomplete Hook Component
function PlacesSearch({ onSelectLocation }: { onSelectLocation: (lat: number, lng: number) => void }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { types: ["(regions)"] },
    debounce: 300,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelectLocation(lat, lng);
    } catch (error) {
      console.error("Error retrieving location: ", error);
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center px-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder="Search any city, neighborhood, or country..."
          className="flex-1 border-0 bg-transparent py-3 pl-3 pr-4 text-base outline-none placeholder:text-muted-foreground"
        />
      </div>
      {status === "OK" && (
        <ul className="absolute left-0 right-0 z-50 mt-2 rounded-xl bg-card border border-border shadow-xl overflow-hidden">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="cursor-pointer px-5 py-3 hover:bg-accent text-sm transition-colors border-b border-border/50 last:border-0"
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
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
        <button onClick={() => embla?.scrollPrev()} className="rounded-full border border-border bg-card p-2 hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => embla?.scrollNext()} className="rounded-full border border-border bg-card p-2 hover:bg-accent">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function StudioCard({ studio }: { studio: Studio }) {
  const photo = studio.studio_photos?.sort((a, b) => a.position - b.position)[0]?.url;
  return (
    <Link to="/studios/$id" params={{ id: studio.id }} className="card-warm group block overflow-hidden rounded-2xl transition-shadow hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {photo ? (
          <img src={photo} alt={studio.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-serif text-2xl text-foreground">{studio.name}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{studio.city}, {studio.country}</span>
        </div>
        {studio.distance !== undefined && studio.distance !== Infinity && (
          <div className="mt-1 text-xs text-secondary font-medium">
            {Math.round(studio.distance)} km away
          </div>
        )}
        {studio.description && <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{studio.description}</p>}
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
      <Link to="/submit" className="mt-6 inline-flex items-center gap-2 rounded-md bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground hover:opacity-90">
        Submit your studio <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
