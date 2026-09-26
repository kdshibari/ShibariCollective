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

  const [logo, setLogo] = useState<PhotoState | null>(null);
  const [gallery, setGallery] = useState<PhotoState[]>([]);
  
  const [hours, setHours] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "", description: "", continent: "", country: "", city: "", address: "",
    email: "", phone: "", website: "", instagram: "", facebook: "", other: "",
  });

  // Protect against accidental tab closure or browser back navigation during uploads
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

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.form) setForm(parsed.form);
        if (parsed.hours) setHours(parsed.hours);
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
        z.object({
          email: z.string().trim().email("Invalid email format.").max(255).optional().or(z.literal("")),
          phone: z.string().max(50).optional(),
          website: z.string().url("Website must be a valid URL (e.g., https://...).").max(255).optional().or(z.literal("")),
          instagram: z.string().max(255).optional(),
        }).parse({
          email: form.email,
          phone: form.phone,
          website: form.website,
          instagram: form.instagram,
        });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message);
      }
      return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setLogo({ file, preview: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const newPhotos = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setGallery(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removeGalleryPhoto = (indexToRemove: number) => {
    setGallery(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  async function onSubmit() {
    if (!logo) {
      toast.error("A studio logo is required.");
      return;
    }
    if (gallery.length < 5) {
      toast.error(`You have selected ${gallery.length} gallery photos. A minimum of 5 is required.`);
      return;
    }
    
    setSaving(true);
    setUploadProgress("Uploading media to staging...");
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    try {
      const uploadPromises: Promise<{ url: string; position: number; path: string }>[] = [];
      const timestamp = Date.now();
      const stagingDir = `uploads/${userData.user.id}/${timestamp}`;

      // 1. Upload Logo (Position 0)
      const logoExt = logo.file.name.split('.').pop();
      const logoFileName = `${stagingDir}/logo.${logoExt}`;
      const logoTask = supabase.storage.from('studios').upload(logoFileName, logo.file, { cacheControl: '3600', upsert: false })
        .then(async ({ error: uploadError }) => {
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('studios').getPublicUrl(logoFileName);
          return { url: publicUrl, position: 0, path: logoFileName };
        });
      uploadPromises.push(logoTask);

      // 2. Upload Gallery (Position 1+)
      const galleryTasks = gallery.map(async (photo, index) => {
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${stagingDir}/gallery_${index}.${fileExt}`;
        return supabase.storage.from('studios').upload(fileName, photo.file, { cacheControl: '3600', upsert: false })
          .then(async ({ error: uploadError }) => {
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('studios').getPublicUrl(fileName);
            return { url: publicUrl, position: index + 1, path: fileName };
          });
      });
      uploadPromises.push(...galleryTasks);

      // Wait for all uploads to complete before touching the database
      const uploadedMedia = await Promise.all(uploadPromises);

      setUploadProgress("Publishing studio profile...");

      // 3. Create Studio Record
      const { data: inserted, error: dbError } = await supabase
        .from("studios")
        .insert({
          owner_id: userData.user.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          continent: form.continent,
          country: form.country.trim(),
          city: form.city.trim(),
          address: form.address.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          hours,
          socials: {
            instagram: form.instagram.trim() || undefined,
            facebook: form.facebook.trim() || undefined,
            other: form.other.trim() || undefined,
          },
        })
        .select("id")
        .single();

      if (dbError || !inserted) {
        // Rollback: Delete the uploaded media if DB insertion fails
        await supabase.storage.from('studios').remove(uploadedMedia.map(m => m.path));
        throw new Error(dbError?.message ?? "Database insertion failed. Media rolled back.");
      }

      // 4. Link Photos to Studio Record
      const photosToInsert = uploadedMedia.map(m => ({
        studio_id: inserted.id,
        url: m.url,
        position: m.position
      }));

      const { error: pErr } = await supabase.from("studio_photos").insert(photosToInsert);
      
      if (pErr) throw pErr;

      setSaving(false);
      setUploadProgress("");
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Studio successfully published!");
      navigate({ to: "/studios/$id", params: { id: inserted.id } });

    } catch (err: any) {
      setSaving(false);
      setUploadProgress("");
      toast.error("Submission failed: " + err.message);
    }
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
                <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">{s.title}</span>
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
                <h2 className="font-serif text-3xl text-foreground mb-8">Where are you located?</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Select label="Continent" value={form.continent} onChange={(v: string) => setForm({ ...form, continent: v })} options={CONTINENTS as unknown as string[]} required />
                  <Input label="Country" value={form.country} onChange={(v: string) => setForm({ ...form, country: v })} placeholder="e.g. Germany" required />
                </div>
                <Input label="City" value={form.city} onChange={(v: string) => setForm({ ...form, city: v })} placeholder="e.g. Berlin" required />
                <Input label="Street Address (Optional)" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} placeholder="Keep blank if private" />
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
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <h2 className="font-serif text-3xl text-foreground mb-2">Visual Identity & Gallery</h2>
                
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Studio Logo</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary">Required</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border border-white/10 shadow-xl bg-black/20 shrink-0">
                      {logo ? (
                        <>
                          <img src={logo.preview} className="w-full h-full object-cover" alt="Studio Logo" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <label className="text-xs font-bold uppercase tracking-widest text-white cursor-pointer hover:text-secondary transition-colors">
                              Replace
                              <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                          <UploadCloud className="w-6 h-6 text-foreground/50 mb-1" />
                          <span className="text-xs font-bold uppercase tracking-widest text-foreground/50 text-center px-2">Upload Logo</span>
                          <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                        </label>
                      )}
                    </div>
                    <div className="text-sm text-foreground/60 max-w-sm leading-relaxed">
                      This serves as your studio's primary identity across the directory. We recommend a square format (1:1).
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Studio Gallery</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary">{gallery.length} / 5 Min</p>
                  </div>
                  <p className="text-sm text-foreground/60 font-medium max-w-sm mb-6">
                    Upload directly from your device. Minimum 5 photos required to showcase your space.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {gallery.map((photo, index) => (
                      <div key={index} className="relative aspect-[4/5] group overflow-hidden rounded-2xl shadow-sm border border-white/10">
                        <img src={photo.preview} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button type="button" onClick={() => removeGalleryPhoto(index)} className="bg-rose-500/90 text-white p-3 rounded-full hover:bg-rose-500 hover:scale-110 transition-all shadow-xl">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <label className="flex flex-col items-center justify-center aspect-[4/5] border border-dashed border-white/30 bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer transition-all">
                      <UploadCloud className="w-6 h-6 text-secondary mb-2" />
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground">Add Photos</span>
                      <input type="file" className="hidden" multiple accept="image/*" onChange={handleGallerySelect} />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                onClick={handleNextStep}
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

function Input({ label, value, onChange, type = "text", required, step, placeholder }: any) {
  return (
    <label className="block group">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-secondary transition-colors">
        {label} {required && <span className="text-secondary">*</span>}
      </span>
      <input
        type={type} required={required} step={step} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-secondary/50 focus:bg-white/10 transition-all shadow-inner placeholder:text-foreground/30"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder }: any) {
  return (
    <label className="block group">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-secondary transition-colors">{label}</span>
      <textarea
        rows={5} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-secondary/50 focus:bg-white/10 transition-all shadow-inner placeholder:text-foreground/30 resize-none"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, required }: any) {
  return (
    <label className="block group">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-secondary transition-colors">
        {label} {required && <span className="text-secondary">*</span>}
      </span>
      <select
        required={required} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-secondary/50 focus:bg-white/10 transition-all shadow-inner appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238B3A36' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1em' }}
      >
        <option value="" disabled className="bg-background text-foreground">Select...</option>
        {options.map((o: string) => <option key={o} value={o} className="bg-background text-foreground">{o}</option>)}
      </select>
    </label>
  );
}
