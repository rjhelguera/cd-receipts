-- yt-tracker schema. The Worker also runs this on first request, so a fresh deploy works even if migrations never ran.
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY, name TEXT NOT NULL, dest TEXT NOT NULL, price REAL, created TEXT);
CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT, published TEXT, views INTEGER, thumb TEXT, updated TEXT);
CREATE TABLE IF NOT EXISTS links (code TEXT PRIMARY KEY, offer TEXT NOT NULL, video_id TEXT, placement TEXT DEFAULT 'description', dest TEXT, label TEXT, created TEXT);
CREATE TABLE IF NOT EXISTS clicks (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, code TEXT, cid TEXT, country TEXT, referer TEXT, ua TEXT);
CREATE INDEX IF NOT EXISTS clicks_ts ON clicks(ts);
CREATE INDEX IF NOT EXISTS clicks_cid ON clicks(cid);
CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, email TEXT NOT NULL UNIQUE, name TEXT, cid TEXT, first_code TEXT, first_ts TEXT, last_code TEXT, source TEXT, stage TEXT DEFAULT 'lead', notes TEXT, country TEXT, updated TEXT);
CREATE INDEX IF NOT EXISTS leads_ts ON leads(ts);
CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, email TEXT, cid TEXT, code TEXT, offer TEXT, amount REAL, currency TEXT DEFAULT 'USD', source TEXT, external_id TEXT UNIQUE, note TEXT);
CREATE INDEX IF NOT EXISTS sales_ts ON sales(ts);
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, kind TEXT, cid TEXT, code TEXT, page TEXT);
CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
