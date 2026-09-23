import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Mail, Globe, Instagram, ArrowLeft, ChevronLeft, ChevronRight, X, Maximize2, Camera, Flag } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/studios/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Studio   Shibari Collective` },
      { name: "description", content: `Shibari studio details on Shibari Collective (${params.id.slice(0, 8)}).` },
      { property: "og:title", content: "Shibari studio" },
      { property: "og:description", content: "Discover this Shibari studio on Shibari Collective." },
    ],
  }),
  component: StudioPage,
});

interface Studio {
  id: string;
  name: string;
  description: string | null;
  continent: string;
  country: string;
  city: string;
  address: string | null;
  hours: Record<string, string> | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  socials: Record<string, string> | null;
  studio_photos: { url: string; position: number }[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function StudioPage() {
  const { id } = Route.useParams();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  
  // Cinematic Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportComments, setReportComments] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    supabase
      .from("studios")
      .select("*, studio_photos(url, position)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setStudio(data as any);
        setLoading(false);
      });
  }, [id]);

  // Lock body scroll when lightbox or report modal is open
  useEffect(() => {
    if (lightboxIndex !== null || showReportModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [lightboxIndex, showReportModal]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportComments.trim()) {
      toast.error("Please provide a reason for your report.");
      return;
    }

    setIsReporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('studio_reports').insert({
        studio_id: studio?.id,
        user_id: user?.id || null,
        comments: reportComments.trim(),
      });

      if (error) throw error;
      
      toast.success("Report submitted securely. Our team will review this immediately.");
      setShowReportModal(false);
      setReportComments("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report.");
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-32 animate-pulse text-secondary text-sm font-bold tracking-widest uppercase text-center">Loading Studio...</div>;
  if (!studio) return <div className="mx-auto max-w-4xl px-4 py-32 text-center font-serif text-3xl">Studio not found.</div>;

  const photos = (studio.studio_photos ?? []).sort((a, b) => a.position - b.position);
  const mapUrl = studio.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${studio.address}, ${studio.city},${studio.country}`)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${studio.city},${studio.country}`)}`;
  
  const primaryContactHref = studio.email ? `mailto:${studio.email}` : studio.website ? studio.website : studio.phone ? `tel:${studio.phone}` : null;

  return (
    <>
      <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6 pb-32 md:pb-16 relative">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Directory
        </Link>

        {/* Desktop Editorial Grid vs Mobile Carousel */}
        {photos.length > 0 && (
          <div className="mb-12">
            {/* Mobile Carousel */}
            <div className="relative md:hidden rounded-[2rem] overflow-hidden">
              <div ref={emblaRef} className="overflow-hidden">
                <div className="flex">
                  {photos.map((p, i) => (
                    <div key={i} className="min-w-0 shrink-0 basis-full relative" onClick={() => setLightboxIndex(i)}>
                      <img src={p.url} alt={`${studio.name} - ${i + 1}`} className="aspect-[4/5] w-full object-cover" />
                      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] font-bold tracking-widest flex items-center gap-2">
                        <Maximize2 className="w-3 h-3" /> {i + 1} / {photos.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Premium Desktop Asymmetric Grid */}
            <div className="hidden md:grid grid-cols-2 gap-4 h-[60vh] rounded-[2rem] overflow-hidden relative">
              <div className="relative group cursor-pointer h-full bg-neutral-900 overflow-hidden" onClick={() => setLightboxIndex(0)}>
                <img src={photos[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="grid grid-rows-2 gap-4 h-full">
                {photos[1] ? (
                  <div className="relative group cursor-pointer h-full bg-neutral-900 overflow-hidden rounded-[1rem]" onClick={() => setLightboxIndex(1)}>
                    <img src={photos[1].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : <div className="bg-white/5 rounded-[1rem]" />}
                {photos[2] ? (
                  <div className="relative group cursor-pointer h-full bg-neutral-900 overflow-hidden rounded-[1rem]" onClick={() => setLightboxIndex(2)}>
                    <img src={photos[2].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* View All Overlay if more than 3 photos exist */}
                    {photos.length > 3 && (
                      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground hover:scale-105 transition-transform">
                        <Camera className="w-4 h-4" /> View All {photos.length}
                      </div>
                    )}
                  </div>
                ) : <div className="bg-white/5 rounded-[1rem]" />}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <header>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary mb-3">
                {studio.continent} &middot; {studio.country}
              </p>
              <h1 className="font-serif text-5xl sm:text-6xl text-foreground leading-tight mb-4">{studio.name}</h1>
              <div className="flex items-center gap-2 text-foreground/60 text-sm font-medium">
                <MapPin className="h-4 w-4 text-secondary" />
                <span>{studio.city}{studio.address ? `, ${studio.address}` : ""}</span>
              </div>
            </header>

            {studio.description && (
              <div className="mt-12">
                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-6">About the Space</h2>
                <p className="whitespace-pre-line text-foreground/80 leading-relaxed text-lg">{studio.description}</p>
              </div>
            )}

            {studio.hours && Object.keys(studio.hours).length > 0 && (
              <div className="mt-16">
                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-6">Operating Hours</h2>
                <div className="divide-y divide-white/10 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md p-6">
                  {DAYS.map((d) => (
                    <div key={d} className="flex justify-between py-4 text-sm first:pt-0 last:pb-0">
                      <dt className="text-foreground/60 font-medium">{d}</dt>
                      <dd className="font-bold text-foreground">{studio.hours?.[d] || "Closed"}</dd>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mobile Report Button */}
            <div className="mt-16 pt-8 border-t border-white/10 flex justify-center lg:hidden">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40 hover:text-rose-500 transition-colors"
              >
                <Flag className="w-3 h-3" /> Report Space
              </button>
            </div>
          </div>

          {/* Desktop Contact Sidebar */}
          <aside className="space-y-6 hidden lg:block">
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-xl sticky top-32">
              <h3 className="font-serif text-3xl text-foreground mb-8">Connect</h3>
              <ul className="space-y-4">
                {studio.email && <Row icon={<Mail className="h-5 w-5" />} href={`mailto:${studio.email}`}>{studio.email}</Row>}
                {studio.phone && <Row icon={<Phone className="h-5 w-5" />} href={`tel:${studio.phone}`}>{studio.phone}</Row>}
                {studio.website && <Row icon={<Globe className="h-5 w-5" />} href={studio.website}>Website</Row>}
                {studio.socials?.instagram && (
                  <Row icon={<Instagram className="h-5 w-5" />} href={studio.socials.instagram}>Instagram</Row>
                )}
                {studio.socials?.facebook && (
                  <Row icon={<Globe className="h-5 w-5" />} href={studio.socials.facebook}>Facebook</Row>
                )}
                {studio.socials?.fetlife && (
                  <Row icon={<Globe className="h-5 w-5" />} href={studio.socials.fetlife}>FetLife</Row>
                )}
                {studio.socials?.other && (
                  <Row icon={<Globe className="h-5 w-5" />} href={studio.socials.other}>Other</Row>
                )}
              </ul>
              
              <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex justify-center items-center gap-2 rounded-full bg-foreground text-background px-4 py-4 text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                >
                  <MapPin className="w-4 h-4" /> Open in Maps
                </a>
                
                {/* Desktop Report Button */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full flex justify-center items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40 hover:text-rose-500 transition-colors pt-4"
                >
                  <Flag className="w-3 h-3" /> Report Space
                </button>
              </div>
            </div>
          </aside>
        </div>
      </article>

      {/* Sticky Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-2xl border-t border-white/10 p-4 sm:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3 max-w-md mx-auto">
          {primaryContactHref && (
            <a
              href={primaryContactHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex justify-center items-center gap-2 rounded-full bg-secondary text-white px-4 py-4 text-xs font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Contact Studio
            </a>
          )}
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-none flex justify-center items-center w-12 h-12 rounded-full bg-white/10 border border-white/20 text-foreground shadow-lg active:scale-95 transition-all"
            aria-label="Open in Maps"
          >
            <MapPin className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Cinematic Full-Screen Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-between items-center p-6 text-white absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 to-transparent">
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                {lightboxIndex + 1} / {photos.length}
              </span>
              <button 
                onClick={() => setLightboxIndex(null)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center relative px-4">
              <motion.img 
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={photos[lightboxIndex].url} 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                alt="Studio Gallery"
              />

              {photos.length > 1 && (
                <>
                  <button 
                    onClick={() => setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)}
                    className="absolute left-4 sm:left-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % photos.length)}
                    className="absolute right-4 sm:right-10 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="w-full max-w-lg bg-background border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowReportModal(false)} 
                className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-6 border border-rose-500/30">
                  <Flag className="w-5 h-5 text-rose-500" />
                </div>
                <h2 className="font-serif text-3xl text-foreground mb-2">Report Studio</h2>
                <p className="text-sm text-foreground/60">
                  Our trust and safety team reviews all reports. Please provide detailed context about why you are reporting this space.
                </p>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-6">
                <label className="block group">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-foreground/60 group-focus-within:text-rose-400 transition-colors">
                    Reason for report <span className="text-rose-500">*</span>
                  </span>
                  <textarea
                    required
                    rows={5}
                    value={reportComments}
                    onChange={(e) => setReportComments(e.target.value)}
                    placeholder="Please describe your concerns..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-rose-500/50 transition-all placeholder:text-foreground/30 resize-none shadow-inner"
                  />
                </label>

                <button 
                  type="submit" 
                  disabled={isReporting}
                  className="w-full flex items-center justify-center gap-2 bg-rose-500 text-white py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:bg-rose-600 disabled:opacity-50 transition-all"
                >
                  {isReporting ? "Submitting..." : "Submit Report"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Row({ icon, href, children }: { icon: React.ReactNode; href: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-4 text-foreground/80 hover:text-secondary group transition-colors py-2">
        <div className="bg-white/5 border border-white/10 p-2.5 rounded-full group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="truncate font-medium">{children}</span>
      </a>
    </li>
  );
}
