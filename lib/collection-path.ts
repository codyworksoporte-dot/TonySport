export const collectionHref = (slug: string) => '/colecciones/' + encodeURIComponent(slug);
export const sourceSlug = (href: string) => href.split('/').filter(Boolean).at(-1)!;
export const albumHref = (id: number) => collectionHref('album-' + id);
