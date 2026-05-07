import { loadConfig } from './config.js';
import { run } from './monitor.js';
import { pickSource } from './source.js';
import { startServer } from './server.js';

const cfg = loadConfig();
const fetchSnapshot = pickSource(cfg);
const sourceName = cfg.mock ? 'mock' : cfg.source;

console.log(`starting ticket-monitor (source=${sourceName}, interval=${cfg.intervalSeconds}s, port=${cfg.httpPort || 'off'})`);

startServer({ port: cfg.httpPort, basePath: cfg.publicBasePath, sourceName });

run({
  fetchSnapshot,
  webhookUrl: cfg.webhookUrl,
  intervalSeconds: cfg.intervalSeconds,
}).catch(err => {
  console.error(`fatal: ${err.message}`);
  process.exit(1);
});
