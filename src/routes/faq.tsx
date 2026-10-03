import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
});

function FAQPage() {
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
            <HelpCircle className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl text-foreground mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-foreground/60 text-lg leading-relaxed max-w-2xl">
            Our ethos is built on transparency, safety, and the elevation of rope practice worldwide. Below, you will find information regarding our curation process, platform standards, and guidelines for both practitioners and space operators.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="space-y-12"
        >
          <section className="bg-white/5 border border-white/10 backdrop-blur-md rounded-[2rem] p-8 sm:p-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-8">For Practitioners & Explorers</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-2xl text-foreground mb-3">How are studios selected and vetted for The Shibari Collective?</h3>
                <p className="text-foreground/70 leading-relaxed text-sm">
                  We maintain a rigorous digital curation process. Spaces submitted to our directory are reviewed to ensure they are dedicated, professional venues rather than casual or residential living spaces. We verify their digital footprint, public guidelines, and community standing. However, please note that we do not physically inspect venues or test rigging points.
                </p>
              </div>

              <div className="w-full h-px bg-white/10" />

              <div>
                <h3 className="font-serif text-2xl text-foreground mb-3">What should I do if I have a concerning experience at a listed studio?</h3>
                <p className="text-foreground/70 leading-relaxed text-sm">
                  Safety and consent are the foundational pillars of our community. If a space or its management violates ethical standards, compromises physical safety, or breaches consent, we strongly encourage you to use the Report Space flag located on their studio page. These reports are securely routed directly to our Trust and Safety team for immediate review and potential removal of the studio.
                </p>
              </div>

              <div className="w-full h-px bg-white/10" />

              <div>
                <h3 className="font-serif text-2xl text-foreground mb-3">Do I need to be an advanced practitioner to visit these spaces?</h3>
                <p className="text-foreground/70 leading-relaxed text-sm">
                  The Shibari Collective features spaces that cater to a wide spectrum of experience levels, from foundational classes for beginners to open suspension labs for advanced riggers. We recommend reviewing the specific programming, prerequisites, and operating hours on each individual website before attending.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 backdrop-blur-md rounded-[2rem] p-8 sm:p-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-8">For Studio Owners</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-2xl text-foreground mb-3">How much does it cost to list my space in the directory?</h3>
                <p className="text-foreground/70 leading-relaxed text-sm">
                  Listing a verified studio on The Shibari Collective is completely free. Our primary mission is to build a comprehensive, accessible, and high quality global resource for the community, not to gatekeep visibility behind a paywall.
                </p>
              </div>

              <div className="w-full h-px bg-white/10" />

              <div>
                <h3 className="font-serif text-2xl text-foreground mb-3">What are the criteria for listing approval?</h3>
                <p className="text-foreground/70 leading-relaxed text-sm">
                  To maintain the integrity of our platform, spaces must be dedicated venues operating with a professional standard. This includes having a distinct physical location, an established online presence, and clear operational guidelines. We do not list private residential bedrooms or unverified temporary spaces.
                </p>
              </div>

              <div className="w-full h-px bg-white/10" />

              <div>
                <h3 className="font-serif text-2xl text-foreground mb-3">My studio is already listed. How do I claim and manage my page?</h3>
                <p className="text-foreground/70 leading-relaxed text-sm">
                  If your space is already visible in our directory, you can claim it by creating an Owner account. Once registered, you will be prompted to verify your identity through your official email domain or social media channels. Upon verification, you will receive full dashboard access to update your imagery, description, and hours.
                </p>
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
