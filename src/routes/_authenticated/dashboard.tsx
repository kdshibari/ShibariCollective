// Inside DashboardPage, update your return statement to pass the user.id:
// {isOwner ? <OwnerPortal userId={user.id} /> : <ParticipantPortal userId={user.id} />}

// -----------------------------------------------------
// PARTICIPANT VIEW
// -----------------------------------------------------
function ParticipantPortal({ userId }: { userId: string }) {
  const [savedStudios, setSavedStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSavedStudios() {
      // Relational query: Fetch saved_studios and join the actual studio & photo data
      const { data, error } = await supabase
        .from("saved_studios")
        .select(`
          studio_id,
          studios (
            id, name, city, country, status,
            studio_photos (url)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Clean up the nested Supabase response for easy mapping
        const formattedStudios = data
          .filter(record => record.studios) // Ensure the studio wasn't deleted by the owner
          .map(record => record.studios);
        setSavedStudios(formattedStudios);
      }
      setLoading(false);
    }
    fetchSavedStudios();
  }, [userId]);

  const handleUnsave = async (studioId: string) => {
    // Optimistic UI: Instantly remove the card from the screen for a snappy feel
    setSavedStudios(prev => prev.filter(studio => studio.id !== studioId));
    toast.success("Removed from saved spaces.");

    // Background Database Sync
    const { error } = await supabase
      .from("saved_studios")
      .delete()
      .match({ user_id: userId, studio_id: studioId });

    if (error) {
      toast.error("Network error. Could not remove save.");
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-white/20 rounded-[2rem] border border-white/40"></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
        <Bookmark className="h-4 w-4" /> Saved Studios
      </h2>

      {savedStudios.length === 0 ? (
        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 sm:p-12 text-center shadow-[0_20px_40px_-10px_rgba(78,44,35,0.1)]">
          <Bookmark className="mx-auto h-12 w-12 text-foreground/30 mb-4" />
          <h3 className="font-serif text-3xl text-foreground">No Saved Spaces</h3>
          <p className="mt-3 text-foreground/70 font-medium max-w-md mx-auto">
            Keep track of studios you'd like to visit. Browse the collective and save them directly from the directory.
          </p>
          <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-8 py-3.5 text-sm font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
            Explore Map <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  
                  {/* Instantly Remove Bookmark */}
                  <button
                    onClick={() => handleUnsave(studio.id)}
                    className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-background/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white transition-colors"
                    aria-label="Remove saved studio"
                  >
                    <Bookmark className="h-5 w-5 fill-secondary text-secondary hover:fill-white hover:text-white transition-colors" />
                  </button>
                </div>

                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-xl text-foreground truncate">{studio.name}</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {studio.city}, {studio.country}
                    </p>
                  </div>
                  <Link 
                    to="/studios/$id" 
                    params={{ id: studio.id }}
                    className="h-10 w-10 rounded-full bg-white/50 hover:bg-foreground hover:text-background flex items-center justify-center transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upgrade Call to Action */}
      <div className="mt-12 pt-8 border-t border-white/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/20 rounded-[2rem] p-6 border border-white/40">
          <div>
            <h4 className="font-serif text-xl text-foreground">Are you a Studio Owner?</h4>
            <p className="text-sm text-foreground/60 font-medium mt-1">Claim your profile and list your space on the global map.</p>
          </div>
          <Link to="/submit" className="shrink-0 rounded-full border border-foreground/20 bg-transparent hover:bg-white/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-all">
            Upgrade Account
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
