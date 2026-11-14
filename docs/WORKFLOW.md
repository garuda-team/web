# Cómo se trabaja en Garuda

Guía corta para entender qué es el proyecto, cómo está organizado el código y cómo se reparte el trabajo. Está pensada para quien llega a un commit o al repositorio por primera vez.

## 1. Qué es el proyecto

- **Garuda** son comederos inteligentes con IoT y Edge AI para gestionar la avifauna. Un compartimento atiende a las aves nativas (gorrión común) y otro, con alimento tratado, a la especie invasora (cotorra argentina), solo en su época de reproducción.
- Esta web es la **página de producto** del proyecto: un sitio estático (React 19 + Vite 6) publicado con GitHub Pages, sin backend.
- **Estado actual:** el repositorio nace de la web de un dron (base v0) que se está sustituyendo por contenido de Garuda. Ya se han retirado las páginas phase-1 y phase-2, el modelo 3D del dron, Glossary y otros restos. Lo abierto se resume en la sección 7.

## 2. Estructura

- `index.html` carga `src/main.jsx`, que monta `src/App.jsx`.
- **Páginas por hash** (`src/lib/route.js`, sin librería de router): `#/` (home), `#/hardware`, `#/software` y `#/team`. Una sección dentro de una página usa `#/hardware/build`.
- `src/components/`: secciones y piezas de interfaz (Hero, Build, Team, Nav, Lightbox, etc.).
- `src/lib/`: utilidades (ruteo, hooks, animación, fotos, texto, idioma en `lang.js`).
- `src/styles.css` y `src/v2.css`: estilos. Los tokens viven en `:root`.
- `src/content.js`: todo el texto del sitio en inglés (base). `src/content.es.js` y `src/content.ca.js` contienen las traducciones con la misma estructura; lo que falte cae al inglés.
- `src/photos/`: fotos y vídeos descubiertos por carpeta y nombre, sin listarlos en código. Detalles en `src/photos/HOW-TO.txt`. Las palabras tras un número inicial forman el pie de foto.
- `public/`: ficheros estáticos.

## 3. Normas

- **Texto en `src/content.js`**, nunca escrito a mano en los componentes. Todo texto nuevo va también en `src/content.es.js` y `src/content.ca.js`.
- **`[Entre corchetes]` = pendiente del equipo** en los tres idiomas. No se inventan datos (precios, modelos, nombres, fechas, resultados). Si falta un dato, se pregunta o se deja el marcador.
- **Estilos:** usar tokens de `:root` y las superficies `paper` / `ink`; nada de colores sueltos. Nomenclatura BEM-ish (`bloque__elemento--modificador`).
- **Accesibilidad obligatoria:** `prefers-reduced-motion`, atributos `aria-*`, foco visible y navegación por teclado.
- **Proyecto ligero:** no añadir dependencias sin justificar qué resuelven y cuánto pesan, y avisar antes.
- **Idioma:** código en inglés; el sitio en inglés, castellano y catalán; documentación y conversación en español. El idioma lo elige `src/lib/lang.js`: la elección guardada en el navegador, si no el idioma del navegador, si no inglés. El selector está en la barra de navegación y al cambiar recarga la página. No hay idioma en la URL.
- **Formato:** UTF-8, indentación de 2 espacios y finales de línea LF (ver `.editorconfig` y `.gitattributes`).
- **Sin secretos en el repo:** `.env`, la configuración local de Claude Code y el vault privado no se versionan.

## 4. Comandos

```bash
npm install       # instalar dependencias
npm run dev       # servidor local con recarga
npm run build     # genera dist/; debe terminar sin errores
npm run preview   # sirve el build para revisarlo
```

- **Node:** la versión mínima y la recomendada están en `.nvmrc` y en `engines` de `package.json`.
- **Lint y tests:** todavía no existen. La verificación mínima es `npm run build` y una revisión visual en móvil y escritorio.
- **Despliegue:** previsto con GitHub Pages mediante GitHub Actions; el workflow aún no está en el repositorio.

## 5. Flujo de trabajo con agentes de Claude Code

El trabajo se reparte entre agentes. La configuración de los agentes es privada del equipo y no se versiona.

1. **PM:** planifica la tarea y la delega.
2. **frontend** (`src/`) y **devops** (configuración: workflows, ESLint, Vite, scripts) implementan cada uno en su ámbito.
3. **tester:** ejecuta el build y revisa el resultado.
4. **security-reviewer:** revisa la seguridad del cambio.
5. **reporter:** registra en un vault de Obsidian privado (no incluido en el repo) las tareas, los bugs (`BUG-XXX`) y los hallazgos de seguridad (`SEC-XXX`).

- Si tester o security-reviewer encuentran problemas, se hace una vuelta de corrección. **Máximo 3 vueltas**; después se escala al equipo.
- Cada tarea se cierra con su registro en el vault, así que el historial detallado vive fuera del repo.

## 6. Dónde mirar

- **`README.md`:** uso general, cómo cambiar el contenido y cómo publicar.
- **Vault de Obsidian:** privado, no está en el repositorio. Aquí solo se resume.

## 7. Trabajo reciente y pendiente

Resumen a fecha de 2026-11-10.

**Cerrado recientemente**

- **2026-11-10:** función de idiomas (inglés, castellano y catalán) implementada y textos de interfaz centralizados; precarga perezosa de la flora y cierre de los bugs BUG-032 a BUG-055; retirada de Glossary y de las páginas phase-1 y phase-2; equipo de cinco miembros; limpieza de código sin uso y duplicado, sin cambios visuales.
- **2026-10-28:** logo, título y favicon actualizados; hojas y gorriones en negativo en hardware, software y team; host de Vite fijado a 127.0.0.1.
- **2026-10-27:** dron 3D y su dependencia retirados; fondo con fotogramas reales de flora.
- **2026-10-22:** versión mínima de Node actualizada; cerrados SEC-001 a SEC-003.

**Abierto**

- Ilustraciones animadas de aves, hojas y árboles (SVG por capas) y su formato: en curso.
- Loader solo con el logo: pendiente de revisión visual.
- Revisión de las traducciones castellana y catalana por el equipo. Los pies de foto salen del nombre de archivo y no se traducen.
- Pendiente del equipo: datos reales de los cinco miembros (ahora son marcadores) y fotos de los integrantes 4 y 5.
- Accesibilidad: alternativa estática al efecto de enfoque y a los cambios de cámara con `prefers-reduced-motion`. Es norma obligatoria y está aplazada.
- Revisión visual manual en navegador, con y sin reduced-motion, en móvil y escritorio.
- Baja prioridad: verificar la procedencia de dependencias con `npm audit signatures`, observaciones BUG-045, BUG-048 y BUG-049, estilos sin uso y renombrar PNG con espacios.
