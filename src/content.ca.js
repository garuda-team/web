/* Traducció al català (override parcial de content.js; el que falta cau a l'anglès). */

const member = {
  name: "[Nom Cognom]",
  role: "[Rol al projecte]",
  background: "[Formació]",
  from: "[Ciutat, país]",
};

const previewLines = [
  ["El problema", "Les cotorres argentines, una espècie invasora, competeixen amb els pardals comuns autòctons pel menjar i els nius."],
  ["Dos compartiments", "El compartiment A és per als ocells autòctons i el B, amb menjar tractat, per a l'espècie invasora."],
  ["Visió per computador", "La càmera identifica l'ocell i els actuadors obren el compartiment adequat."],
  ["Monitoratge acústic", "Un micròfon identifica els cants i construeix un mapa sonor."],
  ["Cants autòctons", "Un altaveu reprodueix cants autòctons per afavorir els pardals i altres espècies amenaçades."],
  ["Privadesa des del disseny", "La imatge i l'àudio es queden al dispositiu, i només es detecten ocells."],
  ["Models", "Uns models d'imatge i d'àudio fets amb Edge Impulse distingeixen les dues espècies."],
  ["Futur", "Servidors, un web de visualització, càmera activada per moviment i més espècies."],
];

export default {
  site: {
    openPhoto: "Obre la foto: {caption}",
    contactEmail: "aboutgaruda@protonmail.com",
    course: {
      name: "[Nom del programa]",
      school: "[Escola]",
      university: "[Universitat]",
      address: ["[Línia d'adreça 1]", "[Línia d'adreça 2]", "[Codi postal i ciutat]"],
    },
  },
  hero: {
    title: "Menjadores intel·ligents per a una avifauna equilibrada.",
    intro:
      "Garuda és una menjadora intel·ligent per a ocells que utilitza IoT i Edge AI per gestionar l'avifauna urbana. Ajuda les espècies autòctones, com el pardal comú, a mantenir el seu menjar i els seus nius davant les invasores, com la cotorra argentina, amb mètodes ètics i sostenibles.",
  },
  team: {
    title: "Qui som",
    members: [member, member, member, member, member],
    reflections: [
      {
        title: "Què hem après",
        text: "[Escriviu tres o quatre frases. Què us ha sorprès mentre construíeu el prototip?]",
      },
      {
        title: "Com hem treballat en equip",
        text: "[Com vau repartir la feina? Què va funcionar bé i què organitzaríeu de manera diferent?]",
      },
      {
        title: "Què faríem de manera diferent",
        text: "[Si comencéssiu de nou demà, què canviaríeu?]",
      },
    ],
  },
  brand: {
    scroll: "Desplaça't per veure com funciona",
  },
  ghosts: {
    project: "Full de ruta",
    build: "Construcció",
    team: "Equip",
    contact: "Contacte",
    stubs: {
      hardware: "Hardware",
      software: "Software",
      team: "Equip",
    },
  },
  ui: {
    placeholderHint: "Marcador de posició: substitueix-lo a content.js",
    intro: {
      photoAlt: "Menjadora intel·ligent Garuda: un armari de fusta estilitzat amb una antena",
      photoMissing: "[Foto de la menjadora pendent: src/photos/home/home_title/]",
    },
    skip: "Salta al contingut",
    and: " i ",
    nav: {
      sections: "Seccions",
      language: "Llengua",
      sheet: "Seccions (menú)",
      pages: "Pàgines",
      pageLinks: [
        { label: "Inici" },
        { label: "Hardware" },
        { label: "Software" },
        { label: "Equip i patrocinadors" },
      ],
      links: {
        "/": { project: "Full de ruta", phases: "Etapes", team: "Qui som", contact: "Contacte" },
      },
    },
    softwareDiagram: {
      caption: "Com es connecten les casetes, el núvol i la web, de dalt a baix.",
      device: ["Caseta 1", "Caseta 2", "Caseta N"],
      linkSecure: "canal xifrat",
      secure: { title: "Passarel·la segura", sub: "Una identitat per caseta" },
      process: { title: "Processament", sub: "Valida i enriqueix cada missatge" },
      raw: { title: "Històric complet", sub: "Tots els missatges, en brut", hint: "Per revisar-ho i estudiar-ho" },
      curated: { title: "Dades del dia a dia", sub: "Resumides per caseta i espècie", hint: "Lectura ràpida per a la web" },
      serve: { title: "Anàlisi", sub: "Models i reprocessos" },
      web: { title: "Web de visualització", sub: "Taulells de la xarxa" },
    },
    stubPages: {
      hardware: { title: "Hardware", text: "[Pàgina de maquinari: pendent]" },
      software: {
        title: "Software",
        lead: "La plataforma de Garuda connecta cada menjadora amb un web de visualització. Està pensada per funcionar bé des d'uns quants dispositius fins a una xarxa a escala de ciutat, tenint cura de la privacitat i la seguretat en cada pas.",
        sections: [
          {
            title: "Dispositius",
            text: "Cada menjadora processa la imatge i el so al mateix aparell. Només en surten dades agregades —l'espècie detectada, el moment, un recompte— i mai la imatge o l'àudio en brut. Així protegim la privacitat des del disseny.",
          },
          {
            title: "Connexió segura",
            text: "La comunicació amb el núvol fa servir canals xifrats i una identitat única per a cada casita, de manera que la xarxa de menjadores no comparteix credencials i cada dispositiu respon només pel que és seu.",
          },
          {
            title: "Processament i dades",
            text: "Al núvol validem i enriquim el que arriba: associem cada missatge a la seva casita i a la seva ubicació, i en guardem tant l'històric complet, per si cal repassar-lo, com la versió ja resumida per al dia a dia.",
          },
          {
            title: "Web de visualització",
            text: "Un tauler web mostra l'activitat de cada menjadora i de la xarxa: quines espècies hi vénen, quan, i com evoluciona l'avifauna de l'entorn. Pensat perquè ajuntaments i col·laboradors entenguin les dades sense ser personal tècnic.",
          },
          {
            title: "Creixement per fases",
            text: "L'arquitectura creix amb el projecte: comença petita per validar el prototip i s'amplia a mesura que arriben més casitas i més usuaris. Així el cost i la complexitat s'ajusten sempre al que cal.",
          },
        ],
      },
      team: { title: "Equip i patrocinadors", text: "[Pàgina d'equip i patrocinadors: pendent]" },
    },
    project: {
      phase: "Etapa {n}. ",
      status: { done: "Fet", current: "En curs" },
    },
    team: {
      more: "Més sobre {name}",
      photoHint: "[La foto {n}{ext} va a src/photos/home/home_team/]",
      portrait: "Retrat de {name}",
      logoAlt: "Logotip de l'equip Garuda",
      close: "Tanca",
      role: "Rol a l'equip",
      education: "Formació",
      links: "Enllaços",
      linksGap: "[Enllaços de LinkedIn i GitHub]",
      reflections: "Reflexions",
      reflectionGap: "[Resposta d'aquest membre de l'equip]",
      newTab: " (s'obre en una pestanya nova)",
    },
    lightbox: {
      label: "Visor de fotos",
      count: "{i} de {n}",
      close: "Tanca",
      prev: "Foto anterior",
      next: "Foto següent",
    },
    hero: {
      by: "Per",
    },
    build: {
      step: "Pas {n}: ",
      progress: "Progrés",
      explore: "Explora el prototip",
      goTo: "Pas {n} de {total}",
    },
    footer: {
      tagline: "Menjadores intel·ligents per a una avifauna urbana equilibrada.",
      projectTitle: "Projecte",
      contactTitle: "Contacte",
      rights: "Tots els drets reservats.",
      top: "Torna a dalt",
      links: {
        roadmap: "Full de ruta",
        stages: "Etapes",
        team: "Qui som",
        contact: "Contacta'ns",
      },
    },
    contact: {
      title: "Contacta'ns",
      lead: "Vols saber més del projecte, col·laborar o patrocinar-nos? Escriu-nos i et respondrem tan aviat com puguem.",
      name: "Nom",
      email: "Correu",
      message: "Missatge",
      namePlaceholder: "El teu nom",
      emailPlaceholder: "tu@correu.com",
      messagePlaceholder: "Explica'ns breument què necessites",
      send: "Envia",
      sending: "Obrint el teu client de correu…",
      subject: "Sol·licitud d'informació — Garuda",
      orWriteTo: "O escriu-nos directament a",
      required: "Camp obligatori",
      invalidEmail: "Correu no vàlid",
    },
  },
  projectV2: {
    title: "Del prototip a la xarxa de ciutat.",
    lead:
      "Garuda és un prototip que encara està creixent. Aquí mostrem què fa avui i què pensem afegir. [Context del projecte: pendent]",
    phases: [
      { title: "Prototip", text: "Una menjadora amb dos compartiments, una càmera, un micròfon i un altaveu, construïda al voltant d'un Arduino Uno Q." },
      { title: "Models i proves de camp", text: "[Pendent]" },
      { title: "Servidors i web", text: "Servidors separats (API i base de dades, i un web de visualització), amb dades enviades per API des de cada placa." },
      { title: "Més espècies i integració a la ciutat", text: "Més espècies, un altaveu d'alta fidelitat i integració amb altres productes de la ciutat." },
    ],
  },
  phasesPreview: {
    title: "Garuda, pas a pas",
    phase2: { title: "Etapa 2", text: "Hi estem treballant..." },
    steps: previewLines.map(([title, text]) => ({ title, text })),
  },
};
