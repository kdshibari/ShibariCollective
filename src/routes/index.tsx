import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, MapPin, Globe2, Search, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ProgressiveImage } from "@/components/ProgressiveImage";

export const Route = createFileRoute("/")({
  component: DirectoryPage,
});

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const PAGE_SIZE = 12;

function AbstractRopeArtwork({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" className={className}>
      <g transform="translate(250, 250)" fill="none" stroke="currentColor" strokeWidth="4">
        <circle cx="0" cy="-100" r="32" transform="rotate(0)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(15)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(30)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(45)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(60)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(75)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(90)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(105)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(120)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(135)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(150)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(165)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(180)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(195)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(210)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(225)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(240)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(255)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(270)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(285)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(300)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(315)" />
        <circle cx="0" cy="-100" r="32" transform="rotate(330)" />
        <circle cx="0" cy="-100" r="30" transform="rotate(345)" />

        <circle cx="30" cy="0" r="22" transform="rotate(0)" />
        <circle cx="30" cy="0" r="22" transform="rotate(30)" />
        <circle cx="30" cy="0" r="22" transform="rotate(60)" />
        <circle cx="30" cy="0" r="22" transform="rotate(90)" />
        <circle cx="30" cy="0" r="22" transform="rotate(120)" />
        <circle cx="30" cy="0" r="22" transform="rotate(150)" />
        <circle cx="30" cy="0" r="22" transform="rotate(180)" />
        <circle cx="30" cy="0" r="22" transform="rotate(210)" />
        <circle cx="30" cy="0" r="22" transform="rotate(240)" />
        <circle cx="30" cy="0" r="22" transform="rotate(270)" />
        <circle cx="30" cy="0" r="22" transform="rotate(300)" />
        <circle cx="30" cy="0" r="22" transform="rotate(330)" />
      </g>
    </svg>
  );
}

function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-background pt-32 pb-20 sm:pt-40 sm:pb-32 border-b border-white/5 flex flex-col items-center justify-center min-h-[75vh]">
      
      {/* Mesmerizing Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] sm:w-[1400px] sm:h-[1400px] pointer-events-none z-0">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
          className="w-full h-full opacity-[0.03] text-white mix-blend-plus-lighter"
        >
          <AbstractRopeArtwork className="w-full h-full" />
        </motion.div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[1000px] sm:h-[1000px] pointer-events-none z-0">
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
          className="w-full h-full opacity-[0.04] text-secondary mix-blend-plus-lighter scale-90"
        >
          <AbstractRopeArtwork className="w-full h-full" />
        </motion.div>
      </div>

      {/* Abstract Cinematic Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] bg-secondary/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen z-0" />
      
      {/* Texture Overlays to blend it all together seamlessly */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay z-0" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-[6rem] text-foreground leading-[1.05] tracking-tight mb-8 drop-shadow-2xl max-w-5xl mx-auto">
            Discover Dedicated <br className="hidden md:block" /> Spaces for Shibari
          </h1>
          <p className="text-foreground/60 text-base sm:text-lg max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            An exclusive, curated directory connecting practitioners with safe, equipped, and trusted rope studios around the world.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link 
              to="/auth" 
              search={{ intent: "owner" }} 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-secondary text-white text-xs font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(139,58,54,0.4)] hover:shadow-[0_0_40px_rgba(139,58,54,0.6)] hover:-translate-y-1 active:scale-95 transition-all duration-300"
            >
              List Your Studio
            </Link>
            <a 
              href="#directory" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 text-foreground text-xs font-bold uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all duration-300 backdrop-blur-md"
            >
              Explore Directory
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PlaceholderCard() {
  return (
    <Link
      to="/auth"
      search={{ intent: "owner" }}
      className="group relative block rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-white/[0.02] border border-white/10 border-dashed aspect-[4/5] sm:aspect-[3/4] hover:border-secondary/40 hover:bg-secondary/5 hover:shadow-[0_0_40px_rgba(139,58,54,0.15)] transition-all duration-500 w-full flex flex-col items-center justify-center text-center p-6 sm:p-8"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-secondary/20 border border-white/5 group-hover:border-secondary/30 transition-all duration-500 shadow-inner backdrop-blur-md">
        <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-foreground/30 group-hover:text-secondary transition-colors duration-500" strokeWidth={1} />
      </div>
      <h3 className="font-serif text-2xl sm:text-3xl text-foreground mb-3 group-hover:text-white transition-colors">Claim This Spot</h3>
      <p className="text-[10px] sm:text-xs text-foreground/50 font-medium leading-relaxed max-w-[200px] uppercase tracking-widest">
        Join the collective directory
      </p>
    </Link>
  );
}

function DirectoryPage() {
  const navigate = useNavigate();
  const [studios, setStudios] = useState<any[]>([]);
  const [savedStudioIds, setSavedStudioIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [regionsList, setRegionsList] = useState<string[]>(["All"]);

  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      setStudios([]);
      setHasMore(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (regionsList.length === 1) {
          const { data: allContinents } = await supabase
            .from("studios")
            .select("continent")
            .eq("status", "approved");
            
          if (allContinents) {
            const unique = new Set(allContinents.map(s => s.continent).filter(Boolean));
            setRegionsList(["All", ...Array.from(unique).sort()]);
          }
        }

        let query = supabase
          .from("studios")
          .select("*, studio_photos(url)", { count: 'exact' })
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (activeRegion !== "All") {
          query = query.eq("continent", activeRegion);
        }

        if (searchQuery.trim() !== "") {
          query = query.or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
        }

        const { data: studioData, count, error } = await query;
        if (error) throw error;
        
        setStudios(studioData || []);
        setHasMore((studioData?.length || 0) < (count || 0));

        if (session?.user) {
          const { data: savedData } = await supabase
            .from("saved_studios")
            .select("studio_id")
            .eq("user_id", session.user.id);
            
          if (savedData) {
            setSavedStudioIds(new Set(savedData.map(s => s.studio_id)));
          }
        }
      } catch (err) {
        console.error("Directory Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    const timeoutId = setTimeout(() => {
      fetchInitialData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeRegion, searchQuery]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const start = studios.length;
      const end = start + PAGE_SIZE - 1;

      let query = supabase
        .from("studios")
        .select("*, studio_photos(url)", { count: 'exact' })
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(start, end);

      if (activeRegion !== "All") {
        query = query.eq("continent", activeRegion);
      }

      if (searchQuery.trim() !== "") {
        query = query.or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }

      const { data: newStudios, count, error } = await query;
      if (error) throw error;

      if (newStudios && newStudios.length > 0) {
        setStudios(prev => [...prev, ...newStudios]);
        setHasMore((studios.length + newStudios.length) < (count || 0));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Load More Error:", err);
      toast.error("Failed to load more studios.");
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleSave = async (studioId: string) => {
    if (!user) {
      toast.info("Create a free User profile to save studios.");
      navigate({ to: "/auth", search: { intent: "User" } });
      return;
    }

    const isCurrentlySaved = savedStudioIds.has(studioId);
    const newSaved = new Set(savedStudioIds);
    
    if (isCurrentlySaved) {
      newSaved.delete(studioId);
      toast.success("Removed from your saved spaces.");
    } else {
      newSaved.add(studioId);
      toast.success("Saved");
    }
    
    setSavedStudioIds(newSaved);

    try {
      if (isCurrentlySaved) {
        const { error } = await supabase.from("saved_studios").delete().match({ user_id: user.id, studio_id: studioId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saved_studios").insert({ user_id: user.id, studio_id: studioId });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error("Network error. Could not sync save state.");
      const reverted = new Set(newSaved);
      if (isCurrentlySaved) reverted.add(studioId); else reverted.delete(studioId);
      setSavedStudioIds(reverted); 
    }
  };

  const placeholdersNeeded = Math.max(0, 4 - studios.length);

  return (
    <div className="min-h-screen bg-background pb-24">
      <HeroSection />

      <div id="directory" className="pt-16 sm:pt-24 scroll-mt-24">
        {/* Filter and Search Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            
            {/* Region Pills */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar w-full sm:w-auto py-2">
              {regionsList.map(region => (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap active:scale-95 transition-all duration-300 ${
                    activeRegion === region 
                      ? 'bg-secondary text-white shadow-lg' 
                      : 'bg-white/5 text-foreground/60 hover:bg-white/10 hover:text-foreground'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Search by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm text-foreground outline-none focus:border-secondary/50 transition-colors placeholder:text-foreground/30"
              />
            </div>
          </div>
        </motion.div>

        {/* Animated Editorial Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
              {[...Array(PAGE_SIZE)].map((_, i) => (
                <div key={i} className="aspect-[4/5] sm:aspect-[3/4] bg-white/5 border border-white/10 animate-pulse rounded-[1.5rem] sm:rounded-[2rem] w-full" />
              ))}
            </div>
          ) : (
            <>
              <motion.div layout variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                <AnimatePresence mode="popLayout">
                  {studios.map(studio => (
                    <StudioCard 
                      key={studio.id} 
                      studio={studio} 
                      isSaved={savedStudioIds.has(studio.id)} 
                      onToggleSave={() => toggleSave(studio.id)} 
                    />
                  ))}
                  
                  {/* Fill out the grid with luxurious placeholders if it's empty/sparse */}
                  {!searchQuery && studios.length > 0 && Array.from({ length: placeholdersNeeded }).map((_, i) => (
                    <motion.div key={`placeholder-${i}`} variants={cardVariants} layout exit="exit">
                      <PlaceholderCard />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {studios.length > 0 && hasMore && (
                <div className="mt-16 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-white/10 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && studios.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="text-center py-32 border border-white/10 rounded-[2rem] bg-white/5"
            >
              <Globe2 className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
              <h3 className="font-serif text-3xl text-foreground">No Spaces Found</h3>
              <p className="text-sm text-foreground/50 mt-2 max-w-md mx-auto">
                Try adjusting your search criteria or checking back later as our global directory grows.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudioCard({ studio, isSaved, onToggleSave }: { studio: any, isSaved: boolean, onToggleSave: () => void }) {
  // Generate a clean slug: "Nawashi Studio" -> "nawashi-studio-uuid"
  const slug = `${studio.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${studio.id}`;

  return (
    <motion.div 
      variants={cardVariants}
      layout
      exit="exit"
    >
      <Link
        to="/studios/$id" 
        params={{ id: slug }}
        preload="intent"
        className="group relative block rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-neutral-900 aspect-[4/5] sm:aspect-[3/4] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-shadow duration-500 border border-white/10 w-full"
      >
        {studio.studio_photos?.[0]?.url ? (
          <ProgressiveImage 
            src={studio.studio_photos[0].url} 
            alt={studio.name} 
            className="w-full h-full"
            imgClassName="transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-white/30 text-xs font-bold uppercase tracking-widest text-center px-2">
            No Image
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave();
          }}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-black/50 active:scale-95 transition-all"
          aria-label="Save Studio"
        >
          <motion.div
            key={isSaved ? "saved" : "unsaved"}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${isSaved ? "fill-secondary text-secondary" : "text-white"}`} />
          </motion.div>
        </button>

        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-8 transform translate-y-2 sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-secondary mb-1.5 sm:mb-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500 delay-100 truncate">
            {studio.country}
          </p>
          <h3 className="font-serif text-xl sm:text-3xl md:text-4xl text-white mb-1 sm:mb-2 leading-tight line-clamp-2">
            {studio.name}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-white/70 flex items-center gap-1.5 sm:gap-2">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white/50 shrink-0" /> 
            <span className="truncate">{studio.city}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
