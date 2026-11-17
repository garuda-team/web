import { Rich } from "../lib/text.jsx";
import { site, ui } from "../content.js";
import { BrandMark } from "./Nav.jsx";
import { smoothScrollToTop } from "../lib/motion.js";
import { fill } from "../lib/text.jsx";
import CookieNotice from "./CookieNotice.jsx";
import { sdgLogo } from "../lib/photos.js";

export default function Footer() {
  const t = ui.footer;
  const l = t.links;
  const goTop = (e) => {
    e.preventDefault();
    smoothScrollToTop();
  };
  return (
    <footer className="footer surface-ink" data-surface="ink">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__brand-block">
            <a className="footer__brand-link" href="#/" aria-label={site.teamName}>
              <BrandMark size={18} />
              <span className="footer__brand-name"><Rich text={site.teamName} /></span>
            </a>
            <p className="footer__tagline">{t.tagline}</p>
            <nav className="footer__sdg" aria-label={ui.sdg.footerTitle}>
              <ul className="footer__sdg-list">
                {ui.sdg.items.map((it) => {
                  const logo = sdgLogo(it.n);
                  if (!logo) return null;
                  const label = `${fill(ui.sdg.goal, { n: it.n })} – ${it.title}`;
                  return (
                    <li key={it.n}>
                      <a className="footer__sdg-link" href={`#/sdg/sdg-${it.n}`} aria-label={label} title={label}>
                        <img className="footer__sdg-logo" src={logo.url} alt="" width="64" height="64" loading="lazy" decoding="async" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <nav className="footer__cols" aria-label={t.projectTitle}>
            <div className="footer__col">
              <h3 className="footer__head">{t.projectTitle}</h3>
              <ul>
                <li><a href="#/home/roadmap">{l.roadmap}</a></li>
                <li><a href="#/hardware">{l.hardware}</a></li>
                <li><a href="#/software">{l.software}</a></li>
                <li><a href="#/team">{l.team}</a></li>
              </ul>
            </div>

            <div className="footer__col">
              <h3 className="footer__head">{t.contactTitle}</h3>
              <ul>
                <li><a href="#/home/contact">{l.contact}</a></li>
                <li>
                  <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="footer__base">
          <span className="footer__copy">
            © {site.year} <Rich text={site.teamName} />. {t.rights}
          </span>
          <a className="footer__top-link" href="#/" onClick={goTop}>{t.top} ↑</a>
        </div>
      </div>
      <CookieNotice />
    </footer>
  );
}
