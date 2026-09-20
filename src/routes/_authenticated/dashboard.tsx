import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Building, Bookmark, ArrowRight, PlusCircle, User, Edit3, MapPin, Camera, X, UploadCloud, Save, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      setUser(session.user);

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const isVerifiedOwner = roles?.some(r => r.role === "studio_owner" || r.role === "admin");
      
      const urlParams = new URLSearchParams(window.location.search);
      const intent = urlParams.get('intent');
      
      if (intent) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      if (intent === 'owner' && !isVerifiedOwner) {
         navigate({ to: "/submit", replace: true });
         return; 
      }

      setIsOwner(!!isVerifiedOwner);
      setLoading(false);
    }
    loadProfile();
  }, [navigate]);

  async function handleLogout() {
    localStorage.removeItem("shibari-studio-draft");
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-pulse text-secondary text-sm font-bold tracking-widest uppercase">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/40 border border-white/60 shadow-md backdrop-blur-md flex items-center justify-center">
              <User className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <h1 className="font-serif text-4xl text-foreground">Welcome Back</h1>
              <p className="text-sm font-medium text-foreground/60">{user?.email}</p>
            </div>
          </div>
        </div>

        {isOwner ? (
          <OwnerPortal userId={user?.id} />
        ) : (
          <ParticipantPortal userId={user?.id} userEmail={user?.email} />
        )}

      </div>
    </div>
  );
}

// -----------------------------------------------------
// STUDIO OWNER VIEW
// -----------------------------------------------------
function OwnerPortal({ userId }: { userId: string }) {
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStudio, setEditingStudio] = useState<any | null>(null);

  const fetchStudios = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("studios")
      .select("*, studio_photos(*)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    
    setStudios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchStudios();
  }, [userId]);

  if (loading) return <div className="animate-pulse h-64 bg-white/20 rounded-[2rem] border border-white/40"></div>;

  if (editingStudio) {
    return (
      <StudioEditor 
        studio={editingStudio} 
        onClose={() => setEditingStudio(null)} 
        onSuccess={() => {
          setEditingStudio(null);
          fetchStudios();
        }}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
          <Building className="h-4 w-4" /> Studio Management
        </h2>
        <Link to="/submit" className="text-xs font-bold uppercase tracking-widest text-foreground hover:text-secondary flex items-center gap-1 transition-colors">
          Add New <PlusCircle className="h-4 w-4" />
        </Link>
      </div>

      {studios.length === 0 ? (
        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 sm:p-12 text-center shadow-[0_20px_40px_-10px_rgba(78,44,35,0.1)]">
          <Building className="mx-auto h-12 w-12 text-foreground/30 mb-4" />
          <h3 className="font-serif text-3xl text-foreground">Your Portfolio is Empty</h3>
          <p className="mt-3 text-foreground/70 font-medium max-w-md mx-auto">
            You are a verified owner, but you haven't listed a studio yet. Curate your space to appear on the global map.
          </p>
          <Link to="/submit" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-8 py-3.5 text-sm font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
            Create Listing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {studios.map(studio => (
            <div key={studio.id} className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-xl transition-all group">
              <div className="aspect-[21/9] bg-white/50 relative overflow-hidden">
                {studio.studio_photos?.[0]?.url ? (
                  <img src={studio.studio_photos[0].url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/40 font-bold uppercase tracking-widest text-xs">No Cover Image</div>
                )}
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {studio.status}
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-serif text-2xl text-foreground truncate">{studio.name}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {studio.city}, {studio.country}
                </p>
                <button 
                  onClick={() => setEditingStudio(studio)}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-white/50 hover:bg-white/80 border border-white/60 rounded-full py-3 text-sm font-bold uppercase tracking-widest transition-all"
                >
                  Manage Studio <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// -----------------------------------------------------
// STUDIO EDITOR (INLINE MODAL)
// -----------------------------------------------------
function StudioEditor({ studio, onClose, onSuccess }: { studio: any, onClose: () => void, onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: studio.name || "",
    description: studio.description || "",
    city: studio.city || "",
    website: studio.website || "",
    instagram: studio.socials?.instagram || "",
  });

  const [existingPhotos, setExistingPhotos] = useState<any[]>(studio.studio_photos || []);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ file: File, preview: string }[]>([]);

  const handleDelete = async (studioId: string) => {
    setDeleting(true);
    const { error } = await supabase.from('studios').delete().eq('id', studioId);
    
    if (error) {
      toast.error("Failed to delete studio.");
      setDeleting(false);
    } else {
      toast.success("Studio permanently removed.");
      onSuccess(); 
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const mapped = selectedFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewPhotos(prev => [...prev, ...mapped]);
    e.target.value = '';
  };

  const removeExistingPhoto = (photoId: string) => {
    setDeletedPhotoIds(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("studios")
        .update({
          name: form.name,
          description: form.description,
          city: form.city,
          website: form.website || null,
          socials: { ...studio.socials, instagram: form.instagram || undefined }
        })
        .eq("id", studio.id);
      
      if (updateError) throw updateError;

      if (deletedPhotoIds.length > 0) {
        const { error: delError } = await supabase.from("studio_photos").delete().in("id", deletedPhotoIds);
        if (delError) throw delError;
      }

      if (newPhotos.length > 0) {
        toast.info(`Uploading ${newPhotos.length} new photos...`);
        const uploadPromises = newPhotos.map(async (photo, index) => {
          const fileExt = photo.file.name.split('.').pop();
          const fileName = `${studio.id}/${Date.now()}-${index}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage.from('studios').upload(fileName, photo.file);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('studios').getPublicUrl(fileName);
          return { studio_id: studio.id, url: publicUrl, position: existingPhotos.length + index };
        });

        const uploadedPhotos = await Promise.all(uploadPromises);
        const { error: insError } = await supabase.from("studio_photos").insert(uploadedPhotos);
        if (insError) throw insError;
      }

      toast.success("Studio successfully updated!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update studio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onClose} className="p-2 bg-white/50 rounded-full hover:bg-white/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-serif text-3xl text-foreground text-center flex-1">Edit Studio</h2>
        <div className="w-9" />
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 ml-2">Name</span>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 rounded-2xl border border-white/40 bg-white/50 px-5 py-3 text-sm font-medium outline-none focus:border-secondary" />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 ml-2">City</span>
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full mt-1 rounded-2xl border border-white/40 bg-white/50 px-5 py-3 text-sm font-medium outline-none focus:border-secondary" />
          </label>
        </div>
        
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 ml-2">Description</span>
          <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full mt-1 rounded-2xl border border-white/40 bg-white/50 px-5 py-3 text-sm font-medium outline-none focus:border-secondary resize-none" />
        </label>

        <div className="pt-6 border-t border-white/40">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2 mb-4">
            <Camera className="w-4 h-4" /> Manage Gallery
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {existingPhotos.map(photo => (
              <div key={photo.id} className="relative aspect-square group rounded-2xl overflow-hidden shadow-sm border border-white/40">
                <img src={photo.url} className="w-full h-full object-cover" alt="Studio" />
                <button onClick={() => removeExistingPhoto(photo.id)} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {newPhotos.map((photo, i) => (
              <div key={i} className="relative aspect-square group rounded-2xl overflow-hidden shadow-sm border-2 border-secondary/50">
                <img src={photo.preview} className="w-full h-full object-cover opacity-80" alt="New Upload" />
                <button onClick={() => removeNewPhoto(i)} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full hover:scale-110">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="bg-secondary text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">Pending</span>
                </div>
              </div>
            ))}

            <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-white/60 bg-white/20 hover:bg-white/40 rounded-2xl cursor-pointer transition-all">
              <UploadCloud className="w-6 h-6 text-secondary mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Add Photos</span>
              <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleSave} 
            disabled={saving || deleting}
            className="flex-1 flex items-center justify-center gap-2 bg-foreground text-background py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] disabled:opacity-50 transition-all"
          >
            {saving ? "Saving Changes..." : "Save Studio Updates"} <Save className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to permanently delete this studio? This cannot be undone.")) {
                handleDelete(studio.id);
              }
            }}
            disabled={saving || deleting}
            className="flex items-center justify-center gap-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white py-4 px-8 rounded-full font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

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
