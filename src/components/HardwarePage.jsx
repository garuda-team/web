import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { hardware3d as H } from "../content.hardware.js";
import { motionOK } from "../lib/motion.js";

/* three lives in its own chunk: it is only fetched when the Hardware page opens. */
const HardwareModel = lazy(() => import("./HardwareModel.jsx"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

function FeatureList({ className, items = H.features }) {
  return (
    <div className={className}>
      <h2 className="sr-only">{H.listLabel}</h2>
      <ul className="hardware3d__items" aria-label={H.listLabel}>
        {items.map((f) => (
          <li key={f.id} className="hardware3d__item">
            <h3 className="hardware3d__item-title">{f.title}</h3>
            <p className="hardware3d__item-text">{f.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Pieces the visitor can open at the start: same keys as the 3D scene (click on the piece) and as the buttons (keyboard). */
const NO_PARTS = { feeders: false, doorL: false, doorR: false };
const PARTS = [["feeders", H.partFeeders], ["doorL", H.partDoorL], ["doorR", H.partDoorR]];

/* Interactive dots: shown only on narrow screens (all notes, one panel open at a time); on desktop the notes are plain text. */
function Dots({ features, from, open, setOpen }) {
  const active = from !== null;
  const refs = useRef({});
  const close = (id, focus) => {
    setOpen(null);
    if (focus) refs.current[id]?.focus();
  };
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => {
      if (!e.target.closest?.(".hardware3d__dot-wrap")) setOpen(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => {
      if (e.key === "Escape") close(open, true);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);
  useEffect(() => {
    if (!active) setOpen(null);
  }, [active]);
  return (
    <div className={`hardware3d__dots${active ? " is-on" : ""}`}>
      {features.map((f) => {
        const isOpen = open === f.id;
        const panelId = `hw-dot-${f.id}`;
        return (
          <div
            key={f.id}
            className={`hardware3d__dot-wrap hardware3d__dot-wrap--${f.side}`}
            style={{ top: `${f.y * 100}%` }}
            data-dot={features.indexOf(f)}
            onBlur={(e) => {
              /* Panel is programmatically focusable, so clicks inside keep focus in the wrap; any focus leaving it (including null) closes. */
              const to = e.relatedTarget;
              if (isOpen && !(to && e.currentTarget.contains(to))) setOpen(null);
            }}
          >
            <button
              type="button"
              ref={(el) => { refs.current[f.id] = el; }}
              className="hardware3d__dot"
              aria-label={f.title}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={(e) => {
                /* Safari/iOS does not focus a tapped button: if the focus sits in another panel that this tap hides,
                   park it on the model box first so it does not fall to body (BUG-166) */
                const panel = document.activeElement?.closest?.(".hardware3d__panel");
                if (panel && panel.id !== panelId) e.currentTarget.closest(".hardware3d__box")?.focus({ preventScroll: true });
                setOpen(isOpen ? null : f.id);
              }}
            />
            <div id={panelId} className="hardware3d__panel" tabIndex={-1} hidden={!isOpen}>
              <h2 className="hardware3d__note-title">{f.title}</h2>
              <p className="hardware3d__note-text">{f.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function HardwarePage() {
  const [dots, setDots] = useState({ from: null, mask: 0 });
  const [open, setOpen] = useState(null);
  const [parts, setParts] = useState(NO_PARTS); /* pieces opened by hand (click on the model or the buttons) */
  const [canPick, setCanPick] = useState(false); /* true only in the free rotation at the start (always, in the static version) */
  const [free, setFree] = useState(false); /* free rotation active: shows the "drag to rotate" hint */
  const [pick, setPick] = useState(null); /* mobile: index of the dot the user opened (drives the piece highlight) */
  const actRef = useRef(-2);
  const onDots = useCallback((from, mask, act) => {
    /* before the dots hide with focus inside, park focus on the model box so it is not lost to body */
    const wrap = document.activeElement?.closest?.(".hardware3d__dot-wrap");
    const hidden = (i) => from === null || i < from || !(mask & (1 << i));
    if (wrap && hidden(Number(wrap.dataset.dot))) {
      boxRef.current?.focus({ preventScroll: true });
    }
    /* close whenever the open dot is no longer visible, focus or not */
    setOpen((cur) => {
      if (cur === null) return cur;
      const idx = H.features.findIndex((f) => f.id === cur);
      return idx < 0 || hidden(idx) ? null : cur;
    });
    setDots({ from, mask });
    /* mobile: the dot in scroll sequence opens its panel by itself; tapping any dot still works */
    if (from !== null && act !== actRef.current) {
      actRef.current = act;
      const next = act >= 0 ? H.features[act]?.id ?? null : null;
      /* focus inside a panel opened by hand that this is about to hide: park it too, or it would fall to body (BUG-164) */
      const panel = document.activeElement?.closest?.(".hardware3d__panel");
      if (panel && panel.id !== `hw-dot-${next}`) boxRef.current?.focus({ preventScroll: true });
      setOpen(next);
    }
  }, []);
  useEffect(() => {
    setPick(open ? H.features.findIndex((f) => f.id === open) : null);
  }, [open]);
  const trackRef = useRef(null);
  const boxRef = useRef(null);
  const onToggle = useCallback((id) => setParts((s) => ({ ...s, [id]: !s[id] })), []);
  const onPartsReset = useCallback(() => setParts((s) => (s.feeders || s.doorL || s.doorR ? NO_PARTS : s)), []);
  const [atTop, setAtTop] = useState(true); /* title still visible (scroll not started) */
  const onPickable = useCallback((on, top = on) => {
    /* the buttons hide when the scroll starts: do not leave the focus on a hidden control */
    if (!on && document.activeElement?.closest?.(".hardware3d__parts")) boxRef.current?.focus({ preventScroll: true });
    setCanPick(on);
    setAtTop(top);
  }, []);
  const seenLocked = useRef(false); /* free was false at some point: not static/reduced-from-load */
  const [said, setSaid] = useState(false); /* screen-reader announcement made (once per visit) */
  const onFree = useCallback((on) => {
    setFree(on);
    if (!on) seenLocked.current = true;
    else if (seenLocked.current) setSaid(true);
  }, []);
  const [coarse, setCoarse] = useState(() => !!window.matchMedia?.("(pointer: coarse)").matches); /* touch: two fingers rotate */
  useEffect(() => {
    const mq = window.matchMedia?.("(pointer: coarse)");
    const sync = () => setCoarse(!!mq?.matches);
    mq?.addEventListener?.("change", sync);
    return () => mq?.removeEventListener?.("change", sync);
  }, []);
  const [started, setStarted] = useState(false); /* the scroll has left the start: the "scroll for more" cue goes away */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const check = () => setStarted(el.getBoundingClientRect().top < -8);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  const rotateText = (coarse && H.rotateHintTouch) || H.rotateHint;
  const bgRef = useRef(null); /* full-stage holder of the canvas: model and forest are one scene */
  /* "pending" until mounted (and in SSR); then "3d", "static" (reduced motion) or "fallback". */
  const [mode, setMode] = useState("pending");
  const [loaded, setLoaded] = useState(false);
  const onReady = useCallback(() => setLoaded(true), []);
  const [loadFail, setLoadFail] = useState(false); /* fallback because the model failed to load (retry offered), not for lack of WebGL */
  const [attempt, setAttempt] = useState(0);
  const onError = useCallback((kind) => {
    setLoadFail(kind !== "webgl");
    setMode("fallback");
  }, []);
  const onRetry = useCallback(() => {
    if (!hasWebGL()) {
      setLoadFail(false);
      return;
    }
    setLoadFail(false);
    setLoaded(false);
    setAttempt((n) => n + 1);
    setMode(motionOK() ? "3d" : "static");
  }, []);

  useEffect(() => {
    if (!hasWebGL()) {
      setMode("fallback");
      return undefined;
    }
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const sync = () => {
      /* entering or leaving reduced motion: drop stale dots/panel so nothing reappears unasked */
      if (document.activeElement?.closest?.(".hardware3d__dot-wrap")) boxRef.current?.focus({ preventScroll: true });
      setOpen(null);
      setDots({ from: null, mask: 0 });
      setMode(motionOK() ? "3d" : "static");
    };
    sync();
    mq?.addEventListener?.("change", sync);
    return () => mq?.removeEventListener?.("change", sync);
  }, []);

  const animated = mode === "3d";
  const showModel = mode === "3d" || mode === "static";
  const barOn = loaded && canPick;
  const titleOn = mode !== "3d" || !loaded || atTop; /* title fades once the scroll starts */

  return (
    <section id="page-hardware" className={`section hardware3d surface-paper hardware3d--${mode}${barOn ? " is-bar" : ""}${titleOn ? " is-title" : ""}`} data-surface="paper" data-wave aria-labelledby="page-hardware-title">
      <div ref={trackRef} className="hardware3d__track">
        <div className="hardware3d__stage">
          {showModel ? <div ref={bgRef} className="hardware3d__bg" aria-hidden="true" /> : null}
          {/* Secondary bar right under the main nav (Hardware only): keyboard route for "click the piece". Always laid out so the stage does not jump when it hides. */}
          {showModel ? (
            <div className={`hardware3d__parts${loaded && canPick ? " is-on" : ""}`} role="group" aria-labelledby="hw-parts-label">
              <div className="hardware3d__parts-list">
                <span id="hw-parts-label" className="sr-only">{H.partsLabel}</span>
                {PARTS.map(([id, label]) => (
                  <button key={id} type="button" className="hardware3d__part" aria-pressed={parts[id]} onClick={() => onToggle(id)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {showModel && loaded ? (
            <div className="hardware3d__hint-wrap">
              <p className={`hardware3d__hint${free ? " is-on" : ""}`} aria-hidden="true">{rotateText}</p>
              <p className="sr-only" aria-live="polite">{said ? rotateText : ""}</p>
              {animated && H.scrollHint ? (
                <p className={`hardware3d__scroll${started ? "" : " is-on"}`} aria-live="polite">{started ? "" : H.scrollHint}</p>
              ) : null}
            </div>
          ) : null}
          <header className="hardware3d__head wrap">
            <h1 id="page-hardware-title" className="h2 hardware3d__title">{H.title}</h1>
          </header>
          <div ref={boxRef} className="hardware3d__box" tabIndex={-1}>
            {showModel ? (
              <Suspense fallback={null}>
                <HardwareModel key={attempt} trackRef={trackRef} boxRef={boxRef} bgRef={bgRef} reduced={!animated} onReady={onReady} onError={onError} onDots={onDots} onFree={onFree} pick={pick} parts={parts} onToggle={onToggle} onPartsReset={onPartsReset} onPickable={onPickable} />
              </Suspense>
            ) : null}
            {mode === "pending" || (showModel && !loaded) ? (
              <p className="hardware3d__loading" role="status" aria-live="polite">{H.loading}</p>
            ) : null}
            {animated ? <Dots features={H.features} from={dots.from} open={open} setOpen={setOpen} /> : null}
          </div>
          {animated ? (
            <div className="hardware3d__notes" aria-hidden="true">
              <svg className="hardware3d__lead" aria-hidden="true" focusable="false">
                <line data-lead-line />
                <circle data-lead-dot r="4" />
              </svg>
              {H.features.map((f, i) => (
                <div key={f.id} className={`hardware3d__note ${i < 5 ? "hardware3d__note--lead" : `hardware3d__note--late hardware3d__note--late-${i - 5}`}`} data-ann>
                  <h2 className="hardware3d__note-title">{f.title}</h2>
                  <p className="hardware3d__note-text">{f.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {mode === "fallback" ? (
        loadFail ? (
          <p className="hardware3d__fallback wrap" role="alert">
            {H.loadError}
            <button type="button" className="hardware3d__retry" onClick={onRetry}>{H.retry}</button>
          </p>
        ) : (
          <p className="hardware3d__fallback wrap">{H.fallback}</p>
        )
      ) : null}
      <div className="wrap">
        <FeatureList className={animated ? "hardware3d__list sr-only" : "hardware3d__list"} items={animated ? H.features.filter((f, i) => !(dots.from !== null && i >= dots.from && dots.mask & (1 << i) && open === f.id)) : H.features} />
      </div>
    </section>
  );
}
