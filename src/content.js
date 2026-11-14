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
    url: "",
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

// Portraits: 1.jpg to 5.jpg in src/photos/home/home_team/ (in this order).
const teamEn = {
  title: "Who we are",
  members: [
    {
      name: "[Name Surname]",
      role: "[Role in the project]",
      background: "[Background]",
      from: "[City, country]",
      links: { linkedin: "", email: "", github: "" },
    },
    {
      name: "[Name Surname]",
      role: "[Role in the project]",
      background: "[Background]",
      from: "[City, country]",
      links: { linkedin: "", email: "", github: "" },
    },
    {
      name: "[Name Surname]",
      role: "[Role in the project]",
      background: "[Background]",
      from: "[City, country]",
      links: { linkedin: "", email: "", github: "" },
    },
    {
      name: "[Name Surname]",
      role: "[Role in the project]",
      background: "[Background]",
      from: "[City, country]",
      links: { linkedin: "", email: "", github: "" },
    },
    {
      name: "[Name Surname]",
      role: "[Role in the project]",
      background: "[Background]",
      from: "[City, country]",
      links: { linkedin: "", email: "", github: "" },
    },
  ],
  reflections: [
    {
      title: "What we learned",
      text: "[Write three or four sentences. What surprised you while building the prototype?]",
    },
    {
      title: "How we worked as a team",
      text: "[How did you split the work? What worked well, and what would you organise differently?]",
    },
    {
      title: "What we would do differently",
      text: "[If you started again tomorrow, what would you change?]",
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
  project: "Roadmap",
  build: "Build",
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
      { path: "/team", label: "Team & Sponsors" },
    ],
    // Secondary menu: the sections of the page you are on.
    links: {
      "/": { project: "Roadmap", phases: "Stages", team: "Who we are", contact: "Contact" },
      "/hardware": {},
      "/software": {},
      "/team": {},
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
          text: "Each feeder processes image and sound on the device itself. Only aggregated data — the species detected, the moment, a count — leaves the feeder; raw image and audio never do. That is privacy by design.",
        },
        {
          title: "Secure connection",
          text: "Communication with the cloud uses encrypted channels and a unique identity per feeder, so the network does not share credentials and each device only answers for its own data.",
        },
        {
          title: "Processing and data",
          text: "In the cloud we validate and enrich what arrives: each message is tied to its feeder and location. We keep both the full history, in case we need to revisit it, and a summarised version for day-to-day use.",
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
    team: { title: "Team & Sponsors", text: "[Team & Sponsors page: pending]" },
  },
  project: {
    phase: "Stage {n}. ",
    status: { done: "Done", current: "In progress" },
  },
  team: {
    closeMark: "×",
    more: "More about {name}",
    photoHint: "[Photo {n}{ext} goes in src/photos/home/home_team/]",
    hintExt: ".jpg",
    linkedin: "LinkedIn",
    github: "GitHub",
    portrait: "Portrait of {name}",
    logoAlt: "Garuda team logo",
    close: "Close",
    role: "Role in the team",
    education: "Education",
    links: "Links",
    linksGap: "[LinkedIn and GitHub links]",
    reflections: "Reflections",
    reflectionGap: "[Answer from this team member]",
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
  },
  footer: {
    tagline: "Smart feeders for balanced urban birdlife.",
    projectTitle: "Project",
    contactTitle: "Contact",
    rights: "All rights reserved.",
    top: "Back to top",
    links: {
      roadmap: "Roadmap",
      stages: "Stages",
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

// Home: stages summary (no dates).
const projectV2En = {
  title: "From prototype to city network.",
  lead:
    "Garuda is a prototype that is still growing. Here we show what it does today and what we plan to add. [Project context: pending]",
  phases: [
    { title: "Prototype", status: "done", text: "A feeder with two compartments, a camera, a microphone and a speaker, built around an Arduino Uno Q." },
    { title: "Models and field tests", status: "current", text: "[Pending]" },
    { title: "Servers and web", status: "upcoming", text: "Separate servers (API and database, and a visualisation website), with data sent by API from each board." },
    { title: "More species and city integration", status: "upcoming", text: "More species, a high-fidelity speaker and integration with other city products." },
  ],
};

// Home preview of the project (one line per step) and of stage 2.
// Image URLs are placeholders from picsum.photos (CC0). The `search` field
// points to an Unsplash search for a thematic replacement — download the
// final photo and swap `src` for a local file under src/photos/steps/.
const previewLines = [
  ["The problem", "Invasive monk parakeets compete with native house sparrows for food and nests."],
  ["Two compartments", "Compartment A for native birds, B with treated food for the invasive species."],
  ["Computer vision", "The camera identifies the bird and the actuators open the right compartment."],
  ["Acoustic monitoring", "A microphone identifies songs and builds a sound map."],
  ["Native songs", "A speaker plays native songs to favour sparrows and other threatened species."],
  ["Privacy by design", "Image and audio stay on the device, and only birds are detected."],
  ["Models", "Image and audio models made with Edge Impulse tell the two species apart."],
  ["Future", "Servers, a visualisation website, motion-activated camera and more species."],
];
const previewGlyphs = ["box", "radio", "arm", "cube", "gps", "calibrate", "flight", "flight"];
// Wikimedia Commons files served through Special:FilePath (the URL redirects
// to the current image). Each `src` returned HTTP 200 on verification; `page`
// links to the Commons file page for licence and attribution.
const previewImages = [
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/House_sparrows_in_CP_%2860060%29.jpg?width=1600",
    alt: "House sparrows perched on a tangle of branches",
    page: "https://commons.wikimedia.org/wiki/File:House_sparrows_in_CP_(60060).jpg",
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Bird_feeder_%284338512925%29.jpg?width=1600",
    alt: "Wooden bird feeder with birds",
    page: "https://commons.wikimedia.org/wiki/File:Bird_feeder_(4338512925).jpg",
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Raspberry_Pi_4_Model_B_-_Top.jpg?width=1600",
    alt: "Raspberry Pi 4 single-board computer, top view",
    page: "https://commons.wikimedia.org/wiki/File:Raspberry_Pi_4_Model_B_-_Top.jpg",
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/AKG_C214_Condenser_microphone.jpg?width=1600",
    alt: "AKG C214 condenser microphone",
    page: "https://commons.wikimedia.org/wiki/File:AKG_C214_Condenser_microphone.jpg",
  },
  null,
  null,
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Colored_neural_network.svg?width=1600",
    alt: "Diagram of a colored artificial neural network",
    page: "https://commons.wikimedia.org/wiki/File:Colored_neural_network.svg",
  },
  null,
];
const phasesPreviewEn = {
  title: "Garuda, step by step",
  lead: "",
  phase2: { title: "Stage 2", text: "Working on it..." },
  steps: previewLines.map(([title, text], i) => ({
    title,
    glyph: previewGlyphs[i],
    text,
    image: previewImages[i],
    details: [],
  })),
};

// Resolved texts for the active language (fixed at load; changing language reloads the page).
const merge = (base, over) => {
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
const base = { site: siteEn, hero: heroEn, team: teamEn, brand: brandEn, ghosts: ghostsEn, ui: uiEn, projectV2: projectV2En, phasesPreview: phasesPreviewEn };
const all = merge(base, LANG === "es" ? es : LANG === "ca" ? ca : {});
export const { site, hero, team, brand, ghosts, ui, projectV2, phasesPreview } = all;
