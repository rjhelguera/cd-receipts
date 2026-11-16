// Creative Direct Receipts — a free, self-hosted way to see which YouTube videos bring you leads and sales.
// Made by Creative Direct (creative-direct.com). MIT licensed. Provided as-is.
//
//   GET  /go/<code>        tracked link: remembers the visitor, redirects to the offer page with UTMs + ?ytc=<visitor id>
//   GET  /t.js             the snippet for your pages (stores the visitor id, reports page views, leads and sales)
//   POST /api/lead         {email, name?, cid?, code?}            from the snippet, your form, Zapier/Make…
//   POST /api/sale         {amount, email?, cid?, code?, offer?, currency?, id?}   from the snippet or Zapier/Make
//   POST /api/event        {kind, cid, code?, page?}             page views from the snippet
//   POST /webhook/stripe   Stripe checkout.session.completed → sale (set the signing secret in Settings)
//   GET  /admin            your dashboard (password created on first visit)
import { dashboardPage, settingsPage, loginPage, setupPage, layout, esc } from './admin.js';
import { SNIPPET } from './snippet.js';
import { CONFIG } from './config.js';
import { MARK } from './brand.js';

const FT = 'yt_ft', LT = 'yt_lt', SESS = 'yt_admin';
const DAY = 86400;
const now = () => new Date().toISOString();
const rid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
const enc = new TextEncoder();

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';
    try {
      await ensureSchema(env);
      if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
      if (p.startsWith('/go/')) return go(p.slice(4).toLowerCase(), req, env, ctx, url);
      if (p === '/t.js') return new Response(SNIPPET.replace('__ORIGIN__', url.origin), { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' } });
      if (p === '/api/lead' && req.method === 'POST') return cors(await apiLead(req, env, url));
      if (p === '/api/sale' && req.method === 'POST') return cors(await apiSale(req, env));
      if (p === '/api/event' && req.method === 'POST') return cors(await apiEvent(req, env, ctx));
      if (p === '/webhook/stripe' && req.method === 'POST') return stripeWebhook(req, env);
      if (p === '/admin' || p.startsWith('/admin/')) return admin(p, req, env, url);
      if (p === '/health') return json({ ok: true, time: now() });
      if (p === '/') return home(env, url);
      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.error(e);
      return new Response('Something went wrong: ' + (e.message || e), { status: 500 });
    }
  },
};

/* ---------- schema (self-healing: runs once per Worker instance) ---------- */
let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  const stmts = [
    'CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)',
    'CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY, name TEXT NOT NULL, dest TEXT NOT NULL, price REAL, created TEXT)',
    'CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT, published TEXT, views INTEGER, thumb TEXT, updated TEXT)',
    "CREATE TABLE IF NOT EXISTS links (code TEXT PRIMARY KEY, offer TEXT NOT NULL, video_id TEXT, placement TEXT DEFAULT 'description', dest TEXT, label TEXT, created TEXT)",
    'CREATE TABLE IF NOT EXISTS clicks (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, code TEXT, cid TEXT, country TEXT, referer TEXT, ua TEXT)',
    'CREATE INDEX IF NOT EXISTS clicks_ts ON clicks(ts)', 'CREATE INDEX IF NOT EXISTS clicks_cid ON clicks(cid)',
    "CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, email TEXT NOT NULL UNIQUE, name TEXT, cid TEXT, first_code TEXT, first_ts TEXT, last_code TEXT, source TEXT, stage TEXT DEFAULT 'lead', notes TEXT, country TEXT, updated TEXT)",
    'CREATE INDEX IF NOT EXISTS leads_ts ON leads(ts)',
    "CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, email TEXT, cid TEXT, code TEXT, offer TEXT, amount REAL, currency TEXT DEFAULT 'USD', source TEXT, external_id TEXT UNIQUE, note TEXT)",
    'CREATE INDEX IF NOT EXISTS sales_ts ON sales(ts)',
    'CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, kind TEXT, cid TEXT, code TEXT, page TEXT)',
    'CREATE INDEX IF NOT EXISTS events_ts ON events(ts)',
  ];
  await env.DB.batch(stmts.map(s => env.DB.prepare(s)));
  schemaReady = true;
}

/* ---------- helpers ---------- */
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
function cors(res) {
  const h = new Headers(res.headers);
  h.set('access-control-allow-origin', '*'); h.set('access-control-allow-methods', 'POST, OPTIONS'); h.set('access-control-allow-headers', 'content-type');
  return new Response(res.body, { status: res.status, headers: h });
}
const html = (body, status = 200, headers = {}) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers } });
function cookies(req) {
  const out = {}; (req.headers.get('cookie') || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
const setCookie = (name, val, maxAge) => `${name}=${encodeURIComponent(val)}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
const safeJSON = s => { try { return JSON.parse(s); } catch { return null; } };
const clean = (s, n = 200) => String(s ?? '').trim().slice(0, n);
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const normEmail = e => clean(e, 200).toLowerCase();
const cidOk = c => /^[a-z0-9_-]{6,40}$/i.test(c || '');
const codeOk = c => /^[a-z0-9][a-z0-9-]{0,48}$/.test(c || '');
const meta = {
  get: (env, k) => env.DB.prepare('SELECT v FROM meta WHERE k=?').bind(k).first('v'),
  set: (env, k, v) => env.DB.prepare('INSERT INTO meta (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k, v).run(),
};
async function hmac(secret, s) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function sha256(s) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map(b => b.toString(16).padStart(2, '0')).join(''); }
async function readBody(req) {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await req.json().catch(() => ({}))) || {};
  if (ct.includes('form')) { const f = await req.formData(); const o = {}; for (const [k, v] of f) o[k] = String(v); return o; }
  const t = await req.text(); return safeJSON(t) || Object.fromEntries(new URLSearchParams(t));
}

// Link scanners, previews and crawlers, not people. When a video goes live, YouTube/Google scans every description link.
const BOT_UA = /bot|crawl|spider|slurp|google-safety|googleother|google-inspectiontool|nexus 5x build\/mmb29p|headless|curl|wget|python|httpclient|okhttp|go-http|node-fetch|axios|whatsapp|facebookexternalhit|facebookcatalog|meta-externalagent|slack|discord|telegram|skypeuripreview|linkedin|twitterbot|embedly|preview|vkshare|bitlybot|ahrefs|semrush|trendiction|dataprovider|scan/i;

/* ---------- /go/<code> ---------- */
async function go(code, req, env, ctx, url) {
  const link = await env.DB.prepare('SELECT l.*, o.dest AS odest, o.id AS oid FROM links l LEFT JOIN offers o ON o.id=l.offer WHERE l.code=?').bind(code).first();
  const fallback = (await meta.get(env, 'fallback_url')) || CONFIG.fallbackUrl;
  if (!link) return Response.redirect(fallback, 302);
  const c = cookies(req);
  const ft = safeJSON(c[FT]) || {};
  const cid = cidOk(ft.id) ? ft.id : rid();
  const touch = JSON.stringify({ c: code, t: now(), id: cid });
  const ua = req.headers.get('user-agent') || '';
  if (ua && !BOT_UA.test(ua) && !(await isAdmin(req, env))) {
    ctx.waitUntil(env.DB.prepare('INSERT INTO clicks (ts,code,cid,country,referer,ua) VALUES (?,?,?,?,?,?)')
      .bind(now(), code, cid, req.cf?.country || '', (req.headers.get('referer') || '').slice(0, 300), ua.slice(0, 200)).run());
  }
  let dest; try { dest = new URL(link.dest || link.odest || fallback); } catch { dest = new URL(fallback); }
  const set = (k, v) => { if (v && !dest.searchParams.has(k)) dest.searchParams.set(k, v); };
  set('utm_source', 'youtube'); set('utm_medium', link.placement || 'description'); set('utm_campaign', link.oid || link.offer); set('utm_content', code);
  dest.searchParams.set('ytc', cid); // the snippet on your page picks this up so sales can be matched even when cookies can't be shared
  const h = new Headers({ Location: dest.toString(), 'cache-control': 'no-store' });
  if (!c[FT]) h.append('set-cookie', setCookie(FT, touch, 365 * DAY));
  h.append('set-cookie', setCookie(LT, touch, 365 * DAY));
  return new Response(null, { status: 302, headers: h });
}

/* ---------- first click of a visitor → the video/link that gets the credit ---------- */
async function firstClick(env, cid) {
  if (!cidOk(cid)) return null;
  return env.DB.prepare('SELECT code, ts FROM clicks WHERE cid=? ORDER BY ts ASC LIMIT 1').bind(cid).first();
}

/* ---------- POST /api/lead ---------- */
async function apiLead(req, env, url) {
  const b = await readBody(req);
  if (b.website) return json({ ok: true }); // honeypot
  const email = normEmail(b.email);
  if (!validEmail(email)) return json({ ok: false, error: 'invalid email' }, 400);
  const cid = cidOk(b.cid) ? b.cid : (cidOk(b.ytc) ? b.ytc : '');
  const fc = await firstClick(env, cid);
  const code = fc?.code || (codeOk(b.code) ? b.code : '') || (codeOk(b.utm_content) ? b.utm_content : '');
  const row = { ts: now(), email, name: clean(b.name, 120), cid, first_code: code, first_ts: fc?.ts || '', last_code: codeOk(b.code) ? b.code : code, source: clean(b.source || 'snippet', 40), country: req.cf?.country || '', notes: clean(b.notes, 1000) };
  const cols = Object.keys(row);
  // one row per email; keep the ORIGINAL first touch, refresh the rest
  await env.DB.prepare(`INSERT INTO leads (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})
    ON CONFLICT(email) DO UPDATE SET name=COALESCE(NULLIF(excluded.name,''),name), cid=COALESCE(NULLIF(excluded.cid,''),cid),
    first_code=CASE WHEN first_code='' OR first_code IS NULL THEN excluded.first_code ELSE first_code END,
    first_ts=CASE WHEN first_ts='' OR first_ts IS NULL THEN excluded.first_ts ELSE first_ts END,
    last_code=COALESCE(NULLIF(excluded.last_code,''),last_code), updated=excluded.ts`).bind(...cols.map(k => row[k])).run();
  if (b.redirect && /^https?:\/\//.test(b.redirect)) return Response.redirect(b.redirect, 303); // plain HTML form posts
  return json({ ok: true, credited: code || null });
}

/* ---------- POST /api/sale ---------- */
async function recordSale(env, s) {
  const email = normEmail(s.email); const cid = cidOk(s.cid) ? s.cid : '';
  let code = codeOk(s.code) ? s.code : '';
  if (!code && cid) code = (await firstClick(env, cid))?.code || '';
  if (!code && validEmail(email)) code = (await env.DB.prepare('SELECT first_code FROM leads WHERE email=?').bind(email).first('first_code')) || '';
  let offer = clean(s.offer, 60);
  if (!offer && code) offer = (await env.DB.prepare('SELECT offer FROM links WHERE code=?').bind(code).first('offer')) || '';
  const amount = Number(s.amount); if (!isFinite(amount) || amount < 0) return { ok: false, error: 'amount must be a number' };
  const r = await env.DB.prepare('INSERT OR IGNORE INTO sales (ts,email,cid,code,offer,amount,currency,source,external_id,note) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(s.ts || now(), validEmail(email) ? email : '', cid, code, offer, amount, clean(s.currency || 'USD', 8).toUpperCase(), clean(s.source || 'api', 30), s.id ? clean(s.id, 120) : null, clean(s.note, 500)).run();
  if (validEmail(email)) {
    // the buyer becomes a lead too (so the journey is complete), and moves to "customer"
    await env.DB.prepare(`INSERT INTO leads (ts,email,cid,first_code,last_code,source,stage,country) VALUES (?,?,?,?,?,?,'customer','')
      ON CONFLICT(email) DO UPDATE SET stage='customer', cid=COALESCE(NULLIF(leads.cid,''),excluded.cid), first_code=CASE WHEN leads.first_code='' OR leads.first_code IS NULL THEN excluded.first_code ELSE leads.first_code END, updated=?`)
      .bind(now(), email, cid, code, code, clean(s.source || 'api', 30), now()).run();
  }
  return { ok: true, duplicate: r.meta.changes === 0, credited: code || null, offer: offer || null };
}
async function apiSale(req, env) {
  const b = await readBody(req);
  if (b.website) return json({ ok: true });
  // optional shared secret for server-to-server posts (Zapier/Make): Settings → API key
  const key = await meta.get(env, 'api_key');
  if (key && req.headers.get('x-api-key') !== key && b.key !== key && !cidOk(b.cid)) return json({ ok: false, error: 'missing api key' }, 401);
  const out = await recordSale(env, { ...b, cid: b.cid || b.ytc, source: b.source || (cidOk(b.cid || b.ytc) ? 'snippet' : 'api') });
  return json(out, out.ok ? 200 : 400);
}

/* ---------- POST /api/event (page views from the snippet) ---------- */
async function apiEvent(req, env, ctx) {
  const b = await readBody(req);
  const kind = clean(b.kind, 30).replace(/[^a-z0-9_-]/gi, ''); const cid = cidOk(b.cid) ? b.cid : '';
  if (!kind || !cid) return json({ ok: false }, 400);
  ctx.waitUntil(env.DB.prepare('INSERT INTO events (ts,kind,cid,code,page) VALUES (?,?,?,?,?)').bind(now(), kind, cid, codeOk(b.code) ? b.code : '', clean(b.page, 300)).run());
  return json({ ok: true });
}

/* ---------- Stripe webhook ---------- */
async function stripeWebhook(req, env) {
  const secret = await meta.get(env, 'stripe_secret');
  if (!secret) return json({ ok: false, error: 'Stripe signing secret not set in Settings' }, 400);
  const raw = await req.text();
  const sig = Object.fromEntries((req.headers.get('stripe-signature') || '').split(',').map(kv => kv.split('=')));
  if (!sig.t || !sig.v1) return json({ ok: false, error: 'bad signature header' }, 400);
  const expected = await hmac(secret, sig.t + '.' + raw);
  if (expected !== sig.v1 || Math.abs(Date.now() / 1000 - Number(sig.t)) > 600) return json({ ok: false, error: 'signature mismatch' }, 400);
  const ev = safeJSON(raw); if (!ev) return json({ ok: false }, 400);
  if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') {
    const s = ev.data.object; const md = s.metadata || {};
    const out = await recordSale(env, {
      id: s.id, email: s.customer_details?.email || s.customer_email || '', amount: (s.amount_total || 0) / 100, currency: s.currency || 'usd',
      cid: s.client_reference_id || md.ytc || '', code: md.code || '', offer: md.offer || '', source: 'stripe', ts: new Date((s.created || Date.now() / 1000) * 1000).toISOString(),
    });
    return json(out);
  }
  if (ev.type === 'invoice.paid' || ev.type === 'payment_intent.succeeded') {
    const o = ev.data.object; const md = o.metadata || {};
    const email = o.customer_email || o.receipt_email || o.customer_details?.email || '';
    const amount = (o.amount_paid ?? o.amount_received ?? o.amount ?? 0) / 100;
    if (email || md.ytc) { const out = await recordSale(env, { id: o.id, email, amount, currency: o.currency || 'usd', cid: md.ytc || '', code: md.code || '', offer: md.offer || '', source: 'stripe' }); return json(out); }
  }
  return json({ ok: true, ignored: ev.type });
}

/* ---------- home ---------- */
async function home(env, url) {
  const setup = !(await meta.get(env, 'admin_hash'));
  return html(layout(CONFIG.name, `<main class="wrap" style="max-width:640px"><div class="brand" style="margin-bottom:18px">${MARK}<div><div class="kicker">${esc(CONFIG.name)}</div><div class="small muted">${esc(CONFIG.tagline)}</div></div></div>
  <div class="card r"><h1>Which videos <em>sell</em></h1>
  <p class="muted">Links that start with <code>${esc(url.origin)}/go/</code> are tracked, then send you on to the right page.</p>
  <p><a class="btn" href="/admin">${setup ? 'Finish setup →' : 'Open the dashboard →'}</a></p>
  <p class="small faint" style="margin-bottom:0">Free, open-source tool from <a href="${CONFIG.cd.site}">Creative Direct</a>.</p></div></main>`));
}

/* ---------- admin ---------- */
async function isAdmin(req, env) {
  const t = cookies(req)[SESS]; if (!t) return false;
  const secret = await meta.get(env, 'session_secret'); if (!secret) return false;
  const [exp, sig] = t.split('.'); if (!exp || !sig || Number(exp) < Date.now()) return false;
  return sig === await hmac(secret, exp);
}
async function sessionCookie(env) {
  const secret = await meta.get(env, 'session_secret');
  const exp = String(Date.now() + 30 * DAY * 1000);
  return setCookie(SESS, exp + '.' + await hmac(secret, exp), 30 * DAY);
}
async function admin(p, req, env, url) {
  const hash = await meta.get(env, 'admin_hash');
  const back = (notice) => Response.redirect(url.origin + '/admin' + (notice ? '?n=' + encodeURIComponent(notice) : ''), 303);
  // first run: create the password
  if (!hash) {
    if (req.method === 'POST' && p === '/admin/setup') {
      const f = await req.formData(); const pw = String(f.get('password') || '');
      if (pw.length < 8) return html(setupPage({ error: 'Use at least 8 characters.' }), 400);
      const salt = rid(); await meta.set(env, 'admin_salt', salt); await meta.set(env, 'admin_hash', await sha256(salt + pw));
      await meta.set(env, 'session_secret', crypto.randomUUID() + crypto.randomUUID());
      await meta.set(env, 'api_key', rid() + rid());
      return new Response(null, { status: 303, headers: { Location: url.origin + '/admin?n=' + encodeURIComponent('Welcome! Start by adding an offer.'), 'set-cookie': await sessionCookie(env) } });
    }
    return html(setupPage({}));
  }
  if (p === '/admin/login' && req.method === 'POST') {
    const f = await req.formData(); const pw = String(f.get('password') || '');
    const salt = await meta.get(env, 'admin_salt');
    if (await sha256(salt + pw) !== hash) return html(loginPage({ error: 'Wrong password.' }), 401);
    return new Response(null, { status: 303, headers: { Location: url.origin + '/admin', 'set-cookie': await sessionCookie(env) } });
  }
  if (p === '/admin/logout') return new Response(null, { status: 303, headers: { Location: url.origin + '/admin', 'set-cookie': setCookie(SESS, '', 0) } });
  if (!(await isAdmin(req, env))) return html(loginPage({}), 401);

  if (req.method === 'POST') {
    const f = await req.formData(); const g = k => clean(f.get(k), 300);
    if (p === '/admin/offer') {
      const id = g('id').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40); let dest = g('dest', 500);
      if (!id || !g('name')) return back('Offer needs a short id and a name.');
      if (!/^https?:\/\//.test(dest)) dest = 'https://' + dest;
      try { new URL(dest); } catch { return back('That destination URL does not look right.'); }
      await env.DB.prepare('INSERT INTO offers (id,name,dest,price,created) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, dest=excluded.dest, price=excluded.price')
        .bind(id, g('name'), dest, Number(g('price')) || null, now()).run();
      return back(`Saved offer “${g('name')}”.`);
    }
    if (p === '/admin/offer/delete') { await env.DB.prepare('DELETE FROM offers WHERE id=?').bind(g('id')).run(); return back('Offer deleted (its links stay, unattached).'); }
    if (p === '/admin/link') {
      const code = g('code').toLowerCase().replace(/[^a-z0-9-]/g, ''); const offer = g('offer'); const vid = ytId(g('video'));
      if (!codeOk(code)) return back('Code can use letters, numbers and dashes only.');
      if (!offer) return back('Pick an offer for the link.');
      let dest = g('dest', 500) || null; if (dest && !/^https?:\/\//.test(dest)) dest = 'https://' + dest;
      const r = await env.DB.prepare('INSERT OR IGNORE INTO links (code,offer,video_id,placement,dest,label,created) VALUES (?,?,?,?,?,?,?)')
        .bind(code, offer, vid || null, g('placement') || 'description', dest, g('label'), now()).run();
      if (r.meta.changes === 0) return back(`The code “${code}” already exists.`);
      if (vid) await upsertVideo(env, vid);
      return back(`Created ${url.origin}/go/${code}`);
    }
    if (p === '/admin/link/video') { const vid = ytId(g('video')); if (!vid) return back('Paste a YouTube link or video id.'); await env.DB.prepare('UPDATE links SET video_id=? WHERE code=?').bind(vid, g('code')).run(); await upsertVideo(env, vid); return back('Video attached.'); }
    if (p === '/admin/link/delete') { await env.DB.prepare('DELETE FROM links WHERE code=?').bind(g('code')).run(); return back('Link deleted. Its past clicks are kept.'); }
    if (p === '/admin/video') { // manual views / title
      const vid = ytId(g('video')); if (!vid) return back('Paste a YouTube link or video id.');
      await upsertVideo(env, vid, { views: g('views') ? Number(g('views')) : undefined, title: g('title') || undefined });
      return back('Video updated.');
    }
    if (p === '/admin/sale') {
      const out = await recordSale(env, { email: g('email'), amount: g('amount'), code: g('code'), offer: g('offer'), currency: g('currency') || 'USD', source: 'manual', note: g('note'), ts: g('date') ? new Date(g('date') + 'T12:00:00Z').toISOString() : undefined });
      return back(out.ok ? (out.credited ? 'Sale recorded and credited to ' + out.credited + '.' : 'Sale recorded (no video to credit — the email never came through a tracked link).') : out.error);
    }
    if (p === '/admin/sale/delete') { await env.DB.prepare('DELETE FROM sales WHERE id=?').bind(Number(g('id'))).run(); return back('Sale removed.'); }
    if (p === '/admin/lead') {
      const stage = ['lead', 'call', 'customer', 'not-fit'].includes(g('stage')) ? g('stage') : 'lead';
      await env.DB.prepare('UPDATE leads SET stage=?, notes=?, first_code=COALESCE(NULLIF(?,\'\'),first_code), updated=? WHERE id=?').bind(stage, g('notes', 1000), g('first_code'), now(), Number(g('id'))).run();
      return back('Lead updated.');
    }
    if (p === '/admin/lead/delete') { await env.DB.prepare('DELETE FROM leads WHERE id=?').bind(Number(g('id'))).run(); return back('Lead removed.'); }
    if (p === '/admin/settings') {
      for (const k of ['stripe_secret', 'yt_api_key', 'fallback_url', 'business_name']) if (f.has(k)) await meta.set(env, k, g(k, 500));
      if (g('new_password')) { if (g('new_password').length < 8) return back('Password needs 8+ characters.'); const salt = rid(); await meta.set(env, 'admin_salt', salt); await meta.set(env, 'admin_hash', await sha256(salt + g('new_password'))); }
      if (f.get('rotate_api_key')) await meta.set(env, 'api_key', rid() + rid());
      return Response.redirect(url.origin + '/admin/settings?n=Saved.', 303);
    }
    if (p === '/admin/refresh') { const n = await refreshVideos(env); return back(n === null ? 'Add a YouTube API key in Settings to refresh view counts automatically.' : `Refreshed ${n} videos.`); }
    return back('Unknown action.');
  }

  if (p === '/admin/settings') {
    const s = {}; for (const k of ['stripe_secret', 'yt_api_key', 'fallback_url', 'business_name', 'api_key']) s[k] = (await meta.get(env, k)) || '';
    return html(settingsPage({ s, origin: url.origin, notice: url.searchParams.get('n') }));
  }
  if (p === '/admin/leads.csv' || p === '/admin/sales.csv' || p === '/admin/clicks.csv') {
    const t = p.split('/').pop().replace('.csv', '');
    const rows = (await env.DB.prepare(`SELECT * FROM ${t} ORDER BY ts DESC LIMIT 50000`).all()).results;
    const cols = rows[0] ? Object.keys(rows[0]) : ['ts'];
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return new Response([cols.join(','), ...rows.map(r => cols.map(c => q(r[c])).join(','))].join('\n'), { headers: { 'content-type': 'text/csv', 'content-disposition': `attachment; filename="${t}.csv"` } });
  }
  const range = ['7', '30', '90', 'all'].includes(url.searchParams.get('r')) ? url.searchParams.get('r') : '30';
  const data = await loadDashboard(env, range);
  return html(dashboardPage({ ...data, range, origin: url.origin, notice: url.searchParams.get('n'), cd: CONFIG.cd, revtrack: CONFIG.revtrack }));
}

/* ---------- videos: title + thumb via oEmbed (no key), views via YouTube Data API (optional key) ---------- */
export function ytId(s) {
  s = String(s || '').trim(); if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|\/shorts\/|\/live\/|\/embed\/)([\w-]{11})/); return m ? m[1] : '';
}
async function upsertVideo(env, id, o = {}) {
  let title = o.title, thumb = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
  if (!title) { try { const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`); if (r.ok) { const j = await r.json(); title = j.title; thumb = j.thumbnail_url || thumb; } } catch { } }
  await env.DB.prepare(`INSERT INTO videos (id,title,thumb,views,updated) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=COALESCE(?,title), thumb=COALESCE(?,thumb), views=COALESCE(?,views), updated=excluded.updated`)
    .bind(id, title || id, thumb, o.views ?? null, now(), o.title || title || null, thumb, o.views ?? null).run();
  const key = await meta.get(env, 'yt_api_key'); if (key) await refreshVideos(env, [id]);
}
async function refreshVideos(env, ids) {
  const key = await meta.get(env, 'yt_api_key'); if (!key) return null;
  ids = ids || (await env.DB.prepare('SELECT id FROM videos').all()).results.map(r => r.id);
  let n = 0;
  for (let i = 0; i < ids.length; i += 50) {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${ids.slice(i, i + 50).join(',')}&key=${encodeURIComponent(key)}`);
    if (!r.ok) { await meta.set(env, 'yt_error', `YouTube API ${r.status}: ${(await r.text()).slice(0, 200)}`); return n; }
    const j = await r.json(); await meta.set(env, 'yt_error', '');
    for (const v of j.items || []) {
      const th = v.snippet?.thumbnails || {}; const thumb = (th.maxres || th.standard || th.high || th.medium || {}).url;
      await env.DB.prepare('UPDATE videos SET title=?, published=?, views=?, thumb=COALESCE(?,thumb), updated=? WHERE id=?')
        .bind(v.snippet?.title, v.snippet?.publishedAt, Number(v.statistics?.viewCount) || 0, thumb || null, now(), v.id).run(); n++;
    }
  }
  return n;
}

/* ---------- dashboard data ---------- */
async function loadDashboard(env, range) {
  const since = range === 'all' ? '2000-01-01' : new Date(Date.now() - Number(range) * DAY * 1000).toISOString();
  const prevSince = range === 'all' ? '2000-01-01' : new Date(Date.now() - 2 * Number(range) * DAY * 1000).toISOString();
  const q = async (sql, ...b) => (await env.DB.prepare(sql).bind(...b).all()).results;
  const one = async (sql, ...b) => env.DB.prepare(sql).bind(...b).first();
  // Credit rule: a lead is credited to its first_code. A sale is credited to its code (set at record time from
  // the visitor's first click, else the buyer's lead first_code). A link belongs to one video and one offer.
  const [offers, links, videos] = await Promise.all([q('SELECT * FROM offers ORDER BY created'), q('SELECT * FROM links ORDER BY created DESC'), q('SELECT * FROM videos')]);
  const clicksByCode = Object.fromEntries((await q('SELECT code, COUNT(*) n, COUNT(DISTINCT cid) p FROM clicks WHERE ts>=? GROUP BY code', since)).map(r => [r.code, r]));
  const clicksAll = Object.fromEntries((await q('SELECT code, COUNT(*) n, COUNT(DISTINCT cid) p FROM clicks GROUP BY code')).map(r => [r.code, r]));
  const leadsByCode = Object.fromEntries((await q('SELECT first_code code, COUNT(*) n, SUM(stage=\'customer\') c FROM leads WHERE ts>=? GROUP BY first_code', since)).map(r => [r.code, r]));
  const salesByCode = Object.fromEntries((await q('SELECT code, COUNT(*) n, SUM(amount) rev FROM sales WHERE ts>=? GROUP BY code', since)).map(r => [r.code, r]));
  const kpi = {
    clicks: (await one('SELECT COUNT(*) n, COUNT(DISTINCT cid) p FROM clicks WHERE ts>=?', since)),
    clicksPrev: (await one('SELECT COUNT(DISTINCT cid) p FROM clicks WHERE ts>=? AND ts<?', prevSince, since)),
    leads: (await one('SELECT COUNT(*) n FROM leads WHERE ts>=?', since)).n,
    leadsPrev: (await one('SELECT COUNT(*) n FROM leads WHERE ts>=? AND ts<?', prevSince, since)).n,
    sales: (await one('SELECT COUNT(*) n, COALESCE(SUM(amount),0) rev FROM sales WHERE ts>=?', since)),
    salesPrev: (await one('SELECT COUNT(*) n, COALESCE(SUM(amount),0) rev FROM sales WHERE ts>=? AND ts<?', prevSince, since)),
    unattributed: (await one("SELECT COUNT(*) n, COALESCE(SUM(amount),0) rev FROM sales WHERE ts>=? AND (code='' OR code IS NULL)", since)),
  };
  const days = range === 'all' ? 90 : Number(range);
  const daySince = new Date(Date.now() - days * DAY * 1000).toISOString();
  const series = {
    clicks: await q("SELECT substr(ts,1,10) d, COUNT(DISTINCT cid) n FROM clicks WHERE ts>=? GROUP BY d", daySince),
    leads: await q("SELECT substr(ts,1,10) d, COUNT(*) n FROM leads WHERE ts>=? GROUP BY d", daySince),
    sales: await q("SELECT substr(ts,1,10) d, COUNT(*) n, SUM(amount) rev FROM sales WHERE ts>=? GROUP BY d", daySince),
  };
  const recentLeads = await q('SELECT * FROM leads ORDER BY ts DESC LIMIT 200');
  const recentSales = await q('SELECT * FROM sales ORDER BY ts DESC LIMIT 200');
  const journeys = {}; // cid → clicks/events for recent leads+sales
  const cids = [...new Set([...recentLeads, ...recentSales].map(r => r.cid).filter(Boolean))].slice(0, 150);
  if (cids.length) {
    const ph = cids.map(() => '?').join(',');
    for (const r of await q(`SELECT 'click' kind, ts, code, cid, '' page FROM clicks WHERE cid IN (${ph}) UNION ALL SELECT kind, ts, code, cid, page FROM events WHERE cid IN (${ph}) ORDER BY ts`, ...cids, ...cids)) (journeys[r.cid] ||= []).push(r);
  }
  const ytError = await meta.get(env, 'yt_error'); const hasKey = !!(await meta.get(env, 'yt_api_key'));
  const business = (await meta.get(env, 'business_name')) || '';
  return { offers, links, videos, clicksByCode, clicksAll, leadsByCode, salesByCode, kpi, series, recentLeads, recentSales, journeys, days, ytError, hasKey, business };
}
