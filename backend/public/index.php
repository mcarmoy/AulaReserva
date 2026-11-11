<?php
/**
 * API de AulaReserva con SQLite.
 *
 * GET    /api/health         Comprueba que la API funciona
 * GET    /api/aulas          Lista las aulas
 * GET    /api/reservas       Lista las reservas
 * POST   /api/reservas       Crea una reserva (409 si el hueco ya está ocupado)
 * DELETE /api/reservas/{id}  Cancela una reserva
 */

require_once __DIR__ . '/../src/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

function responder(int $codigo, $datos): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];
$ruta = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

try {
    $pdo = conectarBaseDatos();

    // GET /api/health
    if ($metodo === 'GET' && $ruta === '/api/health') {
        responder(200, ['ok' => true]);
    }

    // GET /api/aulas
    if ($metodo === 'GET' && $ruta === '/api/aulas') {
        $aulas = $pdo->query('SELECT id, nombre, capacidad, ubicacion FROM aulas ORDER BY id')->fetchAll();
        responder(200, $aulas);
    }

    // GET /api/reservas
    if ($metodo === 'GET' && $ruta === '/api/reservas') {
        $reservas = $pdo->query(
            'SELECT r.id, r.aula_id, a.nombre AS aula, r.fecha, r.hora, r.responsable
             FROM reservas r JOIN aulas a ON a.id = r.aula_id
             ORDER BY r.fecha, r.hora'
        )->fetchAll();
        responder(200, $reservas);
    }

    // POST /api/reservas
    if ($metodo === 'POST' && $ruta === '/api/reservas') {
        $datos = json_decode(file_get_contents('php://input'), true) ?? [];

        foreach (['aula_id', 'fecha', 'hora', 'responsable'] as $campo) {
            if (empty($datos[$campo])) {
                responder(400, ['error' => "Falta el campo $campo"]);
            }
        }

        $existeAula = $pdo->prepare('SELECT COUNT(*) FROM aulas WHERE id = ?');
        $existeAula->execute([$datos['aula_id']]);
        if ($existeAula->fetchColumn() == 0) {
            responder(400, ['error' => 'El aula no existe']);
        }

        try {
            $insertar = $pdo->prepare(
                'INSERT INTO reservas (aula_id, fecha, hora, responsable) VALUES (?, ?, ?, ?)'
            );
            $insertar->execute([$datos['aula_id'], $datos['fecha'], $datos['hora'], trim($datos['responsable'])]);
        } catch (PDOException $e) {
            // La restricción UNIQUE(aula_id, fecha, hora) impide reservar un hueco ocupado
            responder(409, ['error' => 'Esa aula ya está reservada en esa fecha y hora']);
        }

        responder(201, ['mensaje' => 'Reserva creada correctamente', 'id' => (int) $pdo->lastInsertId()]);
    }

    // DELETE /api/reservas/{id}
    if ($metodo === 'DELETE' && preg_match('#^/api/reservas/(\d+)$#', $ruta, $partes)) {
        $borrar = $pdo->prepare('DELETE FROM reservas WHERE id = ?');
        $borrar->execute([$partes[1]]);

        if ($borrar->rowCount() === 0) {
            responder(404, ['error' => 'La reserva no existe']);
        }
        responder(200, ['mensaje' => 'Reserva cancelada correctamente']);
    }

    responder(404, ['error' => 'Ruta no encontrada']);
} catch (PDOException $e) {
    responder(500, ['error' => 'Error en la base de datos']);
}