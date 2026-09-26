import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, MapPin, Globe2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: DirectoryPage,
});

function DirectoryPage() {
  const navigate = useNavigate();
  const [studios, setStudios] = useState<any[]>([]);
  const [savedStudioIds, setSavedStudioIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState<string>("All");

  useEffect(() => {
    async function loadDirectory() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        const { data: studioData, error } = await supabase
          .from("studios")
          .select("*, studio_photos(url)")
          .eq("status", "approved")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setStudios(studioData || []);

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
    loadDirectory();
  }, []);

  const toggleSave = async (studioId: string) => {
    if (!user) {
      toast.info("Create a free Participant profile to save studios.");
      navigate({ to: "/auth", search: { intent: "participant" } });
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

  const regions = useMemo(() => {
    const uniqueContinents = new Set(studios.map(s => s.continent).filter(Boolean));
    return ["All", ...Array.from(uniqueContinents).sort()];
  }, [studios]);

  const filteredStudios = useMemo(() => {
    if (activeRegion === "All") return studios;
    return studios.filter(s => s.continent === activeRegion);
  }, [studios, activeRegion]);

  return (
    <div className="min-h-screen bg-background pb-24">
      
      {/* Editorial Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 mb-8 text-center sm:text-left">
        <p className="text-xs uppercase tracking-[0.4em] text-secondary font-bold mb-4 flex items-center justify-center sm:justify-start gap-2">
          <Globe2 className="w-4 h-4" /> Global Directory
        </p>
        <h1 className="font-serif text-5xl sm:text-7xl text-foreground">Explore Spaces</h1>
        <p className="mt-6 text-foreground/60 max-w-xl text-sm sm:text-base leading-relaxed mx-auto sm:mx-0">
          A curated selection of rope studios and private spaces dedicated to the art and practice of Shibari around the world.
        </p>
      </div>

      {/* Redesigned Borderless Minimalist Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar items-center py-2">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                activeRegion === region 
                  ? 'bg-secondary text-white shadow-lg' 
                  : 'bg-white/5 text-foreground/60 hover:bg-white/10 hover:text-foreground'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Animated Editorial Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[4/5] sm:aspect-[3/4] bg-white/5 animate-pulse rounded-[1.5rem] sm:rounded-[2rem] w-full" />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredStudios.map(studio => (
                <StudioCard 
                  key={studio.id} 
                  studio={studio} 
                  isSaved={savedStudioIds.has(studio.id)} 
                  onToggleSave={() => toggleSave(studio.id)} 
                  navigate={navigate} 
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filteredStudios.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="text-center py-32 border border-white/10 rounded-[2rem] bg-white/5"
          >
            <Globe2 className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="font-serif text-3xl text-foreground">No spaces found</h3>
            <p className="text-sm text-foreground/50 mt-2">We are continually expanding into new regions.</p>
          </motion.div>
        )}
      </div>

    </div>
  );
}

function StudioCard({ studio, isSaved, onToggleSave, navigate }: { studio: any, isSaved: boolean, onToggleSave: () => void, navigate: any }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-neutral-900 cursor-pointer aspect-[4/5] sm:aspect-[3/4] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-shadow duration-500 border border-white/10 w-full"
      onClick={() => navigate({ to: "/studios/$id", params: { id: studio.id } })}
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
        className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-black/50 transition-all hover:scale-110"
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
    </motion.div>
  );
}
