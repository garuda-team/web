import { useCallback, useEffect, useRef, useState } from "react";
import { SplitWords } from "./Reveal.jsx";
import { ui } from "../content.js";
import { routeHash } from "../lib/route.js";
import { Rich, fill } from "../lib/text.jsx";
import { pad2, useReducedMotion } from "../lib/hooks.js";
import { startingWith } from "../lib/photos.js";
import { Glyph } from "./Glyphs.jsx";
import Media from "./Media.jsx";

function Chevron({ dir = "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

const DESKTOP = "(min-width: 900px)";

function useDesktop() {
  const [yes, setYes] = useState(() => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(DESKTOP).matches : true));
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const on = () => setYes(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return yes;
}

export default function Build({ id = "build", data, preview = false }) {
  const reduced = useReducedMotion();
  const desktop = useDesktop();
  const pinned = !reduced && desktop;
  return (
    <section id={id} className="section build surface-paper" data-surface="paper" data-wave>
      <div className="build__frame" data-surface="paper">
        {pinned ? <Pinned data={data} preview={preview} /> : <Static data={data} preview={preview} />}
      </div>
    </section>
  );
}

function Cta() {
  return (
    <a className="btn btn--solid build__cta" href={routeHash("/hardware")}>
      {ui.build.explore}
    </a>
  );
}

function Head({ data, preview, cta = true }) {
  return (
    <div className="section-head">
      <SplitWords as="h2" className="h2" text={data.title} />
      <p className="lead"><Rich text={data.lead} /></p>
      {preview && cta ? <Cta /> : null}
    </div>
  );
}

/* Reduced motion and small screens: every step in a plain list, drone at rest. */
function Static({ data, preview }) {
  return (
    <div className="wrap">
      <Head data={data} preview={preview} cta={false} />
      <ol className="steps">
        {data.steps.map((step, i) => (
          <Step key={step.title} n={i + 1} step={step} preview={preview} />
        ))}
      </ol>
      {preview ? (
        <div className="build__cta-bar">
          <Cta />
        </div>
      ) : null}
    </div>
  );
}

/* Tall track + sticky stage: scroll progress through the track picks the step. */
function Pinned({ data, preview }) {
  const TOTAL = data.steps.length;
  const track = useRef(null);
  const [active, setActive] = useState(0);
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    const el = track.current;
    let raf = 0;
    let last = -1;
    const run = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setSteps(p > 0.02);
      const idx = Math.min(TOTAL - 1, Math.floor(p * TOTAL));
      if (idx !== last) {
        last = idx;
        setActive(idx);
      }
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = useCallback(
    (i) => {
      const el = track.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      if (span <= 0) return;
      const clamped = Math.max(0, Math.min(TOTAL - 1, i));
      const p = (clamped + 0.5) / TOTAL;
      const top = window.scrollY + rect.top + p * span;
      window.scrollTo({ top, behavior: "smooth" });
    },
    [TOTAL],
  );

  return (
    <div ref={track} className="build__track" style={{ "--build-steps": TOTAL }}>
      <div className="build__stage" data-phase={steps ? "steps" : "intro"}>
        <div className="wrap build__wrap">
          <div className="build__head">
            <div className="build__head-in">
              <Head data={data} preview={preview} cta={false} />
            </div>
          </div>

          <div className="build__carousel" data-has-image={data.steps[active].image ? "yes" : "no"}>
            <button
              type="button"
              className="build__nav build__nav--prev"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label={fill(ui.build.goTo, { n: Math.max(1, active), total: TOTAL })}
            >
              <Chevron dir="left" />
            </button>

            <div className="build__slides" role="presentation">
              {data.steps.map((s, i) => {
                const offset = i - active;
                const abs = Math.abs(offset);
                const state = offset === 0 ? "active" : abs === 1 ? "near" : "far";
                return (
                  <article
                    key={s.title}
                    className="build__slide"
                    data-state={state}
                    data-side={offset === 0 ? "" : offset < 0 ? "left" : "right"}
                    style={{ "--offset": offset }}
                    aria-hidden={offset !== 0}
                    aria-roledescription="slide"
                  >
                    <div className="build__slide-media">
                      {s.image ? (
                        <img src={s.image.src} alt="" loading={abs > 1 ? "lazy" : "eager"} decoding="async" />
                      ) : (
                        <div className="build__slide-glyph">
                          <Glyph name={s.glyph} size={120} />
                        </div>
                      )}
                      <div className="build__slide-shade" aria-hidden="true" />
                      <span className="build__slide-num">{pad2(i + 1)}</span>
                    </div>
                    <div className="build__slide-copy">
                      <h3 className="build__slide-title">{s.title}</h3>
                      {s.date ? (
                        <p className="step__date">
                          <Rich text={s.date} />
                        </p>
                      ) : null}
                      <p className="build__slide-text"><Rich text={s.text} /></p>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              className="build__nav build__nav--next"
              onClick={() => goTo(active + 1)}
              disabled={active === TOTAL - 1}
              aria-label={fill(ui.build.goTo, { n: Math.min(TOTAL, active + 2), total: TOTAL })}
            >
              <Chevron dir="right" />
            </button>
          </div>

          <div className="build__dock">
            <span className="build__counter" aria-hidden="true">
              <strong>{pad2(active + 1)}</strong>
              <span>/</span>
              <span>{pad2(TOTAL)}</span>
            </span>
            <ol className="build__dots" aria-label={ui.build.progress}>
              {data.steps.map((s, i) => (
                <li key={s.title}>
                  <button
                    type="button"
                    className="build__dot"
                    data-state={i === active ? "now" : i < active ? "done" : "next"}
                    onClick={() => goTo(i)}
                  >
                    <span className="sr-only">{fill(ui.build.goTo, { n: i + 1, total: TOTAL })}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {preview ? (
            <div className="build__cta-bar">
              <Cta />
            </div>
          ) : null}
        </div>
      </div>
      {/* Screen readers get the full list; the sticky card above is decorative. */}
      <ol className="sr-only" aria-label={data.title}>
        {data.steps.map((s, i) => (
          <li key={s.title} aria-current={i === active ? "step" : undefined}>
            <strong>{fill(ui.build.step, { n: i + 1 })}{s.title}</strong>
            <p><Rich text={s.text} /></p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Step({ n, step, preview }) {
  const diskPhotos = preview ? [] : startingWith("steps", n);
  const photos = diskPhotos.length
    ? diskPhotos
    : step.image
      ? [{ url: step.image.src, type: "image", caption: "", folder: "steps", file: step.image.src, base: step.image.src, dir: "steps" }]
      : [];
  const num = pad2(n);
  return (
    <li className="step">
      <div className="step__head">
        <span className="step__num" aria-hidden="true">
          {num}
        </span>
        <div className="step__titles">
          <h3 className="step__title">
            <span className="sr-only">{fill(ui.build.step, { n })}</span>
            {step.title}
          </h3>
          {step.date ? (
            <p className="step__date">
              <Rich text={step.date} />
            </p>
          ) : null}
        </div>
      </div>
      <div className="step__body">
        <Media
          items={photos}
          glyph={step.glyph}
          label={step.title}
          // Developer note (not shown): add photos for this step as
          // src/photos/steps/NN-description.jpg, where NN is the step number.
        />
        <div className="step__copy">
          <p><Rich text={step.text} /></p>
        </div>
      </div>
    </li>
  );
}
