<?php
/**
 * API de AulaReserva: recibe una reserva por POST en formato JSON.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// El navegador pregunta antes con OPTIONS si puede enviar JSON a otro puerto
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Solo aceptamos POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Leemos el JSON que envía el frontend
$datos = json_decode(file_get_contents('php://input'), true);

// Comprobamos que existen los cuatro datos
$campos = ['aula', 'fecha', 'hora', 'responsable'];
foreach ($campos as $campo) {
    if (empty($datos[$campo])) {
        http_response_code(400);
        echo json_encode(['error' => "Falta el campo $campo"], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

http_response_code(201)
echo json_encode(['mensaje' => 'Reserva recibida correctamente'], JSON_UNESCAPED_UNICODE);