import { createFileRoute, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, ArrowRight, User, Edit3, MapPin, X, Save, Workflow, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
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

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-white/5 animate-pulse border border-white/10" />
          <div className="space-y-3">
            <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="h-40 w-full bg-white/5 rounded-[2rem] animate-pulse border border-white/10" />
        <div className="h-[28rem] md:h-80 w-full bg-white/5 rounded-[2rem] animate-pulse border border-white/10" />
      </div>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    }
    loadProfile();
  }, [navigate]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center shadow-inner border border-secondary/20">
              <Fingerprint className="w-8 h-8 text-secondary" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-serif text-4xl text-foreground">Welcome Back</h1>
              <p className="text-sm font-medium text-foreground/60">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-secondary/10 border border-secondary/20 rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="absolute right-0 top-0 p-8 opacity-5 pointer-events-none">
            <Workflow className="w-40 h-40 text-secondary" />
          </div>
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-3 mb-2">
              <Workflow className="w-6 h-6 text-secondary" />
              <h3 className="font-serif text-3xl text-foreground">Session Planner</h3>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Establish boundaries, map intensity preferences, and share aftercare needs with your partner before tying. This secure communication tool is exclusive to registered users.
            </p>
          </div>
          <Link 
            to="/session" 
            preload="intent"
            className="relative z-10 w-full md:w-auto shrink-0 rounded-full bg-secondary text-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-center shadow-[0_0_20px_rgba(139,58,54,0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            Open Planner
          </Link>
        </motion.div>

        <UserPortal userId={user?.id} userEmail={user?.email} />

      </div>
    </div>
  );
}

function UserPortal({ userId, userEmail }: { userId: string, userEmail: string }) {
  const [savedStudios, setSavedStudios] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      
      const [savesRes, profileRes] = await Promise.all([
        supabase
          .from("saved_studios")
          .select(`studio_id, created_at, studios (id, name, city, country, status, studio_photos (url, position))`)
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", userId).single()
      ]);

      if (!savesRes.error && savesRes.data) {
        const formattedStudios = savesRes.data
          .filter(record => record.studios) 
          .map(record => {
            const st = record.studios as any;
            return {
              ...st,
              studio_photos: (st.studio_photos || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)),
              saved_at: record.created_at
            }
          });
        setSavedStudios(formattedStudios);
      }

      if (profileRes.data) {
        setProfile(profileRes.data);
        setDisplayName(profileRes.data.display_name || "");
      }
      
      setLoading(false);
    }
    fetchData();
  }, [userId]);

  useEffect(() => {
    setIsEditingProfile(false);
  }, [location.key]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", userId);
    
    if (error) {
      toast.error("Failed to update profile.");
    } else {
      setProfile({ ...profile, display_name: displayName });
      setIsEditingProfile(false);
      toast.success("Profile successfully updated.");
    }
    setSavingProfile(false);
  };

  const handleUnsave = async (studioId: string) => {
    setSavedStudios(prev => prev.filter(studio => studio.id !== studioId));
    toast.success("Removed from saved spaces.");

    await supabase
      .from("saved_studios")
      .delete()
      .match({ user_id: userId, studio_id: studioId });
  };

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="h-[28rem] md:h-80 w-full bg-white/5 rounded-[2rem] animate-pulse border border-white/10" />
        <div className="space-y-8">
          <div className="h-6 w-40 bg-white/5 rounded-md animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 w-full bg-white/5 rounded-[2rem] animate-pulse border border-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-12">
      
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col justify-between">
        
        <div className="hidden sm:block absolute right-[-5%] top-1/2 -translate-y-1/2 w-80 h-80 md:w-[32rem] md:h-[32rem] opacity-40 text-jute pointer-events-none mix-blend-plus-lighter">
          <AbstractRopeArtwork className="w-full h-full drop-shadow-[0_0_30px_rgba(181,155,125,0.2)]" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-6">User Profile</p>
            
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner shrink-0">
                <Fingerprint className="w-10 h-10 sm:w-12 sm:h-12 text-secondary" strokeWidth={1} />
              </div>

              <div className="flex-1">
                {isEditingProfile ? (
                  <div className="flex items-center gap-3">
                    <input 
                      autoFocus
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      placeholder="Enter display name..."
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 font-serif text-2xl outline-none focus:border-secondary transition-colors text-foreground max-w-xs"
                    />
                    <button onClick={handleSaveProfile} disabled={savingProfile} className="bg-secondary text-white p-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg">
                      <Save className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsEditingProfile(false)} disabled={savingProfile} className="bg-white/5 text-foreground p-2 rounded-lg hover:bg-white/10 active:scale-95 transition-all border border-white/10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-4 max-w-max">
                    <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-1">{profile?.display_name || "Rope Explorer"}</h2>
                    <button onClick={() => setIsEditingProfile(true)} className="opacity-0 group-hover:opacity-100 bg-white/5 p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all border border-white/10">
                      <Edit3 className="w-4 h-4 text-secondary" />
                    </button>
                  </div>
                )}
                
                <p className="text-sm font-medium text-foreground/60 mt-2">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-32 h-px bg-white/10 mt-10 mb-8 relative z-10" />

        <div className="flex flex-wrap gap-8 md:gap-16 relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Saved Spaces</p>
            <p className="font-serif text-3xl md:text-4xl text-foreground mt-2">{savedStudios.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Member Since</p>
            <p className="font-serif text-3xl md:text-4xl text-foreground mt-2">
              {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Account Status</p>
            <p className="font-serif text-3xl md:text-4xl text-foreground mt-2 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_15px_rgba(226,114,91,0.8)]"></span> Verified
            </p>
          </div>
        </div>
      </div>

      <div className="pt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2 mb-8">
          <Bookmark className="h-4 w-4" /> Saved Studios
        </h2>

        {savedStudios.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 text-center border-dashed">
            <Bookmark className="mx-auto h-8 w-8 text-foreground/30 mb-4" />
            <h3 className="font-serif text-2xl text-foreground mb-2">Your personal directory is waiting</h3>
            <p className="text-foreground/60 text-sm max-w-md mx-auto leading-relaxed">
              Curate your collection of trusted spaces to reference later. Explore the global directory to begin building your roster.
            </p>
            <Link 
              to="/" 
              preload="intent"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-8 py-3.5 text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Explore Directory <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {savedStudios.map(studio => (
                <motion.div 
                  key={studio.id}
                  variants={cardVariants}
                  layout
                  className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="aspect-[16/9] relative overflow-hidden bg-black/20">
                    {studio.studio_photos?.[0]?.url ? (
                      <img src={studio.studio_photos[0].url} alt={studio.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/30 text-xs font-bold uppercase tracking-widest">No Logo</div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnsave(studio.id);
                      }}
                      className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-background/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white active:scale-95 transition-all"
                      aria-label="Remove saved studio"
                    >
                      <Bookmark className="h-5 w-5 fill-secondary text-secondary hover:fill-white hover:text-white transition-colors" />
                    </button>
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif text-xl text-foreground truncate">{studio.name}</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {studio.city}, {studio.country}
                    </p>
                    <Link 
                      to="/studios/$id" 
                      params={{ id: studio.id }}
                      preload="intent"
                      className="mt-6 w-full flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background active:scale-95 transition-all"
                    >
                      View Space <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

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
