import type {MetadataRoute} from 'next';
// La versión local no debe indexarse antes de definir dominio y contenido final.
export const dynamic='force-static';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',disallow:'/'}}}
