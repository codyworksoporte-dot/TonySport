import Link from 'next/link';
import Icon from '@/components/Icon';
import {siteAsset} from '@/lib/asset-path';
import {imageFocus} from '@/lib/product-menu';

type Props = {
  id?:string;
  name:string;
  image:`/assets/${string}`;
  href:string;
  /** page: a page of this site · whatsapp: a chat with Tony · external: the official store (new tab). */
  kind:'page'|'whatsapp'|'external';
  /** Accessible name for external cards (e.g. "<name> en la tienda oficial de Tony"). */
  label?:string;
};

/** A product option as a picture and its name. Nothing else. */
export default function PictureCard({id,name,image,href,kind,label}:Props){
  const body=<>
    <span className="tc-card-media"><img src={siteAsset(image)} alt="" width={440} height={440} loading="lazy" decoding="async" style={imageFocus(image)}/></span>
    <span className="tc-card-name"><span>{name.replace(/N\.º /g,'N.º ')}</span><Icon name={kind==='page'?'arrow':kind==='whatsapp'?'whatsapp':'diagonal'}/></span>
  </>;
  if(kind==='page')return <Link id={id} href={href} className="tc-card pd-card">{body}</Link>;
  return <a id={id} href={href} className="tc-card pd-card" target="_blank" rel="noopener noreferrer" aria-label={label}>
    {body}{kind==='whatsapp'&&<span className="tc-sr"> · consultar por WhatsApp (se abre en otra pestaña)</span>}
  </a>;
}
