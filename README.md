# Ballon d'Or Academy

A project-based web development course (English + French) and the finished project it builds.

| Folder | What it is |
| --- | --- |
| `ballondor-catalogue/` | The finished app = the reference solution. Node.js + Express + SQLite (`db/ballondor.db`, 52 players, 78 awards 1956–2026). Run with `npm install && npm start` → http://localhost:3000 |
| `course-site/` | The interactive course page (published as a Claude artifact). `src/*.html` are the parts, `build.py` stitches them with the real project files into `index.html`. |

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
