import categories from '@/data/collection-categories.json';
import {SPORT_LINES} from './lines';
import {PRODUCT_CATEGORIES, productHref} from './products';

export const company = [['/nosotros','Nuestra historia','De El Salvador, con identidad.'],['/patrocinio','Patrocinios','Proyectos que comparten nuestra pasión.'],['/comunidad','Comunidad, App y TonyPlay','Conexión, responsabilidad social y lo que viene.']];
export const customer = [['/tiendas','Tiendas','Encuentra la sucursal más cercana.'],['/contacto','Contacto','Conversemos sobre lo que necesitas.'],['/entregas','Entregas','Domicilio y retiro en sucursal.'],['/calidad','Calidad y confección','Telas, técnicas y acabados.'],['/actualidad','Guías y novedades','Información para preparar tu pedido.'],['/resenas','Reseñas','La experiencia de nuestra comunidad.'],['/recientes','Recientes','Consulta tus pedidos recientes.'],['/cuenta','Mi cuenta','Iniciar sesión, registro y contraseña.']];
export type DirectoryEntry = {href:string;label:string;group:string;terms:string};
const entries: DirectoryEntry[] = [
  {href:'/',label:'Inicio',group:'EXPLORAR TONY',terms:'pagina principal portada'},
  {href:'/configurador',label:'Crea tu uniforme',group:'PERSONALIZACIÓN',terms:'pedido editor cantidad jugadores nombre numero dorsal talla escudo diseño camiseta camisa agregar imagen ia'},
  {href:'/carrito',label:'Mi carrito',group:'PEDIDOS Y CUENTA',terms:'compras pedido uniforme guardado cotizar pagar'},
  {href:'/catalogo',label:'70 diseños para personalizar',group:'PRODUCTO',terms:'catalogo modelos frontal dorsal editor'},
  {href:'/colecciones',label:'Todas las colecciones y uniformes',group:'PRODUCTO',terms:'catalogo completo mundial anime camisetas ropa prendas'},
  {href:'/producto',label:'Producto',group:'LÍNEAS Y CONFECCIÓN',terms:'deportes empresas ropa productos'},
  {href:'/tony-news',label:'Tony News',group:'EN NUESTRAS REDES',terms:'noticias videos publicaciones tiktok instagram facebook motorcycle cycling pro'},
  {href:'#contactos',label:'Contactos · WhatsApp y correo',group:'AYUDA',terms:'telefono informacion email whatsapp 7015 5571'},
  {href:'/#como-funciona',label:'Cómo crear un pedido',group:'AYUDA',terms:'pasos guia asesor ayuda funcionamiento'},
  {href:'/#tutorial',label:'Tutorial del configurador',group:'AYUDA',terms:'video aprender como usar editor'},
  {href:'/#preguntas',label:'Preguntas frecuentes',group:'AYUDA',terms:'faq dudas respuestas'},
  {href:'/comunidad#app-tony',label:'App Tony · Puntos y recompensas',group:'SOMOS TONY',terms:'descargar android ios aplicacion fidelidad premios'},
  {href:'/comunidad#tonyplay',label:'TonyPlay · Conoce el proyecto',group:'SOMOS TONY',terms:'juego en desarrollo'},
  {href:'/actualidad#guias',label:'Guías para elegir tu uniforme',group:'AYUDA',terms:'material cuidados tallas nombres dorsales'},
  {href:'/cuenta?accion=recuperar',label:'Recuperar contraseña',group:'PEDIDOS Y CUENTA',terms:'olvide clave acceso correo restablecer'},
  {href:'/cuenta?accion=registro',label:'Crear mi cuenta',group:'PEDIDOS Y CUENTA',terms:'registro registrarse email correo verificar'},
  {href:'/cuenta?accion=cambiar',label:'Cambiar mi contraseña',group:'PEDIDOS Y CUENTA',terms:'seguridad clave cuenta'},
  ...SPORT_LINES.map(({id,name})=>({href:`/producto#${id}`,label:name,group:'EXPLORAR LÍNEAS',terms:`uniformes ${id}`})),
  ...PRODUCT_CATEGORIES.flatMap(category=>[
    {href:productHref(category),label:category.label,group:'CATEGORÍAS DE PRODUCTO',terms:category.children.map(child=>child.label).join(' ')},
    ...category.children.map(child=>{
      const collection=categories.find(item=>child.sourceHref.split('/').filter(Boolean).at(-1)===item.slug);
      return {href:collection?`/colecciones?categoria=${encodeURIComponent(collection.slug)}`:`/producto#opcion-${child.id}`,label:child.label,group:'OPCIONES DE CONFECCIÓN',terms:category.label};
    }),
  ]),
  ...categories.map(category=>({href:`/colecciones?categoria=${encodeURIComponent(category.slug)}`,label:category.name,group:'COLECCIONES OFICIALES',terms:`uniformes catalogo imagenes ${category.slug}`})),
  ...company.map(([href,label,terms])=>({href,label,terms,group:'SOMOS TONY'})),
  ...customer.map(([href,label,terms])=>({href,label,terms:`${terms} ${href==='/tiendas'?'sucursales ubicaciones direcciones horarios':href==='/calidad'?'materiales sublimado bordado estampado':href==='/contacto'?'whatsapp correo telefono ayuda':''}`,group:'PARA TI'})),
  {href:'/privacidad',label:'Privacidad y uso de tus datos',group:'INFORMACIÓN',terms:'politica datos personales condiciones'},
];
// A recovered album and its old menu option now share one direct destination.
export const SITE_DIRECTORY = Array.from(new Map(entries.map(item=>[item.href,item])).values());
