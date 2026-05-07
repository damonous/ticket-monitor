# Deploy notes (freelance.mvp.dev)

The service runs as a long-lived Node process under systemd, listens on
`127.0.0.1:8770` for the status page, and is reverse-proxied at
`https://demos.mvp.dev/ticket-monitor` by the existing Caddy stack.

## First-time install

```bash
# On freelance.mvp.dev
mkdir -p /opt/ticket-monitor
# Copy repo from your laptop:
#   scp -r ./* root@5.78.141.224:/opt/ticket-monitor/
cd /opt/ticket-monitor
npm install --omit=dev

# Create .env (see .env.example)
cp .env.example .env
$EDITOR .env

# Install systemd unit
cp infra/ticket-monitor.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now ticket-monitor

# Verify
systemctl status ticket-monitor
journalctl -u ticket-monitor -f
curl -s http://127.0.0.1:8770/healthz
```

## Caddy route

Add to `/opt/demos-mvp-dev/infra/Caddyfile` inside the `demos.mvp.dev` block:

```
handle /ticket-monitor* {
    uri strip_prefix /ticket-monitor
    reverse_proxy host.docker.internal:8770
}
```

Then reload Caddy:

```bash
docker compose -f /opt/demos-mvp-dev/infra/docker-compose.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

The worker uses `PUBLIC_BASE_PATH=/ticket-monitor` so its internal links and
asset paths render correctly behind the proxy.

## Updating

```bash
cd /opt/ticket-monitor
# pull new code (git pull, or scp again)
npm install --omit=dev
systemctl restart ticket-monitor
```
