/**
 * Tony, the brand crocodile, as data. Every drawing of him on the site is one of
 * the raster files below, all cut from one master illustration (the client's
 * logo "opción C": the crocodile in profile, jaws open, over the shield). Every
 * position (eye, eyelid, jaw hinge, the edge he peeks over) is measured once in
 * master pixels, so switching to another logo option means new files and new
 * numbers here, nothing else.
 */

/** A rectangle in master pixels. */
export type ArtRect = { x: number; y: number; width: number; height: number };

export type TonyAsset = {
  /** Public path; components pass it through siteAsset() for the basePath. */
  src: `/assets/${string}`;
  /** Natural size of the file. */
  width: number;
  height: number;
  /** The part of the master the file shows. It may reach past the master into transparent padding. */
  frame: ArtRect;
  /** The part of the frame a composition displays, when smaller: the art is cut flat along its bottom edge. */
  view?: ArtRect;
  /** Lighter versions of the same frame, for `srcset`. */
  smaller?: readonly { src: `/assets/${string}`; width: number }[];
  /** Fractions of the view's width faded out at each side, where the crop cuts through the drawing. */
  fade?: { left?: number; right?: number };
};

/**
 * An eyelid: a closed outline over the eye in master pixels (absolute M/L/C/Z
 * with x,y pairs only, so the numbers read as points), plus the angle of the
 * eye, so the lid drops from the brow along the eye instead of straight down.
 */
export type TonyLid = { d: string; shine?: string; tilt: number };

export const TONY_MASTER = { width: 1898, height: 1707 } as const;

/** Top of the shield's orange border: the edge he peeks over. */
const EDGE = 700;

const BADGE_FRAME: ArtRect = { x: 0, y: 0, width: TONY_MASTER.width, height: TONY_MASTER.height };

export const TONY_ART = {
  /** The complete logo: crocodile, claws, shield and lettering. */
  badge: {
    src: '/assets/brand/tony-logo.webp', width: 1200, height: 1079, frame: BADGE_FRAME,
    smaller: [{ src: '/assets/brand/tony-logo-480.webp', width: 480 }],
  },
  /** Head, arms and claws above the shield, cut at the shield's edge. */
  peek: {
    src: '/assets/brand/tony-peek.webp', width: 900, height: 342,
    frame: { x: 0, y: 0, width: 1898, height: 722 },
    view: { x: 0, y: 0, width: 1898, height: EDGE },
  },
  /** Close-up of the head, square, cut at the same edge. It keeps the whole snout outline; the neck side and the shoulder corner fade. */
  head: {
    src: '/assets/brand/tony-head.webp', width: 512, height: 512,
    frame: { x: 740, y: -120, width: 960, height: 960 },
    view: { x: 740, y: -120, width: 960, height: EDGE + 120 },
    fade: { left: .24, right: .04 },
  },
  /** Centre of the iris, where the eye glows, and the glow's radius. */
  eye: { x: 1106, y: 172, radius: 108 },
  /** Where the jaws meet: a roar or a chomp turns the head around this point. */
  hinge: { x: 1000, y: 420 },
  /**
   * Viewer's left and right eyelid. The profile shows a single eye, the right
   * one (the lid that winks); `null` keeps the other lid element in place, unseen.
   */
  lids: [
    null,
    {
      d: 'M1082.4 122.8L1163.7 192.3L1163.4 197.3C1150.4 203.3 1127.4 208.6 1105.1 204C1094.9 200.5 1079 188.3 1073.1 176.7C1066.4 163.1 1063.6 146.3 1071.1 132.9Z',
      shine: 'M1084.4 131.1L1156.7 192.8C1145.4 193.7 1124.8 184 1105.7 166.4C1091.1 152.6 1083.8 141.1 1084.4 131.1Z',
      tilt: 40.5,
    },
  ] as readonly [TonyLid | null, TonyLid | null],
  /** Lid skin sampled around the eye; outline as dark as the drawing's. */
  lidStyle: { fill: '#19801a', shine: '#2f9f22', stroke: '#031005', strokeWidth: 3.5 },
} as const satisfies {
  badge: TonyAsset; peek: TonyAsset; head: TonyAsset;
  eye: { x: number; y: number; radius: number }; hinge: { x: number; y: number };
  lids: readonly [TonyLid | null, TonyLid | null];
  lidStyle: { fill: string; shine: string; stroke: string; strokeWidth: number };
};

export const viewOf = (asset: TonyAsset): ArtRect => asset.view ?? asset.frame;
/** Height over width of what a composition shows of the asset. */
export const ratioOf = (asset: TonyAsset) => viewOf(asset).height / viewOf(asset).width;
/** A master point as fractions of the asset's view (0..1 across, 0..1 down). */
export function placeIn(asset: TonyAsset, x: number, y: number) {
  const view = viewOf(asset);
  return { x: (x - view.x) / view.width, y: (y - view.y) / view.height };
}

/** The head's own units, kept for older importers: master pixels over the peek view. */
export const TONY_HEAD = { width: TONY_ART.peek.view.width, height: TONY_ART.peek.view.height } as const;
/** The lid outlines alone; an empty string stands for an eye the art does not show. */
export const TONY_EYES = TONY_ART.lids.map(lid => lid?.d ?? '') as readonly string[];

/** A lid laid out level in its own frame: the box it fills before the frame turns by `tilt` around (cx, cy). */
export type LidFrame = { cx: number; cy: number; width: number; height: number; tilt: number; pivot: readonly [number, number]; box: ArtRect };

function points(d: string): [number, number][] {
  const numbers = d.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  const pairs: [number, number][] = [];
  for (let index = 0; index + 1 < numbers.length; index += 2) pairs.push([numbers[index], numbers[index + 1]]);
  return pairs;
}

/**
 * Where an eyelid sits. Returns null for a missing, repeated or degenerate lid
 * (fewer than three points, no area), which components keep in place but hidden.
 */
export function lidFrame(lid: TonyLid | null | undefined, pad: number = TONY_ART.lidStyle.strokeWidth / 2): LidFrame | null {
  const pairs = lid?.d ? points(lid.d) : [];
  if (!lid || pairs.length < 3) return null;
  const pivot = [pairs.reduce((sum, [x]) => sum + x, 0) / pairs.length, pairs.reduce((sum, [, y]) => sum + y, 0) / pairs.length] as const;
  const turn = (x: number, y: number, degrees: number) => {
    const angle = degrees * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle), dx = x - pivot[0], dy = y - pivot[1];
    return [pivot[0] + dx * cos - dy * sin, pivot[1] + dx * sin + dy * cos] as const;
  };
  const level = pairs.map(([x, y]) => turn(x, y, -lid.tilt));
  const xs = level.map(([x]) => x), ys = level.map(([, y]) => y);
  const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
  const width = Math.max(...xs) + pad - x, height = Math.max(...ys) + pad - y;
  if (!(width > pad * 2 + .5 && height > pad * 2 + .5)) return null;
  const [cx, cy] = turn(x + width / 2, y + height / 2, lid.tilt);
  return { cx, cy, width, height, tilt: lid.tilt, pivot, box: { x, y, width, height } };
}

/** Both lids laid out; the left one is dropped when it repeats the right one, so one eye never gets two lids. */
export const LID_FRAMES = TONY_ART.lids.map((lid, index) =>
  index === 0 && lid && lid.d === TONY_ART.lids[1]?.d ? null : lidFrame(lid)) as readonly (LidFrame | null)[];
