import {expect, test} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {MAIN_MENU} from '../lib/main-menu';

const business = [
  '/empresarial/factory','/empresarial/prestige',
  '/colecciones/camisas-polo-lisas','/colecciones/linea-empresarial-con-cinta-reflectiva',
];
const replicas = [
  {label:'Réplicas sublimadas', slug:'replicas-sublimadas-8-99', albums:[36997]},
  {label:'Réplicas bordadas', slug:'replicas-bordadas-de-8-49', albums:[38248]},
  {label:'Réplicas bordadas de fútbol', slug:'replicas-bordadas-de-futbol-de-10-99', albums:[38313,35676]},
];
const parents = [
  ['producto/futbol',10], ['producto/replicas',3], ['producto/bkb',3], ['producto/camisas-polos',7],
  ['colecciones/camisas-empresariales',4], ['colecciones/moldes-de-futbol',3], ['producto/racing',2], ['producto/empresarial',4], ['producto/moldes',3], ['producto/hoddies',2], ['implementos',8],
] as const;

test('cada categoría padre presenta únicamente sus apartados',async({request})=>{
  for(const [path,count] of parents) {
    const response=await request.get('/'+path);
    expect(response.ok(),path).toBe(true);
    const main=(await response.text()).split('</main>')[0].split('<main ').pop()!;
    expect(main.match(/class="tc-card pd-card\b/g)?.length,path).toBe(count);
    expect(main,path).not.toContain('class="scope-grid"');
  }
});

for (const width of [320,1440]) test('cada categoría presenta únicamente sus portadas a '+width+' px',async({page})=>{
  test.setTimeout(180_000);
  await page.setViewportSize({width,height:850});
  for (const [path,count] of parents.filter(([path])=>['producto/futbol','producto/replicas','producto/empresarial'].includes(path))) {
    await page.goto('/'+path,{waitUntil:'domcontentloaded'});
    const nav=page.locator('main nav');
    const cards=nav.locator('.pd-card');
    await expect(cards,path).toHaveCount(count);
    await expect(cards.locator('img'),path).toHaveCount(count);
    await expect(page.locator('.scope-grid'),path).toHaveCount(0);
    expect(await cards.evaluateAll(items=>items.every(item=>item.getBoundingClientRect().right<=innerWidth && item.getBoundingClientRect().left>=0)),path).toBe(true);
    if (path==='producto/empresarial') expect(await cards.evaluateAll(items=>items.map(a=>a.getAttribute('href')))).toEqual(business);
    if (path==='producto/futbol') {
      await expect(nav.getByRole('list',{name:'Uniformes de fútbol'}).getByRole('link')).toHaveCount(7);
      await expect(nav.getByRole('list',{name:'Réplicas'}).getByRole('link')).toHaveText(replicas.map(family=>family.label));
    }
  }
  const empresarial=MAIN_MENU.find(item=>item.href==='/producto')?.children?.find(item=>item.href==='/producto/empresarial');
  expect(empresarial?.children?.map(item=>item.href)).toEqual(business);
});

test('cada familia de réplicas de Fútbol abre sus fotos con un toque',async({page})=>{
  test.setTimeout(120_000);
  for(const family of replicas) {
    await page.goto('/producto/futbol',{waitUntil:'domcontentloaded'});
    await page.getByRole('list',{name:'Réplicas'}).getByRole('link',{name:family.label,exact:true}).click();
    await expect(page).toHaveURL(new RegExp('/colecciones/'+family.slug+'/?$'),{timeout:30_000});
    const photos=page.locator('.scope-grid a');
    await expect(photos).toHaveCount(16);
    const allowed=new Set(family.albums.flatMap(id=>{
      const data=JSON.parse(readFileSync(join(process.cwd(),'public/assets/colecciones',id+'.json'),'utf8')) as {images:{src:string}[]};
      return data.images.map(photo=>photo.src);
    }));
    for(const src of await photos.evaluateAll(items=>items.map(item=>item.getAttribute('href')))) expect(allowed.has(src!)).toBe(true);
    await expect(page.locator('.pd-line-options')).toHaveCount(0);
  }
});
