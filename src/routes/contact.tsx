import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Shibari Collective" },
      { name: "description", content: "Send us a message. We reply to every inquiry from studios and practitioners." },
      { property: "og:title", content: "Contact — Shibari Collective" },
      { property: "og:description", content: "Send us a message. We reply to every inquiry from studios and practitioners." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(5).max(5000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please check the form");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-secondary">Get in touch</p>
      <h1 className="mt-3 font-serif text-5xl text-foreground">Contact us</h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        Questions, feedback, or want to partner? Send a message — we usually reply within a couple of days.
      </p>

      {sent ? (
        <div className="card-warm mt-10 rounded-2xl p-8 text-center">
          <h2 className="font-serif text-2xl text-foreground">Thanks — we got it.</h2>
          <p className="mt-2 text-sm text-muted-foreground">We'll be in touch soon.</p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card-warm mt-10 space-y-4 rounded-2xl p-6 sm:p-8">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
            <input
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-secondary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              required
              type="email"
              maxLength={255}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-secondary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea
              required
              rows={6}
              maxLength={5000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-secondary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
