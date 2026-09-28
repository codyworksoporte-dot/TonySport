import {expect, test} from '@playwright/test';
import {adviseFor, femaleVoice, missingBefore, numberWords, spoken, type AdvisorInput} from '../../lib/pedido/advisor';
import {createPedido} from '../../lib/pedido/order';
import {completePedido} from './pricing.fixtures';

const base = (step: number, patch: Partial<AdvisorInput> = {}): AdvisorInput => ({
  step, draft: createPedido(), delivery: {kind: '', branch: '', department: '', city: '', address: '', reference: ''},
  payment: {method: '', bank: ''}, buyer: {name: '', dui: '', phone: '', email: ''}, signature: '', terms: false, verified: false, hasReceipt: false, ...patch,
});
const words = (text: string) => text.split(/\s+/).length;

test('la configuración se guía opción por opción, con frases cortas', () => {
  const draft = createPedido();
  expect(adviseFor(base(3, {draft})).text).toBe('Primero, elige el molde.');
  draft.config.mold = 'Raglan';
  expect(adviseFor(base(3, {draft}))).toMatchObject({target: 'fabric', text: 'Molde Raglan. Ahora elige la tela.'});
  draft.config.fabric = 'Premier';
  expect(adviseFor(base(3, {draft})).text).toBe('Tela Premier. Ahora elige el cuello.');
  draft.config.collar = 'Chino';
  expect(adviseFor(base(3, {draft})).text).toBe('Cuello Chino. ¿Manga corta o larga?');
  draft.config.sleeve = 'Corta';
  expect(adviseFor(base(3, {draft})).target).toBe('brand');
});

test('ninguna indicación es un discurso: todas caben en una o dos frases cortas', () => {
  const full = completePedido(12); full.goalkeepers = [];
  for (let step = 0; step <= 12; step++) for (const draft of [createPedido(), full]) expect(words(adviseFor(base(step, {draft})).text), `paso ${step}`).toBeLessThanOrEqual(14);
});

test('no se puede elegir algo de adelante sin lo anterior', () => {
  const draft = createPedido();
  expect(missingBefore(draft, 'mold')).toBeNull();
  expect(missingBefore(draft, 'collar')).toEqual({key: 'mold', label: 'el molde'});
  draft.config.mold = 'Estándar';
  expect(missingBefore(draft, 'collar')).toEqual({key: 'fabric', label: 'la tela'});
  expect(missingBefore(draft, 'brand3d')).toEqual({key: 'fabric', label: 'la tela'});
  Object.assign(draft.config, {fabric: 'Slim Fit', collar: 'V', sleeve: 'Corta'});
  expect(missingBefore(draft, 'brand')).toBeNull();
});

test('jugadores, entrega, pago y firma piden un dato a la vez', () => {
  const draft = createPedido();
  expect(adviseFor(base(4, {draft})).text).toBe('Escribe el nombre de tu equipo.');
  draft.teamName = 'Equipo';
  expect(adviseFor(base(4, {draft})).text).toBe('Jugador 1: escribe el nombre.');
  draft.players[0] = {...draft.players[0], name: 'A'};
  expect(adviseFor(base(4, {draft})).text).toBe('Jugador 1: escribe la talla.');
  const done = completePedido();
  const home = {...base(9).delivery, kind: 'home' as const};
  expect(adviseFor(base(9, {draft: done, delivery: home})).text).toBe('Elige el departamento.');
  expect(adviseFor(base(10, {draft: done, payment: {method: 'transfer', bank: ''}})).text).toBe('Elige el banco.');
  const buyer = {name: 'A', dui: '', phone: '', email: ''};
  expect(adviseFor(base(11, {draft: done, buyer})).text).toBe('Ahora tu número de DUI.');
  expect(adviseFor(base(11, {draft: done, buyer: {...buyer, dui: '1', phone: '7'}})).text).toBe('Lee y acepta los términos.');
});

test('la asesora solo usa voces femeninas en español; sin una, se queda en silencio', () => {
  const voices = [
    {name: 'Microsoft Jorge - Spanish (Mexico)', lang: 'es-MX'},
    {name: 'Microsoft Rodrigo Online (Natural) - Spanish (El Salvador)', lang: 'es-SV'},
    {name: 'Microsoft Helena - Spanish (Spain)', lang: 'es-ES'},
    {name: 'Microsoft Lorena Online (Natural) - Spanish (El Salvador)', lang: 'es-SV'},
    {name: 'Microsoft Zira - English', lang: 'en-US'},
  ];
  expect(femaleVoice(voices)?.name).toContain('Lorena');
  expect(femaleVoice(voices.filter(voice => !voice.name.includes('Lorena')))?.name).toContain('Helena');
  expect(femaleVoice([{name: 'Google español', lang: 'es-ES'}])?.name).toBe('Google español');
  expect(femaleVoice([{name: 'Microsoft Raul - Spanish (Mexico)', lang: 'es-MX'}, {name: 'es-us-x-sfb-local', lang: 'es-US'}])).toBeUndefined();
});

test('los montos y abreviaturas se leen como los diría una persona', () => {
  expect(spoken('a $12.99 cada uno')).toBe('a doce dólares con noventa y nueve centavos cada uno');
  expect(spoken('suma $1.75 y +$6.00')).toBe('suma un dólar con setenta y cinco centavos y más seis dólares');
  expect(spoken('en 3D con tu DUI, 50 %')).toBe('en tres D con tu D U I, 50 por ciento');
  expect(spoken('$31.00 · $21.00 · $101.72')).toBe('treinta y un dólares · veintiún dólares · ciento un dólares con setenta y dos centavos');
  expect(numberWords(1999)).toBe('mil novecientos noventa y nueve');
});
