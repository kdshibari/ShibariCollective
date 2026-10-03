import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
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
            <ShieldCheck className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl text-foreground mb-6">
            Privacy Policy
          </h1>
          <p className="text-foreground/60 text-lg leading-relaxed max-w-2xl">
            We are committed to protecting your personal data and your privacy. This policy outlines how The Shibari Collective collects, utilizes, and safeguards your information.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 backdrop-blur-md rounded-[2rem] p-8 sm:p-12 space-y-10"
        >
          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">1. Data Collection</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              We collect information you provide directly to us when you create an account, save a studio to your profile, submit a studio for listing, or submit a report. This includes basic identifying information such as your email address and display name.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">2. Saved Studios & Profile Data</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              When you save a studio to your profile, that preference is stored securely in our database to allow you to access it across devices. This data is entirely private to your account and is never sold, shared, or made public to other users or studio operators.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">3. Analytics & Cookies</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              We utilize Google Analytics to understand how our community interacts with the directory, enabling us to optimize the platform's performance and design. These analytical cookies track broad usage patterns (such as page views and geographic regions) rather than granular personal identities. You can opt out of this tracking at any time via our cookie consent banner.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">4. Third-Party Links</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              Our directory contains outgoing links to independent studio websites, social media profiles, and booking platforms. The Shibari Collective is not responsible for the privacy practices or the content of these third-party operators. We encourage you to review the privacy policies of any studio you choose to engage with.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-3xl text-foreground mb-4">5. Data Deletion</h2>
            <p className="text-foreground/70 leading-relaxed text-sm">
              You maintain total control over your data. If you wish to permanently delete your account, your saved studio preferences, and your associated email address, you may do so at any time by contacting us directly at theshibaricollective@gmail.com.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
