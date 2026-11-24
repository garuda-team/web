import { preloadPage } from "../lib/lazyPages.js";
import { useEffect, useRef, useState } from "react";
import { site, ui } from "../content.js";
import { routeHash } from "../lib/route.js";
import { Rich } from "../lib/text.jsx";
import { Icon } from "./Icons.jsx";
import { LANG, LANGS, setLang } from "../lib/lang.js";
import { inV2Folder } from "../lib/photos.js";

const SAMPLE_X = [0.5, 0.25, 0.75, 0.1, 0.9];

const brandPhoto = () => inV2Folder("logo").find((x) => x.type === "image");

/* Team logo. Decorative by default (the name sits next to it); pass alt where it stands alone.
   invert flips the colour scale (not the layout) on green grounds; the nav does it in CSS. */
export function BrandMark({ size = 12, alt = "", invert = false, className = "" }) {
  const photo = brandPhoto();
  if (!photo) return null;
  const width = Math.round(size * (1315 / 1197));
  return (
    <img
      className={`brand-mark${invert ? " brand-mark--invert" : ""}${className ? ` ${className}` : ""}`}
      src={photo.url}
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
      width={width}
      height={size}
      style={{ "--brand-size": size }}
      decoding="async"
    />
  );
}

export default function Nav({ route }) {
  const LINKS = Object.entries(ui.nav.links[route] ?? {});
  const ref = useRef(null);
  const [surface, setSurface] = useState("paper");
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const menuBtn = useRef(null);
  const [chosen, setChosen] = useState(LANG);

  useEffect(() => {
    let frame = 0;
    let surfaces = document.querySelectorAll("[data-surface]");
    const refresh = () => {
      surfaces = document.querySelectorAll("[data-surface]");
    };
    const update = () => {
      frame = 0;
      const bar = ref.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const y = rect.bottom + 2;
      const sy = rect.top + rect.height / 2; /* sample mid-bar: the 12px frame margin must not decide */
      /* geometry, not elementFromPoint: the sticky nav itself would be hit. Innermost (last in DOM order) wins. */
      let holder = null;
      for (const f of SAMPLE_X) {
        const x = window.innerWidth * f;
        for (let i = surfaces.length - 1; i >= 0; i--) {
          const r = surfaces[i].getBoundingClientRect();
          if (r.top <= sy && sy < r.bottom && r.left <= x && x < r.right) {
            holder = surfaces[i];
            break;
          }
        }
        if (holder) break;
      }
      if (holder) {
        setSurface(holder.dataset.surface);
      }
      let current = "";
      for (const [id] of LINKS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= y + 80) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", refresh);
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", refresh);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  useEffect(() => {
    setOpen(false);
  }, [route]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      menuBtn.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);
  const pages = ui.nav.pageLinks.map((p) => (
    <a key={p.path} href={`#${p.path}`} className="nav__link" aria-current={route === p.path ? "page" : undefined} onClick={close} onPointerEnter={() => preloadPage(p.path)} onFocus={() => preloadPage(p.path)}>
      {p.label}
    </a>
  ));
  const links = LINKS.map(([id, label]) => (
    <a key={id} href={routeHash(route, id)} className="nav__link nav__link--sub" aria-current={active === id ? "true" : undefined} onClick={close}>
      {label}
    </a>
  ));
  const langSelect = (cls) => (
    <select className={`nav__lang ${cls}`} value={chosen}
      aria-label={ui.nav.language}
      onChange={(e) => {
        const code = e.target.value;
        setChosen(code);
        if (!setLang(code)) setChosen(LANG);
      }}>
      {LANGS.map((l) => (
        <option key={l.code} value={l.code} lang={l.code} title={l.name}>
          {l.code.toUpperCase()}
        </option>
      ))}
    </select>
  );
  const sub = links.length ? (
    <nav className="nav__sub" aria-label={ui.nav.sections}>
      <div className="wrap nav__sub-inner">{links}</div>
    </nav>
  ) : null;

  return (
    <header ref={ref} className={`nav surface-${surface}`}>
      <div className="wrap nav__bar">
        <a href="#/" className="nav__brand" onClick={close}>
          <BrandMark />
          <span className="nav__team">
            <Rich text={site.teamName} />
          </span>
        </a>
        <nav className="nav__links" aria-label={ui.nav.pages}>
          {pages}
        </nav>
        <div className="nav__end">
          {langSelect("nav__lang--bar")}
          <button
            type="button"
            ref={menuBtn}
            className="nav__menu"
            aria-expanded={open}
            aria-controls="nav-sheet"
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "close" : "menu"} size={20} />
            <span className="sr-only">{ui.nav.sections}</span>
          </button>
        </div>
      </div>
      {sub}
      <nav id="nav-sheet" className="nav__sheet" hidden={!open} aria-label={ui.nav.sheet}>
        <div className="wrap nav__sheet-inner">
          {pages}
          {links.length ? <hr className="nav__rule" /> : null}
          {links}
        </div>
      </nav>
    </header>
  );
}
