# Ballon d'Or Catalogue

Every Ballon d'Or winner since 1956 (men's award since 1956, women's since 2018), stored in a SQLite database and served by a small Node.js + Express API.
*Tous les lauréats du Ballon d'Or depuis 1956, stockés dans une base SQLite et servis par une petite API Node.js + Express.*

## Run it / Lancer le projet

```bash
npm install
npm start
```

Then open / puis ouvre **http://localhost:3000**

| Command | What it does / Ce que ça fait |
| --- | --- |
| `npm start` | Start the server / Démarre le serveur |
| `npm run dev` | Start and restart on every save / Redémarre à chaque sauvegarde |
| `npm run db:build` | Rebuild `db/ballondor.db` from `schema.sql` + `seed.sql` / Reconstruit la base |

## Project layout / Structure

```
ballondor-catalogue/
├── server.js            ← Express API + static files
├── package.json
├── db/
│   ├── schema.sql       ← tables: players, awards + view: winners
│   ├── seed.sql         ← 52 players, 78 awards (1956 → 2026)
│   ├── build.js         ← npm run db:build
│   └── ballondor.db     ← the SQLite database
└── public/              ← everything the browser downloads
    ├── index.html
    ├── css/style.css
    ├── js/app.js
    └── assets/          ← logo + ballor.jpg placeholder
```

## API

| Route | Example |
| --- | --- |
| `GET /api/winners` | `/api/winners?q=messi&category=men&decade=2010&position=Forward&sort=oldest` |
| `GET /api/players/:id` | `/api/players/43` |
| `GET /api/stats` | totals, most wins, top nations |

## Data notes / Notes sur les données

- No Ballon d'Or was awarded in 2020 (COVID-19). / *Pas de Ballon d'Or en 2020.*
- Photos come from Wikimedia Commons; author + licence for each one is in `players.image_credit` and `players.image_source`. Players without a free photo use the `ballor.jpg` placeholder.
- *Les photos viennent de Wikimedia Commons ; l'auteur et la licence sont dans `players.image_credit`.*
