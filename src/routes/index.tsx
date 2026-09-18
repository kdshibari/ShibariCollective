import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
// import Map from "@/components/Map"; // Assuming your Leaflet map is here

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
      // 1. Fetch the user
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // 2. Fetch all approved studios with their cover photos
      const { data: studioData } = await supabase
        .from("studios")
        .select("*, studio_photos(url)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      
      setStudios(studioData || []);

      // 3. If logged in, fetch their saved studios
      if (session?.user) {
        const { data: savedData } = await supabase
          .from("saved_studios")
          .select("studio_id")
          .eq("user_id", session.user.id);
        
        if (savedData) {
          setSavedStudioIds(new Set(savedData.map(s => s.studio_id)));
        }
      }
      setLoading(false);
    }
    loadDirectory();
  }, []);

  const toggleSave = async (studioId: string) => {
    // Elegant redirect for anonymous users
    if (!user) {
      toast.info("Create a free Participant profile to save studios.");
      navigate({ to: "/auth", search: { intent: "participant" } });
      return;
    }

    const isCurrentlySaved = savedStudioIds.has(studioId);
    
    // OPTIMISTIC UI UPDATE: Instantly toggle the UI state before the database responds
    const newSaved = new Set(savedStudioIds);
    if (isCurrentlySaved) {
      newSaved.delete(studioId);
      toast.success("Removed from your saved spaces.");
    } else {
      newSaved.add(studioId);
      toast.success("Saved to your dashboard!");
    }
    setSavedStudioIds(newSaved);

    // BACKGROUND SYNC: Update the Supabase database
    try {
      if (isCurrentlySaved) {
        const { error } = await supabase.from("saved_studios").delete().match({ user_id: user.id, studio_id: studioId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saved_studios").insert({ user_id: user.id, studio_id: studioId });
        if (error) throw error;
      }
    } catch (error: any) {
      // Revert UI if the database fails
      toast.error("Network error. Could not sync save state.");
      setSavedStudioIds(savedStudioIds); 
    }
  };

  return (
    <div className="flex h-screen w-full bg-background pt-16">
      
      {/* DIRECTORY SIDEBAR */}
      <div className="w-full lg:w-[450px] h-full overflow-y-auto border-r border-white/10 bg-background/50 backdrop-blur-xl p-4 sm:p-6 z-10 hidden lg:block">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-secondary font-bold mb-2">Global Directory</p>
          <h1 className="font-serif text-3xl text-foreground">Explore Spaces</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2rem]" />)}
          </div>
        ) : (
          <div className="space-y-6">
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

      {/* LEAFLET MAP AREA */}
      <div className="flex-1 relative bg-neutral-900">
        {/* <Map studios={studios} /> */}
        <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold uppercase tracking-widest text-sm">
          Interactive Map Canvas
        </div>
      </div>

    </div>
  );
}

// PREMIUM STUDIO CARD COMPONENT
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
        
        {/* INTERACTIVE BOOKMARK BUTTON */}
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
