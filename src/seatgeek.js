const BASE = 'https://api.seatgeek.com/2';

export async function fetchEventSnapshot({ clientId, eventId }) {
  const url = `${BASE}/events/${eventId}?client_id=${encodeURIComponent(clientId)}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SeatGeek ${res.status}: ${body.slice(0, 200)}`);
  }
  const event = await res.json();

  return {
    fetched_at: new Date().toISOString(),
    event_id: String(event.id),
    title: event.title,
    venue: event.venue?.name ?? null,
    starts_at: event.datetime_local ?? null,
    listing_count: event.stats?.listing_count ?? 0,
    ticket_count: event.stats?.ticket_count ?? 0,
    price_lowest: event.stats?.lowest_price ?? null,
    price_highest: event.stats?.highest_price ?? null,
    price_average: event.stats?.average_price ?? null,
    price_median: event.stats?.median_price ?? null,
    url: event.url ?? null,
  };
}
