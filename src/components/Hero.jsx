import { GhostWord, SplitWords } from "./Reveal.jsx";
import { ghosts, hero, team, ui } from "../content.js";
import { Rich, joinNames } from "../lib/text.jsx";

export default function Hero() {
  const names = joinNames(team.members.map((m) => m.name));

  return (
    <section id="top" className="hero wave surface-paper" data-surface="paper" data-wave>
      <GhostWord text={ghosts.top} />
      <div className="wrap">
        <div className="hero__text">
          <SplitWords as="h1" className="hero__title" text={hero.title} gate delay={150} />
          <p className="hero__intro"><Rich text={hero.intro} /></p>
          <p className="hero__by">
            {ui.hero.by} <Rich text={names} />
          </p>
        </div>
      </div>
    </section>
  );
}
