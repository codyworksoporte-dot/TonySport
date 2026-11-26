import {expect, test} from '@playwright/test';
import {continuePedido, expectNoOverflow, mockPedidoApi, seedPedido} from './pedido/helpers';
import {completePedido} from './pedido/pricing.fixtures';

test('configuración muestra una decisión, conserva selecciones al volver y exige escoger acabados', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:390,height:844});
  await mockPedidoApi(page);
  await page.goto('/configurador');
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  await page.getByRole('button',{name:/Uniformes Full Sublimados/}).click();
  await continuePedido(page);
  await page.getByRole('button',{name:/Uniforme para hombre/}).click();
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Elige el molde',exact:true})).toBeVisible();
  await expect(page.locator('.pedido-one-choice fieldset')).toHaveCount(1);
  await expect(page.getByRole('group',{name:'Cuello',exact:true})).toHaveCount(0);
  await continuePedido(page);
  await expect(page.getByRole('alert').first()).toContainText('Elige una opción de molde');
  await page.getByRole('group',{name:'Molde',exact:true}).getByRole('button',{name:/^Estándar/}).click();
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Elige la tela',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Anterior/}).click();
  await expect(page.getByRole('button',{name:/^Estándar/})).toHaveAttribute('aria-pressed','true');
  await continuePedido(page);
  for (const [group, label] of [['Tela','Slim Fit'],['Cuello','V'],['Manga','Corta']]) {
    await expect(page.locator('.pedido-one-choice fieldset')).toHaveCount(1);
    await page.getByRole('group',{name:group,exact:true}).getByRole('button',{name:new RegExp(`^${label}\\b`)}).click();
    await continuePedido(page);
  }
  await page.getByRole('button',{name:/^Marca propia/}).click();
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Acabado de la marca',exact:true})).toBeVisible();
  await continuePedido(page);
  await expect(page.getByRole('alert').first()).toContainText('Elige una opción de acabado de la marca');
  await page.getByRole('button',{name:/^Sublimado/}).click();
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Acabado del escudo',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/^Relieve 3D/}).click();
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'El nombre de tu equipo',exact:true})).toBeVisible();
  await expectNoOverflow(page,390);
  await page.getByRole('button',{name:/Anterior/}).click();
  await expect(page.getByRole('button',{name:/^Relieve 3D/})).toHaveAttribute('aria-pressed','true');
  await continuePedido(page);
  await page.getByLabel('Nombre de equipo',{exact:true}).fill('EQUIPO DE PRUEBA');
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'¿Cuántas prendas necesitas?',exact:true})).toBeVisible();
  const quantity=page.getByRole('spinbutton');
  await expect(quantity).toHaveValue('');
  await continuePedido(page);
  await expect(page.getByRole('alert').first()).toContainText('El pedido es de 6 a 99 prendas de campo.');
  await quantity.fill('6');
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Jugador 1 de 6',exact:true})).toBeVisible();
  await expect(page.locator('.pedido-player')).toHaveCount(1);
  await continuePedido(page);
  await expect(page.getByRole('alert').first()).toBeVisible();
  await page.getByLabel('Nombre jugador 1',{exact:true}).fill('JUGADOR UNO');
  await page.getByRole('combobox',{name:/^Talla jugador 1\b/}).selectOption('M');
  await page.getByLabel('Dorsal jugador 1',{exact:true}).fill('10');
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Jugador 2 de 6',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Anterior/}).click();
  await expect(page.getByLabel('Nombre jugador 1',{exact:true})).toHaveValue('JUGADOR UNO');
});

test('un solo contador avanza en cada pantalla; marca, manga y medias muestran imágenes', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await mockPedidoApi(page);
  await seedPedido(page,completePedido());
  await page.goto('/configurador?borrador=actual');
  await expect(page.getByText('Recuperamos tu diseño. Revisa los pasos para continuar.')).toBeVisible();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  const counter=page.locator('.pedido-wizard-progress');
  // 6 field players of a uniform: 2 + 7 configuration screens + 10 roster screens + 7 final steps.
  for (let current=1; current<20; current++) {
    await expect(counter).toContainText(`PASO ${current} DE 26`);
    await expect(page.locator('.pedido-heading .eyebrow')).toHaveText(new RegExp(`^${String(current).padStart(2,'0')} / `));
    if (current===6) {
      await expect(counter).toContainText('Configuración · Manga');
      await expect(page.locator('[data-advisor="sleeve"] .pedido-choice-photo').first()).toHaveAttribute('src',/manga-corta-96\.webp$/);
    }
    if (current===7) {
      await expect(counter).toContainText('Configuración · Marca deportiva');
      await expect(page.locator('[data-advisor="brand"] .pedido-choice-photo')).toHaveCount(2);
      await page.getByRole('button',{name:/Anterior/}).click();
      await expect(counter).toContainText('PASO 6 DE 26');
      await continuePedido(page);
      await expect(counter).toContainText('PASO 7 DE 26');
    }
    if (current===11) {
      const quantity=page.getByRole('spinbutton');
      await quantity.fill('8');
      await expect(counter).toContainText('PASO 11 DE 28');
      await quantity.fill('6');
      await expect(counter).toContainText('PASO 11 DE 26');
    }
    if (current===12) await expect(counter).toContainText('Jugadores · Jugador 1 de 6');
    await continuePedido(page);
  }
  await expect(page.getByRole('heading',{name:'Completa tu equipo',exact:true})).toBeVisible();
  await expect(counter).toContainText('PASO 20 DE 26');
  const rojo=page.getByRole('button',{name:'Agregar un par de medias color Rojo'});
  await rojo.click(); await rojo.click();
  await expect(page.getByLabel('Pares de medias color Rojo',{exact:true})).toHaveValue('2');
  await expect(page.locator('.pedido-sock-stage figcaption')).toContainText('Rojo');
  await expect(page.getByRole('button',{name:/^Rojo/})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:/^Blanco/}).click();
  await expect(page.locator('.pedido-sock-stage figcaption')).toContainText('Blanco');
  await page.getByLabel('Pares de medias color Blanco',{exact:true}).fill('5');
  await expect(page.locator('.pedido-sock-total')).toHaveText('7 pares en total · $8.75');
  await expect(page.getByRole('button',{name:'Quitar un par de medias color Negro'})).toBeDisabled();
  // 6 × $12.99 + 7 pairs × $1.25.
  await expect(page.locator('.pedido-aside .pedido-price-total dd')).toHaveText('$86.69');
  await page.getByRole('button',{name:/Anterior/}).click();
  await expect(counter).toContainText('PASO 19 DE 26 · Jugadores · Indicaciones');
  await continuePedido(page);
  await expect(page.getByLabel('Pares de medias color Rojo',{exact:true})).toHaveValue('2');
  await continuePedido(page);
  await expect(page.getByRole('region',{name:'Editor de tu uniforme'})).toBeVisible();
  await expect(counter).toContainText('PASO 21 DE 26 · Diseño');
  await continuePedido(page);
  await expect(page.getByRole('heading',{name:'El último detalle',exact:true})).toBeVisible();
  await expect(counter).toContainText('PASO 22 DE 26');
  await expect(page.locator('#pedido-final-ai-info')).toContainText('a Google Gemini a través de Vercel AI Gateway');
  await expectNoOverflow(page,1280);
});

test('recuperar un borrador parcial conserva los acabados sin responder', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await mockPedidoApi(page);
  const draft=completePedido();
  draft.choices={...draft.choices!,brand3d:false,crest3d:false};
  await seedPedido(page,draft);
  await page.goto('/configurador?borrador=actual');
  await expect(page.getByText('Recuperamos tu diseño. Revisa los pasos para continuar.')).toBeVisible();
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).click();
  for(let i=0;i<7;i++) await continuePedido(page);
  await expect(page.getByRole('heading',{name:'Acabado de la marca',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/^Sublimado/})).toHaveAttribute('aria-pressed','false');
  await continuePedido(page);
  await expect(page.getByRole('alert').first()).toContainText('Elige una opción de acabado de la marca');
});
