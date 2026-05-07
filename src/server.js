import http from 'node:http';
import { readState, readAlerts } from './store.js';

function fmtUSD(n) {
  if (n === null || n === undefined) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderPage({ basePath, state, alerts, sourceName }) {
  const prefix = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

  const eventBlock = state ? `
    <div class="card event">
      <div class="kv"><span>Event</span><strong>${escape(state.title) || '—'}</strong></div>
      <div class="kv"><span>Venue</span><strong>${escape(state.venue) || '—'}</strong></div>
      <div class="kv"><span>Starts</span><strong>${escape(state.starts_at) || '—'}</strong></div>
      <div class="kv"><span>Listings</span><strong>${state.listing_count ?? '—'}</strong></div>
      <div class="kv"><span>Lowest price</span><strong>${fmtUSD(state.price_lowest)}</strong></div>
      <div class="kv"><span>Highest price</span><strong>${fmtUSD(state.price_highest)}</strong></div>
      <div class="kv"><span>Last poll</span><strong>${escape(state.fetched_at) || '—'}</strong></div>
    </div>
  ` : '<div class="card">No snapshot yet. Worker is starting up.</div>';

  const alertsBlock = alerts.length
    ? alerts.map(a => `
      <div class="alert">
        <div class="alert-time">${escape(a.at)}</div>
        <div class="alert-title">${escape(a.snapshot?.title) || '—'}</div>
        <ul>${a.reasons.map(r => `<li>${escape(r)}</li>`).join('')}</ul>
      </div>
    `).join('')
    : '<div class="card">No alerts triggered yet.</div>';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ticket Monitor · MVP.dev</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; background: #0e1116; color: #e6edf3; }
  .wrap { max-width: 880px; margin: 0 auto; padding: 32px 20px 80px; }
  h1 { font-size: 28px; margin: 0 0 8px; }
  .lede { color: #8b949e; margin: 0 0 32px; max-width: 60ch; }
  h2 { font-size: 18px; margin: 36px 0 12px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.04em; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 20px; }
  .event .kv { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #21262d; }
  .event .kv:last-child { border-bottom: 0; }
  .event .kv span { color: #8b949e; }
  .alert { background: #161b22; border: 1px solid #30363d; border-left: 3px solid #58a6ff; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
  .alert-time { color: #8b949e; font-size: 12px; font-variant-numeric: tabular-nums; }
  .alert-title { font-weight: 600; margin: 4px 0 8px; }
  .alert ul { margin: 0; padding-left: 18px; }
  .alert li { margin: 2px 0; }
  .meta { color: #8b949e; font-size: 13px; margin-top: 32px; }
  a { color: #58a6ff; }
  code { background: #21262d; padding: 1px 6px; border-radius: 4px; font-size: 13px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Ticket Monitor</h1>
  <p class="lede">Polls a single live event for inventory and price movements, posts alerts to a Discord channel. Built as a working demo of the alerting pattern: pull, diff, alert, persist, repeat.</p>

  <h2>Now monitoring</h2>
  ${eventBlock}

  <h2>Recent alerts</h2>
  ${alertsBlock}

  <p class="meta">Source: <code>${escape(sourceName)}</code> · Auto-refreshes every 30s.</p>
</div>
<script>setTimeout(() => location.reload(), 30000);</script>
</body>
</html>`;
}

export function startServer({ port, basePath, sourceName }) {
  if (!port) return null;

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname.replace(new RegExp('^' + (basePath || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '') || '/';

      if (path === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
        return;
      }

      if (path === '/api/state') {
        const state = await readState();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
        return;
      }

      if (path === '/api/alerts') {
        const alerts = await readAlerts();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(alerts));
        return;
      }

      const [state, alerts] = await Promise.all([readState(), readAlerts()]);
      const html = renderPage({ basePath, state, alerts, sourceName });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`error: ${err.message}`);
    }
  });

  server.listen(port, () => {
    console.log(`status server listening on :${port}`);
  });

  return server;
}
