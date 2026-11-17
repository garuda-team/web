import { useEffect, useState } from "react";

/*
  Tiny hash router, no dependencies.
  Menu pages: "#/", "#/hardware", "#/software", "#/stats", "#/team", "#/sdg".
  Page + section: "#/hardware/build", "#/home/team" (Home is "home" when a section follows).
  Bare section anchors ("#build") never start with "#/", so they are ignored
  here and keep working as plain in-page links.
*/
const ROUTES = ["/", "/hardware", "/software", "/stats", "/team", "/sdg", ...(import.meta.env.DEV ? ["/model-capture"] : [])]; /* the last one is a dev-only capture tool */

const slug = (path) => (path === "/" ? "home" : path.slice(1));

/** "#/hardware/build" -> { path: "/hardware", section: "build" }; null if not a page route. */
export function parseHash(hash) {
  if (!hash.startsWith("#/")) return null;
  const [page = "", ...rest] = hash.slice(2).split("/");
  const path = page === "" || page === "home" ? "/" : `/${page}`;
  let section = rest.join("/");
  try {
    section = decodeURIComponent(section);
  } catch {
    /* keep raw */
  }
  return ROUTES.includes(path) ? { path, section } : { path: "/", section: "", invalid: true };
}

/** Hash for a section of a page; no section gives the plain page hash. */
export const routeHash = (path, section = "") => (section ? `#/${slug(path)}/${section}` : path === "/" ? "#/" : `#${path}`);


/* Unknown page: Home is shown, so fix the URL in place (no extra history entry). */
function fixInvalid(parsed) {
  if (parsed?.invalid) window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${routeHash("/")}`);
}

export function useRoute() {
  const [route, setRoute] = useState(() => {
    const parsed = parseHash(window.location.hash);
    fixInvalid(parsed);
    return parsed?.path ?? "/";
  });
  useEffect(() => {
    const on = () => {
      const next = parseHash(window.location.hash);
      fixInvalid(next);
      if (next) setRoute(next.path);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
