import Link from 'next/link';
import Icon from '@/components/Icon';
import WarmImages from '@/components/media/WarmImages';
import { leadTilePhotos } from '@/components/product/discipline-photos';
import { siteAsset } from '@/lib/asset-path';
import { fitted } from '@/lib/responsive-image';
import { DISCIPLINES, DISCIPLINES_TITLE, disciplineHref } from '@/lib/disciplines';

const MARQUEE_COPIES = [0, 1, 2, 3];
const CHIP_WIDTH = 240;
const PRODUCT_LEAD_PHOTOS = leadTilePhotos();

export default function HomeDisciplines() {
  return <section className="tc-sec home-sec" aria-labelledby="home-disciplinas">
    <div className="tc-sec-h home-sec-h">
      <h2 id="home-disciplinas">{DISCIPLINES_TITLE}</h2>
      <Link href="/producto">Ver todas<span className="tc-sr"> las disciplinas</span><Icon name="arrow" size={18}/></Link>
    </div>
    <WarmImages watch="home-disciplinas" images={PRODUCT_LEAD_PHOTOS}/>
    {/* Two rows in motion: the top one drifts right, the bottom one left. Each track repeats its row
        (copies are aria-hidden and out of the tab order) and shifts by exactly one copy, so the loop is seamless. */}
    {/* data-ahead: the marquees clip their chips, so PicturesAhead readies them all as the section comes near. */}
    <div className="home-chips-rows" data-ahead="">
      {[DISCIPLINES.slice(0, 7), DISCIPLINES.slice(7)].map((row, rowIndex) => {
        const chips = [...row.map(line => ({key: line.id, line})), ...(rowIndex === 1 ? [{key: 'all', line: null}] : [])];
        return <div key={rowIndex} className="home-marquee" data-dir={rowIndex === 0 ? 'right' : 'left'}>
          <ul className="home-marquee-track" role="list">
            {MARQUEE_COPIES.flatMap(copy => chips.map(({key, line}) => {
              const copyProps = copy ? {tabIndex: -1} : {};
              if (!line) return <li key={`${copy}-${key}`} aria-hidden={copy ? true : undefined} data-copy={copy || undefined}>
                <Link className="home-chip home-chip--all" href="/producto" {...copyProps}>
                  <span className="home-chip-ring"><span className="home-chip-photo home-chip-all"><Icon name="grid" size={30}/></span></span>
                  <span className="home-chip-name">Ver todas<span className="tc-sr"> las disciplinas</span></span>
                </Link>
              </li>;
              return <li key={`${copy}-${key}`} aria-hidden={copy ? true : undefined} data-copy={copy || undefined}>
                <Link className="home-chip" href={disciplineHref(line.id)} {...copyProps}>
                  <span className="home-chip-ring"><span className="home-chip-photo"><img src={siteAsset(fitted(line.image, CHIP_WIDTH))} alt="" width={CHIP_WIDTH} height={CHIP_WIDTH} loading="lazy" decoding="async"/></span></span>
                  <span className="home-chip-name">{line.name}</span>
                </Link>
              </li>;
            }))}
          </ul>
        </div>;
      })}
    </div>
  </section>;
}
