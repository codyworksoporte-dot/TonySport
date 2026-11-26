import {expect, test} from '@playwright/test';
import {CONFIG_SCREENS, rosterScreenCount, wizardProgress, type WizardScreen} from '../../components/pedido/wizard-progress';

const at = (patch: Partial<WizardScreen>) => wizardProgress({step: 1, configStep: 0, rosterStep: 0, quantity: 6, uniform: true, ...patch});
/** Every screen in the order Continuar visits them. */
function screens(quantity: number, uniform: boolean): WizardScreen[] {
  const list: WizardScreen[] = [];
  const add = (step: number, configStep = 0, rosterStep = 0) => list.push({step, configStep, rosterStep, quantity, uniform});
  add(1); add(2);
  CONFIG_SCREENS.forEach((_, index) => add(3, index));
  for (let index = 0; index < rosterScreenCount(quantity, uniform); index++) add(4, 0, index);
  for (let step = 5; step <= 11; step++) add(step);
  return list;
}

test('cada pantalla suma uno y el último paso es el total', () => {
  for (const [quantity, uniform] of [[6, true], [6, false], [12, true], [23, false]] as const) {
    const positions = screens(quantity, uniform).map(screen => wizardProgress(screen)!);
    const total = positions[0].total;
    expect(positions.map(position => position.current)).toEqual(Array.from({length: total}, (_, index) => index + 1));
    expect(positions.every(position => position.total === total)).toBe(true);
  }
});

test('la marca deportiva es el paso 7 y el total crece con los jugadores', () => {
  expect(at({step: 3, configStep: 4, quantity: 11})).toEqual({current: 7, total: 31, phase: 'Configuración', screen: 'Marca deportiva'});
  expect(at({step: 1})!.total).toBe(26);
  expect(at({step: 1, quantity: 12})!.total).toBe(32);
  expect(at({step: 1, uniform: false})!.total).toBe(25);
  expect(at({step: 11, quantity: 12})).toMatchObject({current: 32, total: 32, phase: 'Firma', screen: ''});
});

test('jugadores, porteros e indicaciones tienen su propio número y nombre', () => {
  expect([0, 1, 2, 7, 8, 9].map(rosterStep => at({step: 4, rosterStep})!.screen)).toEqual(['Nombre del equipo', 'Cantidad', 'Jugador 1 de 6', 'Jugador 6 de 6', 'Porteros', 'Indicaciones']);
  expect(at({step: 4, rosterStep: 8, uniform: false})!.screen).toBe('Indicaciones');
  expect(at({step: 4, rosterStep: 2})!.current).toBe(12);
});

test('Anterior vuelve exactamente un número, también desde las pantallas posteriores', () => {
  const socks = at({step: 5})!, notes = at({step: 4, rosterStep: rosterScreenCount(6, true) - 1})!;
  expect(notes.current).toBe(socks.current - 1);
  expect(at({step: 3, configStep: CONFIG_SCREENS.length - 1})!.current).toBe(at({step: 4, rosterStep: 0})!.current - 1);
  expect(at({step: 2})!.current).toBe(at({step: 3, configStep: 0})!.current - 1);
});

test('inicio y confirmación no se cuentan', () => {
  expect(at({step: 0})).toBeNull();
  expect(at({step: 12})).toBeNull();
});
