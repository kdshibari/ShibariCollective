import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, LogOut, MapPin, Edit3, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Shibari Collective" },
      { name: "description", content: "Manage your studios and account on Shibari Collective." },
      { property: "og:title", content: "Dashboard — Shibari Collective" },
      { property: "og:description", content: "Manage your studios and account on Shibari Collective." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    setEmail(userData.user.email ?? "");
    const [{ data: profile }, { data: rs }, { data: ss }] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", userData.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userData.user.id),
      supabase
        .from("studios")
        .select("id, name, city, country, status, studio_photos(url, position)")
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false }),
    ]);
    setDisplayName(profile?.display_name ?? "");
    setRoles((rs ?? []).map((r) => r.role));
    setStudios(ss ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  async function deleteStudio(id: string) {
    if (!confirm("Delete this studio? This can't be undone.")) return;
    const { error } = await supabase.from("studios").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Studio deleted");
    load();
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16">Loading…</div>;

  const isOwner = roles.includes("studio_owner") || roles.includes("admin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Your account</p>
          <h1 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">
            Hello, {displayName || email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {roles.length ? roles.map((r) => r.replace("_", " ")).join(" · ") : "practitioner"}
          </p>
        </div>
        <button
          onClick={signOut}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-serif text-2xl text-foreground">
            {isOwner ? "Your studios" : "Get started"}
          </h2>
          {isOwner && (
            <Link
              to="/submit"
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New studio
            </Link>
          )}
        </div>

        {!isOwner ? (
          <div className="card-warm rounded-2xl p-8">
            <p className="text-muted-foreground">
              You're browsing as a practitioner. Discover studios in the directory, or submit a studio if you own one.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/"
                className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
              >
                Browse studios
              </Link>
              <Link
                to="/submit"
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Submit a studio
              </Link>
            </div>
          </div>
        ) : studios.length === 0 ? (
          <div className="card-warm rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">You haven't added any studios yet.</p>
            <Link
              to="/submit"
              className="mt-4 inline-block rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
            >
              Add your first studio
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {studios.map((s) => {
              const photo = s.studio_photos?.sort((a: any, b: any) => a.position - b.position)[0]?.url;
              return (
                <div key={s.id} className="card-warm overflow-hidden rounded-2xl">
                  <div className="aspect-[16/10] bg-muted">
                    {photo && (
                      <img src={photo} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-xl">{s.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {s.city}, {s.country}
                    </div>
                    <div className="mt-1 text-xs">
                      <span className={`rounded-full px-2 py-0.5 ${s.status === "approved" ? "bg-bamboo/20 text-foreground" : "bg-muted text-muted-foreground"}`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link
                        to="/studios/$id"
                        params={{ id: s.id }}
                        className="flex-1 rounded-md border border-border px-3 py-1.5 text-center text-xs hover:bg-accent"
                      >
                        <Edit3 className="mr-1 inline h-3 w-3" /> View
                      </Link>
                      <button
                        onClick={() => deleteStudio(s.id)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
