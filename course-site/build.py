"""Builds course-site/index.html from src/*.html + the real project files.

    python3 build.py

Placeholders understood inside src/*.html:
  @@include <path>@@            whole file from ../ballondor-catalogue/<path>
  @@include <path>#<Section>@@  one "/* ---------- Section ---------- */" block (#HEAD = before the first)
  @@img:<key>@@                 that player's Wikimedia image URL
  @@datajs:<n>@@                a data.js with n sample winners
  @@seedhead:<n>@@              first n lines of seed.sql
  @@DATASET@@ @@RAW <path>@@ @@DATAJS_FULL@@   data blocks for the page script
"""
import json, re, sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJ = HERE.parent / "ballondor-catalogue"
SRC = HERE / "src"
MARK = re.compile(r"^\s*/\* -{3,} (.+?) -{3,} \*/\s*$")

def section(path, name):
    lines = (PROJ / path).read_text().splitlines()
    marks = [i for i, l in enumerate(lines) if MARK.match(l)]
    if name == "HEAD":
        chunk = lines[: marks[0]]
    else:
        start = next(i for i in marks if MARK.match(lines[i]).group(1).startswith(name))
        nxt = [i for i in marks if i > start]
        chunk = lines[start: nxt[0] if nxt else len(lines)]
    return "\n".join(chunk).rstrip()

def safe(text):  # text going inside a <script> block
    return text.replace("</script", "<\\/script")

db = sqlite3.connect(PROJ / "db" / "ballondor.db")
db.row_factory = sqlite3.Row
winners = [dict(r) for r in db.execute("SELECT * FROM winners ORDER BY year DESC, category")]
players = [dict(r) for r in db.execute("SELECT * FROM players ORDER BY id")]
images = json.loads((SRC / "data" / "images.json").read_text())
url_to_key = {v["thumb"]: k for k, v in images.items() if v}

def local_img(url):
    k = url_to_key.get(url)
    return f"assets/players/{k}.jpg" if k else "assets/ballor.jpg"

FIELDS = ["year", "category", "player_id", "player", "nationality", "nationality_fr",
          "position", "club", "image_url", "description_en", "description_fr"]

def datajs(rows, note):
    out = [f"// public/js/data.js — {note}", "export const winners = ["]
    for w in rows:
        out.append("  {")
        out += [f"    {f}: {json.dumps(w[f], ensure_ascii=False)}," for f in FIELDS]
        out.append("  },")
    out.append("];")
    return "\n".join(out)

sample = [w for w in winners if (w["year"], w["category"]) in {(2026, "men"), (2025, "women"), (1998, "men"), (1963, "men")}]
dataset = {
    "winners": [{"year": w["year"], "category": w["category"], "player": w["player"], "club": w["club"],
                 "nationality": w["nationality"], "nationality_fr": w["nationality_fr"],
                 "position": w["position"], "img": local_img(w["image_url"])} for w in winners],
    "players": [{"name": p["name"], "credit": p["image_credit"], "source": p["image_source"]} for p in players],
}
key_by_name = {v: k for k, v in url_to_key.items()}

html = "".join((SRC / f).read_text() for f in sorted(p.name for p in SRC.glob("*.html")))

def sub(m):
    tag, arg = m.group(1), (m.group(2) or "").strip()
    if tag == "include":
        path, _, sec = arg.partition("#")
        return safe(section(path, sec) if sec else (PROJ / path).read_text().rstrip())
    if tag == "img":
        return images[arg]["thumb"]
    if tag == "datajs":
        return safe(datajs(sample[: int(arg)], "temporary data (moves into a database in step 9)"))
    if tag == "seedhead":
        lines = (PROJ / "db" / "seed.sql").read_text().splitlines()[: int(arg)]
        return safe("\n".join(lines) + "\n-- … 52 players + 78 awards in the full file (use the Copy button)")
    if tag == "DATASET":
        return json.dumps(dataset, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    if tag == "RAW":
        return safe((PROJ / arg).read_text())
    if tag == "DATAJS_FULL":
        return safe(datajs(winners, "all 78 awards (temporary: replaced by the database in step 11)") + "\n")
    raise ValueError(tag)

out = re.sub(r"@@(include|img|datajs|seedhead|DATASET|RAW|DATAJS_FULL)(?::|\s+)?([^@]*)@@", sub, html)
left = re.findall(r"@@[^@\n]{0,40}@@", out)
assert not left, left
(HERE / "index.html").write_text(out)
print(f"index.html: {len(out) / 1024:.0f} KB, {len(winners)} awards, {len(players)} players")
