/** Official accounts supplied by Tony. Individual publications remain curated;
 * this is not an authenticated feed or a promise of automatic synchronization. */
export const TONY_CHANNELS = {
  instagram:{name:'Instagram',handle:'@tonysportswearsv',url:'https://www.instagram.com/tonysportswearsv/'},
  tiktok:{name:'TikTok',handle:'@tonysportswear',url:'https://www.tiktok.com/@tonysportswear'},
  facebook:{name:'Facebook',handle:'Tony Sportswear San Salvador',url:'https://www.facebook.com/p/Tony-Sportswear-San-Salvador-61571308625133/'},
} as const;

// Verified against the original publication on 2026-09-22; see
// docs/reference/tony-instagram-reels.json. The announced event is in the past.
export const LOURDES_PUBLICATION = {
  id:'DdJ_s3VB8RR',
  title:'Así se anunció Tony Lourdes.',
  publishedAt:'2026-09-11',
  dateLabel:'11 de septiembre de 2026',
  url:'https://www.instagram.com/tonysportswearsv/reel/DdJ_s3VB8RR/',
  embedUrl:'https://www.instagram.com/reel/DdJ_s3VB8RR/embed/',
} as const;
