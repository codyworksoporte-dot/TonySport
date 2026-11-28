import {siteAsset} from './asset-path';

// Numbers follow the order of the 102 photographs in Tony's original RSE album.
export const RSE_SOURCE = 'https://www.tonysportselsalvador.com/producto/responsabilidad-social-empresarial/';
const groups = {
  'Equipos': [
    [2,'Plantilla de blanco con su portero en la cancha'],[4,'Equipo de negro formado antes del partido'],
    [5,'Equipo de rojo en la cancha iluminada'],[6,'Jugadores de negro y verde en dos filas'],
    [7,'Plantilla de azul oscuro bajo los reflectores'],[8,'Equipo de blanco frente al arco'],
    [9,'Plantilla de camiseta estampada al pie de la portería'],[10,'Equipo de franja roja posando para la foto'],
    [11,'Plantilla de verde y blanco en formación'],[12,'Jugadores de rojo y negro en la jornada nocturna'],
    [13,'Plantilla de blanco junto al guardameta de rojo'],[14,'Equipo de granate en dos filas'],
    [15,'Plantilla de azul junto al área'],[16,'Equipo de celeste en la cancha sintética'],
    [20,'Foto de equipo con camiseta roja'],[21,'Jugadores de azul y amarillo en la cancha'],
    [22,'Jugadores con uniforme naranja y negro'],[23,'Equipo de amarillo reunido en la cancha'],
    [24,'Equipo de camisetas blancas en formación'],[25,'Jugadores de negro con su guardameta'],
    [26,'Equipo de rojo posando de noche'],[27,'Plantilla con camiseta amarilla y negra'],
    [28,'Plantilla de azul al borde del área'],[29,'Equipo de franjas horizontales en dos filas'],
    [30,'Foto de grupo del equipo de rojo'],[54,'Equipo de celeste antes del partido'],
    [60,'Equipo de verde y negro en formación'],[78,'Tres jugadores reunidos tras el encuentro'],
    [79,'Dos jugadores y un acompañante posan en el campo'],
    [86,'Grupo de futbolistas frente al centro de rendimiento'],[87,'Dos participantes durante un encuentro deportivo'],
  ],
  'En la cancha': [
    [3,'Un jugador de naranja encara a su rival con el balón'],[17,'Dos jugadores esperan durante el partido'],
    [18,'Un jugador de amarillo se prepara para el saque'],[19,'Jugador de negro controla la pelota'],
    [31,'Detalle del dorsal y la camiseta de un futbolista'],[32,'Jugador de blanco avanza con el balón'],
    [33,'Guardameta frente al arco de la cancha'],[34,'Disputa de la pelota entre dos jugadores'],
    [35,'Un jugador conduce el balón ante la banca'],[36,'Dos futbolistas disputan el pase'],
    [37,'Jugador con el dorsal diez visto de espaldas'],[49,'Jugador con peto verde durante el calentamiento'],
    [51,'Disputa del balón cerca de la banda'],[53,'Los jugadores se reúnen detrás de la malla'],
    [56,'Jugadores sobre el césped después de una jugada'],[57,'Jugadores de celeste junto al arco'],
    [58,'El equipo llega a la cancha entre luces y humo'],[59,'Futbolistas de verde disputan la pelota'],
    [61,'Un jugador se prepara para controlar el balón'],[62,'Jugadora y árbitro durante el encuentro'],
    [63,'Jugador de negro y dorado en el estadio'],[64,'Tres jugadores se disputan la posesión'],
    [65,'Jugador de blanco saluda al público'],[66,'Jugador conversa con la prensa al borde del campo'],
    [67,'Futbolista de blanco junto a los medios'],[68,'Jugador de blanco observa desde el césped'],
    [69,'Jugada frente a la línea lateral'],[70,'Participantes al borde de la pista del estadio'],
    [71,'Dos jugadores encaran el balón'],[72,'El cuerpo técnico camina por la pista'],
    [73,'Avance de los jugadores vestidos de blanco'],[74,'Los jugadores disputan la posesión en el estadio'],
    [75,'Jugador con peto rojo junto a la malla'],[76,'Grupo en la pista junto a la cancha'],
    [77,'Futbolista de blanco controla el balón'],[80,'Jugador prepara el remate'],
    [81,'Jugador con el dorsal veintitrés frente a su rival'],[82,'Acción de juego delante de la portería'],
    [85,'Guardameta de verde dentro del área'],[94,'Dos jugadores disputan el balón junto al arco'],
    [95,'Futbolista de azul recibe un pase'],[96,'Guardameta vestido de negro en su portería'],
    [97,'Futbolista de negro conduce el balón'],[98,'Jugador de naranja controla la pelota'],
    [99,'Jugador de celeste al borde de la cancha'],[100,'Dos rivales disputan el balón'],
    [101,'Jugador de granate con la pelota'],[102,'Jugador con el dorsal veintiocho cerca de la banda'],
  ],
  'Boxeo': [
    [40,'Boxeador en el cuadrilátero'],[41,'Dos boxeadores con guantes y protectores en combate'],
    [42,'Deportistas y acompañantes junto al ring'],[43,'Boxeador de azul con casco y guantes'],
    [44,'Boxeador con su cinturón tras el combate'],[45,'Deportista en el pasillo del recinto'],
    [46,'Grupo reunido después de la pelea'],[47,'Equipo en una esquina del cuadrilátero'],
    [48,'Deportista en el recinto de boxeo'],
  ],
  'Premiaciones': [
    [1,'Trofeos de la jornada con la insignia de Tony'],[38,'Equipo posa con su premio al finalizar el torneo'],
    [39,'Mesa de trofeos y premio del campeonato'],[50,'Trofeo con los colores de Tony'],
    [52,'Detalle de las copas del torneo'],[55,'Premio y trofeos preparados junto a la cancha'],
    [83,'Equipo campeón celebra con su premio'],[84,'Cartel de los campeones en la cancha'],
    [88,'Reconocimiento al portero menos vencido'],[89,'Equipo posando en el cartel de premiación'],
    [90,'El equipo levanta los brazos durante la premiación'],[91,'Jugadores celebran con el premio'],
    [92,'Equipo sostiene el reconocimiento del campeonato'],[93,'Jugadores con las medallas y el premio del torneo'],
  ],
} satisfies Record<string, [number, string][]>;

export type RseCategory = keyof typeof groups;
export const RSE_CATEGORIES = Object.keys(groups) as RseCategory[];
export const RSE_PHOTOS = RSE_CATEGORIES.flatMap(category =>
  groups[category].map(([id, alt]) => ({id, alt, category}))
).sort((a, b) => a.id - b.id);

export function rseImage(id: number, thumbnail = false) {
  return siteAsset(`/assets/rse/${String(id).padStart(3, '0')}${thumbnail ? '-420' : ''}.webp`);
}
