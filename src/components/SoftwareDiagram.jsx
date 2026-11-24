import { ui } from "../content.js";

/*
  High-level architecture of the Garuda platform, in the site palette.
  Non-technical: no vendor names. Flow goes top to bottom.
  SVG is responsive (viewBox) and uses CSS vars so it reads in every surface.
*/
export default function SoftwareDiagram() {
  const t = ui.softwareDiagram;
  return (
    <figure className="sw-diagram" aria-labelledby="sw-diagram-title">
      <figcaption id="sw-diagram-title" className="sw-diagram__caption">{t.caption}</figcaption>
      <svg
        className="sw-diagram__svg"
        viewBox="0 0 720 620"
        role="img"
        aria-label={t.caption}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker id="sw-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M2 1 L8 5 L2 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Row 1 — Casitas */}
        <g className="sw-diagram__row sw-diagram__row--devices">
          {[60, 285, 510].map((x, i) => (
            <g key={i} transform={`translate(${x}, 20)`}>
              <rect width="150" height="80" rx="12" className="sw-box sw-box--devices" />
              <g transform="translate(75, 30)" className="sw-icon" aria-hidden="true">
                {/* small bird house glyph */}
                <path d="M -18 6 L 0 -12 L 18 6 L 18 20 L -18 20 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="0" cy="12" r="3" fill="currentColor" />
                <line x1="0" y1="-12" x2="0" y2="-20" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="0" cy="-22" r="1.6" fill="currentColor" />
              </g>
              <text x="75" y="70" textAnchor="middle" className="sw-label">{t.device[i]}</text>
            </g>
          ))}
        </g>

        {/* Arrows: devices → secure gateway */}
        <g className="sw-diagram__arrows">
          <path d="M 135 100 Q 135 130 360 150" className="sw-arr" markerEnd="url(#sw-arrow)" />
          <path d="M 360 100 L 360 150" className="sw-arr" markerEnd="url(#sw-arrow)" />
          <path d="M 585 100 Q 585 130 360 150" className="sw-arr" markerEnd="url(#sw-arrow)" />
        </g>
        <text x="380" y="135" className="sw-link">{t.linkSecure}</text>

        {/* Row 2 — Secure connection */}
        <g transform="translate(160, 160)">
          <rect width="400" height="64" rx="12" className="sw-box sw-box--link" />
          <text x="200" y="30" textAnchor="middle" className="sw-title">{t.secure.title}</text>
          <text x="200" y="50" textAnchor="middle" className="sw-sub">{t.secure.sub}</text>
        </g>

        <path d="M 360 224 L 360 270" className="sw-arr" markerEnd="url(#sw-arrow)" />

        {/* Row 3 — Processing */}
        <g transform="translate(160, 280)">
          <rect width="400" height="64" rx="12" className="sw-box sw-box--process" />
          <text x="200" y="30" textAnchor="middle" className="sw-title">{t.process.title}</text>
          <text x="200" y="50" textAnchor="middle" className="sw-sub">{t.process.sub}</text>
        </g>

        {/* branch to two stores */}
        <path d="M 260 344 Q 200 370 155 395" className="sw-arr" markerEnd="url(#sw-arrow)" />
        <path d="M 460 344 Q 520 370 565 395" className="sw-arr" markerEnd="url(#sw-arrow)" />

        {/* Row 4 — Storage */}
        <g transform="translate(10, 400)">
          <rect width="290" height="90" rx="12" className="sw-box sw-box--store" />
          <text x="145" y="34" textAnchor="middle" className="sw-title">{t.raw.title}</text>
          <text x="145" y="55" textAnchor="middle" className="sw-sub">{t.raw.sub}</text>
          <text x="145" y="73" textAnchor="middle" className="sw-sub sw-sub--dim">{t.raw.hint}</text>
        </g>
        <g transform="translate(420, 400)">
          <rect width="290" height="90" rx="12" className="sw-box sw-box--store" />
          <text x="145" y="34" textAnchor="middle" className="sw-title">{t.curated.title}</text>
          <text x="145" y="55" textAnchor="middle" className="sw-sub">{t.curated.sub}</text>
          <text x="145" y="73" textAnchor="middle" className="sw-sub sw-sub--dim">{t.curated.hint}</text>
        </g>

        <path d="M 155 490 L 155 540" className="sw-arr" markerEnd="url(#sw-arrow)" />
        <path d="M 565 490 L 565 540" className="sw-arr" markerEnd="url(#sw-arrow)" />

        {/* Row 5 — Serving */}
        <g transform="translate(10, 550)">
          <rect width="290" height="56" rx="12" className="sw-box sw-box--serve" />
          <text x="145" y="26" textAnchor="middle" className="sw-title">{t.serve.title}</text>
          <text x="145" y="44" textAnchor="middle" className="sw-sub">{t.serve.sub}</text>
        </g>
        <g transform="translate(420, 550)">
          <rect width="290" height="56" rx="12" className="sw-box sw-box--web" />
          <text x="145" y="26" textAnchor="middle" className="sw-title">{t.web.title}</text>
          <text x="145" y="44" textAnchor="middle" className="sw-sub">{t.web.sub}</text>
        </g>
      </svg>

      {/* Narrow screens: same texts as a vertical flow of boxes */}
      <ol className="sw-flow">
        <li className="sw-flow__step">
          <div className="sw-flow__box sw-flow__box--devices">
            {t.device.map((d) => (
              <span key={d} className="sw-flow__chip">{d}</span>
            ))}
          </div>
          <span className="sw-flow__link" aria-hidden="false">{t.linkSecure}</span>
        </li>
        {[
          ["link", t.secure],
          ["process", t.process],
        ].map(([k, b]) => (
          <li key={k} className="sw-flow__step">
            <div className={`sw-flow__box sw-flow__box--${k}`}>
              <strong className="sw-flow__title">{b.title}</strong>
              <span className="sw-flow__sub">{b.sub}</span>
            </div>
          </li>
        ))}
        {[
          ["store", t.raw, true],
          ["store", t.curated, true],
          ["serve", t.serve],
          ["web", t.web],
        ].map(([k, b, hint], i) => (
          <li key={i} className={`sw-flow__step${i === 2 ? " sw-flow__step--split" : ""}`}>
            <div className={`sw-flow__box sw-flow__box--${k}`}>
              <strong className="sw-flow__title">{b.title}</strong>
              <span className="sw-flow__sub">{b.sub}</span>
              {hint && <span className="sw-flow__sub sw-flow__sub--dim">{b.hint}</span>}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
