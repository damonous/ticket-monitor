import 'dotenv/config';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`missing required env var: ${name}`);
  return v;
}

export function loadConfig() {
  const mock = process.env.MOCK === '1';
  const source = (process.env.SOURCE || 'seatgeek').toLowerCase();
  const intervalSeconds = parseInt(process.env.POLL_INTERVAL_SECONDS || '60', 10);
  const webhookUrl = required('DISCORD_WEBHOOK_URL');
  const httpPort = parseInt(process.env.HTTP_PORT || '0', 10);
  const publicBasePath = process.env.PUBLIC_BASE_PATH || '';

  const cfg = { mock, source, intervalSeconds, webhookUrl, httpPort, publicBasePath };

  if (mock) return cfg;

  if (source === 'seatgeek') {
    cfg.seatgeek = {
      clientId: required('SEATGEEK_CLIENT_ID'),
      eventId: required('SEATGEEK_EVENT_ID'),
    };
  } else if (source === 'ticketmaster') {
    cfg.ticketmaster = {
      apiKey: required('TICKETMASTER_API_KEY'),
      eventId: required('TICKETMASTER_EVENT_ID'),
    };
  } else {
    throw new Error(`unknown SOURCE: ${source}`);
  }

  return cfg;
}
