import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer & Terms — Shibari Collective" },
      { name: "description", content: "Terms of use, safety guidelines, and disclaimer for the Shibari Collective platform." },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-32 pt-16 sm:pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-16 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-secondary font-bold mb-4">
            Legal & Safety
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-foreground mb-6">
            Disclaimer & Terms
          </h1>
          <p className="text-foreground/60 max-w-xl text-sm sm:text-base leading-relaxed mx-auto sm:mx-0">
            By accessing or using Shibari Collective, you explicitly agree to the following terms.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 sm:p-12"
        >
          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">Educational Purpose Only</h2>
            <p className="text-sm text-foreground/70 leading-relaxed">
              This website is provided strictly for communication and entertainment purposes. It does not constitute medical, psychological, or relationship advice.
            </p>
          </div>

          <div className="w-12 h-px bg-white/10" />

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">Assumption of Risk</h2>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Engaging in intimate dynamics involves inherent physical and psychological risks. You acknowledge these risks and agree that you are solely responsible for your own safety and wellbeing.
            </p>
          </div>

          <div className="w-12 h-px bg-white/10" />

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">Absolute User Responsibility</h2>
            <p className="text-sm text-foreground/70 leading-relaxed">
              This website does not guarantee or replace active consent. You are exclusively responsible for obtaining and maintaining enthusiastic consent at all times. You are also solely responsible for ensuring all activities comply with your local laws.
            </p>
          </div>

          <div className="w-12 h-px bg-white/10" />

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">Limitation of Liability</h2>
            <p className="text-sm text-foreground/70 leading-relaxed">
              To the maximum extent permitted by law, the creator and developers of Shibari Collective shall not be held liable for any direct, indirect, incidental, or consequential damages arising from your use of this website. This absolute release of liability includes all claims related to personal injury, emotional distress, or relationship disputes.
            </p>
          </div>

          <div className="w-12 h-px bg-white/10" />

          <div>
            <h2 className="font-serif text-2xl text-foreground mb-3">Data Privacy and Sharing</h2>
            <p className="text-sm text-foreground/70 leading-relaxed">
              You are entirely responsible for the distribution of your generated links. The creator accepts no liability for how your partners or others handle your shared information once you generate a link.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
