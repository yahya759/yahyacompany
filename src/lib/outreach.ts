/** Manual sending: build a link that opens the chat with the message pre-filled (when the channel supports it). */
export function channelLink(channel: string, contact: string | null | undefined, text: string, subject?: string | null): string | null {
  const c = (contact || '').trim();
  if (!c) return null;
  if (channel === 'whatsapp') {
    const digits = c.replace(/[^\d]/g, '');
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
  }
  if (channel === 'email') return `mailto:${c}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(text)}`;
  if (channel === 'telegram') {
    if (/^\+?\d[\d\s-]{6,}$/.test(c)) return `https://t.me/+${c.replace(/[^\d]/g, '')}`;
    return `https://t.me/${c.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '')}`;
  }
  if (/^https?:\/\//.test(c)) return c;
  return null;
}

type PlaceLike = { name: string; address?: string | null; city?: string | null; place_id?: string | null };

/** Opens the business on Google Maps (reviews, photos, their work). Uses the exact place when we have its id. */
export function mapsLink(l: PlaceLike): string {
  const q = encodeURIComponent([l.name, l.address || l.city].filter(Boolean).join(' '));
  return `https://www.google.com/maps/search/?api=1&query=${q}` + (l.place_id ? `&query_place_id=${encodeURIComponent(l.place_id)}` : '');
}

/** Plain Google search for the business: finds its Instagram/Facebook/website to judge their work. */
export function searchLink(l: PlaceLike): string {
  return `https://www.google.com/search?q=${encodeURIComponent([l.name, l.city || l.address].filter(Boolean).join(' '))}`;
}
