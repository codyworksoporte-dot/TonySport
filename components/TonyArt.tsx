import type { CSSProperties, ImgHTMLAttributes, Ref, SVGProps } from 'react';
import { LID_FRAMES, TONY_ART, placeIn, ratioOf, viewOf, type ArtRect, type LidFrame, type TonyAsset, type TonyLid } from '@/lib/tony-art';
import { siteAsset } from '@/lib/asset-path';
import './tony-art.css';

/*
 * Tony as drawn in the brand logo. Each component shows one raster cut from the
 * logo master (lib/tony-art.ts holds the files and every measurement). Over the
 * eye sit two things CSS can move without repainting the art: the eyelid
 * (`.tf-lid`, closed at scaleY(1); `.tf-lid--right` is the eye that winks) and
 * the eye's fire (`.tf-glow`, hidden until a composition lights it).
 */

const pct = (fraction: number) => `${(fraction * 100).toFixed(3)}%`;
const SIDES = ['left', 'right'] as const;
const LIDS = TONY_ART.lids.map((lid, index) => ({ lid, frame: LID_FRAMES[index], side: SIDES[index] }));

/**
 * The asset's geometry as custom properties, for compositions that move it:
 * `--tony-ratio` (height / width), `--tony-aspect` (width / height),
 * `--tony-hinge` (transform-origin of a roar or chomp) and `--tony-eye`.
 */
export function tonyArtVars(asset: TonyAsset = TONY_ART.peek): CSSProperties {
  const hinge = placeIn(asset, TONY_ART.hinge.x, TONY_ART.hinge.y), eye = placeIn(asset, TONY_ART.eye.x, TONY_ART.eye.y);
  return {
    '--tony-ratio': ratioOf(asset).toFixed(5),
    '--tony-aspect': (1 / ratioOf(asset)).toFixed(5),
    '--tony-hinge': `${pct(hinge.x)} ${pct(hinge.y)}`,
    '--tony-eye': `${pct(eye.x)} ${pct(eye.y)}`,
  } as CSSProperties;
}

function LidShape({ lid, frame }: { lid: TonyLid; frame: LidFrame }) {
  const style = TONY_ART.lidStyle, [x, y] = frame.pivot;
  // Brings the lid, drawn where it sits on the art, level into its own frame.
  return <g transform={`rotate(${-frame.tilt} ${x} ${y})`}>
    <path d={lid.d} fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth} strokeLinejoin="round"/>
    {lid.shine && <path d={lid.shine} fill={style.shine}/>}
  </g>;
}

/** A lid over an HTML image: a box turned to the eye's slant, the lid inside it drops from the box's top. */
function LidBox({ lid, frame, side, view }: { lid: TonyLid | null; frame: LidFrame | null; side: 'left' | 'right'; view: ArtRect }) {
  if (!lid || !frame) return <span className="tf-lid-frame tf-lid-frame--absent"><span className={`tf-lid tf-lid--${side}`}/></span>;
  const { box } = frame;
  return <span className="tf-lid-frame" style={{
    left: pct((frame.cx - frame.width / 2 - view.x) / view.width),
    top: pct((frame.cy - frame.height / 2 - view.y) / view.height),
    width: pct(frame.width / view.width),
    height: pct(frame.height / view.height),
    rotate: `${frame.tilt}deg`,
  }}>
    <span className={`tf-lid tf-lid--${side}`}>
      <svg viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} preserveAspectRatio="none" focusable="false"><LidShape lid={lid} frame={frame}/></svg>
    </span>
  </span>;
}

type ImgExtras = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes' | 'alt' | 'width' | 'height'> & { [data: `data-${string}`]: string | undefined };
export type TonyArtProps = {
  className?: string;
  /** `sizes` for assets with lighter versions (the badge). */
  sizes?: string;
  /** Classes for the layer holding the glow and the lids, which moves with the eye. */
  eyesClassName?: string;
  imgRef?: Ref<HTMLImageElement>;
  imgProps?: ImgExtras;
};

function TonyArtImage({ asset, className = '', sizes, eyesClassName = '', imgRef, imgProps = {} }: TonyArtProps & { asset: TonyAsset }) {
  const view = viewOf(asset), frame = asset.frame;
  const eye = placeIn(asset, TONY_ART.eye.x, TONY_ART.eye.y), radius = TONY_ART.eye.radius;
  const srcSet = asset.smaller?.length ? [...asset.smaller.map(file => `${siteAsset(file.src)} ${file.width}w`), `${siteAsset(asset.src)} ${asset.width}w`].join(', ') : undefined;
  const { style: imgStyle, ...imgRest } = imgProps;
  // Sides where the crop cuts through the drawing fade out instead of ending in a hard line.
  const across = (x: number) => pct((x - frame.x) / frame.width);
  const fade = asset.fade && (asset.fade.left || asset.fade.right)
    ? `linear-gradient(90deg,transparent ${across(view.x)},#000 ${across(view.x + (asset.fade.left ?? 0) * view.width)},#000 ${across(view.x + (1 - (asset.fade.right ?? 0)) * view.width)},transparent ${across(view.x + view.width)})`
    : undefined;
  return <span className={`tony-art ${className}`} aria-hidden="true" style={{ aspectRatio: `${view.width} / ${view.height}`, ...tonyArtVars(asset) }}>
    <img ref={imgRef} src={siteAsset(asset.src)} srcSet={srcSet} sizes={srcSet ? sizes ?? '100vw' : undefined} alt="" width={asset.width} height={asset.height} draggable={false} decoding="async" {...imgRest} style={{
      left: pct((frame.x - view.x) / view.width),
      top: pct((frame.y - view.y) / view.height),
      width: pct(frame.width / view.width),
      height: pct(frame.height / view.height),
      maskImage: fade,
      WebkitMaskImage: fade,
      ...imgStyle,
    }}/>
    <span className={`tf-eyes ${eyesClassName}`}>
      <span className="tf-glow" style={{
        left: pct(eye.x - radius / view.width),
        top: pct(eye.y - radius / view.height),
        width: pct(radius * 2 / view.width),
        height: pct(radius * 2 / view.height),
      }}/>
      {LIDS.map(({ lid, frame: lidFrame, side }) => <LidBox key={side} lid={lid} frame={lidFrame} side={side} view={view}/>)}
    </span>
  </span>;
}

/** Head, arms and claws rising over an edge: the box's bottom is the shield's edge. */
export function TonyFace({ className = '', ...props }: TonyArtProps) {
  return <TonyArtImage asset={TONY_ART.peek} className={`tony-face ${className}`} {...props}/>;
}

/** The complete logo: crocodile, claws, shield and lettering. */
export function TonyBadge({ className = '', ...props }: TonyArtProps) {
  return <TonyArtImage asset={TONY_ART.badge} className={`tony-badge ${className}`} {...props}/>;
}

/** Close-up of the head, cut at the same edge. */
export function TonyHead({ className = '', ...props }: TonyArtProps) {
  return <TonyArtImage asset={TONY_ART.head} className={`tony-head ${className}`} {...props}/>;
}

/** The lids for an SVG drawn in master pixels (the badge's own units). */
export function TonyLidsInSvg() {
  return <>{LIDS.map(({ lid, frame, side }) => lid && frame
    ? <g key={side} transform={`rotate(${frame.tilt} ${frame.pivot[0]} ${frame.pivot[1]})`}><g className={`tf-lid tf-lid--${side}`}><LidShape lid={lid} frame={frame}/></g></g>
    : <g key={side} className={`tf-lid tf-lid--${side}`} visibility="hidden"/>)}</>;
}

/** The peeking head placed inside another SVG drawing; its user units are master pixels. */
export function TonyFaceInSvg({ className = '', ...box }: SVGProps<SVGSVGElement>) {
  const asset = TONY_ART.peek, view = viewOf(asset);
  return <svg {...box} className={`tony-face ${className}`} viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} overflow="hidden" aria-hidden="true" focusable="false">
    <image href={siteAsset(asset.src)} x={asset.frame.x} y={asset.frame.y} width={asset.frame.width} height={asset.frame.height}/>
    <TonyLidsInSvg/>
  </svg>;
}

/**
 * @deprecated Tony's claws are part of every logo asset now (they grip the
 * shield in the badge and the edge in TonyFace). Kept so older imports build;
 * it draws nothing.
 */
export function TonyClaw(props: { className?: string; flip?: boolean }) { void props; return null; }

/** @deprecated See TonyClaw: draws nothing. */
export function TonyClawInSvg(props: SVGProps<SVGSVGElement> & { flip?: boolean }) { void props; return null; }
