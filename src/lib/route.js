import { useEffect, useState } from "react";

/*
  Tiny hash router, no dependencies.
  Menu pages: "#/", "#/hardware", "#/software", "#/team".
  Page + section: "#/hardware/build", "#/home/team" (Home is "home" when a section follows).
  Bare section anchors ("#build") never start with "#/", so they are ignored
  here and keep working as plain in-page links.
*/
const ROUTES = ["/", "/hardware", "/software", "/team"];

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
  return ROUTES.includes(path) ? { path, section } : { path: "/", section: "" };
}

/** Hash for a section of a page; no section gives the plain page hash. */
export const routeHash = (path, section = "") => (section ? `#/${slug(path)}/${section}` : path === "/" ? "#/" : `#${path}`);


export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash)?.path ?? "/");
  useEffect(() => {
    const on = () => {
      const next = parseHash(window.location.hash);
      if (next) setRoute(next.path);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
