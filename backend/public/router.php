<?php
/**
 * Router para el servidor integrado de PHP.
 *
 * Uso, desde la raíz del proyecto:
 *   php -S localhost:8000 -t backend/public backend/public/router.php
 *
 * Las rutas /api/... van a la API (index.php).
 * El resto se sirve desde la carpeta frontend/.
 */

$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (str_starts_with($ruta, '/api/') || $ruta === '/api') {
    require __DIR__ . '/index.php';
    return true;
}

$carpetaFrontend = realpath(__DIR__ . '/../../frontend');
$fichero = realpath($carpetaFrontend . ($ruta === '/' ? '/index.html' : $ruta));

// Solo se sirven ficheros que estén dentro de frontend/
if ($fichero === false || !str_starts_with($fichero, $carpetaFrontend) || !is_file($fichero)) {
    http_response_code(404);
    echo 'No encontrado';
    return true;
}

$tipos = [
    'html' => 'text/html; charset=utf-8',
    'js'   => 'text/javascript; charset=utf-8',
    'css'  => 'text/css; charset=utf-8',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'svg'  => 'image/svg+xml',
];
$extension = strtolower(pathinfo($fichero, PATHINFO_EXTENSION));
header('Content-Type: ' . ($tipos[$extension] ?? 'application/octet-stream'));
readfile($fichero);
return true;