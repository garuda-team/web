import { ui } from "../content.js";
import { fill } from "../lib/text.jsx";
import { inV2Folder, sdgLogo } from "../lib/photos.js";


export default function SdgPage() {
  const t = ui.sdg;
  const emblem = inV2Folder("sdg").find((x) => x.base === "emblem");
  return (
    <section id="page-sdg" className="section sdg surface-paper" data-surface="paper" data-wave aria-labelledby="page-sdg-title">
      <div className="wrap">
        <header className="sdg__head">
          {emblem ? <img className="sdg__emblem" src={emblem.url} alt={t.emblemAlt} loading="lazy" decoding="async" /> : null}
          <h1 id="page-sdg-title" className="h2 sdg__title">{t.title}</h1>
          <p className="lead sdg__lead">{t.lead}</p>
        </header>
        {t.items.map((it) => {
          const logo = sdgLogo(it.n);
          const id = `sdg-${it.n}`;
          return (
            <section key={it.n} id={id} className="sdg__item" aria-labelledby={`${id}-title`}>
              {logo ? (
                <img className="sdg__logo" src={logo.url} alt={fill(t.logoAlt, { n: it.n })} width="160" height="160" loading="lazy" decoding="async" />
              ) : null}
              <div className="sdg__body">
                <p className="sdg__num">{fill(t.goal, { n: it.n })}</p>
                <h2 id={`${id}-title`} className="sdg__name">{it.title}</h2>
                <h3 className="sdg__why-head">{t.whyHead}</h3>
                <p className="sdg__why">{it.why}</p>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
