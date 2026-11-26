/** Phases of the order wizard. Inicio (0) and Confirmación (12) are not counted as steps. */
export const STEPS = ['Inicio', 'Producto', 'Para quién', 'Configuración', 'Jugadores', 'Medias', 'Diseño', 'Aprobación', 'Resumen', 'Entrega', 'Pago', 'Firma', 'Confirmación'] as const;
export const CONFIG_SCREENS = [
  {key: 'mold', title: 'Elige el molde', label: 'Molde', hint: 'Elige el corte de la prenda.'},
  {key: 'fabric', title: 'Elige la tela', label: 'Tela', hint: 'Selecciona la tela para tu equipo.'},
  {key: 'collar', title: 'Elige el cuello', label: 'Cuello', hint: 'Escoge el estilo de cuello.'},
  {key: 'sleeve', title: 'Elige la manga', label: 'Manga', hint: '¿Prefieres manga corta o larga?'},
  {key: 'brand', title: 'Elige la marca deportiva', label: 'Marca deportiva', hint: 'Elige la marca Tony o tu propia marca.'},
  {key: 'brand3d', title: 'Acabado de la marca', label: 'Acabado de la marca', hint: 'Elige si la marca llevará acabado sublimado o relieve 3D.'},
  {key: 'crest3d', title: 'Acabado del escudo', label: 'Acabado del escudo', hint: 'Elige si el escudo llevará acabado sublimado o relieve 3D.'},
] as const;

export interface WizardScreen {step: number; configStep: number; rosterStep: number; quantity: number; uniform: boolean}
export interface WizardProgress {current: number; total: number; phase: string; screen: string}

/** Team name, quantity, one screen per player, goalkeepers (uniforms only) and notes. */
export function rosterScreenCount(quantity: number, uniform: boolean): number {
  return Math.max(0, Math.floor(quantity)) + 3 + (uniform ? 1 : 0);
}

const clamp = (value: number, max: number) => Math.min(Math.max(0, Math.floor(value)), max);

/** One number for every screen, so "Paso N de T" advances on each Continuar and never stalls. */
export function wizardProgress({step, configStep, rosterStep, quantity, uniform}: WizardScreen): WizardProgress | null {
  if (step < 1 || step > 11) return null;
  const config = CONFIG_SCREENS.length, roster = rosterScreenCount(quantity, uniform);
  const total = 2 + config + roster + 7;
  const phase = STEPS[step];
  if (step <= 2) return {current: step, total, phase, screen: ''};
  if (step === 3) {
    const index = clamp(configStep, config - 1);
    return {current: 3 + index, total, phase, screen: CONFIG_SCREENS[index].label};
  }
  if (step === 4) {
    const index = clamp(rosterStep, roster - 1), players = roster - 3 - (uniform ? 1 : 0);
    const screen = index === 0 ? 'Nombre del equipo' : index === 1 ? 'Cantidad' : index < players + 2 ? `Jugador ${index - 1} de ${players}` : index === roster - 1 ? 'Indicaciones' : 'Porteros';
    return {current: 3 + config + index, total, phase, screen};
  }
  return {current: 2 + config + roster + step - 4, total, phase, screen: ''};
}
