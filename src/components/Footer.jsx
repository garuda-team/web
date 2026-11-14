import { Rich } from "../lib/text.jsx";
import { site, ui } from "../content.js";
import { BrandMark } from "./Nav.jsx";
import { smoothScrollToTop } from "../lib/motion.js";

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
          </div>

          <nav className="footer__cols" aria-label={t.projectTitle}>
            <div className="footer__col">
              <h3 className="footer__head">{t.projectTitle}</h3>
              <ul>
                <li><a href="#/home/project">{l.roadmap}</a></li>
                <li><a href="#/home/phases">{l.stages}</a></li>
                <li><a href="#/home/team">{l.team}</a></li>
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
    </footer>
  );
}
