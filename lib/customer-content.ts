// Only publish records supplied and approved by Tony. Empty is intentional:
// saving a design or opening WhatsApp is not evidence of a completed purchase.
export type PublishedReview = {id:string;alias:string;rating:1|2|3|4|5;text:string;date:string;sourceUrl?:string};
export const PUBLISHED_REVIEWS:PublishedReview[]=[];

export const SOCIAL_COUNTS = [
  {network:'instagram',display:'152',label:'seguidores',approximate:false},
  {network:'tiktok',display:'29,3 mil',label:'seguidores',approximate:true},
  {network:'facebook',display:'1.194',label:'seguidores',approximate:false},
] as const;
export const SOCIAL_VERIFIED_DATE='2026-09-23';
