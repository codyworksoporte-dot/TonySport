// One home for every contact number and outside link the redesigned site uses.
export const TONY_WHATSAPP_NUMBER = '7015 5571';
export const TONY_WHATSAPP_DISPLAY = '7015-5571';
export const TONY_WHATSAPP = 'https://wa.me/50370155571';
export const whatsappLink = (message: string) => `${TONY_WHATSAPP}?text=${encodeURIComponent(message)}`;
export const HELP_WHATSAPP = whatsappLink('Hola, Tony. Necesito ayuda.');
export const TONY_EMAIL = 'info@tonysportselsalvador.com';

// The order lookup lives on the official system. A shorter address can replace it once the stack changes.
export const ORDER_LOOKUP_URL = 'https://www.tonysportselsalvador.com/sistema/consulta_ts/';

export const APP_TONY = {
  android: 'https://play.google.com/store/apps/details?id=com.tonysports.customer',
  ios: 'https://apps.apple.com/us/app/tony/id1528399939',
  page: 'https://www.tonysportselsalvador.com/app-tony/',
} as const;

export const TONY_FACEBOOK = 'https://www.facebook.com/p/Tony-Sportswear-San-Salvador-61571308625133/';
export const OFFICIAL_SITE = 'https://www.tonysportselsalvador.com/';
