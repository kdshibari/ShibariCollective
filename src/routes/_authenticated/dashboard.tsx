// -----------------------------------------------------
// PARTICIPANT VIEW
// -----------------------------------------------------
function ParticipantPortal({ userId, userEmail }: { userId: string, userEmail: string }) {
  const [savedStudios, setSavedStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSavedStudios() {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from("saved_studios")
        .select(`
          studio_id,
          created_at,
          studios (
            id, name, city, country, status,
            studio_photos (url)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const formattedStudios = data
          .filter(record => record.studios) 
          .map(record => ({ ...record.studios, saved_at: record.created_at }));
        setSavedStudios(formattedStudios);
      }
      setLoading(false);
    }
    fetchSavedStudios();
  }, [userId]);

  const handleUnsave = async (studioId: string) => {
    setSavedStudios(prev => prev.filter(studio => studio.id !== studioId));
    toast.success("Removed from saved spaces.");

    await supabase
      .from("saved_studios")
      .delete()
      .match({ user_id: userId, studio_id: studioId });
  };

  if (loading) return <div className="animate-pulse h-64 bg-white/20 rounded-[2rem] border border-white/40"></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      
      {/* PREMIUM PARTICIPANT IDENTITY CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <User className="w-32 h-32" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Participant Profile</p>
          <h2 className="font-serif text-3xl text-foreground mb-1">Rope Journey</h2>
          <p className="text-sm font-medium text-foreground/60">{userEmail}</p>
          
          <div className="mt-8 flex gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Saved Spaces</p>
              <p className="font-serif text-3xl text-foreground mt-1">{savedStudios.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Account Status</p>
              <p className="font-serif text-xl text-foreground mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span> Verified
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-neutral-900 rounded-[2rem] p-8 text-white flex flex-col justify-between shadow-xl">
          <div>
            <Building className="w-6 h-6 text-white/50 mb-4" />
            <h3 className="font-serif text-2xl">Studio Owner?</h3>
            <p className="text-xs font-medium text-white/60 mt-2 leading-relaxed">
              Claim your profile to list your space on the global map and manage your gallery.
            </p>
          </div>
          <Link to="/submit" className="mt-6 w-full rounded-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest text-center hover:bg-white/90 transition-colors">
            Upgrade Account
          </Link>
        </div>
      </div>

      <div className="pt-8 border-t border-white/20">
        <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2 mb-8">
          <Bookmark className="h-4 w-4" /> Saved Directory
        </h2>

        {savedStudios.length === 0 ? (
          <div className="bg-white/20 backdrop-blur-xl border border-white/40 rounded-[2rem] p-12 text-center border-dashed">
            <Bookmark className="mx-auto h-8 w-8 text-foreground/30 mb-4" />
            <p className="text-foreground/70 font-medium">Your curated list of spaces will appear here.</p>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-xs font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
              Explore Map <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {savedStudios.map(studio => (
                <motion.div 
                  key={studio.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="group relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="aspect-[16/9] relative overflow-hidden bg-black/20">
                    {studio.studio_photos?.[0]?.url ? (
                      <img src={studio.studio_photos[0].url} alt={studio.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/30 text-xs font-bold uppercase tracking-widest">No Cover</div>
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
                      className="mt-6 w-full flex items-center justify-center gap-2 rounded-full border border-foreground/20 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
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
