import {expect, test} from '@playwright/test';
import {CLOSED, LipSync, sampleTimeline, timelineFor} from '../../lib/pedido/lipsync';

test('cada letra produce un visema con duración plausible y la frase termina cerrada', () => {
  const frames = timelineFor('Hola, soy tu asesora Tony.');
  expect(frames[0]).toMatchObject({at: 0, ...CLOSED});
  const last = frames[frames.length - 1];
  expect(last).toMatchObject(CLOSED);
  // 26 caracteres a ~70 ms de media: entre 1,2 y 2,6 segundos.
  expect(last.at).toBeGreaterThan(1200);
  expect(last.at).toBeLessThan(2600);
  // La "a" abre mucho; la "m" y la "p" cierran.
  const a = timelineFor('a'), m = timelineFor('m');
  expect(a[1].open).toBeGreaterThan(.9);
  expect(m[1].open).toBe(0);
});

test('las vocales se interpolan y fuera del rango la boca queda cerrada', () => {
  const frames = timelineFor('aa');
  const peak = frames[1].at;
  expect(sampleTimeline(frames, peak).open).toBeCloseTo(.95, 1);
  expect(sampleTimeline(frames, -10)).toEqual(CLOSED);
  expect(sampleTimeline(frames, 10_000)).toEqual(CLOSED);
  const between = sampleTimeline(frames, (frames[0].at + frames[1].at) / 2).open;
  expect(between).toBeGreaterThan(.3);
  expect(between).toBeLessThan(.95);
});

test('los límites de palabra reanclan la estimación y detener la voz cierra la boca', () => {
  const lips = new LipSync();
  expect(lips.active).toBe(false);
  lips.start('Elige tu producto.', 1000);
  expect(lips.active).toBe(true);
  expect(lips.sample(1048).open).toBeGreaterThan(0);
  // El motor va más lento de lo estimado: al llegar a "producto" la boca vuelve a sincronizarse.
  lips.boundary('Elige tu producto.'.indexOf('producto'), 2400);
  const p = lips.sample(2400 + 33);
  expect(p.open).toBeCloseTo(0, 1); // la "p" cierra los labios
  expect(lips.sample(2400 + 66 + 48).open).toBeGreaterThan(.3); // la "r" y la "o" abren
  lips.stop();
  expect(lips.sample(2500)).toEqual(CLOSED);
  expect(lips.active).toBe(false);
});

test('tildes, números y signos tienen forma propia', () => {
  expect(timelineFor('á')[1].open).toBeCloseTo(.95, 2);
  expect(timelineFor('7')[1].open).toBeCloseTo(.6, 2);
  const pause = timelineFor('a. a');
  expect(pause[pause.length - 1].at).toBeGreaterThan(timelineFor('a a')[timelineFor('a a').length - 1].at);
});
