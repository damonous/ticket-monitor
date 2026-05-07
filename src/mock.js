let tick = 0;

export async function fetchEventSnapshot() {
  tick += 1;

  const baseListings = 84;
  const baseLowest = 95;
  const drift = Math.round(Math.sin(tick / 2) * 12);
  const dropEvent = tick % 5 === 0;

  const listing_count = Math.max(0, baseListings + drift + (dropEvent ? -22 : 0));
  const price_lowest = Math.max(35, baseLowest + drift + (dropEvent ? -28 : 0));

  return {
    fetched_at: new Date().toISOString(),
    event_id: 'MOCK-EVENT-1',
    title: 'Mock Headliner at Mock Arena',
    venue: 'Mock Arena',
    starts_at: '2026-08-14T20:00:00',
    listing_count,
    ticket_count: listing_count * 2,
    price_lowest,
    price_highest: price_lowest + 240,
    price_average: price_lowest + 70,
    price_median: price_lowest + 55,
    url: 'https://seatgeek.com/example-event',
  };
}
