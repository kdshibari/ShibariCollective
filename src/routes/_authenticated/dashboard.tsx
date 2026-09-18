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
      if (!session) return;
      
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
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>

        {isOwner ? <OwnerPortal userId={user.id} /> : <ParticipantPortal />}

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
    fetchStudios();
  }, [userId]);

  if (loading) {
    return <div className="animate-pulse h-64 bg-white/20 rounded-[2rem] border border-white/40"></div>;
  }

  // If they are currently editing a studio, show the Editor Overlay
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
  const [form, setForm] = useState({
    name: studio.name || "",
    description: studio.description || "",
    city: studio.city || "",
    website: studio.website || "",
    instagram: studio.socials?.instagram || "",
  });

  // Photo Management State
  const [existingPhotos, setExistingPhotos] = useState<any[]>(studio.studio_photos || []);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<{ file: File, preview: string }[]>([]);

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
      // 1. Update Core Data
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

      // 2. Delete Removed Photos
      if (deletedPhotoIds.length > 0) {
        const { error: delError } = await supabase.from("studio_photos").delete().in("id", deletedPhotoIds);
        if (delError) throw delError;
      }

      // 3. Upload New Photos
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
        <div className="w-9" /> {/* Spacer */}
      </div>

      <div className="space-y-6">
        {/* Core Info */}
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

        {/* Gallery Manager */}
        <div className="pt-6 border-t border-white/40">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2 mb-4">
            <Camera className="w-4 h-4" /> Manage Gallery
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Existing Photos */}
            {existingPhotos.map(photo => (
              <div key={photo.id} className="relative aspect-square group rounded-2xl overflow-hidden shadow-sm border border-white/40">
                <img src={photo.url} className="w-full h-full object-cover" alt="Studio" />
                <button onClick={() => removeExistingPhoto(photo.id)} className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {/* New Upload Previews */}
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

            {/* Upload Button */}
            <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-white/60 bg-white/20 hover:bg-white/40 rounded-2xl cursor-pointer transition-all">
              <UploadCloud className="w-6 h-6 text-secondary mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Add Photos</span>
              <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-8">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] disabled:opacity-50 transition-all"
          >
            {saving ? "Saving Changes..." : "Save Studio Updates"} <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------
// PARTICIPANT VIEW
// -----------------------------------------------------
function ParticipantPortal() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
        <Bookmark className="h-4 w-4" /> Saved Studios
      </h2>

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
    </motion.div>
  );
}
