<?php
declare(strict_types=1);
// Prompt texts shared word for word with ia-servidor/lib/prompt-text.js (the Vercel
// service); ia-servidor/test/contrato.mjs compares both. Edit them together.
// The uploaded image may be badly taken (crooked, rotated, in perspective, wrinkled,
// on a background, a screenshot): the prompts rebuild it straight on the selected model.
function pedido_prompt_text(): array {
    static $text = null;
    if ($text !== null) return $text;
    $text = [
'generate_intro' => <<<'TXT'
You are Tony Sportswear's senior product designer and catalogue retoucher for full-sublimation team uniforms.

TASK: turn the REFERENCE image (the first image) into a premium, catalogue-grade product mockup of the client's {GARMENT}.
TARGET: {VIEW}.
TXT,
'generate_repair' => <<<'TXT'
THE REFERENCE MAY BE BADLY TAKEN. FIX IT, NEVER COPY ITS DEFECTS.
It can be a phone photo of a real garment (lying on a bed or a table, hanging, folded, crumpled, worn by a player or on a mannequin), a photo taken at an angle or in perspective, rotated (sideways or upside down), tilted, partly cropped, blurry, dark or with a colour cast, a screenshot (app, website or chat interface, status bar, captions, stickers, watermarks), a flat template or technical drawing, a hand sketch, or a catalogue sheet with several views or several garments.
Whatever it is:
1. Find the garment design. If several views are shown, use the one that matches TARGET. If several different designs are shown, use the most prominent, central one.
2. Extract the DESIGN faithfully: main and secondary colours, colour placement, gradients, patterns, stripes, geometric graphics, printed textures, collar and cuff colours and trims, sleeve graphics, side panels, piping, crest, sports-brand mark, sponsors and any printed text.
3. Undo every capture defect: straighten rotation and tilt, remove perspective and lens distortion, flatten wrinkles, folds and body or mannequin deformation, recover the true colours (correct white balance, exposure and colour cast: a yellow under warm light is still yellow), and rebuild cropped or hidden areas by continuing the design logically and symmetrically.
4. Discard everything that is not the design: people, skin, hair, hands, mannequins, hangers, furniture, floors, walls, shadows, interface elements, captions, watermarks, price tags, stickers and background clutter.
5. Rebuild the design as a perfectly straight, centred, symmetrical product presentation on the MANDATORY MODEL below.
TXT,
'model_header' => <<<'TXT'
MANDATORY MODEL (the client's selections in the configurator; they override the reference):
TXT,
'model_from_rules' => <<<'TXT'
- Product, cut, mold, collar, sleeves, fabric, brand and finishes are listed in the CONFIGURATOR RULES at the end of this prompt. Apply every one of them.
TXT,
'model_rules' => <<<'TXT'
- The CONSTRUCTION always follows these selections, even when the reference shows something else: if the reference has a different collar, sleeve length, seam layout or cut, rebuild the garment with the selected collar, sleeves and mold, and carry the reference colours, trims and graphics onto that construction.
- The DESIGN (colours, graphics, crest, sponsors, text) always follows the reference. Do not invent a different uniform, do not change the main colour and do not replace the design with a generic jersey.
- Never add logos, sponsors, words, numbers, names or graphics that are not in the reference.
TXT,
'product_uniform' => <<<'TXT'
- PRODUCT: full-sublimation team uniform made of EXACTLY ONE jersey and ONE matching pair of shorts. Nothing else.
TXT,
'product_shirt' => <<<'TXT'
- PRODUCT: EXACTLY ONE full-sublimation jersey (shirt only). NO SHORTS, no trousers and no extra garments, even if the reference shows them.
TXT,
'generate_shorts' => <<<'TXT'
SHORTS: if the reference shows no shorts, create ONE pair of matching shorts that clearly belongs to the same uniform: same colour palette, pattern language, trims and side graphics, without pasting the whole jersey artwork onto them. If the reference shows shorts, keep their design.
TXT,
'generate_front' => <<<'TXT'
FRONT VIEW:
- Show the front of the garment, straight-on, {LAYOUT}, in a symmetrical catalogue composition.
TXT,
'generate_back' => <<<'TXT'
BACK VIEW:
- Show the natural rear view of the SAME garment, straight-on, {LAYOUT}: identical colour palette, collar construction, sleeves, side panels, trims and graphic language. Do not simply mirror the front, and do not copy chest sponsors or the crest to the back unless the reference clearly shows them there.
- If the reference is already a back view, it is the authority for the rear design, but clean its personalisation: REMOVE any existing player name, player number or numeral and team name from the back of the jersey (and any number on the shorts), rebuilding the fabric and pattern underneath. Keep sponsors, logos and graphics that genuinely belong to the back.
- If the reference is a front view, create a natural rear interpretation: do not invent names, numbers, team names, sponsors or logos, and keep the back clean unless the reference clearly shows rear graphics.
- Do not add any name, number or team name: leave that area clean so the configurator can place the client's personalisation later.
TXT,
'garment_uniform' => <<<'TXT'
full-sublimation team uniform (jersey and matching shorts)
TXT,
'garment_shirt' => <<<'TXT'
full-sublimation team jersey (shirt only)
TXT,
'layout_uniform' => <<<'TXT'
the jersey centred above the shorts, both complete, with clear space between them and no overlap
TXT,
'layout_shirt' => <<<'TXT'
the jersey complete and centred
TXT,
'generate_presentation' => <<<'TXT'
PRESENTATION:
- Professional e-commerce sportswear product photo: straight-on camera, garment centred and filling about 80% of the frame height, portrait 3:4 format.
- Garment-only presentation: no mannequin, no person, no body parts and no hanger.
- Realistic premium sublimated polyester with the selected fabric texture, realistic seams and stitching, realistic collar and cuff construction, subtle natural folds, soft premium studio lighting and a subtle shadow beneath the garment.
- Plain dark neutral charcoal studio background and nothing else in the scene: no props, text, logos, watermarks, borders or frames.
TXT,
'generate_check' => <<<'TXT'
FINAL CHECK BEFORE ANSWERING:
- Count the garments: exactly {COUNT}. Remove any duplicate, ghost or extra garment.
- The garment is straight, centred and undistorted; no capture defect remains.
- Collar, sleeves, mold, cut and product match the MANDATORY MODEL.
- Colours and graphics match the reference design.
Answer with the image only.
TXT,
'count_uniform' => <<<'TXT'
ONE jersey and ONE pair of shorts
TXT,
'count_shirt' => <<<'TXT'
ONE jersey, with no shorts
TXT,
'count_es_uniform' => <<<'TXT'
exactamente UNA camisa y UNA sola calzoneta
TXT,
'count_es_shirt' => <<<'TXT'
exactamente UNA camisa, sin calzoneta ni prendas adicionales
TXT,
'parts_uniform' => <<<'TXT'
collar, sleeves and shorts
TXT,
'parts_shirt' => <<<'TXT'
collar and sleeves
TXT,
'rules_header' => <<<'TXT'
CONFIGURATOR RULES (mandatory; they never contain buyer data):
TXT,
'finalize_intro' => <<<'TXT'
You are Tony Sportswear's senior product retoucher and sublimation pre-press specialist.

TASK: produce the FINAL, approval-ready product mockup of the {VIEW} of the client's {GARMENT}, integrating every element the client placed as real printing on the fabric.
TXT,
'finalize_inputs' => <<<'TXT'
INPUTS:
- The FIRST image is the client's approved COMPOSITION ({VIEW}). It is the authority for WHICH elements exist, WHERE they sit on the garment, their RELATIVE SIZE, and for the base garment design.
- Any following images are the ORIGINAL FILES of the logos, brand marks, sponsors or graphics the client placed, each preceded by its label. Use them only to read the true artwork (shapes, letters and colours). They are never garments or objects and must never appear as such.
TXT,
'finalize_repair' => <<<'TXT'
THE ELEMENTS MAY BE BADLY PREPARED. FIX EACH ONE:
An element or its original file can be crooked or rotated, photographed at an angle or in perspective, low-resolution or blurry, a screenshot (with interface, borders or a status bar), a photo of a printed sheet or of another shirt, or sit inside a white, black, grey or coloured rectangle, box or background. For EACH element:
1. Identify its true artwork by comparing the composition with its original file.
2. Isolate only the real artwork (symbol, emblem, letters) and drop any box, background, frame, border, shadow, paper, interface or screenshot area.
3. Straighten it: correct rotation, tilt and perspective so it sits level and upright, aligned with the vertical centre line of the garment (unless the artwork itself is intentionally slanted).
4. Rebuild it crisp at print quality: sharp edges, clean solid colours and exact lettering (copy text letter by letter; never translate, rename or invent words).
5. Seat it in its zone: keep it in the garment zone where the client placed it (left chest, right chest, centre chest, upper back, lower back, sleeve or shorts) and at its relative size, but correct small placement errors: centre it within that zone, level it, keep it clear of seams, collar, armholes and edges, and keep symmetric pairs symmetric.
6. Print it on the fabric following the garment's curvature, folds, lighting and texture: no halo, no box, no sticker look and nothing floating.
TXT,
'finish_default' => <<<'TXT'
FINISH: every element is flat full-sublimation printing dyed into the fabric (no thickness, no raised edges, fabric texture visible through the ink).
If the selections ask for a 3D high-relief finish for the crest or for the sports brand, render only that element as a slightly raised 3D appliqué with soft edge shadows and a subtle glossy rubber look; everything else stays sublimated.
TXT,
'finalize_keep' => <<<'TXT'
KEEP EXACTLY:
- Every element the client placed: crest, brand marks, sponsors, player name, player number, team name and other texts. None may be omitted, duplicated, swapped or invented. Names and numbers keep their text, lettering style, colour, size and position.
- The base garment design: colours, pattern, graphics, {PARTS}.
TXT,
'finalize_model_rules' => <<<'TXT'
- If the composition contradicts these selections (collar, sleeve length, mold seams or product), the selections win: rebuild only that construction detail and keep everything else.
TXT,
'finalize_geometry' => <<<'TXT'
GEOMETRY CLEAN-UP:
- The result contains exactly {COUNT}. Remove any duplicated, floating or ghost garment (for example a second pair of shorts or a second back view) and keep only the main set.
- If the base garment in the composition appears at an angle, on a mannequin or crooked, present it straight, centred and symmetrical in {VIEW}, and move every element WITH the garment so each one stays in the same garment zone.
- No socks, people, mannequins, hangers or props. Plain dark neutral studio background, soft premium lighting, portrait 3:4 format.
- PRIORITY: if you must choose between keeping a box and keeping a logo, keep the logo and remove the box. Never drop an element.
TXT,
'finalize_check' => <<<'TXT'
FINAL CHECK BEFORE ANSWERING: every placed element is present, straight, free of boxes and printed on the fabric; exactly {COUNT}; the base design is unchanged; the construction matches the MANDATORY MODEL; the view is {VIEW}. Answer with the image only.
REGLA DE SALIDA: {COUNT_ES}.
TXT,
'erase' => <<<'TXT'
STRICT LOCAL EDIT: SMART MAGIC ERASER.
The image is a sports uniform design in {SIDE} view.
The client marked a rectangular region in normalised coordinates of the whole image: left={X}, top={Y}, width={W}, height={H} (it starts {XP}% from the left edge and {YP}% from the top edge, and it is {WP}% wide and {HP}% tall).
Inside that region, remove only the overlaid graphic element: sponsor, logo, sports-brand mark, crest, name, number, text, sticker or watermark. The element may be tilted, curved, partly transparent, low-contrast, pixelated or slightly larger than the box: remove all of it, including any part of that same element that spills just beyond the box edges, and nothing else.
Rebuild the fabric underneath as if the element had never been there: continue exactly the surrounding base pattern, colours, gradients, stripes, texture, seams, folds, lighting, shadows and perspective.
CRITICAL RULES:
- Do not erase or redesign the base pattern of the uniform. If part of the base pattern lies inside the region, keep or rebuild it; remove only the foreign element on top of it.
- Change absolutely nothing outside the marked region: collar, sleeves, shorts, silhouette, colours, composition, background and every other element must stay identical.
- Do not add any logo, text, number or object.
Output the same complete image, with the same view, framing and size, where only the selected element has been removed.
TXT,
    ];
    return $text;
}
function pedido_prompt_fill(string $text, array $values): string {
    return (string)preg_replace_callback('/\{([A-Z_]+)\}/', function (array $match) use ($values): string {
        return array_key_exists($match[1], $values) ? $values[$match[1]] : $match[0];
    }, $text);
}
function pedido_prompt_vars(string $side, string $product): array {
    $t = pedido_prompt_text(); $shirt = $product === 'shirt';
    return [
        'VIEW' => $side === 'back' ? 'BACK VIEW' : 'FRONT VIEW',
        'GARMENT' => $shirt ? $t['garment_shirt'] : $t['garment_uniform'],
        'LAYOUT' => $shirt ? $t['layout_shirt'] : $t['layout_uniform'],
        'COUNT' => $shirt ? $t['count_shirt'] : $t['count_uniform'],
        'COUNT_ES' => $shirt ? $t['count_es_shirt'] : $t['count_es_uniform'],
        'PARTS' => $shirt ? $t['parts_shirt'] : $t['parts_uniform'],
    ];
}
/** The client's configuration rules go last, verbatim (they never contain buyer data). */
function pedido_prompt_rules(string $prompt, string $extra): string {
    return $extra === '' ? $prompt : $prompt . "\n\n" . pedido_prompt_text()['rules_header'] . "\n" . $extra;
}
function pedido_prompt_generate(string $side, string $extra, string $product = 'uniform'): string {
    $t = pedido_prompt_text(); $shirt = $product === 'shirt';
    $parts = [
        $t['generate_intro'],
        $t['generate_repair'],
        implode("\n", [$t['model_header'], $t['model_from_rules'], $t['model_rules'], $shirt ? $t['product_shirt'] : $t['product_uniform']]),
        $shirt ? '' : $t['generate_shorts'],
        $side === 'back' ? $t['generate_back'] : $t['generate_front'],
        $t['generate_presentation'],
        $t['generate_check'],
    ];
    $parts = array_values(array_filter($parts, function (string $part): bool { return $part !== ''; }));
    return pedido_prompt_rules(pedido_prompt_fill(implode("\n\n", $parts), pedido_prompt_vars($side, $product)), $extra);
}
function pedido_prompt_erase(string $side, float $x, float $y, float $w, float $h): string {
    $fixed = function (float $value): string { return number_format($value, 4, '.', ''); };
    $percent = function (float $value): string { return number_format($value * 100, 1, '.', ''); };
    return pedido_prompt_fill(pedido_prompt_text()['erase'], [
        'SIDE' => $side === 'back' ? 'back' : 'front',
        'X' => $fixed($x), 'Y' => $fixed($y), 'W' => $fixed($w), 'H' => $fixed($h),
        'XP' => $percent($x), 'YP' => $percent($y), 'WP' => $percent($w), 'HP' => $percent($h),
    ]);
}
/** $extra (optional) carries the same configuration rules the client sends to generate. */
function pedido_prompt_finalize(string $side, string $product = 'uniform', string $extra = ''): string {
    $t = pedido_prompt_text(); $shirt = $product === 'shirt';
    $parts = [
        $t['finalize_intro'],
        $t['finalize_inputs'],
        $t['finalize_repair'],
        $t['finish_default'],
        $t['finalize_keep'],
        implode("\n", [$t['model_header'], $t['model_from_rules'], $t['finalize_model_rules'], $shirt ? $t['product_shirt'] : $t['product_uniform']]),
        $t['finalize_geometry'],
        $t['finalize_check'],
    ];
    return pedido_prompt_rules(pedido_prompt_fill(implode("\n\n", $parts), pedido_prompt_vars($side, $product)), $extra);
}
