import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, MapPin, Globe2, Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

  // Initial Data Fetch (and re-fetch when region or search changes)
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      setStudios([]);
      setHasMore(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        // We fetch ALL approved continents once to build the region filter bar dynamically
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

        // Build the filtered query
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
          // Allow searching by name or city
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

    // Debounce the search input slightly to avoid hammering the DB
    const timeoutId = setTimeout(() => {
      fetchInitialData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeRegion, searchQuery]); // Re-run when filters change


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

  return (
    <div className="min-h-screen bg-background pb-24">
      
      {/* Editorial Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 mb-8 text-center sm:text-left">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xs uppercase tracking-[0.4em] text-secondary font-bold mb-4 flex items-center justify-center sm:justify-start gap-2">
          <Globe2 className="w-4 h-4" /> Global Directory
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-serif text-5xl sm:text-7xl text-foreground">Explore Spaces</motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 text-foreground/60 max-w-xl text-sm sm:text-base leading-relaxed mx-auto sm:mx-0">
          A curated selection of rope studios and private spaces dedicated to the art and practice of Shibari around the world.
        </motion.p>
      </div>

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
          </  >
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
  );
}

function StudioCard({ studio, isSaved, onToggleSave }: { studio: any, isSaved: boolean, onToggleSave: () => void }) {
  return (
    <motion.div 
      variants={cardVariants}
      layout
      exit="exit"
    >
      <Link
        to="/studios/$id" 
        params={{ id: studio.id }}
        preload="intent"
        className="group relative block rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-neutral-900 aspect-[4/5] sm:aspect-[3/4] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-shadow duration-500 border border-white/10 w-full"
      >
        {studio.studio_photos?.[0]?.url ? (
          <img 
            src={studio.studio_photos[0].url} 
            alt={studio.name} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
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
