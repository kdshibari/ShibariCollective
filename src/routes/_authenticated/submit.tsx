import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { CONTINENTS } from "@/lib/geo";
import { Plus, X, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/submit")({
  head: () => ({
    meta: [
      { title: "Submit your studio — Shibari Collective" },
      { name: "description", content: "Submit your Shibari studio to be featured in the worldwide directory." },
      { property: "og:title", content: "Submit your studio — Shibari Collective" },
      { property: "og:description", content: "Submit your Shibari studio to be featured in the worldwide directory." },
    ],
  }),
  component: SubmitPage,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(2000).optional(),
  continent: z.string().min(1),
  country: z.string().trim().min(2).max(80),
  city: z.string().trim().min(1).max(80),
  address: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  website: z.string().url().max(255).optional().or(z.literal("")),
  instagram: z.string().max(255).optional(),
  facebook: z.string().max(255).optional(),
  other: z.string().max(255).optional(),
});

function SubmitPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>(["", "", "", "", ""]);
  const [hours, setHours] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    continent: "",
    country: "",
    city: "",
    address: "",
    latitude: "",
    longitude: "",
    email: "",
    phone: "",
    website: "",
    instagram: "",
    facebook: "",
    other: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rs } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      setRoles((rs ?? []).map((r) => r.role));
      setChecking(false);
    });
  }, []);

  async function becomeStudioOwner() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: data.user.id, role: "studio_owner" });
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    setRoles([...roles, "studio_owner"]);
    toast.success("You're now a studio owner");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validPhotos = photos.map((p) => p.trim()).filter(Boolean);
    if (validPhotos.length < 5) {
      toast.error("Please add at least 5 photo URLs.");
      return;
    }
    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Check the form");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: inserted, error } = await supabase
      .from("studios")
      .insert({
        owner_id: userData.user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        continent: parsed.data.continent,
        country: parsed.data.country,
        city: parsed.data.city,
        address: parsed.data.address || null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        website: parsed.data.website || null,
        hours,
        socials: {
          instagram: parsed.data.instagram || undefined,
          facebook: parsed.data.facebook || undefined,
          other: parsed.data.other || undefined,
        },
        status: "approved",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setSaving(false);
      toast.error(error?.message ?? "Failed to create studio");
      return;
    }

    const photoRows = validPhotos.map((url, position) => ({ studio_id: inserted.id, url, position }));
    const { error: pErr } = await supabase.from("studio_photos").insert(photoRows);
    setSaving(false);
    if (pErr) {
      toast.error(pErr.message);
      return;
    }
    toast.success("Studio submitted");
    navigate({ to: "/studios/$id", params: { id: inserted.id } });
  }

  if (checking) return <div className="mx-auto max-w-3xl px-4 py-16">Loading…</div>;

  if (!roles.includes("studio_owner") && !roles.includes("admin")) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="card-warm rounded-2xl p-8">
          <h1 className="font-serif text-3xl text-foreground">Become a studio owner</h1>
          <p className="mt-2 text-muted-foreground">
            To submit a studio you need studio owner access. It's free — one click.
          </p>
          <button
            onClick={becomeStudioOwner}
            className="mt-6 rounded-md bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground hover:opacity-90"
          >
            I own or represent a studio
          </button>
          <Link to="/" className="ml-3 text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-secondary">Studio submission</p>
      <h1 className="mt-3 font-serif text-5xl text-foreground">Submit your studio</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Share your space with the collective. All fields below are required unless marked optional.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-8">
        <Section title="Basics">
          <Input label="Studio name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Textarea label="Description (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        </Section>

        <Section title="Location">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Continent"
              value={form.continent}
              onChange={(v) => setForm({ ...form, continent: v })}
              options={CONTINENTS as unknown as string[]}
              required
            />
            <Input label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
            <Input label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
          </div>
          <Input label="Street address (optional)" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Latitude (optional)" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} type="number" step="any" />
            <Input label="Longitude (optional)" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} type="number" step="any" />
          </div>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Coordinates help us show your studio to nearby practitioners. You can copy them from Google Maps (right-click a location).
          </p>
        </Section>

        <Section title="Photos" hint="Minimum 5 photo URLs — paste image links (JPG/PNG).">
          <div className="space-y-2">
            {photos.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder={`Photo URL #${i + 1}`}
                  value={p}
                  onChange={(e) => {
                    const c = [...photos];
                    c[i] = e.target.value;
                    setPhotos(c);
                  }}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-secondary"
                />
                {photos.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:bg-accent"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPhotos([...photos, ""])}
              className="inline-flex items-center gap-1 text-sm text-secondary hover:underline"
            >
              <Plus className="h-4 w-4" /> Add another photo
            </button>
          </div>
        </Section>

        <Section title="Operating hours">
          <div className="grid gap-2 sm:grid-cols-2">
            {DAYS.map((d) => (
              <div key={d} className="flex items-center gap-2">
                <label className="w-24 text-sm text-muted-foreground">{d}</label>
                <input
                  placeholder="e.g. 10:00 – 22:00 or Closed"
                  value={hours[d] ?? ""}
                  onChange={(e) => setHours({ ...hours, [d]: e.target.value })}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-secondary"
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Contact & socials">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email (optional)" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <Input label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>
          <Input label="Website (optional)" value={form.website} onChange={(v) => setForm({ ...form, website: v })} type="url" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Instagram URL" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
            <Input label="Facebook URL" value={form.facebook} onChange={(v) => setForm({ ...form, facebook: v })} />
            <Input label="Other link" value={form.other} onChange={(v) => setForm({ ...form, other: v })} />
          </div>
        </Section>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Publishing…" : "Submit studio"}
        </button>
      </form>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card-warm rounded-2xl p-6 sm:p-8">
      <h2 className="font-serif text-2xl text-foreground">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Input({
  label, value, onChange, type = "text", required, step,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-secondary"
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-secondary"
      />
    </label>
  );
}

function Select({
  label, value, onChange, options, required,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-secondary"
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
