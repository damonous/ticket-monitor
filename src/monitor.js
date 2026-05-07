import { readState, writeState, pushAlert } from './store.js';
import { postAlert } from './discord.js';

const PRICE_DROP_PCT = 0.05;
const LISTING_DELTA_ABS = 5;

function diff(prev, next) {
  if (!prev) return ['initial snapshot captured'];

  const reasons = [];

  const listingDelta = next.listing_count - prev.listing_count;
  if (Math.abs(listingDelta) >= LISTING_DELTA_ABS) {
    const dir = listingDelta > 0 ? 'added' : 'removed';
    reasons.push(`${Math.abs(listingDelta)} listings ${dir} (was ${prev.listing_count}, now ${next.listing_count})`);
  }

  if (prev.price_lowest && next.price_lowest) {
    const pct = (next.price_lowest - prev.price_lowest) / prev.price_lowest;
    if (Math.abs(pct) >= PRICE_DROP_PCT) {
      const dir = pct < 0 ? 'dropped' : 'rose';
      reasons.push(`lowest price ${dir} ${Math.round(Math.abs(pct) * 100)}% ($${prev.price_lowest} -> $${next.price_lowest})`);
    }
  }

  return reasons;
}

export async function tick({ fetchSnapshot, webhookUrl }) {
  const snapshot = await fetchSnapshot();
  const prev = await readState();
  const reasons = diff(prev, snapshot);

  if (reasons.length) {
    await postAlert({ webhookUrl, snapshot, prev, reasons });
    await pushAlert({ at: snapshot.fetched_at, snapshot, prev, reasons });
    console.log(`[${snapshot.fetched_at}] alerted: ${reasons.join('; ')}`);
  } else {
    console.log(`[${snapshot.fetched_at}] no change (listings=${snapshot.listing_count}, low=$${snapshot.price_lowest})`);
  }

  await writeState(snapshot);
}

export async function run({ fetchSnapshot, webhookUrl, intervalSeconds }) {
  const intervalMs = intervalSeconds * 1000;
  let stopped = false;

  const stop = () => {
    stopped = true;
    console.log('shutting down...');
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  while (!stopped) {
    try {
      await tick({ fetchSnapshot, webhookUrl });
    } catch (err) {
      console.error(`tick failed: ${err.message}`);
    }
    if (stopped) break;
    await new Promise(r => setTimeout(r, intervalMs));
  }
}
