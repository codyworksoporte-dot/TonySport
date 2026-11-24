import {expect, test} from '@playwright/test';

test('borrar los datos locales requiere confirmación, respeta los otros perfiles y permite retomar un pago', async ({page}) => {
  test.skip(process.env.TONY_AUTH_TEST === 'true', 'Este caso utiliza el configurador público sin cuenta.');
  const profile = ':account:' + 'b'.repeat(32);
  const review = 'tony-review-draft-v1', receipt = 'tony:pedido:references:v279';
  await page.goto('./privacidad/');
  await page.evaluate(async ({profile, review, receipt}) => {
    for (const suffix of ['', profile]) {
      localStorage.setItem(review + suffix, 'reseña de prueba');
      localStorage.setItem(receipt + suffix, 'referencia de prueba');
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('tony-team-artwork-v1' + suffix, 1);
        request.onupgradeneeded = () => request.result.createObjectStore('artwork');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('artwork', 'readwrite');
          tx.objectStore('artwork').put('imagen de prueba', 'current');
          tx.oncomplete = () => {db.close(); resolve();};
          tx.onabort = () => {db.close(); reject(tx.error);};
        };
      });
    }
    sessionStorage.setItem('tony:pedido:pending-payment:v279', 'pago-de-prueba');
  }, {profile, review, receipt});

  const controls = page.locator('#borrar-datos-locales');
  await controls.getByRole('button', {name: 'Borrar mis datos de este navegador'}).click();
  await controls.getByRole('button', {name: 'Cancelar'}).click();
  expect(await page.evaluate(key => localStorage.getItem(key), review)).toBe('reseña de prueba');
  await controls.getByRole('button', {name: 'Borrar mis datos de este navegador'}).click();
  await controls.getByRole('button', {name: 'Confirmar borrado local'}).click();
  await expect(controls.getByRole('status')).toContainText('Conservamos el acceso a tu pago');

  const records = await page.evaluate(async ({profile, review, receipt}) => {
    const designs: (string | undefined)[] = [];
    for (const suffix of ['', profile]) {
      designs.push(await new Promise<string | undefined>((resolve, reject) => {
        const request = indexedDB.open('tony-team-artwork-v1' + suffix, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('artwork');
          const item = tx.objectStore('artwork').get('current');
          tx.oncomplete = () => {db.close(); resolve(item.result);};
          tx.onabort = () => {db.close(); reject(tx.error);};
        };
      }));
    }
    return {
      designs, own: [localStorage.getItem(review), localStorage.getItem(receipt)],
      other: [localStorage.getItem(review + profile), localStorage.getItem(receipt + profile)],
      payment: sessionStorage.getItem('tony:pedido:pending-payment:v279'),
    };
  }, {profile, review, receipt});
  expect(records.designs).toEqual([undefined, 'imagen de prueba']);
  expect(records.own).toEqual([null, null]);
  expect(records.other).toEqual(['reseña de prueba', 'referencia de prueba']);
  expect(records.payment).toBe('pago-de-prueba');
});
