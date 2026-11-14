import { ghosts, ui } from "../content.js";
import { Rich } from "../lib/text.jsx";
import { GhostWord, SplitWords } from "./Reveal.jsx";
import { TeamMembers } from "./Team.jsx";
import SoftwareDiagram from "./SoftwareDiagram.jsx";

/* Ghost word per page: falls back to the page title when no ghost is defined. */
function ghostFor(page, fallback) {
  const map = ghosts.stubs || {};
  return map[page] || fallback;
}

export default function StubPage({ page }) {
  const { title, lead, text, sections } = ui.stubPages[page];
  const id = `page-${page}`;
  const ghost = ghostFor(page, title);
  return (
    <section id={id} className="section stub wave surface-paper" data-surface="paper" data-wave aria-labelledby={`${id}-title`}>
      <GhostWord text={ghost} />
      <div className="wrap">
        <div className="section-head stub__head">
          <SplitWords as="h1" className="h2 stub__title" text={title} />
          {lead ? <p className="lead stub__lead"><Rich text={lead} /></p> : null}
          {text ? <p className="lead stub__lead"><Rich text={text} /></p> : null}
        </div>
        {page === "team" ? <TeamMembers nameTag="h2" /> : null}
        {page === "software" ? <SoftwareDiagram /> : null}
        {sections?.length ? (
          <ol className="stub__cards">
            {sections.map((s, i) => (
              <li key={i} className="stub__card phase">
                <div className="phase__marker" aria-hidden="true">
                  <span>{i + 1}</span>
                </div>
                <h2 className="phase__title stub__card-title">{s.title}</h2>
                <p className="phase__text stub__card-text"><Rich text={s.text} /></p>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
