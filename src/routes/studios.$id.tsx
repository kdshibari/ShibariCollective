import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, Phone, Mail, Globe, Instagram, Facebook, 
  ArrowLeft, ChevronLeft, ChevronRight, X, Maximize2, 
  Camera, Flag, Star 
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/studios/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Studio — Shibari Collective` },
      { name: "description", content: `Shibari studio details on Shibari Collective (${params.id.slice(0, 8)}).` },
      { property: "og:title", content: "Shibari studio" },
      { property: "og:description", content: "Discover this Shibari studio on Shibari Collective." },
    ],
  }),
  component: StudioPage,
});

const sendReportEmail = createServerFn({ method: "POST" })
  .validator((data: { studioName: string; comments: string; reporterEmail: string }) => data)
  .handler(async ({ data }) => {
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
    
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.warn("Gmail credentials missing. Database logged, but email skipped.");
      return { success: false };
    }

    try {
      const nodemailer = await import("nodemailer");
      
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Shibari Collective Alerts" <${GMAIL_USER}>`,
        to: "theshibaricollective@gmail.com",
        subject: `🚨 Studio Report: ${data.studioName}`,
        html: `
          <div style="font-family: sans-serif; color: #181514; padding: 20px;">
            <h2 style="color: #8B3A36;">New Studio Report</h2>
            <p><strong>Studio:</strong> ${data.studioName}</p>
            <p><strong>Reporter Email:</strong> ${data.reporterEmail}</p>
            <p><strong>Reason provided:</strong></p>
            <blockquote style="border-left: 4px solid #8B3A36; padding-left: 16px; color: #555; background: #f9f9f9; padding: 12px;">
              ${data.comments}
            </blockquote>
          </div>
        `,
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to send report email:", error);
      return { success: false };
    }
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

const formatSocialUrl = (input: string, platform: 'instagram' | 'facebook' | 'fetlife') => {
  let val = input.trim();
  if (val.startsWith('http')) return val;
  if (val.startsWith('@')) val = val.substring(1);
  if (platform === 'instagram') return `https://instagram.com/${val}`;
  if (platform === 'facebook') return `https://facebook.com/${val}`;
  if (platform === 'fetlife') return `https://fetlife.com/users/${val}`;
  return `https://${val}`;
};

function FetLifeIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 4h-5a4 4 0 0 0-4 4v12" />
      <path d="M6 12h8" />
    </svg>
  );
}

function StudioPage() {
  const { id } = Route.useParams();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [emblaRef] = useEmblaCarousel({ loop: true });
  
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportComments, setReportComments] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data?.user || null));

    supabase
      .from("studios")
      .select("*, studio_photos(url, position)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setStudio(data as any);
        setLoading(false);
      });

    supabase
      .from("studio_reviews")
      .select("*, profiles(display_name)")
      .eq("studio_id", id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setReviews(data);
      });
  }, [id]);

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
      const { error } = await supabase.from('studio_reports').insert({
        studio_id: studio?.id,
        user_id: currentUser?.id || null,
        comments: reportComments.trim(),
      });

      if (error) throw error;
      
      await sendReportEmail({
        data: {
          studioName: studio?.name || "Unknown Studio",
          comments: reportComments.trim(),
          reporterEmail: currentUser?.email || "Anonymous Visitor",
        }
      });

      toast.success("Report submitted securely. Our team will review this immediately.");
      setShowReportModal(false);
      setReportComments("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report.");
    } finally {
      setIsReporting(false);
    }
  };

  const submitReview = async () => {
    if (!rating || !reviewText.trim()) return toast.error("Please provide a rating and comment.");
    if (!currentUser) return toast.error("You must be signed in to leave a review.");

    setIsSubmittingReview(true);
    try {
      const { error } = await supabase.from('studio_reviews').insert({
         studio_id: studio?.id,
         user_id: currentUser.id,
         rating,
         comment: reviewText.trim()
      });

      if (error) throw error;

      toast.success("Review published.");
      setReviews([{ 
        id: Date.now().toString(), 
        rating, 
        comment: reviewText.trim(), 
        created_at: new Date().toISOString(), 
        profiles: { display_name: 'You' } 
      }, ...reviews]);
      setReviewText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review. Reviews may be disabled.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-32 animate-pulse text-secondary text-sm font-bold tracking-widest uppercase text-center">Loading Studio...</div>;
  if (!studio) return <div className="mx-auto max-w-4xl px-4 py-32 text-center font-serif text-3xl">Studio not found.</div>;

  const photos = (studio.studio_photos ?? []).sort((a, b) => a.position - b.position);
  const avgRating = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : null;
  
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

        {photos.length > 0 && (
          <div className="mb-12">
            <div className="relative md:hidden rounded-[2rem] overflow-hidden">
              <div ref={emblaRef} className="overflow-hidden">
                <div className="flex">
                  {photos.map((p, i) => (
                    <div key={i} className="min-w-0 shrink-0 basis-full relative" onClick={() => setLightboxIndex(i)}>
                      <img src={p.url} alt={`${studio.name} ${i + 1}`} className="aspect-[4/5] w-full object-cover" />
                      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] font-bold tracking-widest flex items-center gap-2">
                        <Maximize2 className="w-3 h-3" /> {i + 1} / {photos.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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
              <div className="flex items-center gap-4 mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">
                  {studio.continent} &middot; {studio.country}
                </p>
                {avgRating && (
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-foreground">
                    <Star className="w-3 h-3 fill-secondary text-secondary" /> {avgRating}
                  </div>
                )}
              </div>
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
                  {DAYS.map((d) => {
                    const h = studio.hours?.[d];
                    const isClosed = !h || h === "Closed";
                    return (
                      <div key={d} className="flex justify-between items-center py-4 text-sm first:pt-0 last:pb-0">
                        <dt className="text-foreground/60 font-bold uppercase tracking-widest text-xs">{d}</dt>
                        <dd className={isClosed ? "text-foreground/40 italic text-xs font-medium" : "font-bold text-foreground"}>
                          {isClosed ? "Closed" : h}
                        </dd>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-16 pt-12 border-t border-white/10">
              <h2 className="font-serif text-3xl text-foreground mb-8">Experiences</h2>
              
              <div className="mb-10 bg-white/5 border border-white/10 rounded-[2rem] p-6 sm:p-8 backdrop-blur-md">
                {!currentUser ? (
                  <div className="text-center">
                    <p className="text-sm text-foreground/60 mb-4">You must be signed in to leave a review for this space.</p>
                    <Link to="/auth" search={{ intent: "participant" }} className="inline-block bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors">
                      Sign In to Review
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">Rate your experience</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                            <Star className={`w-6 h-6 transition-colors ${rating >= star ? 'fill-secondary text-secondary' : 'text-white/20 hover:text-white/50'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience at this studio..."
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none focus:border-secondary/50 transition-colors resize-none placeholder:text-foreground/30"
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={submitReview}
                        disabled={isSubmittingReview}
                        className="bg-secondary text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {isSubmittingReview ? "Posting..." : "Publish Review"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-center text-sm text-foreground/40 italic py-8">No reviews yet. Be the first to share your experience.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-foreground text-sm">{review.profiles?.display_name || "Anonymous Participant"}</p>
                          <p className="text-xs text-foreground/40 mt-0.5">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-secondary text-secondary' : 'text-white/10'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-xl lg:sticky lg:top-32">
              <h3 className="font-serif text-3xl text-foreground mb-8">Connect</h3>
              <ul className="space-y-4">
                {studio.email && <Row icon={<Mail className="h-5 w-5" />} href={`mailto:${studio.email}`}>{studio.email}</Row>}
                {studio.phone && <Row icon={<Phone className="h-5 w-5" />} href={`tel:${studio.phone}`}>{studio.phone}</Row>}
                {studio.website && <Row icon={<Globe className="h-5 w-5" />} href={studio.website}>Website</Row>}
                {studio.socials?.instagram && (
                  <Row icon={<Instagram className="h-5 w-5" />} href={formatSocialUrl(studio.socials.instagram, 'instagram')}>Instagram</Row>
                )}
                {studio.socials?.facebook && (
                  <Row icon={<Facebook className="h-5 w-5" />} href={formatSocialUrl(studio.socials.facebook, 'facebook')}>Facebook</Row>
                )}
                {studio.socials?.fetlife && (
                  <Row icon={<FetLifeIcon className="h-5 w-5" />} href={formatSocialUrl(studio.socials.fetlife, 'fetlife')}>FetLife</Row>
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
