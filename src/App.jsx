import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { phasesPreview, ui } from "./content.js";
import { fill } from "./lib/text.jsx";
import { adaptiveRem, autoReveal, destroyLenis, handleAnchors, motionOK, scrollToId, scrollToTop, startLenis } from "./lib/motion.js";
import { importHardware, importStats } from "./lib/lazyPages.js";
import { parseHash, useRoute } from "./lib/route.js";
import { LightboxProvider } from "./components/Lightbox.jsx";
import { ReadyContext } from "./components/Reveal.jsx";
import Loader from "./components/Loader.jsx";
import Backdrop from "./components/Backdrop.jsx";
import Flora from "./components/Flora.jsx";
import Nav from "./components/Nav.jsx";
import Intro from "./components/Intro.jsx";
import Hero from "./components/Hero.jsx";
import Roadmap from "./components/Roadmap.jsx";
import Build from "./components/Build.jsx";
import HomeHighlights from "./components/HomeHighlights.jsx";
import Contact from "./components/Contact.jsx";
import SdgPage from "./components/SdgPage.jsx";
import StubPage from "./components/StubPage.jsx";
import Footer from "./components/Footer.jsx";

/* Catches a failed chunk import; remounted per route (key) so it resets on navigation. */
class PageBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  errRef = null;
  componentDidUpdate(_, prev) {
    /* A retry that fails again: keep focus on the error notice (only after a Retry press). */
    if (this.state.failed && !prev.failed && this.props.retried) this.errRef?.focus({ preventScroll: true });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <p className="page-error" role="alert" tabIndex={-1} ref={(el) => { this.errRef = el; }}>
        {ui.pageError}
        <button type="button" className="page-error__retry" onClick={() => { this.setState({ failed: false }); this.props.onRetry(); }}>
          {ui.pageRetry}
        </button>
      </p>
    );
  }
}

const lostFocus = () => !document.activeElement || document.activeElement === document.body;

/* React.lazy keeps a rejection forever, so Retry builds a fresh lazy component. */
function DeferredPage({ load }) {
  const [attempt, setAttempt] = useState(0);
  const Page = useMemo(() => lazy(load), [load, attempt]);
  const box = useRef(null);
  const pending = useRef(false);
  /* Retry succeeded: the notice is gone, so focus goes to the page wrapper (only if it fell to body, once). */
  const settled = useCallback(() => {
    if (!pending.current) return;
    pending.current = false;
    if (lostFocus()) box.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="page-deferred" tabIndex={-1} ref={box}>
      <PageBoundary retried={attempt > 0} onRetry={() => { pending.current = true; setAttempt((n) => n + 1); }}>
        <Suspense fallback={<PageFallback focus={attempt > 0} />}>
          <Page />
          <Settled onSettled={settled} />
        </Suspense>
      </PageBoundary>
    </div>
  );
}

/* Mounts only once the lazy page has resolved (siblings of a suspended page do not commit). */
function Settled({ onSettled }) {
  useEffect(() => {
    onSettled();
  }, [onSettled]);
  return null;
}

/* focus: after Retry the pressed button is gone, so the notice takes focus once on mount (never on first load). */
function PageFallback({ focus }) {
  const ref = useRef(null);
  useEffect(() => {
    if (focus && lostFocus()) ref.current?.focus({ preventScroll: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <p className="page-loading" role="status" aria-busy="true" tabIndex={focus ? -1 : undefined} ref={ref}>
      {ui.pageLoading}
    </p>
  );
}

/* Dev-only capture view: the constant condition lets the bundler drop the import from production builds. */
const ModelCapture = import.meta.env.DEV ? lazy(() => import("./components/ModelCapture.jsx")) : null;

/* Blocks that spring in as they scroll into view (headlines rise word by word on their own). */
const REVEAL = [
  ".section-head > :not(h2)",
  ".phase",
  ".roadmap__item",
  ".highlight",
  ".inside__build",
  ".moves",
  ".mixer",
  ".subsection",
  ".person",
  ".reflection",
].join(", ");

/* Max wait for a deep-linked section on a lazy page. */
const WAIT_MS = 8000;

export default function App() {
  const route = useRoute();
  const [ready, setReady] = useState(() => !motionOK());
  const onReady = useCallback(() => setReady(true), []);
  const lastRoute = useRef(null);

  useLayoutEffect(() => {
    const offAnchors = handleAnchors();
    const offRem = adaptiveRem();
    return () => {
      offAnchors();
      offRem();
    };
  }, []);

  /* Document title per route (home uses the Home label). */
  useLayoutEffect(() => {
    const stub = ui.stubPages[route.slice(1)];
    if (stub) {
      document.title = fill(ui.docTitlePage, { page: stub.title });
      return;
    }
    if (route === "/stats") {
      document.title = fill(ui.docTitlePage, { page: ui.nav.pageLinks.find((p) => p.path === "/stats")?.label ?? "Statistics" });
      return;
    }
    if (route === "/sdg") {
      document.title = fill(ui.docTitlePage, { page: ui.sdg.title });
      return;
    }
    const home = ui.nav.pageLinks.find((p) => p.path === "/");
    document.title = home ? fill(ui.docTitlePage, { page: home.label }) : ui.docTitle;
  }, [route]);

  /* Route flag on <html> so each page can set its own ground (Home is warm white). */
  useLayoutEffect(() => {
    document.documentElement.dataset.page = route === "/" ? "home" : route.slice(1);
  }, [route]);

  /* Every page change: back to the top, and smooth scroll + reveals restart on the new DOM. */
  useLayoutEffect(() => {
    startLenis();
    scrollToTop();
    const offReveal = autoReveal(REVEAL);
    /* "#/hardware/build": open the page, then jump to the section. A lazy page may not have it yet,
       so wait for the element (MutationObserver, capped at WAIT_MS) and give up silently. */
    const sectionId = () => {
      const h = parseHash(window.location.hash);
      return h?.path === route && h.section ? h.section : "";
    };
    const toSection = (immediate, focus = false) => {
      const id = sectionId();
      return id ? scrollToId(id, { focus, immediate }) : false;
    };
    /* Page change (not first load): focus the new content, or the target section if there is one. */
    const navigated = lastRoute.current !== null && lastRoute.current !== route;
    lastRoute.current = route;
    const main = document.getElementById("main");
    if (navigated && !sectionId()) main?.focus({ preventScroll: true });
    let t1 = 0;
    let t2 = 0;
    let obs = null;
    const stop = () => {
      obs?.disconnect();
      obs = null;
      clearTimeout(t2);
    };
    const raf = requestAnimationFrame(() => {
      const found = () => {
        toSection(true, navigated);
        t1 = window.setTimeout(() => toSection(true), 400);
      };
      if (!sectionId()) return;
      if (document.getElementById(sectionId())) return found();
      obs = new MutationObserver(() => {
        if (!document.getElementById(sectionId())) return;
        stop();
        found();
      });
      obs.observe(main ?? document.body, { childList: true, subtree: true });
      t2 = window.setTimeout(() => {
        stop();
        const ae = document.activeElement;
        if (navigated && (!ae || ae === document.body)) main?.focus({ preventScroll: true });
      }, WAIT_MS);
    });
    const onHash = () => toSection(false);
    window.addEventListener("hashchange", onHash);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      stop();
      window.removeEventListener("hashchange", onHash);
      offReveal();
      destroyLenis();
    };
  }, [route]);

  return (
      <LightboxProvider>
        <ReadyContext.Provider value={ready}>
          <Backdrop />
          {["/", "/software", "/team", "/stats", "/sdg"].includes(route) ? <Flora key="flora" /> : null}
          <Loader onReady={onReady} />
          <a className="skip" href="#main">
            {ui.skip}
          </a>
          <Nav route={route} />
          <main id="main" tabIndex={-1}>
            {route === "/" ? (
              <>
                <Intro />
                <Hero />
                <Roadmap />
                <Build id="phases" data={phasesPreview} preview />
                <HomeHighlights />
                <Contact />
              </>
            ) : null}
            {["/software", "/team"].includes(route) ? (
              <>
                <span id="top" />
                <StubPage page={route.slice(1)} />
              </>
            ) : null}
            {route === "/hardware" ? (
              <>
                <span id="top" />
                <DeferredPage key="hardware" load={importHardware} />
              </>
            ) : null}
            {route === "/stats" ? (
              <>
                <span id="top" />
                <DeferredPage key="stats" load={importStats} />
              </>
            ) : null}
            {ModelCapture && route === "/model-capture" ? (
              <Suspense fallback={null}>
                <ModelCapture />
              </Suspense>
            ) : null}
            {route === "/sdg" ? (
              <>
                <span id="top" />
                <SdgPage />
              </>
            ) : null}
          </main>
          <Footer key={route} />
        </ReadyContext.Provider>
      </LightboxProvider>
  );
}
