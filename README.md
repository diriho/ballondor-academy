# Ballon d'Or Academy

A project-based web development course (English + French) and the finished project it builds.

Two websites, published together:

| Website | Address |
| --- | --- |
| The course | **https://diriho.github.io/ballondor-academy/** |
| The finished app (what learners build) | **https://diriho.github.io/ballondor-academy/catalogue/** |

| Folder | What it is |
| --- | --- |
| `ballondor-catalogue/` | The finished app = the reference solution. Node.js + Express + SQLite (`db/ballondor.db`, 52 players, 78 awards 1956–2026). Run with `npm install && npm start` → http://localhost:3000 |
| `course-site/` | The interactive course. `src/*.html` are the parts, `build.py` stitches them with the real project files into `index.html`. |
| `deploy/` | Builds both websites into `_site/` for GitHub Pages. |

## Deploying

Both sites are published to GitHub Pages by [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

- **One-time setup:** on GitHub, open *Settings → Pages → Build and deployment* and set *Source* to **GitHub Actions**.
- **After that:** every push to `main` that touches `course-site/`, `ballondor-catalogue/` or `deploy/` rebuilds and redeploys both sites (about 1 minute). You can also run it by hand from the *Actions* tab.
- **Preview locally:** `python3 deploy/build_pages.py && python3 -m http.server -d _site 8000` → http://localhost:8000 (course) and http://localhost:8000/catalogue/ (app)

**How the finished app runs without its server:** GitHub Pages only serves files, it can't run `server.js`. So `deploy/build_pages.py` copies `ballondor-catalogue/public/` unchanged and adds [`deploy/demo-api.js`](deploy/demo-api.js), which answers the same `/api/winners`, `/api/players/:id` and `/api/stats` requests inside the browser, using a snapshot of `db/ballondor.db` made with the same SQL as `server.js`. Visitors get the same results. The real Node.js version (and how to host it, on Render) is what step 12 of the course teaches.

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
