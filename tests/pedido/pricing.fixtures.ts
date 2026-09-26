import {createPedido, resizePlayers} from '../../lib/pedido/order';
import type {PedidoDraft, PedidoLayer} from '../../lib/pedido/types';

export const DEMO_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWMQtVCFIwbiOAC4dAchXMJVdAAAAABJRU5ErkJggg==';
export const layer = (type: PedidoLayer['type'], key: string, side: PedidoLayer['side'] = 'front'): PedidoLayer => ({id: `${type}-${key}-${side}`, type, name: key, side, designKey: key, data: DEMO_IMAGE, x: 50, y: 50, width: 20, height: 20, rotation: 0, color: '#FFFFFF', fontSize: 36, visible: true});
export function completePedido(quantity = 6): PedidoDraft {
  const draft = resizePlayers(createPedido(), quantity);
  draft.id = 'fixture-order';
  draft.teamName = 'EQUIPO DE PRUEBA';
  draft.gender = 'Hombre';
  draft.config = {mold: 'Estándar', fabric: 'Slim Fit', collar: 'V', sleeve: 'Corta', brand: 'Propia', brand3d: false, crest3d: false};
  draft.players = draft.players.map((player, index) => ({...player, id: `field-${index + 1}`, size: 'M', name: `JUGADOR ${index + 1}`, number: String(index + 1)}));
  draft.design = {source: 'catalog', catalogCode: 'TONY-001', front: DEMO_IMAGE, back: DEMO_IMAGE, finalFront: DEMO_IMAGE, finalBack: DEMO_IMAGE, approved: true, layers: []};
  return draft;
}

export function complexPedido(): PedidoDraft {
  const draft = completePedido();
  draft.config = {mold: 'Raglan', fabric: 'Dryfit', collar: 'Chino', sleeve: 'Larga', brand: 'Tony', brand3d: true, crest3d: true};
  ['M', 'M', '2XL', '3XL', '4XL', 'XL'].forEach((size, index) => {draft.players[index].size = size as PedidoDraft['players'][number]['size'];});
  draft.goalkeepers = [{id: 'keeper-1', name: 'PORTERO DE PRUEBA', number: '99', size: '2XL', color: 'Amarillo'}];
  draft.socks.Negro = 3;
  draft.design.source = 'own'; draft.design.catalogCode = '';
  draft.design.layers = [layer('Escudo', 'same-crest'), layer('Escudo', 'same-crest', 'back'), layer('Marca', 'one-brand'), layer('Sponsor', 'same-sponsor'), layer('Sponsor', 'same-sponsor', 'back')];
  return draft;
}
