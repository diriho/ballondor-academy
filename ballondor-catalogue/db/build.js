// db/build.js — (re)creates ballondor.db from schema.sql + seed.sql
// Run it with:  npm run db:build
// Lance-le avec : npm run db:build
import Database from 'better-sqlite3';
import { readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(here, 'ballondor.db');

rmSync(dbPath, { force: true });          // start from a clean file
const db = new Database(dbPath);

db.exec(readFileSync(path.join(here, 'schema.sql'), 'utf8'));  // tables
db.exec(readFileSync(path.join(here, 'seed.sql'), 'utf8'));    // rows

const { players } = db.prepare('SELECT COUNT(*) AS players FROM players').get();
const { awards } = db.prepare('SELECT COUNT(*) AS awards FROM awards').get();
console.log(`✅ ballondor.db ready: ${players} players, ${awards} awards`);
db.close();
