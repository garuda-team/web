import { useEffect, useState } from "react";
import { GhostWord, SplitWords } from "./Reveal.jsx";
import { ghosts, ui } from "../content.js";
import { routeHash } from "../lib/route.js";
import { Rich } from "../lib/text.jsx";

const KPI_IDS = ["nativeBcn", "sparrow", "growthBcn", "cropLoss", "chlamydia"];

/* Home: the essentials of Stats, taken from existing content, each linking to its tab. */
export default function HomeHighlights() {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);

  /* The stats data is a separate chunk: fetched here only after the home mounts. */
  useEffect(() => {
    let live = true;
    import("../content.stats.js")
      .then((m) => m.loadStats())
      .then((s) => live && setStats(s))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const all = stats?.blocks?.[0]?.kpis ?? [];
  const kpis = KPI_IDS.map((id) => all.find((k) => k.id === id)).filter(Boolean);
  const statsLabel = ui.nav.pageLinks.find((p) => p.path === "/stats")?.label ?? ui.highlights.stats.title;

  return (
    <section id="highlights" className="section surface-paper highlights" data-surface="paper" aria-labelledby="highlights-st">
      <GhostWord text={ghosts.stats} />
      <div className="wrap">
        <div className="section-head">
          <SplitWords as="h2" className="h2" id="highlights-st" text={statsLabel} />
        </div>
        <ul className="highlights__list">
          <li className="highlight">
            {stats ? <p className="highlight__lead"><Rich text={stats.lede} /></p> : <p className="highlight__lead" role="status">{failed ? ui.highlights.stats.error : ui.highlights.stats.loading}</p>}
            {kpis.length ? (
              <ul className="stats__kpis highlight__kpis" aria-label={ui.statsPage.kpis}>
                {kpis.map((k) => (
                  <li key={k.id} className="stats__kpi highlight__kpi">
                    <p className="stats__kpi-value">{k.value}</p>
                    <p className="stats__kpi-label">{k.label}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            <a className="highlight__link" href={routeHash("/stats")}>{ui.highlights.stats.cta}</a>
          </li>
        </ul>
      </div>
    </section>
  );
}
