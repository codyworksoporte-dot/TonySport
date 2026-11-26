export const officialMockupBase = (process.env.NEXT_PUBLIC_TONY_MOCKUP_BASE || '').trim().replace(/\/+$/, '');
export const mockupEnabled = Boolean(officialMockupBase || process.env.NEXT_PUBLIC_TONY_API_BASE);
export const mockupProvider = officialMockupBase ? 'Google Gemini' : 'Google Gemini a través de Vercel AI Gateway';
