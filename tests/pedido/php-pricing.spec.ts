import {test, expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {calculatePedido, PRICES} from '../../lib/pedido/pricing';
import {createPedido} from '../../lib/pedido/order';
import type {DeliveryKind, PedidoDraft, PedidoPricing} from '../../lib/pedido/types';
import {completePedido, complexPedido, layer} from './pricing.fixtures';

test('PHP recalcula todas las partidas con las mismas fixtures JSON de TypeScript', () => {
  const cases: {name: string; order: PedidoDraft; deliveryKind: DeliveryKind}[] = [
    {name: 'catalogue base', order: completePedido(), deliveryKind: ''},
    {name: 'complex odd cents', order: complexPedido(), deliveryKind: 'home'},
    {name: 'incomplete draft', order: createPedido(), deliveryKind: ''},
  ];
  for (const product of ['uniform', 'shirt'] as const) {
    for (const quantity of [6, 11, 12, 99]) {
      for (const [fabricIndex, fabric] of Object.keys(PRICES.fabrics).entries()) {
        const order = completePedido(quantity); order.product = product;
        order.config.fabric = fabric as PedidoDraft['config']['fabric'];
        order.config.mold = Object.keys(PRICES.molds)[fabricIndex % 3] as PedidoDraft['config']['mold'];
        order.config.collar = Object.keys(PRICES.collars)[fabricIndex % 4] as PedidoDraft['config']['collar'];
        order.config.sleeve = fabricIndex % 2 ? 'Larga' : 'Corta';
        order.config.brand = fabricIndex % 2 ? 'Tony' : 'Propia';
        order.config.brand3d = fabricIndex % 3 !== 0; order.config.crest3d = fabricIndex % 2 === 0;
        order.players[0].size = '2XL'; order.players[1].size = '3XL'; order.players[2].size = '4XL';
        order.goalkeepers = [{id: 'first-keeper', name: 'SYNTHETIC', number: '90', size: '4XL', color: 'Azul'}, {id: 'second-keeper', name: 'SYNTHETIC', number: '91', size: '3XL', color: 'Verde'}].slice(0, fabricIndex % 3) as PedidoDraft['goalkeepers'];
        order.socks.Negro = fabricIndex; order.socks.Blanco = fabricIndex + 1;
        if (fabricIndex % 2) {order.design.source = 'own'; order.design.catalogCode = '';}
        order.design.layers = [layer('Escudo', 'same'), layer('Escudo', 'same', 'back'), layer('Marca', 'brand'), layer('Sponsor', 'sponsor'), layer('Sponsor', 'sponsor', 'back')];
        order.design.layers[0].visible = false;
        cases.push({name: `${product}-${quantity}-${fabric}`, order, deliveryKind: fabricIndex % 2 ? 'home' : 'pickup'});
      }
    }
  }
  const noKey = completePedido(); noKey.design.layers = [layer('Escudo', 'same'), layer('Escudo', 'same', 'back')];
  noKey.design.layers.forEach(item => {delete item.designKey;});
  cases.push({name: 'design identity falls back to image data', order: noKey, deliveryKind: 'home'});
  const php = process.env.TONY_TEST_PHP || (process.platform === 'win32' ? 'C:\\wamp64\\bin\\php\\php7.4.9\\php.exe' : 'php');
  const output = execFileSync(php, [path.resolve('backend/tests/price-runner.php')], {input: JSON.stringify(cases), encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024});
  const actual: PedidoPricing[] = JSON.parse(output);
  expect(actual).toHaveLength(cases.length);
  for (const [index, fixture] of cases.entries()) expect(actual[index], fixture.name).toEqual(calculatePedido(fixture.order, fixture.deliveryKind));
});
