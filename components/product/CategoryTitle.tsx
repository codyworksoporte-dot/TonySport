// Only published category labels have an editorial emphasis. Album and product names
// can come from the catalogue, so an unrecognised title stays exactly as written.
const phrases = [
  ['Escoge tu', 'disciplina deportiva'],
  ['Camisas', 'y polos'],
  ['Logos', '3D'],
  ['Uniformes', 'de fútbol'],
  ['Implementos', 'deportivos'],
  ['Balones', 'de fútbol'],
  ['Fútbol', 'sala'],
  ['Guantes', 'de portero'],
  ['Diseños del', 'Mundial 2026'],
  ['Uniformes', 'Mundial Anime 2026'],
  ['Camisa Full Sublimada', 'y Calzoneta Full Sublimada – Personalizados'],
  ['Camisa', 'Linea Stamp Line'],
  ['Camisa', 'Selecta Salvadoreña'],
  ['Camisas', 'Empresariales'],
  ['Camisas', 'individuales'],
  ['CAMISAS', 'LINEA PREMIUM'],
  ['CAMISAS OFICIALES', 'DE EQUIPOS NACIONALES'],
  ['Camisas', 'Polo Lisas'],
  ['Camisas', 'Sublimado Frontal'],
  ['Camisas Tipo Polo', 'Full Sublimadas'],
  ['Camisas Tipo Polo', 'Sublimado Frontal'],
  ['Camisas', 'full sublimadas'],
  ['Centro full sublimado', 'con calzoneta de tela'],
  ['Centro full sublimado', 'y calzoneta full sublimada-personalizado'],
  ['Confecciòn Uniforme Sublimado Frontal', 'Calzoneta de Tela – Personalizados'],
  ['Confección uniformes BKB sublimado frontal', 'Calzoneta de tela-personalizado'],
  ['Implementos', 'Deportivos'],
  ['Jerseys', 'de Fútbol'],
  ['Linea', 'Ciclismo'],
  ['Linea', 'empresarial'],
  ['Línea Empresarial', 'Con Cinta Reflectiva'],
  ['Línea', 'Racing'],
  ['Linea', 'Runners'],
  ['LINEAS', 'DE TELA'],
  ['Logos 3D', 'Alto Relieve'],
  ['Moldes', 'de Futbol'],
  ['RACING', 'CAR SHOW'],
  ['RACING', 'MOTORCYCLE'],
  ['Replicas', 'bordadas'],
  ['Replicas Bordadas', 'de Futbol'],
  ['Replicas', 'Sublimadas'],
  ['Réplicas', 'bordadas'],
  ['Réplicas bordadas', 'de fútbol'],
  ['Uniformes de Fùtbol Sublimado', 'Camisa y Calzoneta de Tela – Personalizados'],
  ['Uniformes de Presentaciòn', 'Tipo Polo'],
  ['Uniformes', 'de Voleibol'],
  ['Uniformes deportivos', 'para dama'],
  ['Uniformes', 'Juveniles'],
] as const;

const titles = new Map<string, readonly [string, string]>(
  phrases.map(parts => [parts.join(' '), parts]),
);

const singleWordTitles = new Set([
  'Fútbol', 'Baloncesto', 'Voleibol', 'Ciclismo', 'Running', 'Racing', 'Empresarial',
  'Réplicas', 'Hoddies', 'Implementos', 'Moldes', 'Espinilleras', 'Béisbol', 'Mallas',
  'Accesorios', 'Costuras', 'Motorcycle',
]);

export default function CategoryTitle({title}: {title: string}) {
  if (singleWordTitles.has(title)) return <em className="tc-title-accent">{title}</em>;
  const parts = titles.get(title);
  return parts ? <>{parts[0]} <em className="tc-title-accent">{parts[1]}</em></> : title;
}
