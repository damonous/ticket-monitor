import * as mock from './mock.js';
import * as seatgeek from './seatgeek.js';
import * as ticketmaster from './ticketmaster.js';

export function pickSource(cfg) {
  if (cfg.mock) return () => mock.fetchEventSnapshot();
  if (cfg.source === 'ticketmaster') return () => ticketmaster.fetchEventSnapshot(cfg.ticketmaster);
  if (cfg.source === 'seatgeek') return () => seatgeek.fetchEventSnapshot(cfg.seatgeek);
  throw new Error(`unknown source: ${cfg.source}`);
}
