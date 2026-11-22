// app.js — the front end of the Ballon d'Or catalogue
// 1. Translations   2. State + helpers   3. Talking to the API
// 4. Rendering      5. Events            6. Start

// Import Vercel Speed Insights
import { injectSpeedInsights } from '/@vercel/speed-insights/index.mjs';

const PLACEHOLDER = 'assets/ballor.jpg';

/* ---------- 1. Translations / Traductions ---------- */
const TEXT = {
  en: {
    eyebrow: 'Every winner since 1956',
    title: 'The Golden Ball Hall of Fame',
    lede: "Search seven decades of football's most famous individual award.",
    searchLabel: 'Search',
    searchPlaceholder: 'Player, club or country…',
    all: 'All', men: 'Men', women: 'Women',
    anyDecade: 'Any decade', anyPosition: 'Any position',
    newest: 'Newest first', oldest: 'Oldest first', name: 'Name A→Z',
    mostWins: 'Most wins', topNations: 'Top nations',
    awards: 'Awards', players: 'Winners', nations: 'Nations', years: 'Years',
    loading: 'Loading winners…',
    found: (n) => `${n} award${n === 1 ? '' : 's'} found`,
    none: 'No winner matches your search. Try another name or reset the filters.',
    error: 'Could not reach the server. Is it running? (npm start)',
    wins: (n) => `${n} Ballon${n === 1 ? '' : 's'} d'Or`,
    born: 'Born', photo: 'Photo',
    footer: 'Photos: Wikimedia Commons — author and licence are stored in the database (players.image_credit).',
    Goalkeeper: 'Goalkeeper', Defender: 'Defender', Midfielder: 'Midfielder', Forward: 'Forward',
  },
  fr: {
    eyebrow: 'Tous les lauréats depuis 1956',
    title: 'Le panthéon du Ballon d’Or',
    lede: 'Explore sept décennies du trophée individuel le plus célèbre du football.',
    searchLabel: 'Rechercher',
    searchPlaceholder: 'Joueur, club ou pays…',
    all: 'Tous', men: 'Hommes', women: 'Femmes',
    anyDecade: 'Toutes les décennies', anyPosition: 'Tous les postes',
    newest: 'Plus récents', oldest: 'Plus anciens', name: 'Nom A→Z',
    mostWins: 'Plus de sacres', topNations: 'Nations en tête',
    awards: 'Trophées', players: 'Lauréats', nations: 'Nations', years: 'Années',
    loading: 'Chargement des lauréats…',
    found: (n) => `${n} trophée${n > 1 ? 's' : ''} trouvé${n > 1 ? 's' : ''}`,
    none: 'Aucun lauréat ne correspond. Essaie un autre nom ou réinitialise les filtres.',
    error: 'Impossible de joindre le serveur. Est-il lancé ? (npm start)',
    wins: (n) => `${n} Ballon${n > 1 ? 's' : ''} d’Or`,
    born: 'Né(e) en', photo: 'Photo',
    footer: 'Photos : Wikimedia Commons — auteur et licence sont enregistrés dans la base (players.image_credit).',
    Goalkeeper: 'Gardien', Defender: 'Défenseur', Midfielder: 'Milieu', Forward: 'Attaquant',
  },
};

/* ---------- 2. State + helpers ---------- */
const state = {
  lang: readSavedLang(),
  q: '',
  category: 'all',
  decade: 'all',
  position: 'all',
  sort: 'newest',
  winners: [],
  stats: null,
};

const $ = (selector) => document.querySelector(selector);
const t = (key, ...args) => {
  const value = TEXT[state.lang][key] ?? key;
  return typeof value === 'function' ? value(...args) : value;
};

// Escape text before putting it inside HTML (protects against broken/injected markup)
const esc = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const nationality = (row) => (state.lang === 'fr' ? row.nationality_fr : row.nationality);
const description = (row) => (state.lang === 'fr' ? row.description_fr : row.description_en);

function readSavedLang() {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'fr') return saved;
  } catch { /* storage blocked: ignore */ }
  return navigator.language.startsWith('fr') ? 'fr' : 'en';
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/* ---------- 3. Talking to the API ---------- */
async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

let latestRequest = 0; // so a slow old answer can't overwrite a newer one

async function loadWinners() {
  const ticket = ++latestRequest;
  const params = new URLSearchParams({
    q: state.q, category: state.category, decade: state.decade,
    position: state.position, sort: state.sort,
  });
  setStatus(t('loading'));
  try {
    const winners = await getJSON(`/api/winners?${params}`);
    if (ticket !== latestRequest) return;
    state.winners = winners;
    renderGrid();
  } catch (error) {
    console.error(error);
    setStatus(t('error'));
  }
}

async function loadStats() {
  try {
    state.stats = await getJSON('/api/stats');
    renderStats();
    renderPanels();
  } catch (error) {
    console.error(error);
  }
}

/* ---------- 4. Rendering ---------- */
function setStatus(message) {
  $('#status').textContent = message;
}

function cardHTML(w, index) {
  return `
    <article class="card" tabindex="0" data-player-id="${w.player_id}"
             style="animation-delay:${Math.min(index * 25, 500)}ms">
      <div class="card-media">
        <img src="${esc(w.image_url)}" alt="${esc(w.player)}" loading="lazy">
        <span class="card-year">${w.year}</span>
        <span class="card-tag ${w.category}">${t(w.category)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-name">${esc(w.player)}</h3>
        <p class="card-club">${esc(w.club)}</p>
        <p class="card-meta">${esc(nationality(w))} · ${t(w.position)}</p>
        <p class="card-desc">${esc(description(w))}</p>
      </div>
    </article>`;
}

function renderGrid() {
  const list = state.winners;
  $('#grid').innerHTML = list.map(cardHTML).join('');
  setStatus(list.length ? t('found', list.length) : t('none'));
}

function renderStats() {
  const s = state.stats?.totals;
  if (!s) return;
  const items = [
    [s.awards, t('awards')],
    [s.players, t('players')],
    [s.nations, t('nations')],
    [`${s.first_year}–${String(s.last_year).slice(2)}`, t('years')],
  ];
  $('#stats').innerHTML = items
    .map(([value, label]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('');
}

function renderPanels() {
  if (!state.stats) return;
  const { topPlayers, topNations } = state.stats;

  $('#leaderboard').innerHTML = topPlayers
    .map((p) => `
      <li><button type="button" data-player-id="${p.player_id}">
        <img src="${esc(p.image_url)}" alt="" loading="lazy">
        <span class="who">${esc(p.player)}<br><small>${esc(nationality(p))}</small></span>
        <span class="wins">${p.wins}</span>
      </button></li>`)
    .join('');

  const max = topNations[0]?.wins || 1;
  $('#nations').innerHTML = topNations
    .map((n) => `
      <li><span>${esc(nationality(n))}</span><strong>${n.wins}</strong>
        <span class="bar"><span style="width:${(n.wins / max) * 100}%"></span></span></li>`)
    .join('');
}

function fillSelect(select, options, current) {
  select.innerHTML = options
    .map(([value, label]) => `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`)
    .join('');
}

function renderControls() {
  const decades = [];
  for (let d = 2020; d >= 1950; d -= 10) decades.push([String(d), `${d}s`]);
  fillSelect($('#decade'), [['all', t('anyDecade')], ...decades], state.decade);
  fillSelect($('#position'),
    [['all', t('anyPosition')], ...['Forward', 'Midfielder', 'Defender', 'Goalkeeper'].map((p) => [p, t(p)])],
    state.position);
  fillSelect($('#sort'), ['newest', 'oldest', 'name'].map((s) => [s, t(s)]), state.sort);
}

function applyLanguage() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('.lang-switch button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === state.lang));
  renderControls();
  renderStats();
  renderPanels();
  if (state.winners.length) renderGrid();
}

async function openPlayer(id) {
  const p = await getJSON(`/api/players/${id}`);
  const n = p.awards.length;
  $('#dialog-content').innerHTML = `
    <div class="dialog-head">
      <img src="${esc(p.image_url)}" alt="${esc(p.name)}">
      <div class="dialog-info">
        <h2>${esc(p.name)}</h2>
        <p>${esc(nationality(p))} · ${t(p.position)} · ${t('born')} ${p.born}</p>
        <p class="count">${t('wins', n)}</p>
      </div>
    </div>
    <ol class="timeline">
      ${p.awards.map((a) => `
        <li><span class="y">${a.year}</span>
          <div><strong>${esc(a.club)}</strong><span>${esc(description(a))}</span></div></li>`).join('')}
    </ol>
    <p class="dialog-credit">${t('photo')}: ${esc(p.image_credit)}
      ${p.image_source ? ` · <a href="${esc(p.image_source)}" target="_blank" rel="noopener">Wikimedia Commons</a>` : ''}</p>`;
  $('#player-dialog').showModal();
}

/* ---------- 5. Events ---------- */
$('#search').addEventListener('input', debounce((event) => {
  state.q = event.target.value;
  loadWinners();
}, 250));

$('#category').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  state.category = button.dataset.value;
  $('#category').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === button));
  loadWinners();
});

for (const id of ['decade', 'position', 'sort']) {
  $(`#${id}`).addEventListener('change', (event) => {
    state[id] = event.target.value;
    loadWinners();
  });
}

document.querySelector('.lang-switch').addEventListener('click', (event) => {
  const lang = event.target.closest('button')?.dataset.lang;
  if (!lang) return;
  state.lang = lang;
  try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
  applyLanguage();
});

// One listener for every card and leaderboard row ("event delegation")
document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-player-id]');
  if (target) openPlayer(target.dataset.playerId);
});
$('#grid').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.matches('.card')) openPlayer(event.target.dataset.playerId);
});

$('#dialog-close').addEventListener('click', () => $('#player-dialog').close());
$('#player-dialog').addEventListener('click', (event) => {
  if (event.target.id === 'player-dialog') event.currentTarget.close(); // click on the dark backdrop
});

// If a photo link is broken, swap in the placeholder (error events don't bubble → capture: true)
document.addEventListener('error', (event) => {
  const img = event.target;
  if (img.tagName === 'IMG' && !img.src.endsWith(PLACEHOLDER)) img.src = PLACEHOLDER;
}, true);

/* ---------- 6. Start ---------- */
// Initialize Vercel Speed Insights
injectSpeedInsights();
// Phones: the two side panels start folded, so search results come first.
// Bigger screens: they always stay open (clicking a title does nothing).
const phone = window.matchMedia('(max-width: 520px)'); // same width as in style.css
function foldPanels() {
  for (const panel of document.querySelectorAll('.sidebar details')) {
    panel.open = !phone.matches;
    panel.querySelector('summary').tabIndex = phone.matches ? 0 : -1;
  }
}
phone.addEventListener('change', foldPanels); // e.g. a window resized across 520px
$('.sidebar').addEventListener('click', (event) => {
  if (event.target.closest('summary') && !phone.matches) event.preventDefault();
});
foldPanels();
foldPanels();
applyLanguage();
loadStats();
loadWinners();
