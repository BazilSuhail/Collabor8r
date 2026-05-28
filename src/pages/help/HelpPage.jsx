// feat(pages/help/HelpPage): offer searchable product guides and answers to common questions.
import { useEffect, useState } from "react";
import { useViewEntry, fadeUp, bindLift } from "../../utils/motion.js";
import { HELP_FAQ, HELP_GUIDES } from "../../metadata/help.js";
import { emptyCopy } from "../../metadata/empty.js";
import PageHead from "../../components/layout/PageHead.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Highlight from "../../components/ui/Highlight.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import Input from "../../components/ui/Input.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import GuideSheet from "./components/GuideSheet.jsx";

const SEARCH_DEBOUNCE_MS = 250;

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(null);

  // Debounced search. Real time, so reduced motion does not change it.
  useEffect(() => {
  const id = setTimeout(() => setTerm(query.trim()), SEARCH_DEBOUNCE_MS);
  return () => clearTimeout(id);
  }, [query]);

  useViewEntry(
 "help",
  ({ q, root }) => {
  fadeUp(q("[data-enter]"), { y: 14, stagger: 0.05 });
  return bindLift(root);
  },
  [],
  );

  const needle = term.toLowerCase();
  const guides = HELP_GUIDES.filter(
  (g) => !needle || [g.title, g.summary, ...g.steps].join(" ").toLowerCase().includes(needle),
  );
  const faq = HELP_FAQ.filter((f) => !needle || `${f.q} ${f.a}`.toLowerCase().includes(needle));
  const nothing = !guides.length && !faq.length;

  return (
  <>
  <PageHead title="Help" sub="Guides and answers for the things people ask most." />

  <div className="mb-[20px] flex flex-wrap items-center justify-between gap-[24px]" data-enter>
  <div className=" flex-1 min-w-[260px]">
  <Input
  variant="search"
  label="Search help"
  hideLabel
  placeholder="Search guides and questions"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  />
  </div>
  <Illustration name="wiki" alt="" className="w-[140px] w1000:hidden" />
  </div>

  {nothing ? <EmptyState {...emptyCopy("help")} /> : null}

  {guides.length ? (
  <section className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[var(--gap)] w1100:grid-cols-[repeat(2,minmax(0,1fr))] w560:grid-cols-[minmax(0,1fr)] mb-[24px]">
  {guides.map((g) => (
  <button
  key={g.id}
  type="button"
  data-lift
  data-enter
  onClick={() => setActive(g)}
  className="card p-[20px] text-left grid gap-[10px] hover:shadow-[var(--shadow-lift)]"
  >
  <span className="grid place-items-center size-[40px] rounded-[12px] bg-[color:var(--ember-soft)] text-[color:var(--ember-t)]">
  <Icon name={g.icon} />
  </span>
  <span className="font-bold text-text text-[15px]">
  <Highlight text={g.title} query={term} />
  </span>
  <span className="text-muted text-[13.5px] leading-[1.5]">
  <Highlight text={g.summary} query={term} />
  </span>
  </button>
  ))}
  </section>
  ) : null}

  {faq.length ? (
  <section className="card p-[20px]" data-enter>
  <h2 className="flex items-center gap-[8px] [font:600_17px_var(--display)] tracking-[-0.01em] text-text mb-[8px]">
  <span className="text-muted">
  <Icon name="help" />
  </span>
  Common questions
  </h2>
  <div className="grid">
  {faq.map((f) => (
  <details key={f.id} className="py-[14px] not-first:border-t not-first:border-line">
  <summary className="cursor-pointer font-bold text-text list-none">
  <Highlight text={f.q} query={term} />
  </summary>
  <p className="mt-[8px] text-muted text-[14px] leading-[1.6]">
  <Highlight text={f.a} query={term} />
  </p>
  </details>
  ))}
  </div>
  </section>
  ) : null}

  <GuideSheet guide={active} open={active !== null} onClose={() => setActive(null)} />
  </>
  );
}
