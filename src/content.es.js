/*
  Traducción al castellano. Parcial: lo que falte cae al inglés (content.js).
*/

const previewLinesEs = [
  ["El problema", "Las cotorras argentinas, invasoras, compiten con los gorriones comunes, autóctonos, por la comida y los nidos."],
  ["Dos compartimentos", "El compartimento A es para las aves autóctonas y el B lleva comida tratada para la especie invasora."],
  ["Visión por computador", "La cámara identifica al ave y los actuadores abren el compartimento adecuado."],
  ["Monitorización acústica", "Un micrófono identifica los cantos y construye un mapa sonoro."],
  ["Cantos autóctonos", "Un altavoz reproduce cantos autóctonos para favorecer a los gorriones y a otras especies amenazadas."],
  ["Privacidad desde el diseño", "La imagen y el audio se quedan en el dispositivo, y solo se detectan aves."],
  ["Modelos", "Unos modelos de imagen y audio creados con Edge Impulse distinguen las dos especies."],
  ["Futuro", "Servidores, una web de visualización, cámara activada por movimiento y más especies."],
];

export default {
  site: {
    openPhoto: "Abrir foto: {caption}",
    contactEmail: "aboutgaruda@protonmail.com",
    course: {
      name: "[Nombre del programa]",
      school: "[Escuela]",
      university: "[Universidad]",
      address: ["[Dirección, línea 1]", "[Dirección, línea 2]", "[Código postal y ciudad]"],
    },
  },
  hero: {
    title: "Comederos inteligentes para una avifauna equilibrada.",
    intro:
      "Garuda es un comedero inteligente para aves que usa IoT y Edge AI para gestionar la avifauna urbana. Ayuda a especies autóctonas, como el gorrión común, a conservar su comida y sus nidos frente a las invasoras, como la cotorra argentina, con métodos éticos y sostenibles.",
  },
  team: {
    title: "Quiénes somos",
    members: Array.from({ length: 5 }, () => ({
      name: "[Nombre Apellido]",
      role: "[Rol en el proyecto]",
      background: "[Formación]",
      from: "[Ciudad, país]",
    })),
    reflections: [
      {
        title: "Lo que aprendimos",
        text: "[Escribe tres o cuatro frases. ¿Qué os sorprendió al construir el prototipo?]",
      },
      {
        title: "Cómo trabajamos en equipo",
        text: "[¿Cómo repartisteis el trabajo? ¿Qué funcionó bien y qué organizaríais de otra forma?]",
      },
      {
        title: "Qué haríamos de otra manera",
        text: "[Si empezarais de nuevo mañana, ¿qué cambiaríais?]",
      },
    ],
  },
  brand: {
    scroll: "Desplázate para ver cómo funciona",
  },
  ghosts: {
    project: "Hoja de ruta",
    build: "Construcción",
    team: "Equipo",
    contact: "Contacto",
    stubs: {
      hardware: "Hardware",
      software: "Software",
      team: "Equipo",
    },
  },
  ui: {
    placeholderHint: "Marcador de posición: sustitúyelo en content.js",
    intro: {
      photoAlt: "Comedero inteligente Garuda: un armario de madera estilizado con una antena",
      photoMissing: "[Foto del comedero pendiente: src/photos/home/home_title/]",
    },
    skip: "Saltar al contenido",
    and: " y ",
    nav: {
      sections: "Secciones",
      language: "Idioma",
      sheet: "Secciones (menú)",
      pages: "Páginas",
      pageLinks: [
        { label: "Inicio" },
        { label: "Hardware" },
        { label: "Software" },
        { label: "Equipo y patrocinadores" },
      ],
      links: {
        "/": { project: "Hoja de ruta", phases: "Etapas", team: "Quiénes somos", contact: "Contacto" },
      },
    },
    softwareDiagram: {
      caption: "Cómo se conectan las casitas, la nube y la web, de arriba abajo.",
      device: ["Casita 1", "Casita 2", "Casita N"],
      linkSecure: "canal cifrado",
      secure: { title: "Pasarela segura", sub: "Una identidad por casita" },
      process: { title: "Procesamiento", sub: "Valida y enriquece cada mensaje" },
      raw: { title: "Histórico completo", sub: "Todos los mensajes, en bruto", hint: "Para revisarlo y estudiarlo" },
      curated: { title: "Datos del día a día", sub: "Resumidos por casita y especie", hint: "Lectura rápida para la web" },
      serve: { title: "Análisis", sub: "Modelos y reprocesos" },
      web: { title: "Web de visualización", sub: "Paneles de la red" },
    },
    stubPages: {
      hardware: { title: "Hardware", text: "[Página de hardware: pendiente]" },
      software: {
        title: "Software",
        lead: "La plataforma de Garuda conecta cada comedero con una web de visualización. Está pensada para funcionar bien desde unos pocos dispositivos hasta una red a escala de ciudad, cuidando la privacidad y la seguridad en cada paso.",
        sections: [
          {
            title: "Dispositivos",
            text: "Cada comedero procesa la imagen y el sonido en el propio aparato. Solo salen datos agregados —la especie detectada, el momento, un conteo— y nunca la imagen o el audio en bruto. Así protegemos la privacidad desde el diseño.",
          },
          {
            title: "Conexión segura",
            text: "La comunicación con la nube usa canales cifrados y una identidad única para cada casita, de forma que la red de comederos no comparte credenciales y cada dispositivo responde solo por lo suyo.",
          },
          {
            title: "Procesamiento y datos",
            text: "En la nube validamos y enriquecemos lo que llega: asociamos cada mensaje a su casita y a su ubicación, y guardamos tanto el histórico completo, por si hace falta repasarlo, como la versión ya resumida para el día a día.",
          },
          {
            title: "Web de visualización",
            text: "Un panel web muestra la actividad de cada comedero y de la red: qué especies visitan, cuándo, y cómo evoluciona la avifauna del entorno. Pensado para que ayuntamientos y colaboradores entiendan los datos sin ser personal técnico.",
          },
          {
            title: "Crecimiento por fases",
            text: "La arquitectura crece con el proyecto: empieza pequeña para validar el prototipo y se amplía a medida que llegan más casitas y más usuarios. Así el coste y la complejidad se ajustan siempre a lo que hace falta.",
          },
        ],
      },
      team: { title: "Equipo y patrocinadores", text: "[Página de equipo y patrocinadores: pendiente]" },
    },
    project: {
      phase: "Etapa {n}. ",
      status: { done: "Hecho", current: "En curso" },
    },
    team: {
      more: "Más sobre {name}",
      photoHint: "[La foto {n}{ext} va en src/photos/home/home_team/]",
      portrait: "Retrato de {name}",
      logoAlt: "Logotipo del equipo Garuda",
      close: "Cerrar",
      role: "Rol en el equipo",
      education: "Formación",
      links: "Enlaces",
      linksGap: "[Enlaces de LinkedIn y GitHub]",
      reflections: "Reflexiones",
      reflectionGap: "[Respuesta de este miembro del equipo]",
      newTab: " (se abre en una pestaña nueva)",
    },
    lightbox: {
      label: "Visor de fotos",
      count: "{i} de {n}",
      close: "Cerrar",
      prev: "Foto anterior",
      next: "Foto siguiente",
    },
    hero: {
      by: "Por",
    },
    build: {
      step: "Paso {n}: ",
      progress: "Progreso",
      explore: "Explora el prototipo",
      goTo: "Paso {n} de {total}",
    },
    footer: {
      tagline: "Comederos inteligentes para una avifauna urbana equilibrada.",
      projectTitle: "Proyecto",
      contactTitle: "Contacto",
      rights: "Todos los derechos reservados.",
      top: "Volver arriba",
      links: {
        roadmap: "Hoja de ruta",
        stages: "Etapas",
        team: "Quiénes somos",
        contact: "Contáctanos",
      },
    },
    contact: {
      title: "Contáctanos",
      lead: "¿Quieres saber más del proyecto, colaborar o patrocinarnos? Escríbenos y te responderemos lo antes posible.",
      name: "Nombre",
      email: "Correo",
      message: "Mensaje",
      namePlaceholder: "Tu nombre",
      emailPlaceholder: "tu@correo.com",
      messagePlaceholder: "Cuéntanos brevemente qué necesitas",
      send: "Enviar",
      sending: "Abriendo tu cliente de correo…",
      subject: "Solicitud de información — Garuda",
      orWriteTo: "O escríbenos directamente a",
      required: "Campo obligatorio",
      invalidEmail: "Correo no válido",
    },
  },
  projectV2: {
    title: "Del prototipo a la red de ciudad.",
    lead:
      "Garuda es un prototipo que sigue creciendo. Aquí mostramos lo que hace hoy y lo que planeamos añadir. [Contexto del proyecto: pendiente]",
    phases: [
      { title: "Prototipo", text: "Un comedero con dos compartimentos, una cámara, un micrófono y un altavoz, construido en torno a una Arduino Uno Q." },
      { title: "Modelos y pruebas de campo", text: "[Pendiente]" },
      { title: "Servidores y web", text: "Servidores separados (API y base de datos, y una web de visualización), con datos enviados por API desde cada placa." },
      { title: "Más especies e integración en la ciudad", text: "Más especies, un altavoz de alta fidelidad e integración con otros productos de la ciudad." },
    ],
  },
  phasesPreview: {
    title: "Garuda, paso a paso",
    phase2: { title: "Etapa 2", text: "Estamos en ello..." },
    steps: previewLinesEs.map(([title, text]) => ({ title, text })),
  },
};
