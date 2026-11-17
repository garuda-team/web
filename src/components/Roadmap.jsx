import { GhostWord, SplitWords } from "./Reveal.jsx";
import { ghosts, roadmap } from "../content.js";

export default function Roadmap() {
  return (
    <section id="roadmap" className="section surface-paper roadmap" data-surface="paper" aria-labelledby="roadmap-title">
      <GhostWord text={ghosts.roadmap} />
      <div className="wrap">
        <div className="section-head">
          <SplitWords as="h2" className="h2" id="roadmap-title" text={roadmap.title} />
        </div>
        <ol className="roadmap__list">
          {roadmap.quarters.map((q) => (
            <li key={q.label} className="roadmap__item" aria-current={q.current ? "step" : undefined} data-current={q.current ? "true" : undefined}>
              <h3 className="roadmap__quarter">
                {q.label}
                {q.current ? <span className="roadmap__badge">{roadmap.currentLabel}</span> : null}
              </h3>
              <ul className="roadmap__points">
                {q.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
