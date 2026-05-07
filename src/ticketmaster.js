const BASE = 'https://app.ticketmaster.com/discovery/v2';

export async function fetchEventSnapshot({ apiKey, eventId }) {
  const url = `${BASE}/events/${eventId}.json?apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ticketmaster ${res.status}: ${body.slice(0, 200)}`);
  }
  const event = await res.json();

  const priceRange = event.priceRanges?.[0];
  const venue = event._embedded?.venues?.[0];
  const date = event.dates?.start?.dateTime || event.dates?.start?.localDate || null;

  return {
    fetched_at: new Date().toISOString(),
    event_id: event.id,
    title: event.name,
    venue: venue ? `${venue.name}${venue.city?.name ? ', ' + venue.city.name : ''}` : null,
    starts_at: date,
    listing_count: null,
    ticket_count: null,
    price_lowest: priceRange?.min ?? null,
    price_highest: priceRange?.max ?? null,
    price_average: null,
    price_median: null,
    status: event.dates?.status?.code ?? null,
    sales_status: event.sales?.public?.startTBD ? 'tbd' : (event.dates?.status?.code ?? null),
    url: event.url ?? null,
  };
}
