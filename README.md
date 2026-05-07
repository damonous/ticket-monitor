# Ticket Monitor

A small Node service that polls a single live event for inventory and price
movements and posts alerts to a Discord channel. Pluggable data source: works
with the Ticketmaster Discovery API or the SeatGeek Platform API. Optional
HTTP status page for sharing public visibility into what the bot is doing.

Live demo: https://demos.mvp.dev/ticket-monitor

## What it does

Every N seconds (default 60), it:

1. Pulls the event snapshot from the configured source.
2. Diffs against the last snapshot stored on disk.
3. If listings moved by 5+ or the lowest price moved by 5%+, it posts a
   Discord embed with the change and the trigger reason.
4. Writes the new snapshot to `data/state.json` and appends to `data/alerts.json`.
5. Optionally serves a small status page on `HTTP_PORT` showing the current
   event and a rolling window of recent alerts.

There's also a `MOCK=1` mode that skips the real API and feeds synthetic data,
so the alerting pipeline can be verified before you have credentials.

## Run it

```bash
cp .env.example .env
# fill in DISCORD_WEBHOOK_URL plus either Ticketmaster or SeatGeek credentials
npm install
npm start
```

For mock mode (no API key needed):

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/... npm run start:mock
```

## Env vars

| Name | Required | Default | Notes |
|---|---|---|---|
| `DISCORD_WEBHOOK_URL` | yes | | Channel webhook from Discord (Server Settings > Integrations > Webhooks) |
| `SOURCE` | yes (real) | `seatgeek` | `ticketmaster` or `seatgeek` |
| `TICKETMASTER_API_KEY` | if SOURCE=ticketmaster | | Free key at https://developer-acct.ticketmaster.com/user/register |
| `TICKETMASTER_EVENT_ID` | if SOURCE=ticketmaster | | Event id from a `ticketmaster.com/event/<id>` URL |
| `SEATGEEK_CLIENT_ID` | if SOURCE=seatgeek | | https://developer.seatgeek.com/ (manual approval) |
| `SEATGEEK_EVENT_ID` | if SOURCE=seatgeek | | Numeric event id |
| `POLL_INTERVAL_SECONDS` | no | `60` | How often to poll |
| `HTTP_PORT` | no | off | If set, serves a status page on this port |
| `PUBLIC_BASE_PATH` | no | `` | Path prefix when behind a reverse proxy (e.g. `/ticket-monitor`) |
| `MOCK` | no | `0` | Set to `1` to use synthetic data |

## File layout

```
src/
  index.js         # entry, wiring
  config.js        # env loading and validation
  source.js        # picks the right fetcher based on SOURCE/MOCK
  ticketmaster.js  # Ticketmaster Discovery API client
  seatgeek.js      # SeatGeek Platform API client
  mock.js          # synthetic data source for testing
  store.js         # JSON file state + alerts persistence
  monitor.js       # poll loop and diff logic
  discord.js       # webhook payload + post
  server.js        # optional status page HTTP server
data/
  state.json       # last seen snapshot (auto-created, gitignored)
  alerts.json      # rolling window of recent alerts (auto-created, gitignored)
```

## Tuning the alert thresholds

Open `src/monitor.js`. Two constants:

- `LISTING_DELTA_ABS` (default 5): minimum absolute change in listing count to
  trigger an alert.
- `PRICE_DROP_PCT` (default 0.05): minimum relative change in the lowest price
  to trigger an alert.

Both knobs exist to keep noise out of Discord. Tune to taste per event.

## Status page

Set `HTTP_PORT=3000` (or any port) and the worker will also serve a tiny
status page showing the current snapshot and recent alert log. Endpoints:

- `GET /` — HTML status page
- `GET /api/state` — current snapshot JSON
- `GET /api/alerts` — recent alerts JSON
- `GET /healthz` — `200 ok`

## Deploying

This is a single Node process that needs to keep running. The repo is set up
to run as a `systemd` service on a Linux host. See `infra/ticket-monitor.service`
for the unit file and `infra/DEPLOY.md` for the deploy steps used on
freelance.mvp.dev.

## Limits and notes

- Both Ticketmaster Discovery and SeatGeek Platform are event-level signals.
  Section or row-level filtering (e.g. "alert on anything under $80 in 100s")
  needs richer endpoints and a richer diff function. Easy to add, deliberately
  out of scope here.
- Free-tier rate limits on both providers are generous for a single event
  polling at 60s. Don't ramp the interval down without reading their terms.
- The Discord embed format is opinionated. Adjust `buildEmbed` in
  `src/discord.js` if you want different fields or a different look.
