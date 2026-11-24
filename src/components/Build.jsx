import { useEffect, useRef, useState } from "react";
import { GhostWord, SplitWords } from "./Reveal.jsx";
import { ghosts, phasesPreview, ui } from "../content.js";
import { routeHash } from "../lib/route.js";
import { Rich, fill } from "../lib/text.jsx";
import { pad2 } from "../lib/hooks.js";
import { named, startingWith } from "../lib/photos.js";

function Chevron({ dir = "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

/* Where a step's picture comes from: a named file in photos/steps (optional), a model snapshot (home_model, by number). */
function pictureOf(step) {
  const own = step.photo ? named("steps", step.photo)[0] : null;
  if (own) return { url: own.url, contain: true, diagram: true };
  const model = step.model ? startingWith("home_model", step.model)[0] : null;
  if (model) return { url: model.url, contain: false };
  const shot = step.image?.photo ? named("steps", step.image.photo)[0] : null;
  if (shot) return { url: shot.url, contain: false };
  return null;
}

/* The privacy flow as an ordered list: the list is the accessible version of the diagram. */
function PrivacyFlow() {
  const p = phasesPreview.privacy;
  const last = p.flow.length - 1;
  return (
    <div className="privacy" tabIndex={0} role="region" aria-label={p.title}>
      <ol className="privacy__flow" aria-label={p.list}>
        {p.flow.map((node, i) => (
          <li key={node.label} className="privacy__node" data-kept={i >= last - 1 ? "yes" : "no"}>
            <span className="privacy__label">{node.label}</span>
            <span className="privacy__note">{node.note}</span>
            {i === last - 1 ? <span className="privacy__tag">{p.kept}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Front({ step, n, picture, children }) {
  return (
    <>
      <div className="fcard__stage">
      {step.visual === "privacy" ? (
        <PrivacyFlow />
      ) : step.visual === "future" ? (
        <div className="fcard__badge" aria-hidden="true">{step.badge}</div>
      ) : picture ? (
        <div className="fcard__media" data-fit={picture.contain ? "contain" : "cover"} data-kind={picture.diagram ? "diagram" : undefined}>
          <img src={picture.url} alt={step.alt || step.image?.alt || ""} loading="lazy" decoding="async" />
        </div>
      ) : (
        <div className="fcard__media fcard__media--empty" aria-hidden="true" />
      )}
      {children}
      </div>
      <div className="fcard__bar">
        <span className="fcard__num" aria-hidden="true">{pad2(n)}</span>
        <div className="fcard__titles">
          <h3 className="fcard__title">{step.title}</h3>
          {step.sub ? <p className="fcard__sub">{step.sub}</p> : null}
        </div>
      </div>
    </>
  );
}

/* One card: picture in front, text behind. Only the visible face is exposed to tab order and screen readers. */
function Card({ step, n, total }) {
  const [flipped, setFlipped] = useState(false);
  const hasBack = step.text.length > 0;
  const picture = pictureOf(step);
  const flipLabel = fill(ui.build.flipLabel, { title: step.title });
  const frontBtn = useRef(null);
  const backBtn = useRef(null);
  const moved = useRef(false);
  /* The pressed button sits in the face that becomes hidden: hand focus to the twin control on the visible face. */
  useEffect(() => {
    if (!moved.current) return;
    (flipped ? backBtn : frontBtn).current?.focus();
  }, [flipped]);
  const flip = (to) => {
    moved.current = true;
    setFlipped(to);
  };
  return (
    <article className="fcard" data-flipped={flipped ? "yes" : "no"} aria-roledescription="card" aria-label={fill(ui.build.cardOf, { n, total })}>
      <div className="fcard__inner">
        <div className="fcard__face fcard__face--front" aria-hidden={flipped} inert={flipped}>
          <Front step={step} n={n} picture={picture}>
            {hasBack ? (
              <button ref={frontBtn} type="button" className="btn fcard__flip" aria-label={flipLabel} aria-expanded={flipped} onClick={() => flip(true)}>
                {ui.build.flip}
              </button>
            ) : null}
          </Front>
        </div>
        {hasBack ? (
          <div className="fcard__face fcard__face--back" aria-hidden={!flipped} inert={!flipped}>
            <div className="fcard__copy" tabIndex={flipped ? 0 : -1} role="group" aria-label={step.title}>
              <p className="fcard__kicker"><span aria-hidden="true">{pad2(n)}</span> {step.title}</p>
              {step.text.map((t, i) => (
                <p key={i} className="fcard__text"><Rich text={t} /></p>
              ))}
            </div>
            <button ref={backBtn} type="button" className="btn fcard__flip" onClick={() => flip(false)}>
              {ui.build.flipBack}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function Build({ id = "build", data, preview = false }) {
  const total = data.steps.length;
  const [active, setActive] = useState(0);
  const go = (i) => setActive(Math.max(0, Math.min(total - 1, i)));
  const step = data.steps[active];
  const ctaBar = useRef(null);
  /* The sticky CTA yields (hidden) while it would sit on top of the card bar or the dock, so it never covers a control. */
  useEffect(() => {
    const bar = ctaBar.current;
    if (!preview || !bar) return undefined;
    let raf = 0;
    const hits = (a, b) => b && a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left;
    const check = () => {
      raf = 0;
      const btn = bar.firstElementChild;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const root = bar.closest(".build");
      const over = [".fcard__bar", ".build__dock"].some((q) => {
        const el = root?.querySelector(q);
        return el && hits(r, el.getBoundingClientRect());
      });
      /* Never hide the CTA while it holds focus. */
      bar.dataset.yield = over && !bar.contains(document.activeElement) ? "yes" : "no";
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    bar.addEventListener("focusin", queue);
    bar.addEventListener("focusout", queue);
    /* Card flips or height changes move the bars without any scroll: observe the layout boxes involved. */
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(queue);
      const root = bar.closest(".build");
      [".build__cards", ".fcard", ".fcard__bar", ".build__dock"].forEach((q) => {
        const el = root?.querySelector(q);
        if (el) ro.observe(el);
      });
      ro.observe(bar);
    }
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      bar.removeEventListener("focusin", queue);
      bar.removeEventListener("focusout", queue);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [preview, active]);
  return (
    <section id={id} className="section build surface-paper" data-surface="paper" data-wave aria-labelledby={`${id}-title`}>
      <GhostWord text={ghosts.steps} />
      <div className="build__frame" data-surface="paper">
        <div className="wrap">
          <div className="section-head">
            <SplitWords as="h2" className="h2" id={`${id}-title`} text={data.title} />
            {data.lead ? <p className="lead"><Rich text={data.lead} /></p> : null}
          </div>

          <div className="build__cards" role="region" aria-roledescription="carousel" aria-label={data.title}>
            {/* Only the current card is rendered; key resets it to its front on every change. */}
            <Card key={active} step={step} n={active + 1} total={total} />
            <div className="build__dock">
              <button type="button" className="build__nav" onClick={() => go(active - 1)} disabled={active === 0} aria-label={ui.build.prev}>
                <Chevron dir="left" />
              </button>
              <span className="build__counter" aria-hidden="true">
                <strong>{pad2(active + 1)}</strong>
                <span>/</span>
                <span>{pad2(total)}</span>
              </span>
              <button type="button" className="build__nav" onClick={() => go(active + 1)} disabled={active === total - 1} aria-label={ui.build.next}>
                <Chevron dir="right" />
              </button>
              <ol className="build__dots" aria-label={ui.build.progress}>
                {data.steps.map((s, i) => (
                  <li key={s.title}>
                    <button type="button" className="build__dot" data-state={i === active ? "now" : i < active ? "done" : "next"} aria-current={i === active ? "step" : undefined} onClick={() => go(i)}>
                      <span className="sr-only">{fill(ui.build.goTo, { n: i + 1, total })}: {s.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            <p className="sr-only" aria-live="polite">{fill(ui.build.goTo, { n: active + 1, total })}: {step.title}</p>
          </div>

          {preview ? (
            <div className="build__cta-bar" ref={ctaBar} data-yield="no">
              <a className="btn btn--solid build__cta" href={routeHash("/hardware")}>{ui.build.explore}</a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
