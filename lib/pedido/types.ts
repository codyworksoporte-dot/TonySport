/** V279 selections only. Buyer details, delivery, signatures and payment proof stay separate. */
export type Product = 'uniform' | 'shirt';
export type Gender = 'Hombre' | 'Mujer' | '';
export type Mold = '' | 'Estándar' | 'Raglan' | 'Primera División';
export type Fabric = '' | 'Slim Fit' | 'Slim Pro' | 'Modern Carving' | 'Dryfit' | 'Premier' | 'Drycool';
export type Collar = '' | 'V' | 'Redondo' | 'Chino' | 'Polo';
export type Sleeve = '' | 'Corta' | 'Larga';
export type Size = '' | '2' | '4' | '6' | '8' | '10' | '12' | '14' | '16' | 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL';
export type SockColor = 'Negro' | 'Blanco' | 'Azul negro' | 'Rojo' | 'Azul bandera';
export type DeliveryKind = '' | 'pickup' | 'home';

export interface PedidoPlayer {id: string; name: string; number: string; size: Size}
export interface PedidoGoalkeeper extends PedidoPlayer {color: string}
export interface PedidoConfig {
  mold: Mold; fabric: Fabric; collar: Collar; sleeve: Sleeve;
  brand: 'Tony' | 'Propia'; brand3d: boolean; crest3d: boolean;
}
export interface PedidoLayer {
  id: string; side: 'front' | 'back'; type: 'Escudo' | 'Marca' | 'Sponsor' | 'Texto';
  name: string; designKey?: string; data?: string; text?: string;
  x: number; y: number; width: number; height: number; rotation: number;
  color: string; fontSize: number; visible: boolean;
}
export interface PedidoDesign {
  source: 'catalog' | 'own'; catalogCode: string;
  front: string | null; back: string | null; layers: PedidoLayer[];
  approved: boolean; finalFront: string | null; finalBack: string | null;
}
export interface PedidoDraft {
  version: 279; id: string; product: Product; gender: Gender; quantity: number;
  teamName: string; notes: string; shortsNumber: boolean;
  config: PedidoConfig; players: PedidoPlayer[];
  /** The first goalkeeper is the main goalkeeper; all later entries are charged. */
  goalkeepers: PedidoGoalkeeper[]; socks: Record<SockColor, number>; design: PedidoDesign;
}

export interface Buyer {name: string; dui: string; phone: string; email: string}
export interface Delivery {
  kind: DeliveryKind; branch: string; department: string; city: string;
  address: string; reference: string; latitude?: number | null; longitude?: number | null;
}
export interface Payment {
  method: '' | 'wompi' | 'transfer'; bank: string;
  receiptName?: string; receiptData?: string; reference?: string;
}
/** Safe local tracking reference. Never includes a buyer, roster, signature or payment proof. */
export interface SubmittedReceipt {id: string; status: string}
export type PedidoStep = 'product' | 'gender' | 'config' | 'players' | 'socks' | 'design' | 'approval' | 'summary' | 'delivery' | 'payment' | 'signature';
export type PedidoErrors = Record<string, string>;

export interface PedidoPricing {
  currency: 'USD'; fieldQuantity: number; paidKeeperCount: number; freeKeeper: boolean;
  baseCents: number; garmentExtrasCents: number; sizeExtrasCents: number;
  creationDesignCents: number; crestDesignCount: number; crestDesignCents: number;
  brandDesignCount: number; brandDesignCents: number; sponsorCount: number; sponsorCents: number;
  designServicesCents: number; crest3dCents: number; brand3dCents: number; threeDCents: number;
  sockQuantity: number; socksCents: number; keeperSizeExtrasCents: number; keeperCents: number;
  discountCents: number; deliveryCents: number; totalCents: number; depositCents: number; balanceCents: number;
}
