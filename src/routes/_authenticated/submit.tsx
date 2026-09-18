import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { grantStudioOwnerRole } from "@/integrations/supabase/server";
import { CONTINENTS } from "@/lib/geo";
import { Info, ChevronRight, ChevronLeft, MapPin, Camera, Clock, CheckCircle2, UploadCloud, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/submit")({
  head: () => ({
    meta: [
      { title: "Submit your studio — Shibari Collective" },
      { name: "description", content: "Submit your Shibari studio to be featured in the worldwide directory." },
    ],
  }),
  component: SubmitPage,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DRAFT_KEY = "shibari-studio-draft";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(2000).optional(),
  continent: z.string().min(1),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(1).max(80),
  address: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().url().max(255).optional(),
  instagram: z.string().max(255).optional(),
  facebook: z.string().max(255).optional(),
  other: z.string().max(255).optional(),
});

interface PhotoState {
  file: File;
  preview: string;
}

function SubmitPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [roles, setRoles] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  
  // Local File State
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [hours, setHours] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState({
    name: "", description: "", continent: "", country: "", city: "", address: "",
    latitude: "", longitude: "", email: "", phone: "", website: "", instagram: "", facebook: "", other: "",
  });

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.form) setForm(parsed.form);
        if (parsed.hours) setHours(parsed.hours);
        // We do not reload photos from local storage because File objects cannot be serialized safely
      } catch (e) { /* ignore invalid drafts */ }
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rs } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      setRoles((rs ?? []).map((r) => r.role));
      setChecking(false);
    });
  }, []);

  useEffect(() => {
    if (!checking) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, hours }));
    }
  }, [form, hours, checking]);

  async function becomeStudioOwner() {
    try {
      await grantStudioOwnerRole();
      await supabase.auth.refreshSession();
      setRoles([...roles, "studio_owner"]);
      toast.success("You are now a verified Studio Owner.");
    } catch (error: any) {
      toast.error(error.message || "Failed to elevate permissions");
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    const newPhotos = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    
    // Reset the input so the user can select the same file again if they delete and re-add it
    e.target.value = '';
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  async function onSubmit() {
    if (photos.length < 5) {
      toast.error(`You have selected ${photos.length} photos. A minimum of 5 is required.`);
      return;
    }
    
    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      website: form.website.trim() || undefined,
      address: form.address.trim() || undefined,
      instagram: form.instagram.trim() || undefined,
      facebook: form.facebook.trim() || undefined,
      other: form.other.trim() || undefined,
      description: form.description.trim() || undefined,
    };
    
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please check your form entries.");
      return;
    }

    setSaving(true);
    setUploadProgress("Initializing profile...");
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // 1. Create the studio record
    const { data: inserted, error } = await supabase
      .from("studios")
      .insert({
        owner_id: userData.user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        continent: parsed.data.continent,
        country: parsed.data.country,
        city: parsed.data.city,
        address: parsed.data.address || null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        website: parsed.data.website || null,
        hours,
        socials: {
          instagram: parsed.data.instagram || undefined,
          facebook: parsed.data.facebook || undefined,
          other: parsed.data.other || undefined,
        },
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setSaving(false);
      setUploadProgress("");
      toast.error(error?.message ?? "Failed to create studio. Please check permissions.");
      return;
    }

    // 2. Upload images to Supabase Storage concurrently
    setUploadProgress("Processing images...");
    try {
      const uploadPromises = photos.map(async (photo, index) => {
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${inserted.id}/${Date.now()}-${index}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('studios')
          .upload(fileName, photo.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('studios')
          .getPublicUrl(fileName);

        return { studio_id: inserted.id, url: publicUrl, position: index };
      });

      const uploadedPhotos = await Promise.all(uploadPromises);

      // 3. Link uploaded image URLs to the studio in the database
      setUploadProgress("Finalizing listing...");
      const { error: pErr } = await supabase.from("studio_photos").insert(uploadedPhotos);
      
      if (pErr) throw pErr;

    } catch (err: any) {
      setSaving(false);
      setUploadProgress("");
      toast.error("Studio created, but image uploads failed: " + err.message);
      navigate({ to: "/studios/$id", params: { id: inserted.id } });
      return;
    }

    setSaving(false);
    setUploadProgress("");
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Studio successfully published!");
    navigate({ to: "/studios/$id", params: { id: inserted.id } });
  }

  if (checking) return <div className="flex h-screen items-center justify-center text-secondary tracking-widest uppercase text-sm font-bold animate-pulse">Initializing Secure Portal...</div>;

  if (!roles.includes("studio_owner") && !roles.includes("admin")) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-10 max-w-lg text-center shadow-[0_30px_60px_-15px_rgba(78,44,35,0.2)]">
          <CheckCircle2 className="mx-auto h-16 w-16 text-secondary mb-6" />
          <h1 className="font-serif text-4xl text-foreground">Claim Your Space</h1>
          <p className="mt-4 text-foreground/70 font-medium">
            To maintain the integrity of the collective, only verified owners can list a studio. Verification is instant and free.
          </p>
          <button
            onClick={becomeStudioOwner}
            className="mt-8 w-full rounded-full bg-secondary px-6 py-4 text-sm font-bold uppercase tracking-widest text-secondary-foreground shadow-lg hover:scale-[1.02] transition-transform"
          >
            I own or represent a studio
          </button>
          <Link to="/" className="mt-6 inline-block text-sm font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors">Return Home</Link>
        </div>
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
          <p className="text-xs uppercase tracking-[0.4em] text-secondary font-bold mb-4">Studio Submission</p>
          <h1 className="font-serif text-5xl sm:text-6xl text-foreground">Curate Your Space</h1>
          
          <div className="mt-12 flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/30 -z-10 rounded-full" />
            <div className="absolute top-1/2 left-0 h-1 bg-secondary -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }} />
            
            {steps.map((s) => (
              <div key={s.id} className={`flex flex-col items-center gap-2 transition-all duration-500 ${step >= s.id ? 'text-secondary' : 'text-foreground/40'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-all duration-500 ${step >= s.id ? 'bg-secondary text-white border-secondary shadow-lg scale-110' : 'bg-white/40 border-white/50'}`}>
                  {s.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_30px_60px_-15px_rgba(78,44,35,0.15)] min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="font-serif text-3xl text-foreground mb-8">Let's start with the basics</h2>
                <Input label="Official Studio Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} placeholder="e.g. The Rope Den" required />
                <Textarea label="Studio Description (Optional but recommended)" value={form.description} onChange={(v: string) => setForm({ ...form, description: v })} placeholder="Describe the atmosphere, equipment, and ethos of your space..." />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="font-serif text-3xl text-foreground mb-2">Where are you located?</h2>
                <p className="text-sm text-foreground/60 font-medium mb-8">Coordinates are required to appear on the global proximity map.</p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Select label="Continent" value={form.continent} onChange={(v: string) => setForm({ ...form, continent: v })} options={CONTINENTS as unknown as string[]} required />
                  <Input label="Country" value={form.country} onChange={(v: string) => setForm({ ...form, country: v })} placeholder="e.g. Germany" required />
                </div>
                <Input label="City" value={form.city} onChange={(v: string) => setForm({ ...form, city: v })} placeholder="e.g. Berlin" required />
                <Input label="Street Address (Optional)" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} placeholder="Keep blank if private" />
                <div className="grid gap-6 sm:grid-cols-2 p-4 bg-white/30 rounded-2xl border border-white/50">
                  <Input label="Latitude" value={form.latitude} onChange={(v: string) => setForm({ ...form, latitude: v })} type="number" step="any" placeholder="e.g. 52.5200" />
                  <Input label="Longitude" value={form.longitude} onChange={(v: string) => setForm({ ...form, longitude: v })} type="number" step="any" placeholder="e.g. 13.4050" />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <h2 className="font-serif text-3xl text-foreground mb-8">Operating Hours & Contact</h2>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Weekly Schedule</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {DAYS.map((d) => (
                      <div key={d} className="flex items-center gap-3 bg-white/30 p-2 rounded-xl border border-white/50">
                        <label className="w-24 text-xs font-bold text-foreground/70 pl-2">{d.substring(0,3)}</label>
                        <input
                          placeholder="10:00 - 22:00"
                          value={hours[d] ?? ""}
                          onChange={(e) => setHours({ ...hours, [d]: e.target.value })}
                          className="flex-1 bg-transparent border-0 text-sm outline-none font-medium placeholder:text-foreground/30 focus:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 pt-6 border-t border-white/40">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Digital Presence</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Input label="Public Email" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} type="email" placeholder="hello@studio.com" />
                    <Input label="Phone Number" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} placeholder="+1 234 567 890" />
                    <Input label="Website" value={form.website} onChange={(v: string) => setForm({ ...form, website: v })} type="url" placeholder="https://..." />
                    <Input label="Instagram" value={form.instagram} onChange={(v: string) => setForm({ ...form, instagram: v })} placeholder="@studio" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="font-serif text-3xl text-foreground mb-2">Build Your Gallery</h2>
                <div className="flex justify-between items-end mb-8">
                  <p className="text-sm text-foreground/60 font-medium max-w-sm">
                    Upload directly from your device. Minimum 5 photos required to ensure directory standards.
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary">
                    {photos.length} / 5 Min
                  </p>
                </div>
                
                {/* Premium Native File Uploader */}
                <div className="space-y-6">
                  <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/60 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-[2rem] cursor-pointer transition-all hover:scale-[1.01]">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-10 h-10 text-secondary mb-3" />
                      <p className="mb-2 text-sm font-bold text-foreground">Tap to select or drop images</p>
                      <p className="text-xs text-foreground/60 font-medium">JPEG, PNG or WEBP (Max 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>

                  {/* Image Preview Grid */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-white/20 rounded-[2rem] border border-white/30">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square group overflow-hidden rounded-2xl shadow-sm">
                          <img 
                            src={photo.preview} 
                            alt={`Preview ${index}`} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <button 
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="bg-secondary/90 text-white p-3 rounded-full hover:bg-secondary hover:scale-110 transition-all shadow-xl"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-auto sm:w-full sm:max-w-3xl z-50">
          <div className="bg-white/80 backdrop-blur-3xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(78,44,35,0.3)] rounded-full p-3 flex items-center justify-between">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1 || saving}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest text-foreground/60 hover:bg-white/50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-foreground text-background text-sm font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-secondary text-white text-sm font-bold uppercase tracking-widest shadow-lg hover:scale-105 disabled:opacity-50 transition-all min-w-[200px]"
              >
                {saving ? uploadProgress || "Publishing..." : "Publish Studio"} 
                {!saving && <CheckCircle2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// PREMIUM COMPONENTS
function Input({ label, value, onChange, type = "text", required, step, placeholder }: any) {
  return (
    <label className="block group">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-secondary transition-colors">
        {label} {required && <span className="text-secondary">*</span>}
      </span>
      <input
        type={type} step={step} required={required} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/40 bg-white/40 backdrop-blur-sm px-5 py-4 text-sm font-medium outline-none focus:border-white/80 focus:bg-white/70 transition-all shadow-sm placeholder:text-foreground/30"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }: any) {
  return (
    <label className="block group">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-secondary transition-colors">{label}</span>
      <textarea
        rows={5} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/40 bg-white/40 backdrop-blur-sm px-5 py-4 text-sm font-medium outline-none focus:border-white/80 focus:bg-white/70 transition-all shadow-sm placeholder:text-foreground/30 resize-none"
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
        required={required} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/40 bg-white/40 backdrop-blur-sm px-5 py-4 text-sm font-medium outline-none focus:border-white/80 focus:bg-white/70 transition-all shadow-sm appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234E2C23' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1em' }}
      >
        <option value="" disabled>Select...</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
