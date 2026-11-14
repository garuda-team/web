# Garuda

The product website of the Garuda team: smart bird feeders that use IoT and Edge AI
to manage urban birdlife.

Built with React and Vite. There is no server: GitHub Pages hosts it for free.

---

## 1. Put your own content in

You only need to touch two places.

| What | Where |
| --- | --- |
| All the text: team name, hero, team, project and interface wording | `src/content.js` |
| Your photos and videos | the folders in `src/photos/` |

**Text.** Open `src/content.js`. Anything in `[square brackets]` is a placeholder.
Replace it, brackets included. Until you do, it shows on the site with a dashed
underline, so you can spot the ones you missed. Your course details (programme,
school, university) are the placeholders in `site.course`.

**Photos.** Drop them in the folders under `src/photos/`; the site finds them on its
own. `src/photos/HOW-TO.txt` explains each folder. For example:

- `src/photos/home/home_team/` team portraits named `1.jpg` to `5.jpg`, in the order
  of the team in `src/content.js`.
- `src/photos/logo/` the team logo (PNG, transparent).
- `src/photos/home/home_title/` the title cut-out (PNG, transparent).

Files show in name order. The words after a leading number become the caption:
`03-arms-on-the-body.jpg` is shown as "Arms on the body".

Use `.jpg`, `.png` or `.webp` (iPhone `.heic` photos don't work in most browsers;
export them as JPG), and resize big phone photos to about 2000 pixels wide.

When all your photos are in, set `showPhotoHints: false` in `src/content.js`
to hide the empty photo frames.

**Colours and fonts.** Colours: the `:root` block at the top of `src/styles.css`.
Fonts: `src/fonts.js`.

---

## 2. Publish it on GitHub Pages (free)

Automatic publishing is pending: the deployment workflow
(`.github/workflows/deploy.yml`) is not in this repository yet.

1. **Create a repository.** On github.com, click **New repository**. Give it a
   short name such as `garuda-website` and make it **Public**. Don't add a README.
   Once publishing is set up, your site will live at
   `https://YOUR-USERNAME.github.io/garuda-website/`.

2. **Turn on Pages (pending).** When the deployment workflow is added, go to the
   repository's **Settings > Pages > Build and deployment > Source: GitHub Actions**.
   Until then there is nothing to turn on.

3. **Open your site** at `https://YOUR-USERNAME.github.io/garuda-website/` once
   publishing is set up.

**Editing later.** On github.com, open `src/content.js`, click the pencil, edit,
and click **Commit changes**. To add photos, open the right folder in
`src/photos/` and use **Add file > Upload files**. The site updates itself once
automatic publishing is set up (pending).

---

## 3. See it on your computer (optional)

Install [Node.js](https://nodejs.org) (version 24, as set in `.nvmrc`; 22.23.4 or newer in the 22 line also works), then in this folder:

```bash
npm install
npm run dev
```

and open the address it prints (usually http://127.0.0.1:5173). The page reloads
as you edit. `npm run build` makes the final version in `dist/`.

---

## Questions

**Why is there no backend?** GitHub Pages can only host static files,
and this site doesn't need a server: the text, photos, drawings and the
interactive parts all run in the visitor's browser. If you later want a contact
form, a service like Formspree works without a server; anything that needs
a server (for example, live data from the feeders) would need hosting elsewhere.

**Can I use my own domain?** Yes: Settings > Pages > Custom domain.

**What is in the project?**

```
src/content.js        all the text of the site
src/photos/           your photos (read HOW-TO.txt inside)
src/styles.css        colours, fonts and layout
src/components/       the sections of the page (React)
# pending: automatic publishing to GitHub Pages (workflow not added yet)
```

## Cómo se trabaja

Para entender qué es Garuda, cómo está organizado el código y cómo se reparte el trabajo entre agentes, lee [docs/WORKFLOW.md](docs/WORKFLOW.md). La configuración de los agentes y el estado detallado del proyecto son privados del equipo.

Antes de publicar cambios, `npm run build` debe terminar sin errores.
