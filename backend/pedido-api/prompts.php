<?php
declare(strict_types=1);
// Prompt text ported from the supplied V279 sources; no configuration or credentials copied.
function pedido_prompt_generate(string $side, string $extra, string $product='uniform'): string {
$viewText=$side==='back'?'BACK VIEW':'FRONT VIEW';
$prompt = <<<PROMPT

You are a professional sportswear product mockup designer.

The uploaded image is the REFERENCE DESIGN.

Create a premium professional soccer uniform product mockup.

TARGET:
{$viewText}

CRITICAL RULE:

The final image must contain EXACTLY:

1 soccer jersey
1 matching pair of soccer shorts

TOTAL GARMENTS:
TWO GARMENTS ONLY.

DO NOT CREATE:

- duplicate jersey
- second jersey
- duplicate shorts
- second shorts
- ghost clothing
- clothing behind the uniform
- mannequin
- human model
- human body
- arms
- hands
- legs
- head
- socks
- shoes
- hanger
- rack
- poster
- advertising board
- packaging
- floating fabric
- extra clothing

REFERENCE FIDELITY IS EXTREMELY IMPORTANT.

Study the uploaded reference carefully.

Preserve as faithfully as possible:

- exact main colors
- secondary colors
- color placement
- gradients
- patterns
- geometric graphics
- stripes
- collar shape
- collar colors
- sleeve colors
- sleeve graphics
- sleeve trims
- side panels
- seams
- visible crest
- visible sports brand
- visible sponsors
- visible text
- distinctive visual identity

DO NOT invent a different uniform.

DO NOT change the main color.

DO NOT replace the design with a generic football jersey.

DO NOT remove important visual elements visible in the reference.

If the reference contains only a jersey and no shorts:

Create ONE pair of matching soccer shorts that clearly belongs
to the SAME uniform.

The shorts must use the same:

- color palette
- pattern language
- trims
- side graphics
- design identity

But do not simply paste the entire shirt artwork onto the shorts.

FRONT VIEW:

If TARGET is FRONT VIEW:

- show the jersey directly from the front
- show the shorts directly from the front
- jersey centered above shorts
- full jersey visible
- full shorts visible
- clear space between jersey and shorts
- no overlapping garments
- symmetrical catalog composition

BACK VIEW:

If TARGET is BACK VIEW:

Generate the natural rear view of the SAME uniform.

Maintain:

- identical color palette
- same collar construction
- same sleeve construction
- same sleeve colors
- same side panels
- same trims
- same graphic design language

Do not simply mirror the front.

Do not copy a chest sponsor to the back unless the reference
clearly indicates that it belongs there.

PRODUCT PRESENTATION:

- professional sportswear ecommerce mockup
- straight-on camera
- centered composition
- realistic premium sports fabric
- realistic seams
- realistic stitching
- subtle natural fabric folds
- realistic collar construction
- realistic shorts construction
- no mannequin
- garment-only presentation
- dark neutral studio background
- soft premium studio lighting
- subtle shadow beneath garments
- high-end commercial sportswear presentation

BEFORE GENERATING:

Count all visible garments.

The answer must be:

ONE JERSEY.
ONE PAIR OF SHORTS.

If an extra garment exists, remove it.

IMPORTANT BACK VIEW RULES:

If the uploaded reference is already a BACK VIEW:
Treat that uploaded image as the authoritative rear design FOR THE GARMENT STYLE, COLORS, SPONSORS AND GRAPHICS, but CLEAN the shirt-back personalization layer.

MANDATORY CLEANUP ON THE BACK SHIRT ONLY:
- REMOVE any existing player name on the back shirt
- REMOVE any existing player number or numeral on the back shirt
- REMOVE any existing team name on the back shirt

ONLY those 3 shirt-back personalization elements must be removed.

Preserve all other rear elements exactly as closely as possible:
- sponsors if present
- logos if present
- graphics
- colors
- patterns
- collar
- sleeves
- trims
- side panels
- shorts design and shorts details

Do NOT remove sponsors, brand marks, crests, trims or other design graphics.
Do NOT add a new player name, player number or team name at this generation stage. Leave that shirt-back area clean so the configurator can place the new personalized elements later.

If the uploaded reference is a FRONT VIEW and TARGET is BACK VIEW:
Create a natural rear interpretation of the same uniform.

In this case:
- DO NOT invent a player name
- DO NOT invent a player number
- DO NOT invent a team name
- DO NOT invent sponsors
- DO NOT invent logos
- DO NOT copy the chest sponsor onto the back
- keep the back clean unless the reference clearly indicates rear graphics or sponsor graphics
- preserve the same colors, collar, sleeves, trims, side panels and design language

The back must look like the same uniform viewed from behind, not a different design. The back shirt must remain free of old name/number/team-name personalization so the configurator can place the new ones later.

FINAL RESULT:

EXACTLY ONE SOCCER JERSEY
+
EXACTLY ONE MATCHING PAIR OF SOCCER SHORTS.

PROMPT;
if($product==='shirt'){
    // Keep the legacy uniform prompt unchanged; remove its shorts-specific clauses for the shirt-only product.
    $prompt=preg_replace('/If the reference contains only a jersey and no shorts:.*?(?=FRONT VIEW:)/s','',$prompt);
    $prompt=preg_replace('/^.*shorts.*\R?/mi','',$prompt);
    $prompt=preg_replace('/^\+\s*$/m','',$prompt);
    $prompt=str_replace(['TWO GARMENTS ONLY.','TWO GARMENTS ONLY','professional soccer uniform product mockup'],['ONE GARMENT ONLY.','ONE GARMENT ONLY','professional sports shirt product mockup'],$prompt);
    $prompt.="\nPRODUCT RULE: exactly ONE shirt only. NO SHORTS, no extra garments. Preserve the shirt artwork, collar, sleeves, logos and selected front/back view.\n";
}
if($extra!=='')$prompt.="\nCLIENT PLACEMENT RULES:\n".$extra;
return $prompt;
}
function pedido_prompt_erase(string $side, float $x,float $y,float $w,float $h): string {
$side=$side==='back'?'trasera':'frontal';
$prompt = "BORRADOR MÁGICO INTELIGENTE — EDICIÓN LOCAL ESTRICTA. "
    . "Esta imagen es un uniforme deportivo ya diseñado en vista {$side}. "
    . "El usuario marcó una región rectangular normalizada: izquierda={$x}, arriba={$y}, ancho={$w}, alto={$h}. "
    . "Dentro de ESA REGIÓN identifica y elimina únicamente el elemento gráfico superpuesto que parezca patrocinador, logotipo, marca deportiva, escudo, nombre, número o texto. "
    . "Reconstruye de forma natural la tela que estaba detrás: continúa exactamente el patrón, textura, colores, costuras, sombras, iluminación, pliegues y perspectiva circundantes. "
    . "REGLA CRÍTICA: NO borres ni rediseñes el patrón base del uniforme. "
    . "NO cambies absolutamente nada fuera de la región marcada. "
    . "NO cambies cuello, mangas, calzoneta, silueta, colores, composición, fondo ni otros elementos. "
    . "Si dentro de la región hay parte del patrón base, consérvalo/reconstrúyelo; elimina solo el elemento gráfico ajeno que está encima. "
    . "No agregues ningún logo, texto, número ni objeto nuevo. "
    . "La salida debe ser la misma imagen completa, misma vista y encuadre, con únicamente el elemento seleccionado eliminado y la tela reconstruida como si nunca hubiera estado allí.";
return $prompt;
}
function pedido_prompt_finalize(string $side, string $product='uniform'): string {
$isBack=$side==='back';$side=$isBack?'trasera':'frontal';
$prompt="ACABADO PROFESIONAL DE UNIFORME — MODO COMPOSICIÓN ESTRICTA. La PRIMERA imagen es la composición completa aprobada por el cliente en vista {$side}. Es la referencia obligatoria de POSICIÓN, TAMAÑO y DISEÑO. Las imágenes adicionales, si existen, son los ARCHIVOS ORIGINALES de logos, marcas, textos gráficos o patrocinadores que el cliente colocó. Úsalas para identificar con precisión el contenido real dentro de cualquier captura o rectángulo. NO copies el fondo rectangular de esas imágenes. Recorta mentalmente/aisla únicamente el logo, letras o símbolo real y aplícalo como impresión/sublimación integrada a la tela. Conserva TODOS los logos, marcas, patrocinadores, nombres, números y textos colocados por el cliente y respeta su ubicación y tamaño relativo. IMPORTANTE: un rectángulo de fondo, captura de pantalla o interfaz que rodea a un logo NO es parte del elemento y debe desaparecer. Si un elemento tiene fondo negro, blanco, gris, borde de captura, interfaz, pantalla o caja rectangular, ELIMINA SOLO ESE FONDO/INTERFAZ y conserva el arte real. El resultado debe parecer fabricado: bordes limpios, sin cajas, sin screenshots, siguiendo perspectiva, pliegues, textura, luz y curvatura de la prenda. NO rediseñes el uniforme base; conserva exactamente patrón, colores, cuello, mangas y calzoneta. REGLA DE LIMPIEZA DE GEOMETRÍA: conserva la camisa principal, pero corrige errores de duplicación del mockup. El resultado SIEMPRE debe contener exactamente UNA camisa y UNA sola calzoneta. Si la imagen de entrada dorsal contiene dos calzonetas, una calzoneta flotante, una segunda copia o una prenda duplicada, ELIMINA la duplicada y conserva únicamente la calzoneta que pertenece al set principal. No agregues medias, personas, maniquíes ni objetos. Los archivos adicionales son SOLO referencias gráficas y jamás deben convertirse en prendas u objetos. Cada logo o patrocinador debe quedar sin su fondo rectangular, conservando únicamente su símbolo/letras/arte y fundiéndose con la tela como sublimación profesional. PRIORIDAD MÁXIMA: no omitas ningún elemento colocado por el cliente. Compara la composición con cada referencia adicional, identifica el arte correcto y reprodúcelo sobre la tela en la misma zona. Si debes elegir entre conservar una caja o conservar el logo, conserva el logo y elimina la caja. NO inventes, sustituyas, traduzcas, dupliques ni elimines logos, patrocinadores, marcas, textos o números. REGLA DE SALIDA {$side}: exactamente UNA camisa y UNA calzoneta. ".($isBack?"La camisa debe verse únicamente por detrás; jamás generes dos dorsales ni dos uniformes.":"La camisa debe verse únicamente de frente.")." Antes de responder verifica: todos los elementos agregados siguen presentes; ningún elemento conserva caja rectangular; solo hay una camisa; el diseño base no cambió.";
if($product==='shirt'){
    $prompt=preg_replace('/El resultado SIEMPRE debe contener exactamente UNA camisa y UNA sola calzoneta\. Si la imagen.*?set principal\./u','El resultado SIEMPRE debe contener exactamente UNA camisa, sin calzoneta ni prendas adicionales.',$prompt);
    $prompt=str_replace(['cuello, mangas y calzoneta','exactamente UNA camisa y UNA calzoneta'],['cuello y mangas','exactamente UNA camisa, sin calzoneta'],$prompt);
    $prompt.=' PRODUCTO SOLICITADO: solo camisa. No agregues calzonetas. Mantén todos los elementos y la vista aprobada de esa única camisa.';
}
return $prompt;
}
