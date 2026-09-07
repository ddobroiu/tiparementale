import type { Block } from "@/lib/articles";

/**
 * Randarea unui articol din blocuri.
 *
 * Tipografia stă aici, nu în text: articolele se scriu ca date, deci nu pot
 * introduce marcaje ciudate, iar dacă se schimbă stilul se schimbă o dată
 * pentru toate.
 */
export function ArticleBody({ body }: { body: Block[] }) {
  return (
    <div className="mt-10 space-y-6">
      {body.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} className="pt-6 font-serif text-2xl leading-snug text-paper">
                {block.text}
              </h2>
            );

          case "p":
            return (
              <p key={i} className="text-[17px] leading-[1.75] text-paper-dim">
                {block.text}
              </p>
            );

          case "ul":
            return (
              <ul key={i} className="space-y-3 border-l border-ink-line pl-5">
                {block.items.map((item, j) => (
                  <li key={j} className="text-[17px] leading-[1.7] text-paper-dim">
                    {item}
                  </li>
                ))}
              </ul>
            );

          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-[color:var(--belief)] py-1 pl-5 font-serif text-xl leading-relaxed text-paper"
              >
                {block.text}
              </blockquote>
            );
        }
      })}
    </div>
  );
}
