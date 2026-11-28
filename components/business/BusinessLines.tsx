import Link from 'next/link';
import Icon from '@/components/Icon';
import {siteAsset} from '@/lib/asset-path';
import {businessLineIds, businessLines, type BusinessLine} from '@/lib/business-lines';
import './identity.css';
import './business-lines.css';

export function LineCover({line, heading = false}: {line: BusinessLine; heading?: boolean}) {
  const {name, label, description} = businessLines[line];
  const Title = heading ? 'h1' : 'h3';
  return <>
    <picture className="business-art">
      <source media="(max-width: 640px)" srcSet={siteAsset(`/assets/empresarial/${line}/portada-640.webp`)}/>
      <img src={siteAsset(`/assets/empresarial/${line}/portada.webp`)} width="1400" height="933" alt="" loading={heading ? 'eager' : 'lazy'} decoding="async"/>
    </picture>
    <div className="business-cover-copy">
      <span className="business-label">{label}</span>
      <Title className="business-name"><span>Línea</span> {name}</Title>
      <p className="business-description">{description}</p>
      {!heading && <span className="business-action">Ver catálogo {name} <Icon name="arrow" size={20}/></span>}
    </div>
  </>;
}

export default function BusinessLines() {
  return <section className="business-home" aria-labelledby="business-heading">
    <p className="business-eyebrow">Tony Empresarial</p>
    <h2 id="business-heading">Una imagen profesional para tu empresa.</h2>
    <div className="business-covers">{businessLineIds.map(line =>
      <Link key={line} className={`business-cover business-${line}`} href={`/empresarial/${line}`}>
        <LineCover line={line}/>
      </Link>
    )}</div>
  </section>;
}
