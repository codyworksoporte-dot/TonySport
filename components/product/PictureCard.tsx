import Link from 'next/link';
import Icon from '@/components/Icon';
import LeadImage from '@/components/media/LeadImage';
import {responsive} from '@/lib/responsive-image';
import {imageFocus} from '@/lib/product-menu';
import {businessLineIds} from '@/lib/business-lines';
import '@/components/business/identity.css';

type Props = {
  id?:string;
  name:string;
  image:`/assets/${string}`;
  href:string;
  /** page: a page of this site · whatsapp: a chat with Tony · external: the official store (new tab). */
  kind:'page'|'whatsapp'|'external';
  /** Accessible name for external cards (e.g. "<name> en la tienda oficial de Tony"). */
  label?:string;
  /**
   * The card is in the first row the page shows: its picture loads at once (the rest wait until they near the screen).
   * 'high' only for the page's LCP picture; 'auto' for the others, so they do not compete with it and the CSS.
   */
  priority?:false|'high'|'auto';
};

/** A product option as a picture and its name. Nothing else. */
export default function PictureCard({id,name,image,href,kind,label,priority=false}:Props){
  const photo={...responsive(image,'(max-width: 599px) 48vw, (max-width: 1000px) 32vw, 440px'),alt:'',width:440,height:440,decoding:'async' as const,style:imageFocus(image)};
  const body=<>
    <span className="tc-card-media">{priority?<LeadImage {...photo} fetchPriority={priority}/>:<img {...photo} loading="lazy"/>}</span>
    <span className="tc-card-name"><span>{name.replace(/N\.º /g,'N.º ')}</span><Icon name={kind==='page'?'arrow':kind==='whatsapp'?'whatsapp':'diagonal'}/></span>
  </>;
  if(kind==='page'){
    const line = businessLineIds.find(line => href === '/empresarial/' + line);
    return <Link id={id} href={href} className={`tc-card pd-card${line ? ' business-' + line : ''}`}>{body}</Link>;
  }
  return <a id={id} href={href} className="tc-card pd-card" target="_blank" rel="noopener noreferrer" aria-label={label}>
    {body}{kind==='whatsapp'&&<span className="tc-sr"> · consultar por WhatsApp (se abre en otra pestaña)</span>}
  </a>;
}
