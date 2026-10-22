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
