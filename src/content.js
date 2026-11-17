/*
  Site, hero, team and project text, plus the interface text used by the components.
  Every text is one plain string. Imports only the language resolver and the override files.

  Structure: the objects below are the English base. content.es.js and content.ca.js
  default-export partial overrides with the same shape; they are deep-merged over the
  base (missing keys and missing arrays fall back to English) and the result for the
  active language (lib/lang.js) is exported at the bottom. Components import as usual.
*/

import { LANG } from "./lib/lang.js";
import es from "./content.es.js";
import ca from "./content.ca.js";

const siteEn = {
  openPhoto: "Open photo: {caption}",
  teamName: "Garuda",
  contactEmail: "aboutgaruda@protonmail.com",
  course: {
    name: "[Programme name]",
    school: "[School]",
    university: "[University]",
    address: ["[Address line 1]", "[Address line 2]", "[Postcode and city]"],
  },
  // While true, empty photo slots show where to put your photos.
  showPhotoHints: true,
  year: 2026,
};

const heroEn = {
  title: "Smart feeders for balanced birdlife.",
  intro:
    "Garuda is a smart bird feeder that uses IoT and Edge AI to manage urban birdlife. It helps native species, such as the house sparrow, keep their food and nests against invasive ones, such as the monk parakeet, with ethical and sustainable methods.",
};

// Portraits: 01.webp to 05.webp in src/photos/home/home_team/ (in this order).
const teamEn = {
  title: "Who we are",
  members: [
    {
      name: "Ivan Garcia Berral",
      role: "Project Leader",
      education: "Industrial Engineer",
      links: { linkedin: "https://www.linkedin.com/in/ivan-garc%C3%ADa-berral/" },
    },
    {
      name: "Federico Pompeo Teva",
      role: "Hardware and Software Leader",
      education: "Aerospace & UAV System Engineer",
      links: { linkedin: "https://www.linkedin.com/in/federicopompeoteva" },
    },
    {
      name: "Alex Veciana Garcia",
      role: "Hardware",
      education: "Electronics Engineer",
      links: { linkedin: "https://www.linkedin.com/in/alexandre-veciana/" },
    },
    {
      name: "Marc Montaner Roldan",
      role: "Hardware",
      education: "Electronics Engineer",
      links: { linkedin: "https://www.linkedin.com/in/marc-montaner-roldan/" },
    },
    {
      name: "Pablo Ruiz Perez",
      role: "Software",
      education: "Computer Engineer",
      links: { linkedin: "https://www.linkedin.com/in/pablo-ruiz-perez/" },
    },
  ],
};

const brandEn = {
  name: "Garuda",
  scroll: "Scroll to see how it works",
};

// Giant semi-transparent words behind each section (decorative, hidden from screen readers).
const ghostsEn = {
  top: "Garuda",
  build: "Build",
  steps: "Step by step",
  roadmap: "Roadmap",
  stats: "Stats",
  team: "Team",
  contact: "Contact",
  stubs: {
    hardware: "Hardware",
    software: "Software",
    team: "Team",
  },
};

/*
  Interface text used by the components. {name} marks a value filled in by
  the component (a number, a step, a unit); it is not pending data.
*/

const uiEn = {
  placeholderHint: "Placeholder: replace it in content.js",
  intro: {
    photoAlt: "Garuda smart feeder: a stylised wooden cabinet with an antenna",
    photoMissing: "[Feeder photo pending: src/photos/home/home_title/]",
  },
  skip: "Skip to content",
  docTitle: "Garuda",
  docTitlePage: "{page} · Garuda",
  pageLoading: "Loading page…",
  pageError: "Couldn't load this page.",
  pageRetry: "Retry",
  and: " and ",
  nav: {
    sections: "Sections",
    language: "Language",
    sheet: "Sections (menu)",
    pages: "Pages",
    // Main menu: one entry per page.
    pageLinks: [
      { path: "/", label: "Home" },
      { path: "/hardware", label: "Hardware" },
      { path: "/software", label: "Software" },
      { path: "/stats", label: "Stats" },
      { path: "/team", label: "Team & Sponsors" },
      { path: "/sdg", label: "SDG" },
    ],
    // Secondary menu: the sections of the page you are on.
    links: {
      "/": { roadmap: "Roadmap", phases: "Step by step", contact: "Contact" },
      "/hardware": {},
      "/software": {},
      "/team": {},
      "/sdg": { "sdg-7": "SDG 7", "sdg-9": "SDG 9", "sdg-11": "SDG 11", "sdg-12": "SDG 12", "sdg-15": "SDG 15" },
    },
  },
  softwareDiagram: {
    caption: "How the feeders, the cloud and the website connect, from top to bottom.",
    device: ["Feeder 1", "Feeder 2", "Feeder N"],
    linkSecure: "encrypted channel",
    secure: { title: "Secure gateway", sub: "One identity per feeder" },
    process: { title: "Processing", sub: "Validates and enriches each message" },
    raw: { title: "Full history", sub: "Every message, kept raw", hint: "For revisits and research" },
    curated: { title: "Day-to-day data", sub: "Summarised by feeder and species", hint: "Fast reads for the website" },
    serve: { title: "Analysis", sub: "Models and reprocessing" },
    web: { title: "Visualisation website", sub: "Dashboards for the network" },
  },
  // Placeholder pages (content pending).
  stubPages: {
    hardware: { title: "Hardware", text: "[Hardware page: pending]" },
    software: {
      title: "Software",
      lead: "The Garuda platform connects every feeder to a visualisation website. It is built to work well from a handful of devices up to a city-wide network, with privacy and security considered at every step.",
      sections: [
        {
          title: "Devices",
          text: "Each feeder has a camera that captures a frame. The frame is sent encrypted over 4G to a server, where the AI processes it. Nothing is stored on the device or kept as an image: only the detection log is kept. That is privacy by design.",
        },
        {
          title: "Secure connection",
          text: "Communication with the cloud uses encrypted channels and a unique identity per feeder, so the network does not share credentials and each device only answers for its own data.",
        },
        {
          title: "Processing and data",
          text: "On the server we process each frame with AI and produce a detection log, which is what the website shows. Each detection is tied to its feeder and location. We keep both the full history, in case we need to revisit it, and a summarised version for day-to-day use.",
        },
        {
          title: "Visualisation website",
          text: "A web dashboard shows the activity of each feeder and of the whole network: which species visit, when, and how the local birdlife evolves. Designed so city councils and partners can read the data without a technical background.",
        },
        {
          title: "Growth in phases",
          text: "The architecture grows with the project: it starts small to validate the prototype and expands as more feeders and users come in. Cost and complexity stay in step with what is actually needed.",
        },
      ],
    },
    team: { title: "Team", sponsorsTitle: "Sponsors", sponsorsSoon: "Coming soon" },
  },
  team: {
    closeMark: "×",
    more: "More about {name}",
    photoHint: "[Photo {n}{ext} goes in src/photos/home/home_team/]",
    hintExt: ".webp",
    linkedin: "LinkedIn",
    portrait: "Portrait of {name}",
    logoAlt: "Garuda team logo",
    close: "Close",
    role: "Role in the team",
    education: "Degree",
    newTab: " (opens in a new tab)",
  },
  lightbox: {
    label: "Photo viewer",
    count: "{i} of {n}",
    close: "Close",
    prev: "Previous photo",
    next: "Next photo",
  },
  media: {
    more: "+{n}",
  },
  hero: {
    by: "By",
  },
  build: {
    step: "Step {n}: ",
    progress: "Progress",
    explore: "Explore the prototype",
    goTo: "Step {n} of {total}",
    flip: "Flip",
    flipBack: "Show front",
    flipLabel: "Flip card: {title}",
    cardOf: "Step {n} of {total}",
    prev: "Previous step",
    next: "Next step",
  },
  highlights: {
    stats: { cta: "See Stats", title: "Stats", loading: "Loading figures…", error: "The figures could not be loaded. You can still see them on the Stats page." },
  },
  statsPage: {
    kpis: "Key figures",
    chart: "Chart",
    chartLoading: "Loading chart…",
    chartAria: "Chart: {title}",
    dataTable: "Data table for this chart",
    unit: "Unit",
    projection: "Projection",
    noData: "No data",
    range: "Range",
    rangeNote: "Dashed bar: range between low and high, no central value.",
    boundNote: "means \"more than\": the figure is a lower bound.",
    fields: { mark: "Note", low: "Low", high: "High", year: "Year", label: "Category", group: "Group", value: "Value", mean: "Mean", total: "Total", annualAverage: "Annual average", amount: "Amount", springSince2002: "Spring, since 2002", winterSince2002: "Winter, since 2002" },
    legend: "Show or hide series",
    seriesPicker: "Choose data series",
    viewTable: "View as table",
    sources: "Sources",
    sourcesOf: "Sources for this table",
    also: "See also",
    glossary: "Glossary",
    warning: "Warning",
    info: "Note",
    notes: "Notes",
    external: "(opens in a new tab)",
    units: { individuals: "individuals", index: "index (2005 = 1)", percent: "%", percentPerYear: "% per year", count: "count", MEUR: "million euros", EUR: "euros" },
  },
  sdg: {
    title: "Sustainable Development Goals",
    lead: "The five UN Sustainable Development Goals (SDGs) that Garuda contributes to.",
    goal: "SDG {n}",
    whyHead: "Why we contribute",
    emblemAlt: "United Nations Sustainable Development Goals emblem",
    logoAlt: "Logo of SDG {n}",
    footerTitle: "Sustainable Development Goals",
    items: [
      {
        n: 7,
        title: "Affordable and Clean Energy",
        why: "The feeder is powered by a solar panel, a renewable energy source, so it can work for long periods in remote settings without depending on the power grid.",
      },
      {
        n: 9,
        title: "Industry, Innovation and Infrastructure",
        why: "Garuda is our own hardware and software solution, combining AI at the edge, remote 4G connectivity and a modular design. It is innovative technological infrastructure for managing the natural environment.",
      },
      {
        n: 11,
        title: "Sustainable Cities and Communities",
        why: "Garuda helps manage invasive species in urban and peri-urban areas. In doing so it protects local biodiversity as well as the health and safety of the communities who live there.",
      },
      {
        n: 12,
        title: "Responsible Consumption and Production",
        why: "The feeder is built with sustainable materials and designed so that parts can be repaired and reused. Its multi-species feeding design works without single-use consumables.",
      },
      {
        n: 15,
        title: "Life on Land",
        why: "Garuda detects invasive species and makes it possible to act on them selectively. This protects native wildlife and the ecosystems it depends on.",
      },
    ],
  },
  cookies: {
    title: "Cookies and storage",
    text: "This website uses no tracking or analytics cookies. It only saves in your browser your language preference and that you closed this notice (technical storage).",
    close: "Close notice",
  },
  footer: {
    tagline: "Smart feeders for balanced urban birdlife.",
    projectTitle: "Project",
    contactTitle: "Contact",
    rights: "All rights reserved.",
    top: "Back to top",
    links: {
      roadmap: "Roadmap",
      phases: "Step by step",
      hardware: "Hardware",
      software: "Software",
      team: "Who we are",
      contact: "Contact us",
    },
  },
  contact: {
    title: "Contact us",
    lead: "Want to know more about the project, collaborate or sponsor us? Write to us and we will get back to you.",
    name: "Name",
    email: "Email",
    message: "Message",
    namePlaceholder: "Your name",
    emailPlaceholder: "you@example.com",
    messagePlaceholder: "Tell us briefly what you need",
    send: "Send",
    sending: "Opening your mail client…",
    subject: "Information request — Garuda",
    orWriteTo: "Or write to us directly at",
    required: "Required field",
    invalidEmail: "Invalid email",
  },
};

// Home step-by-step cards. Per step: title, text (paragraphs; [] = image only), optional sub (caption),
// alt, and one visual: image (remote), model (n -> home_model photo), photo (name -> steps folder, optional) or visual.
const phasesPreviewEn = {
  title: "Garuda, step by step",
  lead: "",
  privacy: {"title": "Where the data goes", "flow": [{"label": "Camera", "note": "Captures a frame"}, {"label": "Frame", "note": "Sent encrypted over 4G, not Wi-Fi"}, {"label": "Server", "note": "Processes the frame; the image is not stored"}, {"label": "Detection log", "note": "The only thing that is stored"}, {"label": "Website", "note": "Shows the detection log"}], "kept": "Stored", "list": "Privacy flow, step by step"},
  steps: [{"title": "The problem", "text": ["The monk parakeet (Myiopsitta monachus) is an invasive species that has spread notably across the Barcelona metropolitan area. It competes with native species, and its nests damage trees, crops and infrastructure, so the urban and peri-urban ecosystem loses biodiversity. Today the population is monitored and controlled mostly by hand, with scattered data and little capacity to react for city councils and organisations. What is missing is a tool that shows precisely where the parakeets are, how many there are and how the population evolves, without depending on one-off counts."], "glyph": "box", "image": {"src": "https://commons.wikimedia.org/wiki/Special:FilePath/House_sparrows_in_CP_%2860060%29.jpg?width=1600", "page": "https://commons.wikimedia.org/wiki/File:House_sparrows_in_CP_(60060).jpg", "alt": "House sparrows"}}, {"title": "How we solve it", "text": ["Garuda is a smart device that combines monitoring and control of the invasive species in a single point. It incorporates a camera with artificial intelligence that automatically identifies every bird that approaches, for example whether it is a parakeet or a sparrow, and assigns it a confidence level.", "On the one hand, Garuda acts passively: every detection generates continuous data on the presence, distribution and activity of the invasive species. With this information, administrations and organisations can carry out precise population monitoring, detect new areas of expansion and assess the effect of the measures applied, without depending on one-off manual counts.", "On the other hand, Garuda acts actively: the device includes a feeder that, depending on the species identified, dispenses conventional feed if the bird is native or sterilising feed if it is a parakeet. This reduces the reproductive capacity of the invasive population progressively, selectively and non-lethally, without affecting native species.", "The project was born at InterHack 2026 and starts with the monk parakeet in the Barcelona metropolitan area, but it is designed to scale to other invasive species and other territories."], "alt": "Front view of the Garuda prototype", "glyph": "radio", "model": 1}, {"title": "3D model", "text": [], "sub": "Our solution prototype", "alt": "Three-quarter view of the wooden hut model", "glyph": "cube", "model": 2}, {"title": "Two compartments", "text": [], "alt": "Exploded 3D model showing the two feeders", "glyph": "radio", "model": 5}, {"title": "Monitoring through AI", "text": ["Garuda incorporates a camera with artificial intelligence that automatically identifies every bird that approaches, for example whether it is a parakeet or a sparrow, and assigns it a confidence level. Every detection generates continuous data on the presence, distribution and activity of the invasive species. With this information, administrations and organisations can carry out precise population monitoring, detect new areas of expansion and assess the effect of the measures applied, without depending on one-off manual counts."], "alt": "Diagram: the feeder camera captures the birds and the AI classifies them (monk parakeet 0.92, sparrow 0.85); the parakeet adds +1 on the map and the sparrow is left protected", "glyph": "arm", "photo": "monitoring_AI"}, {"title": "Privacy by design", "text": ["Garuda does not store images. The camera captures a frame, which is sent encrypted over 4G (not Wi-Fi) to a server, where it is processed. Only the detection log is kept, and it is what the website shows. Because no images are stored, citizens' privacy is protected."], "glyph": "calibrate", "visual": "privacy"}, {"title": "Future", "text": ["Garuda starts with the monk parakeet in the Barcelona metropolitan area, but it is designed to scale to other invasive species and other territories. It can also be integrated with other control solutions, and become a tool for scientific research and environmental education, thanks to the continuous data it generates."], "glyph": "flight", "visual": "future", "badge": "Q3 2027"}],
};

const roadmapEn = {
  title: "From prototype to city network.",
  currentLabel: "Current milestone",
  quarters: [
    { label: "Q4 2026", current: true, items: ["MVP development", "Defining the business metrics", "Taking part in Industrial Tech"] },
    { label: "Q1 2027", items: ["Launch of the first pilot tests", "Search for investors and grants", "Preparing the series launch"] },
    { label: "Q2 2027", items: ["Analysis of the data from the pilot tests", "Product optimisation and improvement"] },
    { label: "Q3 2027", items: ["Official launch of the service", "Expanding the team", "Study of the impact on other invasive species"] },
  ],
};


// Resolved texts for the active language (fixed at load; changing language reloads the page).
export const merge = (base, over) => {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base) || Array.isArray(over)) return Array.isArray(base) && Array.isArray(over) && over.length === base.length ? over.map((v, i) => merge(base[i], v)) : base;
  if (base && typeof base === "object" && typeof over === "object") {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
    return out;
  }
  if (typeof over === "string" && !over.trim() && typeof base === "string") return base;
  return typeof over === typeof base || base === undefined ? over : base;
};
const base = { site: siteEn, hero: heroEn, team: teamEn, brand: brandEn, ghosts: ghostsEn, ui: uiEn, phasesPreview: phasesPreviewEn, roadmap: roadmapEn };
const all = merge(base, LANG === "es" ? es : LANG === "ca" ? ca : {});
export const { site, hero, team, brand, ghosts, ui, phasesPreview, roadmap } = all;
