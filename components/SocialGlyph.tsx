import type {TONY_CHANNELS} from '@/lib/social-news';

type Channel = keyof typeof TONY_CHANNELS;
// Brand glyphs for the three official accounts (filled, 24px grid).
const SOCIAL_GLYPHS: Record<Channel, string> = {
  facebook: 'M13.5 21.5v-8h2.7l.4-3.2h-3.1V8.3c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8v8h3.4Z',
  instagram: 'M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm5-8.1a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 4.6c2.4 0 2.7 0 3.6.1 2.4.1 3.6 1.3 3.7 3.7.1.9.1 1.2.1 3.6s0 2.7-.1 3.6c-.1 2.4-1.3 3.6-3.7 3.7-.9.1-1.2.1-3.6.1s-2.7 0-3.6-.1c-2.4-.1-3.6-1.3-3.7-3.7-.1-.9-.1-1.2-.1-3.6s0-2.7.1-3.6c.1-2.4 1.3-3.6 3.7-3.7.9-.1 1.2-.1 3.6-.1ZM12 3c-2.4 0-2.8 0-3.7.1-3.3.2-5 2-5.2 5.2C3 9.2 3 9.6 3 12s0 2.8.1 3.7c.2 3.3 2 5 5.2 5.2.9.1 1.3.1 3.7.1s2.8 0 3.7-.1c3.3-.2 5-2 5.2-5.2.1-.9.1-1.3.1-3.7s0-2.8-.1-3.7c-.2-3.3-2-5-5.2-5.2C14.8 3 14.4 3 12 3Z',
  tiktok: 'M16.6 3c.3 2.4 1.7 3.9 4.1 4v2.8a7 7 0 0 1-4-1.3v5.9a5.6 5.6 0 1 1-5.6-5.6l.6.1v3a2.6 2.6 0 1 0 1.9 2.5V3h3Z',
};

export default function SocialGlyph({channel, size = 24}: {channel: Channel; size?: number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={SOCIAL_GLYPHS[channel]}/></svg>;
}
