<?php
declare(strict_types=1);
// Reference only. The API reads the host's environment directly; never hardcode credentials here.
// Do not expose this template through HTTP. Apache denies it in .htaccess.
return [
    'privateDirectory'=>getenv('TONY_PRIVATE_DIR')?:null,
    'pricesFile'=>getenv('TONY_PRICES_FILE')?:null,
    'checkoutFile'=>getenv('TONY_CHECKOUT_FILE')?:null,
    'frontendUrl'=>getenv('TONY_FRONTEND_URL')?:null,
    'allowedOrigins'=>getenv('TONY_ALLOWED_ORIGINS')?:null,
    'apiPublicUrl'=>getenv('TONY_API_PUBLIC_URL')?:null,
    'appSecret'=>getenv('TONY_APP_SECRET')?:null,
    'gemini'=>['enabled'=>getenv('TONY_AI_ENABLED')==='true','key'=>getenv('GEMINI_API_KEY')?:null,'model'=>getenv('GEMINI_IMAGE_MODEL')?:'gemini-3-pro-image','fallback'=>getenv('GEMINI_IMAGE_FALLBACK_MODEL')?:'gemini-3.1-flash-image'],
    'panel'=>['enabled'=>getenv('TONY_PANEL_ENABLED')==='true','url'=>getenv('TONY_PANEL_URL')?:null,'token'=>getenv('TONY_PANEL_TOKEN')?:null],
    'wompi'=>['enabled'=>getenv('TONY_WOMPI_ENABLED')==='true','clientId'=>getenv('WOMPI_CLIENT_ID')?:null,'clientSecret'=>getenv('WOMPI_CLIENT_SECRET')?:null],
];
