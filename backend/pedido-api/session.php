<?php
require __DIR__ . '/core.php';
pedido_run('POST', function () { return pedido_session_create(); }, true);
