# Ballon d'Or Academy

A project-based web development course (English + French) and the finished project it builds.

| Folder | What it is |
| --- | --- |
| `ballondor-catalogue/` | The finished app = the reference solution. Node.js + Express + SQLite (`db/ballondor.db`, 52 players, 78 awards 1956–2026). Run with `npm install && npm start` → http://localhost:3000 |
| `course-site/` | The interactive course website, live at **https://diriho.github.io/ballondor-academy/**. `src/*.html` are the parts, `build.py` stitches them with the real project files into `index.html`. |

## Deploying the course site

The site is static (one `index.html` + `assets/`), published to GitHub Pages by
[`.github/workflows/deploy-course-site.yml`](.github/workflows/deploy-course-site.yml).

- **One-time setup:** on GitHub, open *Settings → Pages → Build and deployment* and set *Source* to **GitHub Actions**.
- **After that:** every push to `main` that touches `course-site/` or `ballondor-catalogue/` rebuilds and redeploys automatically (about 1 minute). You can also run it by hand from the *Actions* tab.
- **Preview locally:** `cd course-site && python3 -m http.server` → http://localhost:8000

Learners' progress (ticked steps, solved SQL challenges, last step visited) is saved in their own browser, so no accounts or backend are needed.

Rebuild the course page after changing the project or the lessons:

```bash
cd course-site
python3 build.py
```

`build.py` pulls code straight from `ballondor-catalogue/` (via `@@include …@@` markers), so the code shown in the lessons always matches the finished app.

Rebuild the database after editing `db/seed.sql`:

```bash
cd ballondor-catalogue
npm run db:build
```
