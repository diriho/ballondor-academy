# Ballon d'Or Academy

A project-based web development course (English + French) and the finished project it builds.

**The course is live at https://diriho.github.io/ballondor-academy/**

| Folder | What it is |
| --- | --- |
| `ballondor-catalogue/` | The finished app = the reference solution. Node.js + Express + SQLite (`db/ballondor.db`, 52 players, 78 awards 1956–2026). Run with `npm install && npm start` → http://localhost:3000 |
| `course-site/` | The interactive course website. `src/*.html` are the parts, `build.py` stitches them with the real project files into `index.html`. |

## Deploying

The course is published to GitHub Pages by [`.github/workflows/static.yml`](.github/workflows/static.yml):
every push to `main` rebuilds `course-site/index.html` and publishes it with `course-site/assets/` (about 1 minute).
You can also run it by hand from the *Actions* tab. (Pages must stay set to *Settings → Pages → Source: GitHub Actions*.)

Preview locally: `cd course-site && python3 -m http.server` → http://localhost:8000

## Deploying the finished app on Vercel

`ballondor-catalogue/` deploys to Vercel as-is (Vercel runs Express apps with zero configuration):

1. On [vercel.com](https://vercel.com): **Add New… → Project** → import the `ballondor-academy` GitHub repo.
2. **Root Directory** → *Edit* → choose `ballondor-catalogue`. Framework Preset is detected as **Express**; leave the build and install settings empty.
3. **Deploy.** You get a `https://….vercel.app` link; every push to `main` redeploys it.

How it runs there: `public/` is served by Vercel's CDN, and `server.js` becomes one serverless function that answers `/api/...`. Vercel bundles `db/ballondor.db` and better-sqlite3's prebuilt Linux binary with it automatically. `ballondor-catalogue/.npmrc` stops npm from trying to recompile better-sqlite3, which would need build tools on Vercel's servers. The build log warns that `"engines": ">=22"` picks the newest Node.js; that's fine.

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
