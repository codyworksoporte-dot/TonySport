// Line icons share one 24px grid and a 1.5 stroke. "Solid" icons are brand glyphs drawn as filled shapes.
const LINE = {
  mail: 'M3 5h18v14H3zM3.5 6l8.5 7 8.5-7',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  diagonal: 'M6 18 18 6M6 6h12v12',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'm6 6 12 12M6 18 18 6',
  search: 'm16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  check: 'm5 12 4 4L19 6',
  whatsapp: 'M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.7-4.5A9 9 0 1 1 21 11.5ZM8 7c0 5 4 9 9 9l1-3-3-1-1 2-4-4 2-1-1-3Z',
  plus: 'M12 5v14M5 12h14',
  shield: 'm12 2 9 4v7c0 5-9 9-9 9s-9-4-9-9V6l9-4Z',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  bag: 'M5 8h14l-1 13H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2',
  tag: 'M3 12V4h8l10 10-8 8L3 12Zm5-3.5a1 1 0 1 0 0-.01',
  store: 'M4 9 5.5 4h13L20 9M4 9h16v11H4V9Zm0 0a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5',
  package: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9M8 5.3l8 4.5',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h2',
  download: 'M12 3v12m-5-5 5 5 5-5M4 19h16',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6m0 3h.01',
  sparkle: 'M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Zm7 11c.3 1.7 1 2.4 2.7 2.7-1.7.3-2.4 1-2.7 2.7-.3-1.7-1-2.4-2.7-2.7 1.7-.3 2.4-1 2.7-2.7Z',
  chat: 'M4 5h16v11H9l-5 4V5Zm4 5h.01M12 10h.01M16 10h.01',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z',
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z',
  ball: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5 3.4 2.5-1.3 4H9.9l-1.3-4L12 7.5ZM12 3v4.5m3.4 2.5 4.8-1.6M14.1 14l2.9 4.1M9.9 14 7 18.1M8.6 10 3.8 8.4',
  gift: 'M4 11h16v10H4V11Zm-1-4h18v4H3V7Zm9 0v14M12 7c-1-3-6-4-6-1.5S10 7 12 7Zm0 0c1-3 6-4 6-1.5S14 7 12 7Z',
  star: 'm12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
  left: 'm15 6-6 6 6 6',
  right: 'm9 6 6 6-6 6',
  down: 'm6 9 6 6 6-6',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  news: 'M5 4h12v16H5a2 2 0 0 1-2-2V8h2m0-4v14m4-10h5m-5 4h5m-5 4h3',
} as const;

const SOLID = {
  'whatsapp-solid': 'M12 2.2a9.8 9.8 0 0 0-8.4 14.9L2.3 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm5 13.7c-.2.6-1.3 1.2-1.8 1.3-.5.1-1.1.2-3.5-.8-3-1.2-4.8-4.3-4.9-4.5-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.3.7-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.3 2.5 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 .9c.3.1.5.2.5.3.2.2.2.8-.1 1.6Z',
  apple: 'M16.4 12.6c0-2.4 2-3.6 2.1-3.7a4.6 4.6 0 0 0-3.6-1.9c-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.9a4.8 4.8 0 0 0-4.1 2.5c-1.8 3-.5 7.6 1.2 10.1.9 1.2 1.9 2.6 3.2 2.5 1.3 0 1.8-.8 3.3-.8s2 .8 3.3.8 2.2-1.2 3-2.5c1-1.4 1.4-2.8 1.4-2.9 0 0-2.9-1.1-2.9-4.1ZM14 5.4c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4Z',
  play: 'M5 3.2v17.6c0 .6.6.9 1.1.6l14.6-8.8c.5-.3.5-1 0-1.3L6.1 2.6C5.6 2.3 5 2.6 5 3.2Z',
} as const;

export type IconName = keyof typeof LINE | keyof typeof SOLID;
type Props = { name?: IconName; className?: string; size?: number };

export default function Icon({ name = 'arrow', className, size = 20 }: Props) {
  if (name in SOLID) return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={SOLID[name as keyof typeof SOLID]}/></svg>;
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={LINE[name as keyof typeof LINE]}/></svg>;
}
