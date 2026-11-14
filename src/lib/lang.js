/* Active language: saved choice first, then the browser's, else English. Fixed at load. */
export const LANGS = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "ca", name: "Català" },
];
export const LANG_KEY = "garuda-lang";
const valid = (c) => LANGS.some((l) => l.code === c);

const stores = () => {
  const out = [];
  // Session first: it is the most recent choice when local writes fail.
  for (const n of ["sessionStorage", "localStorage"]) {
    try {
      if (typeof window !== "undefined" && window[n]) out.push(window[n]);
    } catch {
      /* storage blocked */
    }
  }
  return out;
};

function detect() {
  for (const st of stores()) {
    try {
      const saved = st.getItem(LANG_KEY);
      if (valid(saved)) return saved;
    } catch {
      /* storage blocked */
    }
  }
  if (typeof navigator === "undefined") return "en";
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language || ""]) {
    const p = String(l).toLowerCase();
    if (p.startsWith("ca")) return "ca";
    if (p.startsWith("es")) return "es";
    if (p.startsWith("en")) return "en";
  }
  return "en";
}

export const LANG = detect();
if (typeof document !== "undefined") document.documentElement.lang = LANG;

/** Saves the choice (local, else session storage) and reloads on the same route. Returns false if nothing could be saved. */
export function setLang(code) {
  if (!valid(code) || code === LANG) return false;
  let saved = false;
  for (const st of stores()) {
    try {
      st.setItem(LANG_KEY, code);
      saved = true;
    } catch {
      try {
        st.removeItem(LANG_KEY); // never leave a stale value that could win
      } catch {
        /* storage blocked */
      }
    }
  }
  if (!saved) return false;
  window.location.reload();
  return true;
}
