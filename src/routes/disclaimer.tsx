import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/disclaimer")({
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background pb-24 pt-12 sm:pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" /> Return Home
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-12"
        >
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-8 border border-secondary/20 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl text-foreground mb-6">
            Disclaimer & Terms of Use
          </h1>
          <p className="text-foreground/60 text-lg leading-relaxed max-w-2xl">
            By accessing and utilizing The Shibari Collective, you acknowledge and agree to the following terms regarding liability, safety, and your inherent responsibilities as a practitioner.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 backdrop-blur-md rounded-[2rem] p-8 sm:p-12 space-y-10"
        >
          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">1. Assumption of Inherent Risk</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              Shibari and rope bondage involve inherent and significant risks, including but not limited to nerve damage, circulation loss, physical injury, psychological distress, and in extreme cases, death. By utilizing this directory to locate spaces for practice, you explicitly acknowledge these risks. The Shibari Collective provides informational listings only and assumes zero liability for any injury, loss, or damages sustained while visiting a space found through our platform. You assume total responsibility for your own physical and emotional safety.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">2. Platform Role & Independent Status</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              The Shibari Collective operates exclusively as an informational directory and search aggregate. We do not own, operate, manage, or employ the staff of any studio listed on this platform. The inclusion of a studio in our directory does not constitute a partnership, joint venture, or agency relationship. All transactions, bookings, and interactions occur strictly between you and the independent studio operators.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">3. No Guarantee of Physical Safety or Rigging Integrity</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              While we review the digital presence of submissions prior to approval, The Shibari Collective does not physically inspect studios, verify the structural integrity of their hardpoints, or audit their safety protocols. The presence of a studio on this platform is not an endorsement of their safety standards. It is your absolute responsibility to conduct personal due diligence, inspect equipment, evaluate the structural safety of the environment, and assess the competence of the operators before engaging in any rope activities.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">4. Code of Conduct and Right of Removal</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              We are committed to maintaining a directory of spaces that uphold the highest standards of consent, respect, and safety. However, we cannot actively monitor the daily operations of independent venues. The Shibari Collective reserves the unconditional right to suspend, alter, or permanently remove any listing, user profile, or review at our sole discretion, at any time, and without prior notice, particularly in response to credible reports of unsafe practices or consent violations.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">5. User Submitted Content and Reviews</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              Experiences and reviews shared on this platform represent the subjective opinions of independent practitioners and do not reflect the views of The Shibari Collective. We do not verify the factual accuracy of user submitted reviews, though we retain the right to moderate and remove content that violates our community guidelines, contains hate speech, or constitutes harassment.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
