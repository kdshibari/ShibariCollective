import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | The Shibari Collective" },
      { name: "description", content: "Send us a message." },
      { property: "og:title", content: "Contact | The Shibari Collective" },
      { property: "og:description", content: "Send us a message." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(255),
  message: z.string().trim().min(5, "Your message is too short.").max(5000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [botField, setBotField] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // Honeypot: bots fill every field; pretend success and drop it.
    if (botField) {
      setSent(true);
      return;
    }

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      // .issues works on zod v3 and v4 (v4 removed .errors, which made this line crash).
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    setLoading(false);

    if (error) {
      console.error("Contact form error:", error);
      toast.error("Your message could not be sent. Please try again or email theshibaricollective@gmail.com.");
      return;
    }

    setSent(true);
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-secondary">Get in touch</p>
      <h1 className="mt-3 font-serif text-5xl text-foreground">Contact Us</h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        Questions, feedback, or want to partner? Send a message, we usually reply within a couple of days.
      </p>

      {sent ? (
        <div className="card-warm mt-10 rounded-2xl p-8 text-center">
          <h2 className="font-serif text-2xl text-foreground">Thanks! We got it.</h2>
          <p className="mt-2 text-sm text-muted-foreground">We'll be in touch soon.</p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card-warm mt-10 space-y-4 rounded-2xl p-6 sm:p-8 relative">
          <div className="absolute opacity-0 -z-10 h-0 w-0 overflow-hidden" aria-hidden="true">
            <label>Leave this field blank</label>
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" value={botField} onChange={(e) => setBotField(e.target.value)} />
          </div>
          <div>
            <label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
            <input
              id="contact-name"
              autoComplete="name"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-secondary"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              id="contact-email"
              autoComplete="email"
              required
              type="email"
              maxLength={255}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-secondary"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea
              id="contact-message"
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
            {loading ? "Sending..." : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
