-- =============================================================
--  Ballon d'Or catalogue — database schema
--  Schéma de la base de données du catalogue Ballon d'Or
--
--  Two tables + one view:
--    players  : one row per person (Messi appears ONCE here)
--    awards   : one row per trophy (Messi appears 8 times here)
--    winners  : a ready-made JOIN of the two, handy for the API
-- =============================================================

DROP VIEW  IF EXISTS winners;
DROP TABLE IF EXISTS awards;
DROP TABLE IF EXISTS players;

CREATE TABLE players (
  id             INTEGER PRIMARY KEY,          -- unique number for each player
  name           TEXT    NOT NULL,
  nationality    TEXT    NOT NULL,             -- country in English
  nationality_fr TEXT    NOT NULL,             -- pays en français
  position       TEXT    NOT NULL CHECK (position IN ('Goalkeeper','Defender','Midfielder','Forward')),
  born           INTEGER,                      -- birth year
  image_url      TEXT    NOT NULL,             -- photo link (Wikimedia Commons or the placeholder)
  image_credit   TEXT,                         -- photographer + licence
  image_source   TEXT                          -- page where the photo licence can be checked
);

CREATE TABLE awards (
  id             INTEGER PRIMARY KEY,
  year           INTEGER NOT NULL,
  category       TEXT    NOT NULL CHECK (category IN ('men','women')),
  player_id      INTEGER NOT NULL REFERENCES players(id),   -- FOREIGN KEY → players.id
  club           TEXT    NOT NULL,             -- club at the time of the award
  description_en TEXT,
  description_fr TEXT,
  UNIQUE (year, category)                      -- only one winner per year per category
);

CREATE INDEX idx_awards_player ON awards(player_id);

-- A VIEW is a saved SELECT. You can query it like a table:
--   SELECT * FROM winners WHERE nationality = 'France';
CREATE VIEW winners AS
SELECT a.id,
       a.year,
       a.category,
       p.id            AS player_id,
       p.name          AS player,
       p.nationality,
       p.nationality_fr,
       p.position,
       a.club,
       p.image_url,
       a.description_en,
       a.description_fr
FROM awards  AS a
JOIN players AS p ON p.id = a.player_id;
