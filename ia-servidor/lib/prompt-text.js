// Prompt fragments. backend/pedido-api/prompts.php holds the same texts word for
// word (test/contrato.mjs compares them when both folders are present).
// Placeholders in braces are filled in prompts.js / prompts.php.

export const TEXT = Object.freeze({
  generate_intro: `You are Tony Sportswear's senior product designer and catalogue retoucher for full-sublimation team uniforms.

TASK: turn the REFERENCE image (the first image) into a premium, catalogue-grade product mockup of the client's {GARMENT}.
TARGET: {VIEW}.`,

  generate_repair: `THE REFERENCE MAY BE BADLY TAKEN. FIX IT, NEVER COPY ITS DEFECTS.
It can be a phone photo of a real garment (lying on a bed or a table, hanging, folded, crumpled, worn by a player or on a mannequin), a photo taken at an angle or in perspective, rotated (sideways or upside down), tilted, partly cropped, blurry, dark or with a colour cast, a screenshot (app, website or chat interface, status bar, captions, stickers, watermarks), a flat template or technical drawing, a hand sketch, or a catalogue sheet with several views or several garments.
Whatever it is:
1. Find the garment design. If several views are shown, use the one that matches TARGET. If several different designs are shown, use the most prominent, central one.
2. Extract the DESIGN faithfully: main and secondary colours, colour placement, gradients, patterns, stripes, geometric graphics, printed textures, collar and cuff colours and trims, sleeve graphics, side panels, piping, crest, sports-brand mark, sponsors and any printed text.
3. Undo every capture defect: straighten rotation and tilt, remove perspective and lens distortion, flatten wrinkles, folds and body or mannequin deformation, recover the true colours (correct white balance, exposure and colour cast: a yellow under warm light is still yellow), and rebuild cropped or hidden areas by continuing the design logically and symmetrically.
4. Discard everything that is not the design: people, skin, hair, hands, mannequins, hangers, furniture, floors, walls, shadows, interface elements, captions, watermarks, price tags, stickers and background clutter.
5. Rebuild the design as a perfectly straight, centred, symmetrical product presentation on the MANDATORY MODEL below.`,

  model_header: `MANDATORY MODEL (the client's selections in the configurator; they override the reference):`,

  model_from_rules: `- Product, cut, mold, collar, sleeves, fabric, brand and finishes are listed in the CONFIGURATOR RULES at the end of this prompt. Apply every one of them.`,

  model_rules: `- The CONSTRUCTION always follows these selections, even when the reference shows something else: if the reference has a different collar, sleeve length, seam layout or cut, rebuild the garment with the selected collar, sleeves and mold, and carry the reference colours, trims and graphics onto that construction.
- The DESIGN (colours, graphics, crest, sponsors, text) always follows the reference. Do not invent a different uniform, do not change the main colour and do not replace the design with a generic jersey.
- Never add logos, sponsors, words, numbers, names or graphics that are not in the reference.`,

  product_uniform: `- PRODUCT: full-sublimation team uniform made of EXACTLY ONE jersey and ONE matching pair of shorts. Nothing else.`,

  product_shirt: `- PRODUCT: EXACTLY ONE full-sublimation jersey (shirt only). NO SHORTS, no trousers and no extra garments, even if the reference shows them.`,

  generate_shorts: `SHORTS: if the reference shows no shorts, create ONE pair of matching shorts that clearly belongs to the same uniform: same colour palette, pattern language, trims and side graphics, without pasting the whole jersey artwork onto them. If the reference shows shorts, keep their design.`,

  generate_front: `FRONT VIEW:
- Show the front of the garment, straight-on, {LAYOUT}, in a symmetrical catalogue composition.`,

  generate_back: `BACK VIEW:
- Show the natural rear view of the SAME garment, straight-on, {LAYOUT}: identical colour palette, collar construction, sleeves, side panels, trims and graphic language. Do not simply mirror the front, and do not copy chest sponsors or the crest to the back unless the reference clearly shows them there.
- If the reference is already a back view, it is the authority for the rear design, but clean its personalisation: REMOVE any existing player name, player number or numeral and team name from the back of the jersey (and any number on the shorts), rebuilding the fabric and pattern underneath. Keep sponsors, logos and graphics that genuinely belong to the back.
- If the reference is a front view, create a natural rear interpretation: do not invent names, numbers, team names, sponsors or logos, and keep the back clean unless the reference clearly shows rear graphics.
- Do not add any name, number or team name: leave that area clean so the configurator can place the client's personalisation later.`,

  garment_uniform: `full-sublimation team uniform (jersey and matching shorts)`,

  garment_shirt: `full-sublimation team jersey (shirt only)`,

  layout_uniform: `the jersey centred above the shorts, both complete, with clear space between them and no overlap`,

  layout_shirt: `the jersey complete and centred`,

  generate_presentation: `PRESENTATION:
- Professional e-commerce sportswear product photo: straight-on camera, garment centred and filling about 80% of the frame height, portrait 3:4 format.
- Garment-only presentation: no mannequin, no person, no body parts and no hanger.
- Realistic premium sublimated polyester with the selected fabric texture, realistic seams and stitching, realistic collar and cuff construction, subtle natural folds, soft premium studio lighting and a subtle shadow beneath the garment.
- Plain dark neutral charcoal studio background and nothing else in the scene: no props, text, logos, watermarks, borders or frames.`,

  generate_check: `FINAL CHECK BEFORE ANSWERING:
- Count the garments: exactly {COUNT}. Remove any duplicate, ghost or extra garment.
- The garment is straight, centred and undistorted; no capture defect remains.
- Collar, sleeves, mold, cut and product match the MANDATORY MODEL.
- Colours and graphics match the reference design.
Answer with the image only.`,

  count_uniform: `ONE jersey and ONE pair of shorts`,

  count_shirt: `ONE jersey, with no shorts`,

  count_es_uniform: `exactamente UNA camisa y UNA sola calzoneta`,

  count_es_shirt: `exactamente UNA camisa, sin calzoneta ni prendas adicionales`,

  parts_uniform: `collar, sleeves and shorts`,

  parts_shirt: `collar and sleeves`,

  rules_header: `CONFIGURATOR RULES (mandatory; they never contain buyer data):`,

  finalize_intro: `You are Tony Sportswear's senior product retoucher and sublimation pre-press specialist.

TASK: produce the FINAL, approval-ready product mockup of the {VIEW} of the client's {GARMENT}, integrating every element the client placed as real printing on the fabric.`,

  finalize_inputs: `INPUTS:
- The FIRST image is the client's approved COMPOSITION ({VIEW}). It is the authority for WHICH elements exist, WHERE they sit on the garment, their RELATIVE SIZE, and for the base garment design.
- Any following images are the ORIGINAL FILES of the logos, brand marks, sponsors or graphics the client placed, each preceded by its label. Use them only to read the true artwork (shapes, letters and colours). They are never garments or objects and must never appear as such.`,

  finalize_repair: `THE ELEMENTS MAY BE BADLY PREPARED. FIX EACH ONE:
An element or its original file can be crooked or rotated, photographed at an angle or in perspective, low-resolution or blurry, a screenshot (with interface, borders or a status bar), a photo of a printed sheet or of another shirt, or sit inside a white, black, grey or coloured rectangle, box or background. For EACH element:
1. Identify its true artwork by comparing the composition with its original file.
2. Isolate only the real artwork (symbol, emblem, letters) and drop any box, background, frame, border, shadow, paper, interface or screenshot area.
3. Straighten it: correct rotation, tilt and perspective so it sits level and upright, aligned with the vertical centre line of the garment (unless the artwork itself is intentionally slanted).
4. Rebuild it crisp at print quality: sharp edges, clean solid colours and exact lettering (copy text letter by letter; never translate, rename or invent words).
5. Seat it in its zone: keep it in the garment zone where the client placed it (left chest, right chest, centre chest, upper back, lower back, sleeve or shorts) and at its relative size, but correct small placement errors: centre it within that zone, level it, keep it clear of seams, collar, armholes and edges, and keep symmetric pairs symmetric.
6. Print it on the fabric following the garment's curvature, folds, lighting and texture: no halo, no box, no sticker look and nothing floating.`,

  finish_default: `FINISH: every element is flat full-sublimation printing dyed into the fabric (no thickness, no raised edges, fabric texture visible through the ink).
If the selections ask for a 3D high-relief finish for the crest or for the sports brand, render only that element as a slightly raised 3D appliqué with soft edge shadows and a subtle glossy rubber look; everything else stays sublimated.`,

  finalize_keep: `KEEP EXACTLY:
- Every element the client placed: crest, brand marks, sponsors, player name, player number, team name and other texts. None may be omitted, duplicated, swapped or invented. Names and numbers keep their text, lettering style, colour, size and position.
- The base garment design: colours, pattern, graphics, {PARTS}.`,

  finalize_model_rules: `- If the composition contradicts these selections (collar, sleeve length, mold seams or product), the selections win: rebuild only that construction detail and keep everything else.`,

  finalize_geometry: `GEOMETRY CLEAN-UP:
- The result contains exactly {COUNT}. Remove any duplicated, floating or ghost garment (for example a second pair of shorts or a second back view) and keep only the main set.
- If the base garment in the composition appears at an angle, on a mannequin or crooked, present it straight, centred and symmetrical in {VIEW}, and move every element WITH the garment so each one stays in the same garment zone.
- No socks, people, mannequins, hangers or props. Plain dark neutral studio background, soft premium lighting, portrait 3:4 format.
- PRIORITY: if you must choose between keeping a box and keeping a logo, keep the logo and remove the box. Never drop an element.`,

  finalize_check: `FINAL CHECK BEFORE ANSWERING: every placed element is present, straight, free of boxes and printed on the fabric; exactly {COUNT}; the base design is unchanged; the construction matches the MANDATORY MODEL; the view is {VIEW}. Answer with the image only.
REGLA DE SALIDA: {COUNT_ES}.`,

  erase: `STRICT LOCAL EDIT: SMART MAGIC ERASER.
The image is a sports uniform design in {SIDE} view.
The client marked a rectangular region in normalised coordinates of the whole image: left={X}, top={Y}, width={W}, height={H} (it starts {XP}% from the left edge and {YP}% from the top edge, and it is {WP}% wide and {HP}% tall).
Inside that region, remove only the overlaid graphic element: sponsor, logo, sports-brand mark, crest, name, number, text, sticker or watermark. The element may be tilted, curved, partly transparent, low-contrast, pixelated or slightly larger than the box: remove all of it, including any part of that same element that spills just beyond the box edges, and nothing else.
Rebuild the fabric underneath as if the element had never been there: continue exactly the surrounding base pattern, colours, gradients, stripes, texture, seams, folds, lighting, shadows and perspective.
CRITICAL RULES:
- Do not erase or redesign the base pattern of the uniform. If part of the base pattern lies inside the region, keep or rebuild it; remove only the foreign element on top of it.
- Change absolutely nothing outside the marked region: collar, sleeves, shorts, silhouette, colours, composition, background and every other element must stay identical.
- Do not add any logo, text, number or object.
Output the same complete image, with the same view, framing and size, where only the selected element has been removed.`,
});
