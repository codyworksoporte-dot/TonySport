type Props = { name?: 'arrow'|'diagonal'|'menu'|'close'|'search'|'check'|'whatsapp'|'plus'|'shield'|'pin'; className?: string };
export default function Icon({ name = 'arrow', className }: Props) {
  const paths = { arrow: 'M4 12h16m-6-6 6 6-6 6', diagonal: 'M6 18 18 6M6 6h12v12', menu: 'M3 6h18M3 12h18M3 18h18', close: 'm6 6 12 12M6 18 18 6', search: 'm16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', check:'m5 12 4 4L19 6', whatsapp:'M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.7-4.5A9 9 0 1 1 21 11.5ZM8 7c0 5 4 9 9 9l1-3-3-1-1 2-4-4 2-1-1-3Z', plus:'M12 5v14M5 12h14', shield:'m12 2 9 4v7c0 5-9 9-9 9s-9-4-9-9V6l9-4Z',pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' };
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
