import { promises as fs } from 'node:fs';
import path from 'node:path';

const STATE = path.resolve('data', 'state.json');
const ALERTS = path.resolve('data', 'alerts.json');
const ALERTS_MAX = 50;

async function readJson(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

export async function readState() {
  return readJson(STATE);
}

export async function writeState(state) {
  return writeJson(STATE, state);
}

export async function readAlerts() {
  return (await readJson(ALERTS)) || [];
}

export async function pushAlert(alert) {
  const alerts = await readAlerts();
  alerts.unshift(alert);
  if (alerts.length > ALERTS_MAX) alerts.length = ALERTS_MAX;
  await writeJson(ALERTS, alerts);
}
