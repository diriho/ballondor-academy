// server.js — the back end of the Ballon d'Or catalogue
// Le serveur : il lit la base SQLite et renvoie du JSON au navigateur.
import express from 'express';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// 1) Open the database. readonly: the API only reads, it never changes data.
const db = new Database(path.join(here, 'db', 'ballondor.db'), {
  readonly: true,
  fileMustExist: true,
});

// A tiny custom SQL function so "dembele" also finds "Dembélé".
// Petite fonction SQL maison : recherche insensible aux accents.
const fold = (text) =>
  String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
db.function('fold', fold);

// 2) Serve the front end (everything inside /public) as static files.
app.use(express.static(path.join(here, 'public')));

// 3) API routes ------------------------------------------------------------

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const SORTS = {
  newest: 'year DESC, category',
  oldest: 'year ASC, category',
  name: 'player COLLATE NOCASE, year',
};

// GET /api/winners?q=messi&category=men&decade=2010&position=Forward&sort=newest
app.get('/api/winners', (req, res) => {
  const { q = '', category = 'all', decade = 'all', position = 'all', sort = 'newest' } = req.query;

  const where = [];   // pieces of the WHERE clause
  const params = {};  // values, sent separately → no SQL injection possible

  if (q.trim()) {
    where.push(`(fold(player) LIKE @q OR fold(club) LIKE @q
                 OR fold(nationality) LIKE @q OR fold(nationality_fr) LIKE @q)`);
    params.q = `%${fold(q.trim())}%`;
  }
  if (category === 'men' || category === 'women') {
    where.push('category = @category');
    params.category = category;
  }
  if (/^\d{4}$/.test(decade)) {
    where.push('year BETWEEN @from AND @to');
    params.from = Number(decade);
    params.to = Number(decade) + 9;
  }
  if (POSITIONS.includes(position)) {
    where.push('position = @position');
    params.position = position;
  }

  const sql = `
    SELECT * FROM winners
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${SORTS[sort] ?? SORTS.newest}`;

  res.json(db.prepare(sql).all(params));
});

// GET /api/players/7 → one player + every award they won
app.get('/api/players/:id', (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  player.awards = db
    .prepare(`SELECT year, category, club, description_en, description_fr
              FROM awards WHERE player_id = ? ORDER BY year`)
    .all(player.id);

  res.json(player);
});

// GET /api/stats → numbers for the hero + the two side panels
app.get('/api/stats', (req, res) => {
  const totals = db.prepare(`
    SELECT COUNT(*)                    AS awards,
           COUNT(DISTINCT player_id)   AS players,
           COUNT(DISTINCT nationality) AS nations,
           MIN(year)                   AS first_year,
           MAX(year)                   AS last_year
    FROM winners`).get();

  const topPlayers = db.prepare(`
    SELECT player_id, player, nationality, nationality_fr, image_url, COUNT(*) AS wins
    FROM winners
    GROUP BY player_id
    ORDER BY wins DESC, MIN(year)
    LIMIT 8`).all();

  const topNations = db.prepare(`
    SELECT nationality, nationality_fr, COUNT(*) AS wins
    FROM winners
    GROUP BY nationality
    ORDER BY wins DESC, nationality
    LIMIT 8`).all();

  res.json({ totals, topPlayers, topNations });
});

// Any other /api/... address → a clean JSON 404
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route' }));

// 4) Start listening
app.listen(PORT, () => {
  console.log(`⚽ Ballon d'Or catalogue → http://localhost:${PORT}`);
});
