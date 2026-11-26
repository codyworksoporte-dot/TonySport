// Multipart parsing and validation of the three AI endpoints.
import {BODY_LIMIT, FILE_LIMIT, MAX_ASSETS, META_LIMIT, RULES_LIMIT, SPEC_LIMIT, TOTAL_LIMIT} from './config.js';
import {HttpError, fail, readBody} from './http.js';
import {sniffImage} from './images.js';

const tooLarge = () => new HttpError(413, 'too_large', 'Las imágenes superan 4,4 MB. Vuelve a intentarlo: el editor las comprime antes de enviarlas.');

export async function readForm(request) {
  const type = request.headers.get('content-type') || '';
  if (!/^multipart\/form-data;\s*boundary=/i.test(type)) fail(415, 'content_type', 'Envía las imágenes como formulario multipart.');
  const raw = await readBody(request, BODY_LIMIT, tooLarge);
  try {
    return await new Response(raw, {headers: {'content-type': type}}).formData();
  } catch {
    fail(400, 'invalid_form', 'El formulario enviado no es válido.');
  }
}

/** Removes control characters (keeps line breaks and tabs) and trims. */
function cleanText(value, limit, label) {
  if (value == null) return '';
  if (typeof value !== 'string') fail(422, 'invalid_field', `El campo ${label} no es válido.`);
  const text = value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (text.length > limit) fail(422, 'too_long', `El campo ${label} es demasiado largo.`);
  return text;
}

function choice(value, allowed, fallback, message) {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string' || !allowed.includes(value)) fail(422, 'invalid_choice', message);
  return value;
}

async function imageFrom(file, label) {
  if (file.size > FILE_LIMIT) fail(413, 'too_large', `${label} supera 4 MB.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const info = sniffImage(bytes);
  if (!info) fail(422, 'invalid_image', `${label} no es una imagen PNG, JPG o WebP válida.`);
  return {bytes, mime: info.mime, width: info.width, height: info.height};
}

/**
 * Validated input of generate / magic_eraser / finalize. Only `image` and
 * (for finalize) `assets[]` may carry files.
 */
export async function aiInput(operation, form) {
  let total = 0;
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') continue;
    if (key !== 'image' && key !== 'assets[]' && key !== 'assets') fail(400, 'unexpected_upload', 'El archivo no corresponde a este formulario.');
    total += value.size;
  }
  if (total > TOTAL_LIMIT) throw tooLarge();

  const images = form.getAll('image');
  if (images.length !== 1 || typeof images[0] === 'string') fail(400, 'image_required', 'Adjunta una imagen del uniforme.');
  const files = [...form.getAll('assets[]'), ...form.getAll('assets')];
  if (operation !== 'finalize' && files.length) fail(400, 'unexpected_upload', 'Los elementos adicionales solo se usan al preparar el acabado.');

  const input = {
    operation,
    image: await imageFrom(images[0], 'La imagen del uniforme'),
    side: choice(form.get('side'), ['front', 'back'], 'front', 'Selecciona una vista válida: frontal o dorsal.'),
    product: operation === 'magic_eraser' ? 'uniform' : choice(form.get('product'), ['uniform', 'shirt'], 'uniform', 'Selecciona un producto válido.'),
    rules: '',
    spec: null,
    region: null,
    assets: [],
  };

  if (operation !== 'magic_eraser') {
    input.rules = cleanText(form.get('placementRules') ?? form.get('placement_rules') ?? form.get('prompt'), RULES_LIMIT, 'de indicaciones');
    const spec = cleanText(form.get('spec'), SPEC_LIMIT, 'de configuración');
    if (spec) {
      try { input.spec = JSON.parse(spec); } catch { fail(422, 'invalid_spec', 'La configuración del pedido no es válida.'); }
      if (!input.spec || typeof input.spec !== 'object' || Array.isArray(input.spec)) fail(422, 'invalid_spec', 'La configuración del pedido no es válida.');
    }
  }

  if (operation === 'magic_eraser') {
    const region = {};
    for (const key of ['x', 'y', 'w', 'h']) {
      const raw = form.get(key);
      const value = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
      if (!Number.isFinite(value) || value < 0 || value > 1) fail(422, 'invalid_region', 'Selecciona una región válida para borrar.');
      region[key] = value;
    }
    if (region.w <= 0 || region.h <= 0 || region.x + region.w > 1.00001 || region.y + region.h > 1.00001) fail(422, 'invalid_region', 'La región debe quedar dentro de la imagen.');
    input.region = region;
  }

  if (operation === 'finalize') {
    if (files.length > MAX_ASSETS) fail(400, 'too_many_assets', 'Adjunta hasta 8 elementos originales.');
    let meta = [];
    const rawMeta = cleanText(form.get('assets_meta'), META_LIMIT, 'de elementos');
    if (rawMeta) {
      try { meta = JSON.parse(rawMeta); } catch { fail(422, 'invalid_assets', 'Los elementos del diseño no son válidos.'); }
    }
    if (!Array.isArray(meta) || meta.length > MAX_ASSETS) fail(422, 'invalid_assets', 'Adjunta hasta 8 elementos originales.');
    for (const [index, file] of files.entries()) {
      if (typeof file === 'string') fail(422, 'invalid_assets', 'Un elemento del diseño no es válido.');
      const label = meta[index] ?? {};
      if (!label || typeof label !== 'object' || Array.isArray(label)) fail(422, 'invalid_assets', 'Los datos del elemento no son válidos.');
      input.assets.push({
        ...(await imageFrom(file, `El elemento ${index + 1}`)),
        type: cleanText(typeof label.type === 'string' ? label.type : 'elemento', 50, 'tipo de elemento') || 'elemento',
        name: cleanText(typeof label.name === 'string' ? label.name : 'original', 100, 'nombre del elemento') || 'original',
      });
    }
  }
  return input;
}
