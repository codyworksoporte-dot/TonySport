export const businessLines = {
  factory: {
    name: 'Factory',
    label: 'Confección local',
    description: 'Uniformes empresariales personalizados, confeccionados con manos salvadoreñas.',
  },
  prestige: {
    name: 'Prestige',
    label: 'Entrega inmediata según stock',
    description: 'Prendas empresariales importadas con opción de personalización y entrega inmediata.',
  },
} as const;

export type BusinessLine = keyof typeof businessLines;
export const businessLineIds: BusinessLine[] = ['factory', 'prestige'];
