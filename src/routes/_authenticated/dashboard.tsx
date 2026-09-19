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

        {/* BUG FIX: Added the specific Delete button and laid it out cleanly next to Save */}
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
