import {accountStorageKey} from './auth';

const databases = ['tony-pedido-v279', 'tony-cart-v1', 'tony-team-artwork-v1'];
const localKeys = [
  'tony:pedido:references:v279', 'tony-review-draft-v1', 'tony-team-order-v2', 'tony-uniform-draft-v1',
];
const paymentKeys = ['tony:pedido:pending-payment:v279', 'tony:pedido:payment-key:v279'];

// Capture once before any async work: closing an account can change the active
// namespace to "signed-out" before local cleanup starts.
export function captureLocalPrivacyScope(): string {
  return accountStorageKey('');
}

function clearDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    let absent = false;
    request.onupgradeneeded = event => {
      // Opening a missing DB would create schema version 1 with no stores and
      // break the next visit to the editor. Abort that creation instead.
      if (event.oldVersion === 0) {
        absent = true;
        request.transaction!.abort();
      }
    };
    request.onerror = () => {if (absent) resolve(); else reject(request.error);};
    request.onsuccess = () => {
      const db = request.result;
      try {
        const stores = Array.from(db.objectStoreNames);
        if (!stores.length) {db.close(); resolve(); return;}
        // A transaction also works when the site is open in another tab.
        const tx = db.transaction(stores, 'readwrite');
        tx.oncomplete = () => {db.close(); resolve();};
        tx.onabort = () => {db.close(); reject(tx.error);};
        for (const store of stores) tx.objectStore(store).clear();
      } catch (error) {db.close(); reject(error);}
    };
  });
}

export async function eraseLocalPrivacyData(scope: string, {accountDeleted = false} = {}) {
  // Guest drafts created before sign-in was enabled used the unscoped keys.
  const scopes = scope === ':account:signed-out' ? [scope, ''] : [scope];
  let paymentPending = false;
  const results = await Promise.allSettled([
    ...scopes.flatMap(owner => databases.map(name => clearDatabase(name + owner))),
    Promise.resolve().then(() => {
      for (const owner of scopes) for (const key of localKeys) localStorage.removeItem(key + owner);
    }),
    Promise.resolve().then(() => {
      if (accountDeleted) {
        for (const key of paymentKeys) sessionStorage.removeItem(key + scope);
      } else {
        paymentPending = scopes.some(owner => paymentKeys.some(key => !!sessionStorage.getItem(key + owner)));
      }
    }),
  ]);
  window.dispatchEvent(new Event('tony:cart-changed'));
  window.dispatchEvent(new Event('tony-pedido-updated'));
  if (results.some(result => result.status === 'rejected')) {
    throw new Error('No se pudo completar el borrado. Cierra las otras pestañas de Tony y vuelve a intentarlo. También puedes borrar los datos del sitio desde tu navegador.');
  }
  return {paymentPending};
}
