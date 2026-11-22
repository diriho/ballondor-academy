// demo-api.js — lets the finished catalogue run on a static host (GitHub Pages).
//
// The real app asks server.js (Node + Express + SQLite) for its data at /api/...
// A static host has no server, so this file answers the same three routes inside
// the browser, from a snapshot of db/ballondor.db taken by deploy/build_pages.py.
// public/js/app.js is not changed at all: it still calls fetch('/api/...').
(function () {
  'use strict';
  var DB = /*@@DATA@@*/null; // { winners: [...], stats: {...}, players: { id: player + awards } }

  var POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
  var fold = function (t) { return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var nocase = function (t) { return String(t).replace(/[A-Z]/g, function (c) { return c.toLowerCase(); }); }; // like COLLATE NOCASE
  var cmp = function (a, b) { return a < b ? -1 : a > b ? 1 : 0; };
  var SORTS = {
    newest: function (a, b) { return b.year - a.year || cmp(a.category, b.category); },
    oldest: function (a, b) { return a.year - b.year || cmp(a.category, b.category); },
    name: function (a, b) { return cmp(nocase(a.player), nocase(b.player)) || a.year - b.year; }
  };

  // GET /api/winners?q=messi&category=men&decade=2010&position=Forward&sort=newest
  function winners(query) {
    var q = (query.get('q') || '').trim(), category = query.get('category') || 'all',
        decade = query.get('decade') || 'all', position = query.get('position') || 'all', sort = query.get('sort') || 'newest';
    var needle = fold(q);
    var rows = DB.winners.filter(function (w) {
      if (q && ![w.player, w.club, w.nationality, w.nationality_fr].some(function (v) { return fold(v).indexOf(needle) !== -1; })) return false;
      if ((category === 'men' || category === 'women') && w.category !== category) return false;
      if (/^\d{4}$/.test(decade) && (w.year < Number(decade) || w.year > Number(decade) + 9)) return false;
      if (POSITIONS.indexOf(position) !== -1 && w.position !== position) return false;
      return true;
    });
    return [200, rows.sort(Object.prototype.hasOwnProperty.call(SORTS, sort) ? SORTS[sort] : SORTS.newest)];
  }

  function answer(path, query) {
    if (path === '/api/winners') return winners(query);
    if (path === '/api/stats') return [200, DB.stats];
    var m = path.match(/^\/api\/players\/(\d+)$/);
    if (m && DB.players[Number(m[1])]) return [200, DB.players[Number(m[1])]];
    if (/^\/api\/players\/[^/]+$/.test(path)) return [404, { error: 'Player not found' }];
    return [404, { error: 'Unknown API route' }];
  }

  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    var api = url.origin === location.origin && url.pathname.match(/\/api(\/.*)?$/);
    if (!api) return realFetch(input, init);
    var res = answer('/api' + (api[1] || ''), url.searchParams);
    return Promise.resolve(new Response(JSON.stringify(res[1]), {
      status: res[0],
      statusText: res[0] === 200 ? 'OK' : 'Not Found',
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }));
  };
})();
