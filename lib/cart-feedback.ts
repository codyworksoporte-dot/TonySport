/** Only announce a save after its storage transaction has completed. */
export const CART_FEEDBACK_EVENT = 'tony:cart-feedback';
export type CartFeedbackDetail = {message: string; error?: boolean; animate?: boolean};
export function announceCartSave(detail: CartFeedbackDetail) {
  window.dispatchEvent(new CustomEvent<CartFeedbackDetail>(CART_FEEDBACK_EVENT, {detail}));
}
