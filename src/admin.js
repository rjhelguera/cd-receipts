// Dashboard, settings, login and setup pages. Plain HTML + CSS, no build step.
import { MARK } from './brand.js';
import { CONFIG } from './config.js';
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n, cur = 'USD') => { n = Number(n) || 0; try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); } catch { return '$' + n.toFixed(0); } };
const num = n => new Intl.NumberFormat('en-US').format(Number(n) || 0);
const pct = (a, b, d = 1) => b ? (100 * a / b).toFixed(d) + '%' : '—';
const when = ts => ts ? new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
const dateOnly = ts => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const CSS = `
:root{--red:#D20009;--red-bright:#ff2a2f;--ink:#0c0d10;--char:#16181d;--panel:#1c1f26;--panel2:#23272f;--border:#2a2e38;--text:#eef0f4;--muted:#9aa1b0;--faint:#6b7280;--bone:#F2ECE0;--good:#2fbf71;--warn:#e0a020;
--disp:'Archivo Black',-apple-system,'Arial Black',sans-serif;--sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;--mono:'SF Mono',ui-monospace,Menlo,monospace}
*{box-sizing:border-box}html{background:var(--ink)}body{margin:0;background:linear-gradient(160deg,#13151b,#0a0b0e) fixed;color:var(--text);font:15px/1.5 var(--sans)}
a{color:var(--text)}a:hover{color:var(--red-bright)}code{font-family:var(--mono);background:var(--panel2);padding:1px 6px;border-radius:5px;font-size:.86em;letter-spacing:.02em}
.wrap{max-width:1180px;margin:0 auto;padding:22px 16px 70px}
.kicker{display:inline-flex;align-items:center;gap:8px;font:800 11px/1 var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--red-bright)}.kicker:before{content:'';width:6px;height:6px;border-radius:50%;background:var(--red)}
h1{font:400 clamp(26px,3.4vw,40px)/1 var(--disp);text-transform:uppercase;letter-spacing:-.01em;margin:6px 0 6px}h1 em{font-style:normal;color:var(--red-bright)}
h2{font:400 clamp(17px,2vw,22px)/1.04 var(--disp);text-transform:uppercase;letter-spacing:-.01em;margin:34px 0 12px;display:flex;align-items:center;gap:10px}h2:before{content:'';width:4px;height:1em;background:var(--red);border-radius:2px;flex:none}
h2 .muted{font:500 13px/1.3 var(--sans);text-transform:none;letter-spacing:0}
h3{font:800 13px/1.3 var(--sans);text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0 0 10px}
.muted{color:var(--muted)}.faint{color:var(--faint)}.small{font-size:13px}
.top{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;justify-content:space-between;margin-bottom:16px}
.brand{display:flex;gap:14px;align-items:center}.brand .mark{width:52px;height:auto;color:#fff;flex:none}
.pills{display:inline-flex;gap:4px;background:var(--panel);border:1px solid var(--border);border-radius:999px;padding:3px}.pills a{display:inline-block;padding:6px 12px;border-radius:999px;text-decoration:none;color:var(--muted);font:600 13px/1 var(--sans)}
.pills a.on{background:var(--red);color:#fff}
.btn{display:inline-block;padding:9px 16px;border-radius:7px;background:var(--red);color:#fff;text-decoration:none;border:0;cursor:pointer;font:800 12px/1.2 var(--sans);text-transform:uppercase;letter-spacing:.08em}.btn:hover{background:var(--red-bright);color:#fff}
.btn.ghost{background:var(--panel);color:var(--text);border:1px solid var(--border)}.btn.ghost:hover{background:var(--panel2);color:#fff}.btn.sm{padding:6px 10px;font-size:11px}
.card{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:16px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.kpi .v{font:400 34px/1 var(--disp);letter-spacing:-.02em}.kpi.hot .v{color:var(--red-bright)}.kpi .l{font:700 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-top:8px}.kpi .l .muted{color:var(--faint);font-weight:500;text-transform:none;letter-spacing:0;font-family:var(--sans);font-size:12px}
.kpi .d{font-size:12px;margin-top:6px;color:var(--faint)}.up{color:var(--good) !important}.down{color:var(--red-bright) !important}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:9px 10px;text-align:left;border-bottom:1px solid var(--border);vertical-align:middle}th{color:var(--faint);font:700 10.5px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.1em;cursor:pointer;white-space:nowrap}th:hover{color:var(--text)}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}tr:last-child td{border-bottom:0}tbody tr:hover td{background:rgba(255,255,255,.015)}
.tbl{overflow-x:auto}.thumb{width:72px;aspect-ratio:16/9;object-fit:cover;border-radius:6px;background:#202a33;display:block;border:1px solid var(--border)}
.vid{display:flex;gap:10px;align-items:center;min-width:260px}.vid .t{font-weight:600;line-height:1.3}.vid a{text-decoration:none}
.notice{background:var(--panel2);border:1px solid var(--border);border-left:4px solid var(--red);padding:10px 14px;border-radius:7px;margin-bottom:14px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}.grid2>*,.card,.kpis>*{min-width:0}
input,select,textarea{font:inherit;padding:9px 11px;border:1px solid var(--border);border-radius:7px;background:var(--char);color:var(--text);width:100%}input:focus,select:focus{outline:2px solid rgba(210,0,9,.45);border-color:var(--red)}input::placeholder{color:var(--faint)}
label{font:600 12px/1.3 var(--sans);color:var(--muted);display:block;margin-bottom:4px}.f{display:grid;gap:10px}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.steps{display:grid;gap:10px}.step{display:flex;gap:12px;align-items:flex-start}.step .n{flex:0 0 28px;height:28px;border-radius:50%;background:var(--panel2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font:800 12px var(--sans)}.step.done .n{background:var(--red);border-color:var(--red);color:#fff}
pre{background:var(--char);border:1px solid var(--border);padding:10px 12px;border-radius:7px;overflow:auto;font:12.5px/1.5 var(--mono);margin:6px 0;color:var(--text)}
.tag{display:inline-block;padding:2px 8px;border-radius:5px;font:700 10.5px/1.5 var(--mono);text-transform:uppercase;letter-spacing:.08em;background:var(--panel2);color:var(--muted)}.tag.warn{background:rgba(224,160,32,.15);color:var(--warn)}
details summary{cursor:pointer;color:var(--muted);text-decoration:underline dotted}.journey{margin:6px 0 0 0;padding-left:18px;font-size:13px;color:var(--muted)}.journey li{margin:3px 0}
.promo{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.promo .card{display:flex;flex-direction:column;gap:8px}.promo .card .btn{align-self:flex-start;margin-top:auto}.promo .card.cd{border-color:rgba(210,0,9,.35);box-shadow:0 0 0 1px rgba(210,0,9,.25),0 14px 40px rgba(210,0,9,.12)}.promo h3{color:var(--text)}
.chart{width:100%;height:160px;display:block}.legend span{display:inline-block;margin-right:14px;font:700 10.5px/1.5 var(--mono);text-transform:uppercase;letter-spacing:.08em;color:var(--faint)}.legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.copy{cursor:pointer;color:var(--muted);font:600 12px var(--sans);border:0;background:none;padding:0;text-decoration:underline dotted}.copy:hover{color:var(--red-bright)}
.insight{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--border)}.insight:last-child{border:0}.insight .ic{flex:none;width:6px;height:6px;border-radius:50%;background:var(--red);margin-top:7px}
.foot{margin-top:30px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:14px;align-items:center;flex-wrap:wrap;color:var(--faint);font-size:12.5px}.foot .mark{width:26px;color:var(--text);opacity:.4}.foot a{color:var(--muted)}
.r{opacity:0;transform:translateY(16px);transition:opacity .55s,transform .6s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0s)}.r.in{opacity:1;transform:none}
@media(max-width:800px){.kpi .v{font-size:26px}.row{grid-template-columns:1fr}.grid2{grid-template-columns:1fr !important}.brand .mark{width:40px}}
`;

export function layout(title, body, extra = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="robots" content="noindex"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(MARK.replace('class="mark"','style="color:%23fff;background:%23D20009;padding:8%25"'))}"><style>${CSS}</style></head><body>${body}${extra}<script>requestAnimationFrame(()=>document.querySelectorAll('.r').forEach((e,i)=>{e.style.setProperty('--d',(Math.min(i,8)*.06)+'s');e.classList.add('in')}))</script></body></html>`;
}

export function setupPage({ error }) {
  return layout(CONFIG.name + ' · Setup', `<main class="wrap" style="max-width:560px"><div class="brand" style="margin-bottom:18px">${MARK}<div><div class="kicker">${esc(CONFIG.name)}</div><div class="small muted">${esc(CONFIG.tagline)}</div></div></div><div class="card r"><h1>Create your <em>password</em></h1>
  <p class="muted">You're the first one here, so this password becomes the owner's. Keep it somewhere safe; it's the only login.</p>
  ${error ? `<p style="color:var(--bad)">${esc(error)}</p>` : ''}
  <form method="post" action="/admin/setup" class="f"><div><label>Password (8+ characters)</label><input type="password" name="password" required minlength="8" autofocus></div><button class="btn">Create password →</button></form></div></main>`);
}
export function loginPage({ error }) {
  return layout(CONFIG.name + ' · Sign in', `<main class="wrap" style="max-width:460px"><div class="brand" style="margin-bottom:18px">${MARK}<div><div class="kicker">${esc(CONFIG.name)}</div><div class="small muted">${esc(CONFIG.tagline)}</div></div></div><div class="card r"><h1>Sign <em>in</em></h1>${error ? `<p style="color:var(--bad)">${esc(error)}</p>` : ''}
  <form method="post" action="/admin/login" class="f"><div><label>Dashboard password</label><input type="password" name="password" required autofocus></div><button class="btn">Open dashboard →</button></form></div></main>`);
}

export function settingsPage({ s, origin, notice }) {
  return layout(CONFIG.name + ' · Settings', `<main class="wrap" style="max-width:760px">
  <p><a href="/admin" class="small muted">← Dashboard</a></p><div class="kicker">${esc(CONFIG.name)}</div><h1>Set<em>tings</em></h1>
  ${notice ? `<div class="notice">${esc(notice)}</div>` : ''}
  <form method="post" action="/admin/settings" class="f card" style="margin-top:14px">
    <div><label>Your business or channel name (shown on the dashboard)</label><input name="business_name" value="${esc(s.business_name)}"></div>
    <div><label>Fallback URL — where an unknown /go/ code sends people</label><input name="fallback_url" value="${esc(s.fallback_url)}" placeholder="https://yoursite.com"></div>
    <div><label>YouTube Data API key (optional — fills in view counts and titles automatically)</label><input name="yt_api_key" value="${esc(s.yt_api_key)}" placeholder="AIza…">
      <p class="small muted">Free. Google Cloud Console → create a project → enable “YouTube Data API v3” → Credentials → API key. Without it you can type view counts in by hand, or leave them out.</p></div>
    <div><label>Stripe webhook signing secret (optional — records sales automatically)</label><input name="stripe_secret" value="${esc(s.stripe_secret)}" placeholder="whsec_…">
      <p class="small muted">Stripe Dashboard → Developers → Webhooks → Add endpoint: <code>${esc(origin)}/webhook/stripe</code>, event <code>checkout.session.completed</code> (add <code>invoice.paid</code> for subscriptions). Paste the signing secret here.</p></div>
    <div><label>API key for Zapier / Make / your own code (send it as header <code>x-api-key</code>)</label><input value="${esc(s.api_key)}" readonly onclick="this.select()"><label style="margin-top:6px"><input type="checkbox" name="rotate_api_key" value="1" style="width:auto"> Generate a new key</label></div>
    <div><label>Change dashboard password</label><input type="password" name="new_password" minlength="8" placeholder="leave blank to keep"></div>
    <button class="btn">Save</button>
  </form>
  <h2>Sending leads and sales from other tools</h2>
  <div class="card small">
    <p><b>Lead</b> (from an email tool, Zapier, Make, your form's webhook):</p>
    <pre>POST ${esc(origin)}/api/lead
Content-Type: application/json
x-api-key: ${esc(s.api_key)}

{"email":"name@example.com","name":"Name","ytc":"&lt;visitor id if you have it&gt;","code":"&lt;link code if you have it&gt;"}</pre>
    <p><b>Sale</b> (from Stripe via webhook above, or from anything else):</p>
    <pre>POST ${esc(origin)}/api/sale
Content-Type: application/json
x-api-key: ${esc(s.api_key)}

{"email":"name@example.com","amount":497,"currency":"USD","id":"&lt;order id, prevents duplicates&gt;"}</pre>
    <p class="muted">A sale is credited to a video by the visitor id first, then by the buyer's email (if that email came in as a lead through a tracked link). A sale with neither shows as “not attributed”.</p>
  </div></main>`);
}

/* ---------- dashboard ---------- */
export function dashboardPage(d) {
  const { offers, links, videos, clicksByCode, clicksAll, leadsByCode, salesByCode, kpi, series, recentLeads, recentSales, journeys, range, origin, notice, cd, revtrack, days, ytError, hasKey, business } = d;
  const linkMap = Object.fromEntries(links.map(l => [l.code, l]));
  const vidMap = Object.fromEntries(videos.map(v => [v.id, v]));
  const offerMap = Object.fromEntries(offers.map(o => [o.id, o]));
  const vidTitle = id => vidMap[id]?.title || id;
  const linkLabel = code => { const l = linkMap[code]; if (!l) return code ? `<code>${esc(code)}</code> <span class="muted small">(deleted link)</span>` : '<span class="muted">—</span>'; return `<code>${esc(code)}</code>${l.video_id ? ` <span class="small muted">in “${esc(vidTitle(l.video_id))}”</span>` : ''}`; };
  const delta = (a, b, isMoney) => { if (range === 'all') return ''; const d = a - b; const f = isMoney ? money(Math.abs(d)) : num(Math.abs(d)); return `<div class="d ${d > 0 ? 'up' : d < 0 ? 'down' : 'muted'}">${d > 0 ? '▲' : d < 0 ? '▼' : '•'} ${d === 0 ? 'same as' : f + (d > 0 ? ' more than' : ' less than')} the ${days} days before</div>`; };

  // per-video roll-up
  const byVideo = {}; const noVideo = { id: '', title: 'Links not attached to a video', clicks: 0, people: 0, leads: 0, customers: 0, sales: 0, rev: 0, codes: [] };
  for (const v of videos) byVideo[v.id] = { ...v, clicks: 0, people: 0, leads: 0, customers: 0, sales: 0, rev: 0, codes: [] };
  for (const l of links) {
    const t = l.video_id && byVideo[l.video_id] ? byVideo[l.video_id] : noVideo;
    const c = clicksByCode[l.code] || {}, le = leadsByCode[l.code] || {}, s = salesByCode[l.code] || {};
    t.clicks += c.n || 0; t.people += c.p || 0; t.leads += le.n || 0; t.customers += le.c || 0; t.sales += s.n || 0; t.rev += s.rev || 0; t.codes.push(l.code);
  }
  // sales credited to deleted codes still count somewhere
  for (const [code, s] of Object.entries(salesByCode)) if (code && !linkMap[code]) { noVideo.sales += s.n; noVideo.rev += s.rev; }
  const vrows = Object.values(byVideo).sort((a, b) => b.rev - a.rev || b.leads - a.leads || b.people - a.people);
  const perK = (rev, views) => views ? money(1000 * rev / views) : '—';

  const videoTable = `<div class="tbl"><table id="vt"><thead><tr>
    <th data-k="t">Video</th><th class="n" data-k="n">Views</th><th class="n" data-k="n">People clicked</th><th class="n" data-k="n" title="People who clicked ÷ views × 100">Clicks / 100 views</th><th class="n" data-k="n">Leads</th><th class="n" data-k="n">Sales</th><th class="n" data-k="n">Revenue</th><th class="n" data-k="n" title="Revenue ÷ views × 1,000">$ per 1K views</th></tr></thead><tbody>
    ${[...vrows, ...(noVideo.codes.length || noVideo.sales ? [noVideo] : [])].map(v => `<tr>
      <td><div class="vid">${v.id ? `<a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener"><img class="thumb" src="${esc(v.thumb || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`)}" alt=""></a>` : '<div class="thumb" style="background:var(--soft)"></div>'}<div><div class="t">${esc(v.title || v.id)}</div><div class="small muted">${v.published ? dateOnly(v.published) + ' · ' : ''}${v.codes.length} link${v.codes.length === 1 ? '' : 's'}${v.id && !hasKey ? ` · <form method="post" action="/admin/video" style="display:inline"><input type="hidden" name="video" value="${esc(v.id)}"><input name="views" placeholder="views" style="width:80px;padding:2px 6px;display:inline;font-size:12px" value="${v.views || ''}"> <button class="copy">save</button></form>` : ''}</div></div></div></td>
      <td class="n" data-v="${v.views || 0}">${v.views ? num(v.views) : '<span class="muted">—</span>'}</td>
      <td class="n" data-v="${v.people}">${num(v.people)}<div class="small muted">${num(v.clicks)} clicks</div></td>
      <td class="n" data-v="${v.views ? v.people / v.views : -1}">${v.views ? (100 * (clicksAllFor(v.codes, clicksAll)) / v.views).toFixed(2) : '—'}${v.views ? '<div class="small muted">all time</div>' : ''}</td>
      <td class="n" data-v="${v.leads}">${num(v.leads)}${v.people ? `<div class="small muted">${pct(v.leads, v.people, 0)} of clickers</div>` : ''}</td>
      <td class="n" data-v="${v.sales}">${num(v.sales)}</td>
      <td class="n" data-v="${v.rev}"><b>${money(v.rev)}</b></td>
      <td class="n" data-v="${v.views ? v.rev / v.views : -1}">${perK(v.rev, v.views)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">No videos yet. Create a tracked link and attach it to a video below.</td></tr>'}
  </tbody></table></div>`;

  // per-offer roll-up
  const orows = offers.map(o => { const codes = links.filter(l => l.offer === o.id).map(l => l.code); const sum = (m, k) => codes.reduce((a, c) => a + ((m[c] || {})[k] || 0), 0); return { ...o, codes, people: sum(clicksByCode, 'p'), leads: sum(leadsByCode, 'n'), sales: sum(salesByCode, 'n'), rev: sum(salesByCode, 'rev') }; });
  const offerTable = `<div class="tbl"><table><thead><tr><th>Offer</th><th>Goes to</th><th class="n">Links</th><th class="n">People clicked</th><th class="n">Leads</th><th class="n">Sales</th><th class="n">Revenue</th><th class="n" title="Sales ÷ people who clicked">Click → sale</th></tr></thead><tbody>
    ${orows.map(o => `<tr><td><b>${esc(o.name)}</b><div class="small muted"><code>${esc(o.id)}</code>${o.price ? ' · ' + money(o.price) : ''} · <form method="post" action="/admin/offer/delete" style="display:inline" onsubmit="return confirm('Delete this offer? Its links stay.')"><input type="hidden" name="id" value="${esc(o.id)}"><button class="copy">delete</button></form></div></td><td class="small"><a href="${esc(o.dest)}" target="_blank" rel="noopener">${esc(o.dest.replace(/^https?:\/\//, '')).slice(0, 48)}</a></td><td class="n">${o.codes.length}</td><td class="n">${num(o.people)}</td><td class="n">${num(o.leads)}</td><td class="n">${num(o.sales)}</td><td class="n"><b>${money(o.rev)}</b></td><td class="n">${pct(o.sales, o.people, 1)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">No offers yet. An offer is anything you send people to: a lead magnet, a call booking page, a product.</td></tr>'}
  </tbody></table></div>`;

  // tracked links
  const linkTable = `<div class="tbl"><table><thead><tr><th>Link</th><th>Offer</th><th>Video</th><th>Placement</th><th class="n">People (range)</th><th class="n">People (all)</th><th class="n">Leads</th><th class="n">Sales</th><th></th></tr></thead><tbody>
    ${links.map(l => { const c = clicksByCode[l.code] || {}, a = clicksAll[l.code] || {}, le = leadsByCode[l.code] || {}, s = salesByCode[l.code] || {}; return `<tr>
      <td><code>${esc(l.code)}</code> <button class="copy" data-copy="${esc(origin)}/go/${esc(l.code)}">copy</button>${l.label ? `<div class="small muted">${esc(l.label)}</div>` : ''}${l.dest ? `<div class="small muted">→ ${esc(l.dest)}</div>` : ''}</td>
      <td>${esc(offerMap[l.offer]?.name || l.offer)}</td>
      <td>${l.video_id ? `<a href="https://www.youtube.com/watch?v=${esc(l.video_id)}" target="_blank" rel="noopener" class="small">${esc(vidTitle(l.video_id)).slice(0, 50)}</a>` : `<form method="post" action="/admin/link/video" style="display:flex;gap:4px"><input type="hidden" name="code" value="${esc(l.code)}"><input name="video" placeholder="paste YouTube link" style="padding:3px 6px;font-size:12px;min-width:150px"><button class="btn sm ghost">attach</button></form>`}</td>
      <td class="small">${esc(l.placement)}</td><td class="n">${num(c.p || 0)}</td><td class="n">${num(a.p || 0)}</td><td class="n">${num(le.n || 0)}</td><td class="n">${num(s.n || 0)}${s.rev ? `<div class="small muted">${money(s.rev)}</div>` : ''}</td>
      <td><form method="post" action="/admin/link/delete" onsubmit="return confirm('Delete this link? It will stop redirecting.')"><input type="hidden" name="code" value="${esc(l.code)}"><button class="copy">delete</button></form></td></tr>`; }).join('') || '<tr><td colspan="9" class="muted">No tracked links yet.</td></tr>'}
  </tbody></table></div>`;

  const journey = cid => { const j = journeys[cid]; if (!j?.length) return '<div class="small muted">No tracked clicks before this (they didn\'t come through a tracked link, or used another device).</div>'; return `<ol class="journey">${j.map(e => `<li>${esc(when(e.ts))} — ${e.kind === 'click' ? `clicked ${linkLabel(e.code)}` : e.kind === 'view' ? `viewed <span class="muted">${esc(e.page || 'a page')}</span>` : esc(e.kind) + (e.page ? ` <span class="muted">${esc(e.page)}</span>` : '')}</li>`).join('')}</ol>`; };
  const stages = { lead: 'Lead', call: 'Call booked', customer: 'Customer', 'not-fit': 'Not a fit' };
  const leadRows = recentLeads.map(l => `<tr><td><b>${esc(l.name || l.email)}</b>${l.name ? `<div class="small muted">${esc(l.email)}</div>` : ''}<details><summary class="small">journey</summary>${journey(l.cid)}
      <form method="post" action="/admin/lead" class="f small" style="margin-top:8px"><input type="hidden" name="id" value="${l.id}"><div class="row"><div><label>Credit to link code</label><input name="first_code" value="${esc(l.first_code || '')}" placeholder="e.g. v12-guide"></div><div><label>Notes</label><input name="notes" value="${esc(l.notes || '')}"></div></div><div style="display:flex;gap:8px"><button class="btn sm">Save</button><button class="btn sm ghost" formaction="/admin/lead/delete" onclick="return confirm('Remove this lead?')">Remove</button></div></form></details></td>
    <td class="small">${when(l.ts)}</td><td class="small">${linkLabel(l.first_code)}</td>
    <td><form method="post" action="/admin/lead"><input type="hidden" name="id" value="${l.id}"><input type="hidden" name="notes" value="${esc(l.notes || '')}"><select name="stage" onchange="this.form.submit()" style="padding:4px 8px;font-size:13px;width:auto">${Object.entries(stages).map(([k, v]) => `<option value="${k}" ${l.stage === k ? 'selected' : ''}>${v}</option>`).join('')}</select></form></td>
    <td class="small muted">${esc(l.source || '')}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No leads yet. Add the snippet to your signup/thank-you page, or send leads from your email tool (Settings).</td></tr>';

  const saleRows = recentSales.map(s => `<tr><td><b>${money(s.amount, s.currency)}</b>${s.note ? `<div class="small muted">${esc(s.note)}</div>` : ''}</td><td class="small">${when(s.ts)}</td><td class="small">${esc(s.email || '—')}</td><td class="small">${esc(offerMap[s.offer]?.name || s.offer || '—')}</td><td class="small">${s.code ? linkLabel(s.code) : '<span class="tag warn">not attributed</span>'}</td><td class="small muted">${esc(s.source || '')}</td>
    <td><form method="post" action="/admin/sale/delete" onsubmit="return confirm('Remove this sale?')"><input type="hidden" name="id" value="${s.id}"><button class="copy">remove</button></form></td></tr>`).join('') || '<tr><td colspan="7" class="muted">No sales yet. Record one below, add <code>data-sale</code> to your thank-you page snippet, or connect Stripe in Settings.</td></tr>';

  // insights
  const ins = [];
  const withViews = vrows.filter(v => v.views > 0);
  if (withViews.length >= 2) { const best = [...withViews].sort((a, b) => b.rev / b.views - a.rev / a.views)[0]; if (best.rev > 0) ins.push(['', `<b>“${esc(best.title)}”</b> earns the most per view (${perK(best.rev, best.views)} per 1,000 views). Make more videos like it, and link it from your other videos.`]); }
  const clickNoLead = vrows.filter(v => v.id && v.people >= 20 && v.leads === 0); if (clickNoLead.length) ins.push(['', `${clickNoLead.length} video${clickNoLead.length > 1 ? 's send' : ' sends'} people to your page but none of them sign up (e.g. “${esc(clickNoLead[0].title)}”). Check that the offer in the video matches what the page promises.`]);
  if (kpi.sales.n && kpi.unattributed.n / kpi.sales.n > 0.4) ins.push(['', `${pct(kpi.unattributed.n, kpi.sales.n, 0)} of sales aren't attributed to any video. Usually: the buyer never clicked a tracked link, or bought on another device. Capture an email before the purchase (a lead form) and it will match by email.`]);
  const lowCtr = withViews.filter(v => v.views >= 1000 && clicksAllFor(v.codes, clicksAll) / v.views < 0.002); if (lowCtr.length) ins.push(['', `${lowCtr.length} video${lowCtr.length > 1 ? 's have' : ' has'} under 0.2 clicks per 100 views. Try mentioning the link out loud, pinning a comment with it, and putting it first in the description.`]);
  if (!ins.length) ins.push(['', 'Insights appear once a few videos have views, clicks and sales recorded.']);

  // getting started
  const steps = [
    { done: offers.length > 0, t: 'Add an offer', d: 'What you send people to: a free guide, a call booking page, a product page.' },
    { done: links.length > 0, t: 'Create a tracked link for a video', d: `Put <code>${esc(origin)}/go/&lt;code&gt;</code> in that video's description (and pinned comment).` },
    { done: Object.keys(clicksAll).length > 0, t: 'Get your first click', d: 'Click your own link once from the YouTube description to test it (it redirects with ?ytc=… on the end).' },
    { done: recentLeads.length > 0 || recentSales.length > 0, t: 'Add the snippet to your pages', d: `Paste <code>&lt;script src="${esc(origin)}/t.js"&gt;&lt;/script&gt;</code> before <code>&lt;/body&gt;</code> on your landing and thank-you pages. On a purchase thank-you page add <code>data-sale="497"</code>.` },
    { done: recentSales.length > 0, t: 'Record sales', d: 'Connect Stripe in Settings, use the thank-you snippet, send them from Zapier/Make, or type them in below.' },
  ];
  const allDone = steps.every(s => s.done);

  const chart = svgChart(series, days);

  const body = `<main class="wrap">
  <div class="top"><div class="brand">${MARK}<div><div class="kicker">${esc(CONFIG.name)}${business ? ' · ' + esc(business) : ''}</div><h1>Which videos <em>sell</em></h1><div class="muted small">Clicks, leads and sales per video. ${range === 'all' ? 'All time' : `Last ${days} days`}.</div></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="pills">${['7', '30', '90', 'all'].map(r => `<a href="/admin?r=${r}" class="${r === range ? 'on' : ''}">${r === 'all' ? 'All time' : r + ' days'}</a>`).join('')}</span>
    <form method="post" action="/admin/refresh"><button class="btn ghost sm" title="Refresh view counts from YouTube">↻ Refresh</button></form><a class="btn ghost sm" href="/admin/settings">Settings</a><a class="btn ghost sm" href="/admin/logout">Log out</a></div></div>
  ${notice ? `<div class="notice">${esc(notice)}</div>` : ''}
  ${ytError ? `<div class="notice" style="border-color:var(--bad)">${esc(ytError)}</div>` : ''}
  ${allDone ? '' : `<div class="card" style="margin-bottom:14px"><h3>Getting started</h3><div class="steps">${steps.map((s, i) => `<div class="step ${s.done ? 'done' : ''}"><div class="n">${s.done ? '✓' : i + 1}</div><div><b>${s.t}</b><div class="small muted">${s.d}</div></div></div>`).join('')}</div></div>`}

  <div class="kpis">
    <div class="card kpi r"><div class="v">${num(kpi.clicks.p)}</div><div class="l">People who clicked a link <span class="muted">(${num(kpi.clicks.n)} clicks)</span></div>${delta(kpi.clicks.p, kpi.clicksPrev.p)}</div>
    <div class="card kpi r"><div class="v">${num(kpi.leads)}</div><div class="l">New leads</div>${delta(kpi.leads, kpi.leadsPrev)}</div>
    <div class="card kpi r"><div class="v">${num(kpi.sales.n)}</div><div class="l">Sales</div>${delta(kpi.sales.n, kpi.salesPrev.n)}</div>
    <div class="card kpi hot r"><div class="v">${money(kpi.sales.rev)}</div><div class="l">Revenue tracked${kpi.unattributed.n ? ` <span class="muted">· ${money(kpi.unattributed.rev)} not attributed</span>` : ''}</div>${delta(Math.round(kpi.sales.rev), Math.round(kpi.salesPrev.rev), true)}</div>
  </div>

  <div class="grid2" style="margin-top:14px">
    <div class="card"><h3>Per day</h3>${chart}<div class="legend"><span><i style="background:#4b5563"></i>People clicked</span><span><i style="background:#9aa1b0"></i>Leads</span><span><i style="background:#ff2a2f"></i>Sales</span></div></div>
    <div class="card"><h3>What the numbers say</h3>${ins.map(([, t]) => `<div class="insight"><div class="ic"></div><div class="small">${t}</div></div>`).join('')}</div>
  </div>

  <h2>Your videos <span class="muted small" style="font-weight:400">— click a column to sort</span></h2>
  <div class="card">${videoTable}${!hasKey && videos.length ? '<p class="small muted" style="margin:10px 0 0">View counts: type them in from YouTube Studio, or add a free YouTube API key in Settings and they fill in automatically.</p>' : ''}</div>

  <h2>Your offers</h2>
  <div class="grid2" style="grid-template-columns:2fr 1fr"><div class="card">${offerTable}</div>
    <div class="card"><h3>Add or update an offer</h3><form method="post" action="/admin/offer" class="f"><div class="row"><div><label>Short id (letters, numbers, dashes)</label><input name="id" required placeholder="guide"></div><div><label>Name</label><input name="name" required placeholder="Free guide"></div></div><div><label>Page people land on</label><input name="dest" required placeholder="https://yoursite.com/guide"></div><div><label>Price (optional, for your reference)</label><input name="price" type="number" step="0.01" placeholder="0"></div><button class="btn">Save offer</button></form></div></div>

  <h2>Tracked links</h2>
  <div class="grid2" style="grid-template-columns:2fr 1fr"><div class="card">${linkTable}</div>
    <div class="card"><h3>New tracked link</h3><form method="post" action="/admin/link" class="f">
      <div><label>Code (becomes ${esc(origin)}/go/<b>code</b>)</label><input name="code" required placeholder="v12-guide" pattern="[a-z0-9][a-z0-9-]*"></div>
      <div><label>Offer</label><select name="offer" required>${offers.map(o => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('') || '<option value="">Add an offer first</option>'}</select></div>
      <div><label>YouTube video it goes under (paste the link)</label><input name="video" placeholder="https://youtu.be/…"></div>
      <div class="row"><div><label>Placement</label><select name="placement"><option>description</option><option>pinned-comment</option><option>end-screen</option><option>community-post</option><option>short</option><option>channel-about</option><option>other</option></select></div><div><label>Label (optional)</label><input name="label" placeholder="E12 description: guide"></div></div>
      <div><label>Different landing page for this link (optional)</label><input name="dest" placeholder="leave blank to use the offer's page"></div>
      <button class="btn">Create link</button></form>
      <p class="small muted" style="margin-bottom:0">Tip: one code per video per offer, e.g. <code>v12-guide</code>, <code>v12-call</code>. Never reuse a code across videos; the tool can only credit one video per link.</p></div></div>

  <h2>Sales</h2>
  <div class="grid2" style="grid-template-columns:2fr 1fr"><div class="card tbl"><table><thead><tr><th>Amount</th><th>When</th><th>Who</th><th>Offer</th><th>Credited to</th><th>Via</th><th></th></tr></thead><tbody>${saleRows}</tbody></table></div>
    <div class="card"><h3>Record a sale</h3><form method="post" action="/admin/sale" class="f"><div class="row"><div><label>Amount</label><input name="amount" type="number" step="0.01" required placeholder="497"></div><div><label>Date</label><input name="date" type="date"></div></div><div><label>Buyer's email (used to find which video they came from)</label><input name="email" type="email" placeholder="name@example.com"></div><div class="row"><div><label>Offer</label><select name="offer"><option value="">—</option>${offers.map(o => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('')}</select></div><div><label>Or credit a link code directly</label><input name="code" placeholder="v12-call"></div></div><div><label>Note</label><input name="note" placeholder="3-month retainer"></div><button class="btn">Record sale</button></form></div></div>

  <h2>Leads <span class="muted small" style="font-weight:400">— newest 200 · <a href="/admin/leads.csv">leads.csv</a> · <a href="/admin/sales.csv">sales.csv</a> · <a href="/admin/clicks.csv">clicks.csv</a></span></h2>
  <div class="card tbl"><table><thead><tr><th>Who</th><th>When</th><th>Came from</th><th>Stage</th><th>Via</th></tr></thead><tbody>${leadRows}</tbody></table></div>

  <h2>Next steps</h2>
  <div class="promo">
    <div class="card cd"><h3>Get your channel reviewed live</h3><div class="small muted">Creative Direct Live reviews business channels on the show, live on YouTube. Find out why your videos aren't selling, for free.</div><a class="btn" href="${esc(cd.review)}" target="_blank" rel="noopener">Apply for a review →</a></div>
    <div class="card"><h3>Free guide: turn your editor into a creative director</h3><div class="small muted">The system Creative Direct uses so a business owner spends under 5 hours a week on YouTube and still grows.</div><a class="btn ghost" href="${esc(cd.guide)}" target="_blank" rel="noopener">Get the guide →</a></div>
    <div class="card"><h3>Want videos that sell, made for you?</h3><div class="small muted">Creative Direct runs YouTube for business owners: strategy, scripting, thumbnails, editing, publishing and reporting.</div><a class="btn ghost" href="${esc(cd.apply)}" target="_blank" rel="noopener">Work with Creative Direct →</a></div>
    <div class="card"><h3>Outgrown this? ${esc(revtrack.name)}</h3><div class="small muted">${esc(revtrack.blurb)} ${esc(CONFIG.name)} is the free starting point; ${esc(revtrack.name)} is the full version.</div><a class="btn ghost" href="${esc(revtrack.url)}" target="_blank" rel="noopener">See ${esc(revtrack.name)} →</a></div>
  </div>
  <div class="foot">${MARK}<span>${esc(CONFIG.name)} is free, open-source and provided as-is by <a href="${esc(cd.site)}">Creative Direct</a>. Your data stays in your own Cloudflare account.</span><a href="${esc(cd.show)}" target="_blank" rel="noopener">Watch the show</a><a href="${esc(cd.aiPolicy)}" target="_blank" rel="noopener">How we use AI</a></div>
  </main>`;

  const js = `<script>
  document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>{navigator.clipboard.writeText(b.dataset.copy).then(()=>{const t=b.textContent;b.textContent='copied';setTimeout(()=>b.textContent=t,1200)})}));
  document.querySelectorAll('table').forEach(tb=>{const ths=[...tb.querySelectorAll('thead th')];ths.forEach((th,i)=>{if(!th.textContent.trim())return;th.addEventListener('click',()=>{const tbody=tb.tBodies[0];const rows=[...tbody.rows];const num=th.classList.contains('n');const dir=th.dataset.dir==='asc'?'desc':'asc';ths.forEach(h=>h.removeAttribute('data-dir'));th.dataset.dir=dir;rows.sort((a,b)=>{const A=a.cells[i],B=b.cells[i];if(!A||!B)return 0;let x=num?parseFloat(A.dataset.v??A.textContent.replace(/[^0-9.-]/g,''))||0:A.textContent.trim().toLowerCase();let y=num?parseFloat(B.dataset.v??B.textContent.replace(/[^0-9.-]/g,''))||0:B.textContent.trim().toLowerCase();return (x<y?-1:x>y?1:0)*(dir==='asc'?1:-1)});rows.forEach(r=>tbody.appendChild(r))})})});
  </script>`;
  return layout(CONFIG.name + (business ? ' · ' + business : ''), body, js);
}

function clicksAllFor(codes, clicksAll) { return codes.reduce((a, c) => a + ((clicksAll[c] || {}).p || 0), 0); }

function svgChart(series, days) {
  const W = 520, H = 150, P = 6;
  const keys = []; for (let i = days - 1; i >= 0; i--) keys.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  const m = s => Object.fromEntries(s.map(r => [r.d, r.n]));
  const c = m(series.clicks), l = m(series.leads), s = m(series.sales);
  const max = Math.max(1, ...keys.map(k => Math.max(c[k] || 0, l[k] || 0, s[k] || 0)));
  const x = i => P + i * (W - 2 * P) / Math.max(1, keys.length - 1);
  const y = v => H - 18 - (v / max) * (H - 18 - 16);
  const path = (mm, color, w) => `<path d="${keys.map((k, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(mm[k] || 0).toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const dots = (mm, color) => keys.map((k, i) => mm[k] ? `<circle cx="${x(i).toFixed(1)}" cy="${y(mm[k]).toFixed(1)}" r="3.5" fill="${color}"><title>${k}: ${mm[k]}</title></circle>` : '').join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${path(c, '#4b5563', 1.5)}${path(l, '#9aa1b0', 2)}${path(s, '#ff2a2f', 2.5)}${dots(l, '#9aa1b0')}${dots(s, '#ff2a2f')}
  <text x="${P}" y="${H - 1}" font-size="10" fill="#6b7280">${keys[0]}</text><text x="${W - P}" y="${H - 1}" font-size="10" fill="#6b7280" text-anchor="end">${keys[keys.length - 1]}</text><text x="${W - P}" y="10" font-size="10" fill="#6b7280" text-anchor="end">max ${max}/day</text></svg>`;
}
