import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ, Shibari Collective" },
      { name: "description", content: "Frequently asked questions about the Shibari Collective directory, membership, and safety policies." },
    ],
  }),
  component: FAQPage,
});

const faqs = [
  {
    category: "The Platform",
    items: [
      {
        q: "What is the Shibari Collective?",
        a: "It is a curated global directory designed to connect Shibari practitioners with dedicated, trusted rope studios and private spaces around the world."
      },
      {
        q: "Are there membership fees?",
        a: "Creating a Participant profile is completely free, and studio owner verification is also instant and free."
      },
      {
        q: "What features do participants receive?",
        a: "Verified users can browse the global directory, save favorite studios to a curated dashboard, and manage their personal profiles."
      }
    ]
  },
  {
    category: "Studio Owners",
    items: [
      {
        q: "Who can list a space?",
        a: "Only verified studio owners can list a space on the platform."
      },
      {
        q: "What is required for a studio listing?",
        a: "Owners must provide a studio name, continent, country, city, and contact information, and the directory requires a minimum of five photos in JPEG, PNG, or WEBP formats under 5MB each."
      },
      {
        q: "Can I keep my location private?",
        a: "Yes, providing a street address is entirely optional for spaces that operate privately."
      }
    ]
  },
  {
    category: "Trust and Safety",
    items: [
      {
        q: "Does the platform vet practitioners or studios?",
        a: "The Shibari Collective is strictly provided for communication and entertainment purposes, and it does not replace active consent or serve as safety advice."
      },
      {
        q: "Who is responsible for safety during sessions?",
        a: "Users are exclusively responsible for obtaining enthusiastic consent, managing their own physical wellbeing, and ensuring all activities comply with local laws, and the platform creators hold no liability for personal injury or relationship disputes."
      }
    ]
  }
];

function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-32 pt-16 sm:pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-16 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-secondary font-bold mb-4">
            Knowledge Base
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-foreground mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-foreground/60 max-w-xl text-sm sm:text-base leading-relaxed mx-auto sm:mx-0">
            Everything you need to know about the platform, listing your space, and our community guidelines.
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((section, index) => (
            <motion.div 
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <h2 className="font-serif text-3xl text-foreground mb-6 pb-2 border-b border-white/10">
                {section.category}
              </h2>
              <Accordion type="multiple" className="w-full space-y-4">
                {section.items.map((item, i) => (
                  <AccordionItem 
                    key={i} 
                    value={`item_${index}_${i}`} 
                    className="border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl px-6 data-[state=open]:bg-white/10 transition-colors"
                  >
                    <AccordionTrigger className="hover:no-underline py-6 text-left">
                      <span className="font-medium text-base text-foreground pr-4">
                        {item.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-foreground/70 leading-relaxed pb-6">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
