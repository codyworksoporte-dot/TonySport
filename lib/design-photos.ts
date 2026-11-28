export type Album = {id: number; name: string; href: string; imageCount: number; cover: string | null; categories?: string[]};
export type Photo = {src: string; preview: string; label: string};
export type Design = {photo: Photo; albumId: number; number: number};
export const DESIGN_BATCH = 16;

/** Read only the albums intersecting this batch, preserving the catalogue order. */
export async function designBatch(albums: Album[], offset: number, read: (id: number) => Promise<Photo[]>): Promise<Design[]> {
  let start = 0;
  const batches: Promise<Design[]>[] = [];
  for (const album of albums) {
    const from = Math.max(0, offset - start);
    const to = Math.min(album.imageCount, offset + DESIGN_BATCH - start);
    if (from < to) {
      batches.push(read(album.id).then(images => images.slice(from, to).map((photo, i) => ({photo, albumId: album.id, number: from + i + 1}))));
    }
    start += album.imageCount;
    if (start >= offset + DESIGN_BATCH) break;
  }
  return (await Promise.all(batches)).flat();
}
