import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Building, Bookmark, ArrowRight, PlusCircle, User } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setUser(session.user);

      // Check if they hold the studio owner role
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const isVerifiedOwner = roles?.some(r => r.role === "studio_owner" || r.role === "admin");
      
      const urlParams = new URLSearchParams(window.location.search);
      const intent = urlParams.get('intent');
      
      // Instantly strip the intent parameter from the browser history without a reload
      if (intent) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      // Auto-redirect to the claim portal if they chose "Studio" but lack the role
      if (intent === 'owner' && !isVerifiedOwner) {
         navigate({ to: "/submit", replace: true });
         return; 
      }

      setIsOwner(!!isVerifiedOwner);
      setLoading(false);
    }
    loadProfile();
  }, [navigate]);

  async function handleLogout() {
    // Destroy the local draft cache before logging out to protect privacy
    localStorage.removeItem("shibari-studio-draft");
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-pulse text-secondary text-sm font-bold tracking-widest uppercase">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/40 border border-white/60 shadow-md backdrop-blur-md flex items-center justify-center">
              <User className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <h1 className="font-serif text-4xl text-foreground">Welcome Back</h1>
              <p className="text-sm font-medium text-foreground/60">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/50 hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>

        {isOwner ? <OwnerPortal /> : <ParticipantPortal />}

      </div>
    </div>
  );
}

function OwnerPortal() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
          <Building className="h-4 w-4" /> Studio Management
        </h2>
        <Link to="/submit" className="text-xs font-bold uppercase tracking-widest text-foreground hover:text-secondary flex items-center gap-1 transition-colors">
          Add New <PlusCircle className="h-4 w-4" />
        </Link>
      </div>

      <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 sm:p-12 text-center shadow-[0_20px_40px_-10px_rgba(78,44,35,0.1)]">
        <Building className="mx-auto h-12 w-12 text-foreground/30 mb-4" />
        <h3 className="font-serif text-3xl text-foreground">Your Portfolio is Empty</h3>
        <p className="mt-3 text-foreground/70 font-medium max-w-md mx-auto">
          You are a verified owner, but you haven't listed a studio yet. Curate your space to appear on the global map.
        </p>
        <Link to="/submit" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-8 py-3.5 text-sm font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
          Create Listing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}

function ParticipantPortal() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
        <Bookmark className="h-4 w-4" /> Saved Studios
      </h2>

      <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2rem] p-8 sm:p-12 text-center shadow-[0_20px_40px_-10px_rgba(78,44,35,0.1)]">
        <Bookmark className="mx-auto h-12 w-12 text-foreground/30 mb-4" />
        <h3 className="font-serif text-3xl text-foreground">No Saved Spaces</h3>
        <p className="mt-3 text-foreground/70 font-medium max-w-md mx-auto">
          Keep track of studios you'd like to visit. Browse the collective and save them directly from the directory.
        </p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-8 py-3.5 text-sm font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
          Explore Map <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-12 pt-8 border-t border-white/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/20 rounded-[2rem] p-6 border border-white/40">
          <div>
            <h4 className="font-serif text-xl text-foreground">Are you a Studio Owner?</h4>
            <p className="text-sm text-foreground/60 font-medium mt-1">Claim your profile and list your space on the global map.</p>
          </div>
          <Link to="/submit" className="shrink-0 rounded-full border border-foreground/20 bg-transparent hover:bg-white/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-all">
            Upgrade Account
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
