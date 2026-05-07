function fmtUSD(n) {
  if (n === null || n === undefined) return 'n/a';
  return `$${Math.round(n).toLocaleString()}`;
}

function changeArrow(prev, next) {
  if (prev === null || prev === undefined) return '';
  if (next > prev) return ' (up)';
  if (next < prev) return ' (down)';
  return '';
}

function buildEmbed(snapshot, prev, reasons) {
  const fields = [
    {
      name: 'Listings',
      value: `${snapshot.listing_count}${changeArrow(prev?.listing_count, snapshot.listing_count)}`,
      inline: true,
    },
    {
      name: 'Lowest price',
      value: `${fmtUSD(snapshot.price_lowest)}${changeArrow(prev?.price_lowest, snapshot.price_lowest)}`,
      inline: true,
    },
    {
      name: 'Median price',
      value: fmtUSD(snapshot.price_median),
      inline: true,
    },
  ];

  if (reasons.length) {
    fields.push({
      name: 'Triggers',
      value: reasons.map(r => `• ${r}`).join('\n'),
      inline: false,
    });
  }

  return {
    title: snapshot.title || 'Event update',
    description: snapshot.venue ? `${snapshot.venue} · ${snapshot.starts_at ?? ''}` : null,
    url: snapshot.url || null,
    timestamp: snapshot.fetched_at,
    color: 0x2b6cb0,
    fields,
    footer: { text: `event ${snapshot.event_id}` },
  };
}

export async function postAlert({ webhookUrl, snapshot, prev, reasons }) {
  const payload = {
    username: 'ticket-monitor',
    embeds: [buildEmbed(snapshot, prev, reasons)],
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.text();
    throw new Error(`Discord ${res.status}: ${body.slice(0, 200)}`);
  }
}
