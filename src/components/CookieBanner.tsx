import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 md:w-[400px]"
        >
          <div className="bg-background/80 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
            <h3 className="font-serif text-xl text-foreground mb-2">Cookie Preferences</h3>
            <p className="text-xs text-foreground/60 leading-relaxed mb-6">
              We use minimal cookies to analyze site traffic and improve the directory via Google Analytics. 
              Read our <Link to="/privacy" className="text-secondary hover:underline">Privacy Policy</Link> for more details.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-secondary text-white py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/90 active:scale-95 transition-all"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 bg-white/5 border border-white/10 text-foreground py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
