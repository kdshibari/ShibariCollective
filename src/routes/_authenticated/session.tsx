import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Workflow, ChevronDown, Hand, HeartHandshake, MessageSquare, RotateCcw, Share2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/session")({
  component: SessionPlannerPage,
});

const DEFAULT_RADAR = [
  { subject: "Intensity", A: 0 },
  { subject: "Pain", A: 0 },
  { subject: "Restriction", A: 0 },
  { subject: "Intimacy", A: 0 },
  { subject: "Sensuality", A: 0 },
  { subject: "Exposure", A: 0 },
  { subject: "Predicament", A: 0 },
  { subject: "Playfulness", A: 0 },
  { subject: "Suspension", A: 0 },
];

const AFTERCARE_OPTIONS = [
  "Cuddling", "Water / Snacks", "Warm Blanket", "Quiet Time", 
  "Processing / Talking", "Physical Space", "Shower Together", "Verbal Reassurance"
];

// NATIVE SVG RADAR CHART (Zero External Dependencies)
function NativeRadarChart({ data }: { data: { subject: string, A: number }[] }) {
  const size = 300;
  const center = size / 2;
  const maxRadius = 100;
  const numAxes = data.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Calculate coordinates for a given value (0-10) at a specific axis index
  const getPoint = (value: number, index: number, radiusScale: number = maxRadius) => {
    const angle = index * angleStep - Math.PI / 2; // -90deg to start at 12 o'clock
    const radius = (value / 10) * radiusScale;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  // Generate grid polygons (concentric rings)
  const gridLevels = [2, 4, 6, 8, 10];
  
  // Generate the active data polygon
  const dataPolygon = data.map((d, i) => {
    const pt = getPoint(d.A, i);
    return `${pt.x},${pt.y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
      {/* Background Grid */}
      {gridLevels.map(level => (
        <polygon 
          key={level}
          points={data.map((_, i) => {
            const pt = getPoint(level, i);
            return `${pt.x},${pt.y}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}

      {/* Axis Lines & Labels */}
      {data.map((d, i) => {
        const endPt = getPoint(10, i);
        const labelPt = getPoint(10, i, maxRadius + 20); // Push labels outside the grid
        
        // Adjust text anchoring based on horizontal position
        let textAnchor = "middle";
        if (labelPt.x < center - 10) textAnchor = "end";
        if (labelPt.x > center + 10) textAnchor = "start";

        return (
          <g key={i}>
            <line x1={center} y1={center} x2={endPt.x} y2={endPt.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text 
              x={labelPt.x} 
              y={labelPt.y + 4} // slight vertical bump for centering
              fill="rgba(255,255,255,0.5)" 
              fontSize="9" 
              fontWeight="bold" 
              textAnchor={textAnchor}
              className="uppercase tracking-[0.1em]"
            >
              {d.subject}
            </text>
          </g>
        );
      })}

      {/* Dynamic Data Shape */}
      <polygon 
        points={dataPolygon}
        fill="rgba(139, 58, 54, 0.4)" // Secondary color with opacity
        stroke="#8B3A36" 
        strokeWidth="2"
        className="transition-all duration-300 ease-out"
      />
      
      {/* Data Points */}
      {data.map((d, i) => {
        const pt = getPoint(d.A, i);
        return (
          <circle 
            key={`pt-${i}`} 
            cx={pt.x} 
            cy={pt.y} 
            r="3" 
            fill="#8B3A36" 
            className="transition-all duration-300 ease-out"
          />
        );
      })}
    </svg>
  );
}

function SessionPlannerPage() {
  const [isRadarVisible, setIsRadarVisible] = useState(true);
  const [radarData, setRadarData] = useState(DEFAULT_RADAR);
  const [notes, setNotes] = useState("");
  const [stopWord, setStopWord] = useState("");
  const [slowWord, setSlowWord] = useState("");
  const [selectedAftercare, setSelectedAftercare] = useState<string[]>([]);
  const [isSharedView, setIsSharedView] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get("share");
    
    if (shareData) {
      try {
        const decoded = JSON.parse(atob(shareData));
        if (decoded.radarData) setRadarData(decoded.radarData);
        if (decoded.notes) setNotes(decoded.notes);
        if (decoded.stopWord) setStopWord(decoded.stopWord);
        if (decoded.slowWord) setSlowWord(decoded.slowWord);
        if (decoded.selectedAftercare) setSelectedAftercare(decoded.selectedAftercare);
        setIsSharedView(true);
        toast.info("Loaded partner's session configuration.");
      } catch (e) {
        toast.error("Invalid share link.");
      }
    }
  }, []);

  const handleSliderChange = (index: number, value: string) => {
    const newData = [...radarData];
    newData[index].A = parseInt(value, 10);
    setRadarData(newData);
  };

  const toggleAftercare = (need: string) => {
    setSelectedAftercare(prev => 
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to reset all session parameters?")) {
      setRadarData(DEFAULT_RADAR);
      setNotes("");
      setStopWord("");
      setSlowWord("");
      setSelectedAftercare([]);
      setIsSharedView(false);
      window.history.replaceState({}, '', window.location.pathname);
      toast.success("Session planner reset.");
    }
  };

  const handleShare = () => {
    const payload = { radarData, notes, stopWord, slowWord, selectedAftercare };
    const encoded = btoa(JSON.stringify(payload));
    const shareUrl = `${window.location.origin}/session?share=${encoded}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Secure link copied! Share this with your partner.");
    }).catch(() => {
      toast.error("Failed to copy link to clipboard.");
    });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-32 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center sm:text-left mb-12">
          <p className="text-xs uppercase tracking-[0.4em] text-secondary font-bold mb-4 flex items-center justify-center sm:justify-start gap-2">
            <Workflow className="w-4 h-4" /> Communication Tool
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-foreground">Session Planner</h1>
          <p className="mt-4 text-foreground/60 max-w-xl text-sm leading-relaxed mx-auto sm:mx-0">
            Establish boundaries, intentions, and desires before tying. Share this configuration securely with your partner.
          </p>
        </div>

        {isSharedView && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80 leading-relaxed">
              You are viewing a shared session configuration. You can modify these settings and generate a new share link, or clear the form to start fresh.
            </p>
          </div>
        )}

        {/* ROPE RADAR SECTION */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-xl overflow-hidden transition-all">
          <button 
            onClick={() => setIsRadarVisible(!isRadarVisible)}
            className="w-full p-6 sm:p-8 flex items-center justify-between group hover:bg-white/5 transition-colors"
          >
            <div>
              <h2 className="text-xl font-serif text-foreground text-left">The Rope Radar</h2>
              <p className="text-xs text-foreground/50 mt-1 text-left font-medium tracking-wide">Map out the physical and emotional intensity</p>
            </div>
            <div className={`p-2 rounded-full bg-white/5 border border-white/10 transition-transform duration-300 ${isRadarVisible ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4 text-secondary" />
            </div>
          </button>

          <AnimatePresence>
            {isRadarVisible && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: "auto", opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 sm:p-8 pt-0 border-t border-white/5">
                  
                  {/* NATIVE CUSTOM SVG CHART RENDERER */}
                  <div className="w-full max-w-md mx-auto mb-12 mt-4 px-4">
                    <NativeRadarChart data={radarData} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                    {radarData.map((item, index) => (
                      <div key={item.subject} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-widest text-foreground/70">{item.subject}</span>
                          <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">{item.A} / 10</span>
                        </div>
                        <input 
                          type="range" min="0" max="10" value={item.A}
                          onChange={(e) => handleSliderChange(index, e.target.value)}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Specific Intentions & Notes
                    </label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[120px] rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-foreground outline-none focus:border-secondary/50 transition-all resize-none placeholder:text-foreground/30 shadow-inner" 
                      placeholder="Outline specific scenes, body areas to avoid, injuries, or desires for this session..." 
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SAFE WORDS SECTION */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-xl p-6 sm:p-8">
          <h2 className="font-serif text-2xl text-foreground flex items-center gap-3 mb-6">
            <Hand className="h-6 w-6 text-secondary" /> Boundaries & Safewords
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <label className="block group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-rose-400 group-focus-within:text-rose-500 transition-colors">Hard Stop Word</span>
              <input 
                value={stopWord} onChange={(e) => setStopWord(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-rose-500/50 transition-all shadow-inner placeholder:text-foreground/30" 
                placeholder="e.g. Red, Pineapple" 
              />
            </label>
            <label className="block group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-amber-400 group-focus-within:text-amber-500 transition-colors">Slow Down / Check-in Word</span>
              <input 
                value={slowWord} onChange={(e) => setSlowWord(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm font-medium text-foreground outline-none focus:border-amber-500/50 transition-all shadow-inner placeholder:text-foreground/30" 
                placeholder="e.g. Yellow, Mercy" 
              />
            </label>
          </div>
        </div>

        {/* AFTERCARE SECTION */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-xl p-6 sm:p-8">
          <h2 className="font-serif text-2xl text-foreground flex items-center gap-3 mb-6">
            <HeartHandshake className="h-6 w-6 text-secondary" /> Aftercare Needs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AFTERCARE_OPTIONS.map((need) => {
              const isSelected = selectedAftercare.includes(need);
              return (
                <button 
                  key={need}
                  onClick={() => toggleAftercare(need)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 text-center gap-2 ${
                    isSelected 
                      ? 'bg-secondary/20 border-secondary text-white shadow-[0_0_15px_rgba(139,58,54,0.3)]' 
                      : 'bg-white/5 border-white/10 text-foreground/60 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider leading-tight">{need}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button 
            onClick={handleClear}
            className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 py-4 px-8 text-xs font-bold uppercase tracking-widest text-foreground transition-all sm:flex-1"
          >
            <RotateCcw className="h-4 w-4" /> Reset Form
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-full bg-foreground text-background hover:scale-[1.02] py-4 px-8 text-xs font-bold uppercase tracking-widest shadow-xl transition-all sm:flex-[2]"
          >
            <Share2 className="h-4 w-4" /> Generate Share Link
          </button>
        </div>

      </div>
    </div>
  );
}
