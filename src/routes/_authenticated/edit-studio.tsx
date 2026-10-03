import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { CONTINENTS } from "@/lib/geo";
import { Info, ChevronRight, ChevronLeft, MapPin, Camera, Clock, CheckCircle2, UploadCloud, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/edit-studio")({
  head: () => ({
    meta: [{ title: "Edit Your Studio | Shibari Collective" }],
  }),
  component: EditStudioPage,
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_OPTIONS = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
  "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
  "24:00"
];

interface PhotoState {
  file: File;
  preview: string;
}

interface ExistingPhoto {
  id: string;
  url: string;
  position: number;
}

// Must match submit.tsx. Previously submit required 5 gallery photos and edit only 4.
const MIN_GALLERY_PHOTOS = 5;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const filterImages = (files: File[]) => {
  const ok = files.filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_BYTES);
  if (ok.length < files.length) toast.error("Some files were skipped: only images up to 10 MB are allowed.");
  return ok;
};

const extOf = (file: File) => {
  const fromName = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  return /^[a-z0-9]{2,5}$/.test(fromName) ? fromName : (file.type.split("/")[1] || "jpg");
};

// Turns a public URL back into its storage path so replaced photos can be deleted from the bucket.
const storagePathFromUrl = (url: string) => {
  const marker = "/object/public/studios/";
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
};

const formatUrl = (url: string) => {
  let u = url.trim();
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 30 : -30, opacity: 0 })
};

function EditStudioPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [studioId, setStudioId] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);

  // Form State
  const [form, setForm] = useState({
    name: "", description: "", continent: "", country: "", city: "", address: "",
    email: "", phone: "", website: "", instagram: "", facebook: "", other: "", fetlife: "",
  });
  const [hours, setHours] = useState<Record<string, string>>({});

  // Media State
  const [existingLogo, setExistingLogo] = useState<ExistingPhoto | null>(null);
  const [existingGallery, setExistingGallery] = useState<ExistingPhoto[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [deletedPhotoUrls, setDeletedPhotoUrls] = useState<string[]>([]);
  
  const [newLogo, setNewLogo] = useState<PhotoState | null>(null);
  const [newGallery, setNewGallery] = useState<PhotoState[]>([]);

  useEffect(() => {
    async function loadStudio() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/auth" });
        return;
      }

      const { data: studio, error } = await supabase
        .from("studios")
        .select("*, studio_photos(*)")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!studio || error) {
        toast.error("No studio found. Please submit a studio first.");
        navigate({ to: "/submit" });
        return;
      }

      setStudioId(studio.id);
      setForm({
        name: studio.name || "",
        description: studio.description || "",
        continent: studio.continent || "",
        country: studio.country || "",
        city: studio.city || "",
        address: studio.address || "",
        email: studio.email || "",
        phone: studio.phone || "",
        website: studio.website || "",
        instagram: studio.socials?.instagram || "",
        facebook: studio.socials?.facebook || "",
        other: studio.socials?.other || "",
        fetlife: studio.socials?.fetlife || "",
      });
      setHours(studio.hours || {});

      if (studio.studio_photos && studio.studio_photos.length > 0) {
        const sorted = [...studio.studio_photos].sort((a: any, b: any) => a.position - b.position);
        setExistingLogo(sorted[0]);
        if (sorted.length > 1) {
          setExistingGallery(sorted.slice(1));
        }
      }
      setLoading(false);
    }
    loadStudio();
  }, [navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saving) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saving]);

  const validateStep = (currentStep: number) => {
    try {
      if (currentStep === 1) {
        z.object({
          name: z.string().trim().min(2, "Studio name must be at least 2 characters.").max(120),
          description: z.string().max(2000).optional(),
        }).parse({ name: form.name, description: form.description });
      } else if (currentStep === 2) {
        z.object({
          continent: z.string().min(1, "Please select a continent."),
          country: z.string().trim().min(2, "Country is required.").max(80),
          city: z.string().trim().min(1, "City is required.").max(80),
          address: z.string().max(200).optional(),
        }).parse({ continent: form.continent, country: form.country, city: form.city, address: form.address });
      } else if (currentStep === 3) {
        let websiteUrl = formatUrl(form.website);
        z.object({
          email: z.string().trim().email("Invalid email format.").max(255).optional().or(z.literal("")),
          phone: z.string().max(50).optional(),
          website: z.string().url("Website must be a valid URL.").max(255).optional().or(z.literal("")),
          instagram: z.string().max(255).optional(),
          facebook: z.string().max(255).optional(),
          fetlife: z.string().max(255).optional(),
          other: z.string().url("Other link must be a valid URL.").max(255).optional().or(z.literal("")),
        }).parse({
          email: form.email,
          phone: form.phone,
          website: websiteUrl,
          instagram: form.instagram,
          facebook: form.facebook,
          fetlife: form.fetlife,
          other: formatUrl(form.other),
        });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0]?.message ?? "Please check the form.");
      }
      return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setDirection(-1);
    setStep(step - 1);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const [file] = filterImages([e.target.files[0]]);
    e.target.value = '';
    if (!file) return;
    setNewLogo({ file, preview: URL.createObjectURL(file) });
    if (existingLogo) {
      setDeletedPhotoIds(prev => [...prev, existingLogo.id]);
      setDeletedPhotoUrls(prev => [...prev, existingLogo.url]);
      setExistingLogo(null);
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = filterImages(Array.from(e.target.files));
    const photos = selectedFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewGallery(prev => [...prev, ...photos]);
    e.target.value = '';
  };

  const removeExistingGalleryPhoto = (photo: ExistingPhoto) => {
    setDeletedPhotoIds(prev => [...prev, photo.id]);
    setDeletedPhotoUrls(prev => [...prev, photo.url]);
    setExistingGallery(prev => prev.filter(p => p.id !== photo.id));
  };

  const removeNewGalleryPhoto = (indexToRemove: number) => {
    setNewGallery(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  async function onSubmit() {
    if (saving) return;
    const totalPhotos = existingGallery.length + newGallery.length;
    if (!existingLogo && !newLogo) return toast.error("A studio logo is required.");
    if (totalPhotos < MIN_GALLERY_PHOTOS) return toast.error(`Minimum of ${MIN_GALLERY_PHOTOS} gallery photos required. You have ${totalPhotos}.`);

    setSaving(true);
    setUploadProgress("Applying updates...");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !studioId) {
      // BUG FIX: previously returned with `saving` stuck on true.
      setSaving(false);
      setUploadProgress("");
      toast.error("Your session expired. Please sign in again.");
      return;
    }

    const uploadedPaths: string[] = [];

    try {
      // 1. Update text data
      const { error: dbError } = await supabase
        .from("studios")
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          continent: form.continent,
          country: form.country.trim(),
          city: form.city.trim(),
          address: form.address.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          website: formatUrl(form.website) || null,
          hours,
          socials: {
            instagram: form.instagram.trim() || undefined,
            facebook: form.facebook.trim() || undefined,
            other: formatUrl(form.other) || undefined,
            fetlife: form.fetlife.trim() || undefined,
          },
        })
        .eq("id", studioId);

      if (dbError) throw new Error("Failed to update studio details.");

      // 2. Upload new media FIRST.
      // BUG FIX: the old code deleted the removed photos before uploading the new ones,
      // so a failed upload left the studio with fewer photos than the minimum (and no way back).
      setUploadProgress("Syncing new media...");
      const timestamp = Date.now();
      const stagingDir = `uploads/${userData.user.id}/${timestamp}`;
      const photosToInsert: { studio_id: string; url: string; position: number }[] = [];

      if (newLogo) {
        const path = `${stagingDir}/logo_update.${extOf(newLogo.file)}`;
        const { error: uploadError } = await supabase.storage.from('studios').upload(path, newLogo.file, { upsert: false, contentType: newLogo.file.type });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        const { data: { publicUrl } } = supabase.storage.from('studios').getPublicUrl(path);
        photosToInsert.push({ studio_id: studioId, url: publicUrl, position: 0 });
      }

      // BUG FIX: new photos used to get position existingGallery.length + i + 1, but existing
      // photos keep their OLD positions (with gaps after deletions), so positions collided and
      // the gallery order shuffled. Everything is renumbered contiguously below.
      for (let i = 0; i < newGallery.length; i++) {
        const file = newGallery[i].file;
        const path = `${stagingDir}/gallery_update_${i}.${extOf(file)}`;
        const { error: uploadError } = await supabase.storage.from('studios').upload(path, file, { upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        const { data: { publicUrl } } = supabase.storage.from('studios').getPublicUrl(path);
        photosToInsert.push({ studio_id: studioId, url: publicUrl, position: existingGallery.length + i + 1 });
      }

      if (photosToInsert.length > 0) {
        const { error: pErr } = await supabase.from("studio_photos").insert(photosToInsert);
        if (pErr) throw pErr;
      }

      // 3. Renumber kept gallery photos 1..n so they sit before the newly added ones.
      for (let i = 0; i < existingGallery.length; i++) {
        const photo = existingGallery[i];
        if (photo.position !== i + 1) {
          const { error: posErr } = await supabase.from("studio_photos").update({ position: i + 1 }).eq("id", photo.id);
          if (posErr) throw posErr;
        }
      }

      // 4. Only now remove the photos the owner deleted (rows, then files in the bucket).
      if (deletedPhotoIds.length > 0) {
        const { error: delErr } = await supabase.from("studio_photos").delete().in("id", deletedPhotoIds);
        if (delErr) throw delErr;
        const paths = deletedPhotoUrls.map(storagePathFromUrl).filter((p): p is string => !!p);
        if (paths.length > 0) {
          // Best effort: a leftover file is harmless, so don't fail the whole save over it.
          await supabase.storage.from('studios').remove(paths);
        }
      }

      toast.success("Studio successfully updated!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('studios').remove(uploadedPaths);
      }
      toast.error("Update failed: " + (err?.message ?? "Unknown error"));
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-secondary" />
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/50">Retrieving Studio Data...</p>
        </motion.div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: "The Basics", icon: <Info className="w-5 h-5" /> },
    { id: 2, title: "Location", icon: <MapPin className="w-5 h-5" /> },
    { id: 3, title: "Details", icon: <Clock className="w-5 h-5" /> },
    { id: 4, title: "Gallery", icon: <Camera className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-40 pt-12 sm:pt-20">
      <div className="mx-auto max-w-3xl px-4">
        
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.4em] text-secondary font-bold mb-4">Studio Management</p>
          <h1 className="font-serif text-5xl sm:text-6xl text-foreground">Edit Your Space</h1>
          
          <div className="mt-12 flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10 rounded-full" />
            <div className="absolute top-1/2 left-0 h-1 bg-secondary -z-10 rounded-full transition-all duration-700 ease-out" style={{ width: `${((step - 1) / 3) * 100}%` }} />
            
            {steps.map((s) => (
              <div key={s.id} className={`flex flex-col items-center gap-2 transition-all duration-500 ${step >= s.id ? 'text-secondary' : 'text-foreground/30'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-all duration-500 ${step >= s.id ? 'bg-secondary text-white border-secondary shadow-[0_0_15px_rgba(139,58,54,0.4)] scale-110' : 'bg-white/5 border-white/10'}`}>
                  {s.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl min-h-[500px] overflow-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>
            
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }} className="space-y-6">
                <h2 className="font-serif text-3xl text-foreground mb-8">Update the basics</h2>
                <Input label="Official Studio Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} placeholder="e.g. The Rope Den" required />
                <Textarea label="Studio Description" value={form.description} onChange={(v: string) => setForm({ ...form, description: v })} placeholder="Describe the atmosphere, equipment, and ethos of your space..." />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }} className="space-y-6">
                <h2 className="font-serif text-3xl text-foreground mb-8">Location Updates</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Select label="Continent" value={form.continent} onChange={(v: string) => setForm({ ...form, continent: v })} options={CONTINENTS as unknown as string[]} required />
                  <Input label="Country" value={form.country} onChange={(v: string) => setForm({ ...form, country: v })} placeholder="e.g. Germany" required />
                </div>
                <Input label="City" value={form.city} onChange={(v: string) => setForm({ ...form, city: v })} placeholder="e.g. Berlin" required />
                <Input label="Street Address (Optional)" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} placeholder="Keep blank if private" />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }} className="space-y-8">
                <h2 className="font-serif text-3xl text-foreground mb-8">Operating Hours & Contact</h2>
                
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary">Weekly Schedule</h3>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {DAYS.map((d) => (
                      <TimeRangeRow key={d} day={d} value={hours[d] ?? ""} onChange={(val) => setHours({ ...hours, [d]: val })} />
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary">Digital Presence</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input label="Public Email" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} type="email" placeholder="hello@studio.com" />
                    <Input label="Phone Number" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} placeholder="+1 234 567 890" />
                    <Input label="Website" value={form.website} onChange={(v: string) => setForm({ ...form, website: v })} placeholder="studio.com" />
                    <Input label="Instagram" value={form.instagram} onChange={(v: string) => setForm({ ...form, instagram: v })} placeholder="@studio" />
                    <Input label="Facebook" value={form.facebook} onChange={(v: string) => setForm({ ...form, facebook: v })} placeholder="facebook.com/studio" />
                    <Input label="FetLife" value={form.fetlife} onChange={(v: string) => setForm({ ...form, fetlife: v })} placeholder="fetlife.com/users/..." />
                    <Input label="Other Link" value={form.other} onChange={(v: string) => setForm({ ...form, other: v })} placeholder="booking page, linktree..." />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeInOut" }} className="space-y-8">
                <h2 className="font-serif text-3xl text-foreground mb-2">Visual Identity & Gallery</h2>
                
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary">Studio Logo</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Required</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border border-white/10 shadow-xl bg-black/20 shrink-0">
                      {newLogo ? (
                        <>
                          <img src={newLogo.preview} className="w-full h-full object-cover" alt="New Logo Preview" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white cursor-pointer hover:text-secondary transition-colors">
                              Replace
                              <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                            </label>
                          </div>
                        </>
                      ) : existingLogo ? (
                        <>
                          <img src={existingLogo.url} className="w-full h-full object-cover" alt="Existing Studio Logo" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white cursor-pointer hover:text-secondary transition-colors">
                              Replace
                              <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                          <UploadCloud className="w-6 h-6 text-foreground/50 mb-1" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/50 text-center px-2">Upload Logo</span>
                          <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary">Studio Gallery</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">{existingGallery.length + newGallery.length} / {MIN_GALLERY_PHOTOS} Min</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* Render Existing Gallery Photos */}
                    {existingGallery.map((photo) => (
                      <div key={photo.id} className="relative aspect-[4/5] group overflow-hidden rounded-2xl shadow-sm border border-white/10">
                        <img src={photo.url} alt="Gallery item" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button type="button" onClick={() => removeExistingGalleryPhoto(photo)} className="bg-rose-500/90 text-white p-3 rounded-full hover:bg-rose-500 hover:scale-110 active:scale-95 transition-all shadow-xl">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Render New Unsaved Gallery Photos */}
                    {newGallery.map((photo, index) => (
                      <div key={`new-${index}`} className="relative aspect-[4/5] group overflow-hidden rounded-2xl shadow-sm border border-secondary/50">
                        <img src={photo.preview} alt={`New Preview ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80" />
                        <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button type="button" onClick={() => removeNewGalleryPhoto(index)} className="bg-rose-500/90 text-white p-3 rounded-full hover:bg-rose-500 hover:scale-110 active:scale-95 transition-all shadow-xl">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <label className="flex flex-col items-center justify-center aspect-[4/5] border border-dashed border-white/20 bg-white/5 hover:bg-white/10 active:scale-[0.98] rounded-2xl cursor-pointer transition-all">
                      <UploadCloud className="w-6 h-6 text-secondary mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Add Photos</span>
                      <input type="file" className="hidden" multiple accept="image/*" onChange={handleGallerySelect} />
                    </label>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-auto sm:w-full sm:max-w-3xl z-50">
          <div className="bg-white/10 backdrop-blur-3xl border border-white/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] rounded-full p-3 flex items-center justify-between">
            <button
              onClick={handlePrevStep}
              disabled={step === 1 || saving}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-foreground/60 hover:bg-white/10 hover:text-foreground active:scale-95 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            
            {step < 4 ? (
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-secondary text-white text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(139,58,54,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all min-w-[200px]"
              >
                {saving ? uploadProgress || "Applying..." : "Update Studio"}
                {!saving && <CheckCircle2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Same helper components used in submit.tsx
function TimeRangeRow({ day, value, onChange }: { day: string, value: string, onChange: (v: string) => void }) {
  const isOpen = value !== "" && value !== "Closed";
  const [openTime, closeTime] = isOpen ? value.split("-") : ["10:00", "22:00"];

  return (
    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 transition-colors focus-within:border-secondary/50">
      <div className="w-20 sm:w-24 flex items-center gap-2 shrink-0">
        <input 
          type="checkbox" 
          checked={isOpen} 
          onChange={(e) => onChange(e.target.checked ? `${openTime}-${closeTime}` : "Closed")} 
          className="accent-secondary w-4 h-4 cursor-pointer" 
        />
        <label className="text-xs font-bold uppercase tracking-widest text-foreground/70">{day.substring(0,3)}</label>
      </div>
      {isOpen ? (
        <div className="flex flex-1 items-center gap-2">
          <select 
            value={openTime} 
            onChange={e => onChange(`${e.target.value}-${closeTime}`)} 
            className="flex-1 bg-white/10 rounded-lg text-xs p-2.5 text-foreground outline-none border border-transparent cursor-pointer appearance-none text-center focus:border-secondary transition-colors"
          >
            {TIME_OPTIONS.map(t => <option key={`open-${t}`} value={t} className="bg-background text-foreground">{t}</option>)}
          </select>
          <span className="text-[10px] text-foreground/40 font-bold uppercase">to</span>
          <select 
            value={closeTime} 
            onChange={e => onChange(`${openTime}-${e.target.value}`)} 
            className="flex-1 bg-white/10 rounded-lg text-xs p-2.5 text-foreground outline-none border border-transparent cursor-pointer appearance-none text-center focus:border-secondary transition-colors"
          >
            {TIME_OPTIONS.map(t => <option key={`close-${t}`} value={t} className="bg-background text-foreground">{t}</option>)}
          </select>
        </div>
      ) : (
        <div className="flex-1 text-xs font-bold uppercase tracking-widest text-foreground/30 px-2 text-center">Closed</div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, placeholder }: any) {
  return (
    <label className="block group">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-secondary transition-colors">
        {label} {required && <span className="text-secondary">*</span>}
      </span>
      <input
        type={type} required={required} value={value || ""} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all shadow-inner placeholder:text-foreground/30"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }: any) {
  return (
    <label className="block group">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-secondary transition-colors">{label}</span>
      <textarea
        rows={5} value={value || ""} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all shadow-inner placeholder:text-foreground/30 resize-none"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, required }: any) {
  return (
    <label className="block group">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-secondary transition-colors">
        {label} {required && <span className="text-secondary">*</span>}
      </span>
      <select
        required={required} value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all shadow-inner appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238B3A36' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1em' }}
      >
        <option value="" disabled className="bg-background text-foreground">Select...</option>
        {options.map((o: string) => <option key={o} value={o} className="bg-background text-foreground">{o}</option>)}
      </select>
    </label>
  );
}
