"""Builds both websites into _site/ for GitHub Pages.

    python3 deploy/build_pages.py
    python3 -m http.server -d _site 8000

    _site/            → the course            http://localhost:8000/
    _site/catalogue/  → the finished app      http://localhost:8000/catalogue/

The finished app normally needs its Node server (server.js). For the static copy,
deploy/demo-api.js answers the same /api routes in the browser from a snapshot of
db/ballondor.db, built here with the same SQL queries as server.js.
ballondor-catalogue/ itself is copied as-is and never modified.
"""
import json, shutil, sqlite3, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COURSE = ROOT / "course-site"
APP = ROOT / "ballondor-catalogue"
OUT = ROOT / "_site"

# ---------- 1. the course ----------
subprocess.run([sys.executable, str(COURSE / "build.py")], check=True)
shutil.rmtree(OUT, ignore_errors=True)
OUT.mkdir()
shutil.copy(COURSE / "index.html", OUT / "index.html")
shutil.copytree(COURSE / "assets", OUT / "assets")

# ---------- 2. the finished app ----------
demo = OUT / "catalogue"
shutil.copytree(APP / "public", demo)

db = sqlite3.connect(APP / "db" / "ballondor.db")
db.row_factory = sqlite3.Row
rows = lambda sql, *p: [dict(r) for r in db.execute(sql, p)]

data = {  # same queries as server.js
    "winners": rows("SELECT * FROM winners ORDER BY year DESC, category"),
    "stats": {
        "totals": rows("""
            SELECT COUNT(*) AS awards, COUNT(DISTINCT player_id) AS players,
                   COUNT(DISTINCT nationality) AS nations, MIN(year) AS first_year, MAX(year) AS last_year
            FROM winners""")[0],
        "topPlayers": rows("""
            SELECT player_id, player, nationality, nationality_fr, image_url, COUNT(*) AS wins
            FROM winners GROUP BY player_id ORDER BY wins DESC, MIN(year) LIMIT 8"""),
        "topNations": rows("""
            SELECT nationality, nationality_fr, COUNT(*) AS wins
            FROM winners GROUP BY nationality ORDER BY wins DESC, nationality LIMIT 8"""),
    },
    "players": {},
}
for p in rows("SELECT * FROM players"):
    p["awards"] = rows("""SELECT year, category, club, description_en, description_fr
                          FROM awards WHERE player_id = ? ORDER BY year""", p["id"])
    data["players"][p["id"]] = p

api = (ROOT / "deploy" / "demo-api.js").read_text()
assert "/*@@DATA@@*/null" in api
api = api.replace("/*@@DATA@@*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
(demo / "js" / "demo-api.js").write_text(api)

html = (demo / "index.html").read_text()
app_tag = '<script type="module" src="js/app.js"></script>'
footer_end = "</footer>"
for needle in (app_tag, 'class="brand" href="/"', footer_end):
    assert html.count(needle) == 1, f"public/index.html changed, update build_pages.py: {needle}"
html = html.replace(app_tag, '<script src="js/demo-api.js"></script>\n  ' + app_tag)  # must run before app.js
html = html.replace('class="brand" href="/"', 'class="brand" href="./"')  # the site lives in a sub-folder
link = '<a style="color:inherit" href="{}">{}</a>'
html = html.replace(footer_end, "  <p>Ballon d'Or Academy · " + link.format("../", "Course / Cours") + " · "
                    + link.format("https://github.com/diriho/ballondor-academy/tree/main/ballondor-catalogue", "Code")
                    + "</p>\n  " + footer_end)
(demo / "index.html").write_text(html)

size = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file())
print(f"_site/: course + catalogue/ ({len(data['winners'])} awards, {len(data['players'])} players), {size / 1024 / 1024:.1f} MB")
