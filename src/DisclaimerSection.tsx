import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function DisclaimerSection() {
  return (
    <div className="mx-auto max-w-3xl mt-12 mb-8 px-4 text-left">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="disclaimer" className="border border-white/10 bg-background/50 rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Disclaimer and Terms of Use
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground/80 space-y-4 pb-4 leading-relaxed">
            <p>By accessing or using Shibari Collective, you explicitly agree to the following terms.</p>
            <ul className="space-y-3 list-disc pl-4">
              <li>
                <strong className="text-foreground/90">Educational Purpose Only:</strong> This application is provided strictly for communication and entertainment purposes. It does not constitute medical, psychological, or relationship advice.
              </li>
              <li>
                <strong className="text-foreground/90">Assumption of Risk:</strong> Engaging in intimate dynamics involves inherent physical and psychological risks. You acknowledge these risks and agree that you are solely responsible for your own safety and wellbeing.
              </li>
              <li>
                <strong className="text-foreground/90">Absolute User Responsibility:</strong> This tool does not guarantee or replace active consent. You are exclusively responsible for obtaining and maintaining enthusiastic consent at all times. You are also solely responsible for ensuring all activities comply with your local laws.
              </li>
              <li>
                <strong className="text-foreground/90">Limitation of Liability:</strong> To the maximum extent permitted by law, the creator and developers of Shibari Collective shall not be held liable for any direct, indirect, incidental, or consequential damages arising from your use of this tool. This absolute release of liability includes all claims related to personal injury, emotional distress, or relationship disputes.
              </li>
              <li>
                <strong className="text-foreground/90">Data Privacy and Sharing:</strong> You are entirely responsible for the distribution of your generated links. The creator accepts no liability for how your partners or others handle your shared information once you generate a link.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
