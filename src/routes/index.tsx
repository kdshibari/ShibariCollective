import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Map from "@/components/Map";

export const Route = createFileRoute("/")({
  component: DirectoryPage,
});

function DirectoryPage() {
  const navigate = useNavigate();
  const [studios, setStudios] = useState<any[]>([]);
  const [savedStudioIds, setSavedStudioIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      toast.success("Saved to your dashboard!");
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
      setSavedStudioIds(savedStudioIds); 
    }
  };

  // Strictly sanitize coordinates before sending them to the Map
  const safeMapStudios = studios.filter(
    (studio) => typeof studio.latitude === "number" && typeof studio.longitude === "number"
  );

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] w-full bg-background pt-16 overflow-hidden">
      
      {/* LEAFLET MAP AREA */}
      <div className="w-full h-[45vh] lg:h-full lg:flex-1 relative bg-neutral-900 order-1 lg:order-2 shrink-0 z-0">
        {/* BUG FIX: Passed the 'filtered' prop instead of 'studios' to prevent crash */}
        {!loading && <Map filtered={safeMapStudios} userLoc={null} />}
      </div>

      {/* DIRECTORY SIDEBAR */}
      <div className="w-full lg:w-[450px] h-[55vh] lg:h-full overflow-y-auto border-t lg:border-t-0 lg:border-r border-white/10 bg-background/50 backdrop-blur-xl p-4 sm:p-6 z-10 order-2 lg:order-1 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.3)] lg:shadow-none">
        <div className="mb-8 hidden lg:block">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary font-bold mb-2">Global Directory</p>
          <h1 className="font-serif text-3xl text-foreground">Explore Spaces</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2rem]" />)}
          </div>
        ) : (
          <div className="space-y-6 pb-20 lg:pb-6">
            {studios.map(studio => (
              <StudioCard 
                key={studio.id} 
                studio={studio} 
                isSaved={savedStudioIds.has(studio.id)} 
                onToggleSave={() => toggleSave(studio.id)} 
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function StudioCard({ studio, isSaved, onToggleSave }: { studio: any, isSaved: boolean, onToggleSave: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] overflow-hidden transition-all duration-300"
    >
      <div className="aspect-[16/9] relative overflow-hidden bg-black/20">
        {studio.studio_photos?.[0]?.url ? (
          <img src={studio.studio_photos[0].url} alt={studio.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/30 text-xs font-bold uppercase tracking-widest">No Cover</div>
        )}
        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave();
          }}
          className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-background/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-background/80 transition-all"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isSaved ? "saved" : "unsaved"}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Bookmark 
                className={`h-5 w-5 transition-colors ${isSaved ? "fill-secondary text-secondary" : "text-white"}`} 
              />
            </motion.div>
          </AnimatePresence>
        </button>
      </div>

      <div className="p-5">
        <h3 className="font-serif text-xl text-foreground truncate">{studio.name}</h3>
        <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-2 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> {studio.city}, {studio.country}
        </p>
      </div>
    </motion.div>
  );
}
