import {expect, test} from '@playwright/test';
import {calculatePedido, isCatalogCode, money, PedidoValidationError} from '../../lib/pedido/pricing';
import {createPedido, readPedido, resizePlayers, validateStep} from '../../lib/pedido/order';
import type {Buyer, Delivery, PedidoDraft} from '../../lib/pedido/types';
import {completePedido, complexPedido, DEMO_IMAGE, layer} from './pricing.fixtures';

test('6 uniformes catálogo: 6 × $12.99 = $77.94; 50% = $38.97', () => {
  const price = calculatePedido(completePedido());
  expect(price.totalCents).toBe(7794); expect(price.depositCents).toBe(3897); expect(price.balanceCents).toBe(3897);
  expect(price.creationDesignCents).toBe(0); expect(price.freeKeeper).toBe(false);
});

test('diseño propio suma $5 y el pedido incompleto cobra solamente tallas seleccionadas', () => {
  const order = completePedido(); order.design.source = 'own'; order.design.catalogCode = '';
  expect(calculatePedido(order).totalCents).toBe(8294);
  order.players[0].size = '';
  expect(calculatePedido(order).totalCents).toBe(6995);
  expect(validateStep(order, 'players')['players.0.size']).toBeTruthy();
});

test('caso manual completo: $203.43, anticipo $101.72 y saldo $101.71', () => {
  const price = calculatePedido(complexPedido(), 'home');
  expect(price).toMatchObject({baseCents: 7794, garmentExtrasCents: 4350, sizeExtrasCents: 900, creationDesignCents: 500, crestDesignCents: 500, brandDesignCents: 300, sponsorCents: 1000, designServicesCents: 2300, threeDCents: 2100, socksCents: 375, keeperCents: 2224, keeperSizeExtrasCents: 200, discountCents: 300, deliveryCents: 600, totalCents: 20343, depositCents: 10172, balanceCents: 10171});
});

test('12 uniformes: primer portero 4XL gratis; extra 3XL pagado sin 3D ni descuento', () => {
  const order = completePedido(12);
  order.config.brand = 'Tony'; order.config.crest3d = true; order.config.brand3d = true;
  order.goalkeepers = [{id: 'keeper-main', size: '4XL', name: 'PORTERO 1', number: '1', color: 'Rojo'}, {id: 'keeper-extra', size: '3XL', name: 'PORTERO 2', number: '2', color: 'Azul'}];
  expect(calculatePedido(order)).toMatchObject({freeKeeper: true, paidKeeperCount: 1, keeperCents: 1599, keeperSizeExtrasCents: 300, threeDCents: 4200, discountCents: 600, totalCents: 20787, depositCents: 10394, balanceCents: 10393});
});

test('12 camisas: sin descuento Tony ni portero gratis; 3D solo jugadores de campo', () => {
  const order = completePedido(12); order.product = 'shirt'; order.config.brand = 'Tony'; order.config.brand3d = true;
  order.goalkeepers = [{id: 'keeper-main', size: '4XL', name: 'PORTERO 1', number: '1', color: 'Rojo'}, {id: 'keeper-extra', size: '3XL', name: 'PORTERO 2', number: '2', color: 'Azul'}];
  expect(calculatePedido(order)).toMatchObject({baseCents: 9588, freeKeeper: false, paidKeeperCount: 2, keeperCents: 2298, threeDCents: 2100, discountCents: 0, totalCents: 13986});
});

test('sponsors por objeto; escudos/marcas únicos y ocultar no elimina su cargo', () => {
  const order = completePedido();
  order.design.layers = [layer('Escudo', 'same'), layer('Escudo', 'same', 'back'), layer('Marca', 'same'), layer('Marca', 'same', 'back'), layer('Sponsor', 'same'), layer('Sponsor', 'same', 'back')];
  order.design.layers[0].visible = false;
  expect(calculatePedido(order)).toMatchObject({crestDesignCount: 1, brandDesignCount: 1, sponsorCount: 2, designServicesCents: 1800, totalCents: 9594});
  order.design.layers = order.design.layers.filter(item => item.type !== 'Sponsor');
  expect(calculatePedido(order).totalCents).toBe(8594);
});

test('la tabla confiable ignora precios y descuentos inyectados por el navegador', () => {
  const order = {...completePedido(), basePrice: 0, total: 1, tonyDiscount: true};
  expect(calculatePedido(order).totalCents).toBe(7794);
  expect(readPedido({...order, buyer: {name: 'DATO QUE NO DEBE PERSISTIR'}, signature: DEMO_IMAGE})).not.toHaveProperty('buyer');
  expect(readPedido(order)).not.toHaveProperty('basePrice');
});

test('opciones desconocidas, tallas alteradas y cantidades inválidas se rechazan', () => {
  for (const mutate of [
    (o: PedidoDraft) => {o.product = 'free' as PedidoDraft['product'];},
    (o: PedidoDraft) => {o.config.fabric = '__proto__' as PedidoDraft['config']['fabric'];},
    (o: PedidoDraft) => {o.config.brand3d = 'false' as unknown as boolean;},
    (o: PedidoDraft) => {o.players[0].size = '5XL' as PedidoDraft['players'][number]['size'];},
    (o: PedidoDraft) => {o.socks.Negro = -1;},
    (o: PedidoDraft) => {o.socks.Negro = .5;},
    (o: PedidoDraft) => {o.quantity = 100;},
    (o: PedidoDraft) => {o.quantity = 5;},
    (o: PedidoDraft) => {o.design.catalogCode = 'TONY-071';},
  ]) {const order = completePedido(); mutate(order); expect(() => calculatePedido(order)).toThrow(PedidoValidationError); expect(readPedido(order)).toBeNull();}
  expect(() => calculatePedido(completePedido(), 'free' as 'home')).toThrow(PedidoValidationError);
});

test('borradores incompletos se conservan, geometría peligrosa y URLs ajenas se rechazan', () => {
  const order = createPedido(); expect(readPedido(order)).toEqual(order);
  expect(readPedido({...order, design: {...order.design, front: 'javascript:alert(1)'}})).toBeNull();
  expect(readPedido({...order, design: {...order.design, front: 'https://other.example/image.png'}})).toBeNull();
  expect(readPedido({...order, design: {...order.design, layers: [{...layer('Escudo', 'one'), x: Infinity}]}})).toBeNull();
  expect(readPedido({...order, design: {...order.design, front: '/TonySport/assets/pedido/catalogo/tony-001.webp'}})).not.toBeNull();
});

test('reducir y ampliar cantidad conserva jugadores restantes y revoca aprobación', () => {
  const order = completePedido(12), reduced = resizePlayers(order, 6), expanded = resizePlayers(reduced, 8);
  expect(reduced.players).toEqual(order.players.slice(0, 6)); expect(reduced.design.approved).toBe(false);
  expect(expanded.players.slice(0, 6)).toEqual(reduced.players); expect(expanded.players[6].size).toBe('');
  expect(validateStep(resizePlayers(order, 5), 'players').quantity).toBeTruthy();
});

test('pago y firma: datos completos, comprobante obligatorio o Wompi verificado', () => {
  const order = completePedido();
  const delivery: Delivery = {kind: 'pickup', branch: 'Sucursal de prueba', department: '', city: '', address: '', reference: ''};
  const buyer: Buyer = {name: 'CLIENTE DE PRUEBA', dui: '00000000-0', phone: '70000000', email: ''};
  const payment = {method: 'transfer' as const, bank: 'Banco de prueba', receiptName: 'prueba.png', receiptData: DEMO_IMAGE};
  const context = {delivery, buyer, payment, signature: DEMO_IMAGE, termsAccepted: true};
  expect(validateStep(order, 'signature', context)).toEqual({});
  expect(validateStep(order, 'signature', {...context, signature: null})).toHaveProperty('signature');
  expect(validateStep(order, 'payment', {...context, payment: {...payment, receiptData: undefined}})).toHaveProperty(['payment.receiptData']);
  expect(validateStep(order, 'payment', {...context, payment: {method: 'wompi', bank: ''}})).toHaveProperty(['payment.reference']);
  expect(validateStep(order, 'payment', {...context, payment: {method: 'wompi', bank: ''}, wompiVerified: true})).toEqual({});
  expect(validateStep(order, 'signature', {...context,buyer:{...buyer,phone:'00000000'}})).toHaveProperty(['buyer.phone']);
  expect(validateStep(order, 'signature', {...context,buyer:{...buyer,phone:'+503 7000-0000'}})).toEqual({});
});

test('catálogo y dinero no admiten códigos inexistentes ni cantidades fraccionarias', () => {
  expect(isCatalogCode('TONY-001')).toBe(true); expect(isCatalogCode('TONY-070')).toBe(true);
  expect(isCatalogCode('TONY-000')).toBe(false); expect(isCatalogCode('TONY-071')).toBe(false); expect(isCatalogCode('TONY-1')).toBe(false);
  expect(money(20343)).toBe('$203.43'); expect(() => money(10.5)).toThrow();
});
