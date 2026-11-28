import {notFound} from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import CategoryTitle from '@/components/product/CategoryTitle';
import PictureCard from '@/components/product/PictureCard';
import {IMPLEMENT_FAMILIES,implementsOf} from '@/lib/implements';
import '@/components/product/product.css';
import '../implementos.css';

type Props = {params:Promise<{familia:string}>};
export const generateStaticParams = () => IMPLEMENT_FAMILIES.map(family=>({familia:family.id}));

export async function generateMetadata({params}:Props) {
  const {familia} = await params;
  return {title:IMPLEMENT_FAMILIES.find(item=>item.id===familia)?.name};
}

export default async function Family({params}:Props) {
  const {familia} = await params;
  const family = IMPLEMENT_FAMILIES.find(item=>item.id===familia);
  if (!family) notFound();
  return <main id="contenido" className="tc-page im-page"><div className="tc-wrap">
    <header className="tc-head"><Link className="tc-back" href="/implementos"><Icon name="left"/>Familias de implementos</Link><h1><CategoryTitle title={family.name}/></h1></header>
    <ul className="tc-cards pd-cards" role="list">{implementsOf(familia).map((product,index)=><li key={product.id}>
      <PictureCard name={product.name} image={product.image} href={product.href} kind="external" label={product.name+' en la tienda oficial de Tony'} priority={index===0?'high':false}/>
    </li>)}</ul>
  </div></main>;
}
