import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, ArrowRight, User, Edit3, MapPin, Save, X, Workflow } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-pulse text-secondary text-sm font-bold tracking-widest uppercase">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-12">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 shadow-md backdrop-blur-md flex items-center justify-center">
              <User className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <h1 className="font-serif text-4xl text-foreground">Welcome Back</h1>
              <p className="text-sm font-medium text-foreground/60">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary/10 border border-secondary/20 rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="absolute right-0 top-0 p-8 opacity-5 pointer-events-none">
            <Workflow className="w-40 h-40 text-secondary" />
          </div>
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-3 mb-2">
              <Workflow className="w-6 h-6 text-secondary" />
              <h3 className="font-serif text-3xl text-foreground">Session Planner</h3>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Establish boundaries, map intensity preferences, and share aftercare needs with your partner before tying. This secure communication tool is exclusive to registered participants.
            </p>
          </div>
          <Link 
            to="/session" 
            className="relative z-10 w-full md:w-auto shrink-0 rounded-full bg-secondary text-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-center shadow-[0_0_20px_rgba(139,58,54,0.3)] hover:scale-[1.02] transition-transform"
          >
            Open Planner
          </Link>
        </div>

        <ParticipantPortal userId={user?.id} userEmail={user?.email} />

      </div>
    </div>
  );
}

function ParticipantPortal({ userId, userEmail }: { userId: string, userEmail: string }) {
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
        supabase.from("profiles").select("*").eq("id", userId).single(),
      ]);

      if (!savesRes.error && savesRes.data) {
        const formattedStudios = savesRes.data
          .filter((record) => record.studios)
          .map((record) => {
            const st = record.studios as any;
            return {
              ...st,
              studio_photos: (st.studio_photos || []).sort(
                (a: any, b: any) => (a.position || 0) - (b.position || 0),
              ),
              saved_at: record.created_at,
            };
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
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", userId);

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
    setSavedStudios((prev) => prev.filter((studio) => studio.id !== studioId));
    toast.success("Removed from saved spaces.");

    await supabase
      .from("saved_studios")
      .delete()
      .match({ user_id: userId, studio_id: studioId });
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-white/5 rounded-[2rem] border border-white/10" />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 pointer-events-none">
          <User className="w-40 h-40 md:w-64 md:h-64" />
        </div>

        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">
            Participant Profile
          </p>

          {isEditingProfile ? (
            <div className="flex items-center gap-3 mt-2">
              <input
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name..."
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 font-serif text-2xl outline-none focus:border-secondary transition-colors text-foreground max-w-xs"
              />
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="bg-secondary text-white p-2 rounded-lg hover:scale-105 transition-all shadow-lg"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsEditingProfile(false)}
                disabled={savingProfile}
                className="bg-white/5 text-foreground p-2 rounded-lg hover:bg-white/10 transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-4 mt-2 max-w-max">
              <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-1">
                {profile?.display_name || "Rope Explorer"}
              </h2>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="opacity-0 group-hover:opacity-100 bg-white/5 p-2 rounded-full hover:bg-white/10 transition-all border border-white/10"
              >
                <Edit3 className="w-4 h-4 text-secondary" />
              </button>
            </div>
          )}

          <p className="text-sm font-medium text-foreground/60 mt-1">{userEmail}</p>
        </div>

        <div className="mt-12 flex flex-wrap gap-8 md:gap-16 relative z-10 pt-8 border-t border-white/10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              Saved Spaces
            </p>
            <p className="font-serif text-3xl md:text-4xl text-foreground mt-2">
              {savedStudios.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              Member Since
            </p>
            <p className="font-serif text-3xl md:text-4xl text-foreground mt-2">
              {profile?.created_at
                ? new Date(profile.created_at).getFullYear()
                : new Date().getFullYear()}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              Account Status
            </p>
            <p className="font-serif text-3xl md:text-4xl text-foreground mt-2 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_15px_rgba(226,114,91,0.8)]" />{" "}
              Verified
            </p>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2 mb-8">
          <Bookmark className="h-4 w-4" /> Saved Studios
        </h2>

        {savedStudios.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-12 text-center border-dashed">
            <Bookmark className="mx-auto h-8 w-8 text-foreground/30 mb-4" />
            <p className="text-foreground/70 font-medium">
              Your curated list of spaces will appear here.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
            >
              Explore Directory <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {savedStudios.map((studio) => (
                <motion.div
                  key={studio.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="aspect-[16/9] relative overflow-hidden bg-black/20">
                    {studio.studio_photos?.[0]?.url ? (
                      <img
                        src={studio.studio_photos[0].url}
                        alt={studio.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/30 text-xs font-bold uppercase tracking-widest">
                        No Logo
                      </div>
                    )}

                    <button
                      onClick={() => handleUnsave(studio.id)}
                      className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-background/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white transition-colors"
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
                      className="mt-6 w-full flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      View Space <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
