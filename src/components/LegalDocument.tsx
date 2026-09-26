import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LEGAL_EFFECTIVE, LEGAL_VERSION_LABEL } from "@/lib/legal";

export interface LegalSection {
  title: string;
  paragraphs: React.ReactNode[];
}

/** Macheta comună a documentelor legale: titlu, versiune, secțiuni numerotate. */
export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm text-paper-faint">
          {LEGAL_VERSION_LABEL}, în vigoare de la {LEGAL_EFFECTIVE}
        </p>
        {intro && <div className="mt-6 leading-relaxed text-paper-dim">{intro}</div>}

        <div className="mt-12 space-y-10">
          {sections.map((section, n) => (
            <section key={section.title} className="border-t border-ink-line pt-8">
              <h2 className="font-serif text-2xl text-paper">
                {n + 1}. {section.title}
              </h2>
              <div className="mt-4 space-y-3">
                {section.paragraphs.map((text, i) => (
                  <div key={i} className="leading-relaxed text-paper-dim">
                    {text}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

/** Link extern în textul documentelor legale. */
export function Ext({ href, children }: { href: string; children?: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-paper underline underline-offset-4"
    >
      {children ?? href}
    </a>
  );
}
