<?php
/**
 * Conexión de AulaReserva con SQLite mediante PDO.
 *
 * La ruta de la base de datos se toma de la variable de entorno DB_PATH.
 * Si no está definida, se usa data/aulareserva.sqlite.
 * Si la base de datos todavía no existe, se crea a partir de database/schema.sql.
 */

function conectarBaseDatos(): PDO
{
    $raiz = dirname(__DIR__, 2);
    $rutaBd = getenv('DB_PATH') ?: $raiz . '/data/aulareserva.sqlite';
    $existia = file_exists($rutaBd);

    $carpeta = dirname($rutaBd);
    if (!is_dir($carpeta)) {
        mkdir($carpeta, 0777, true);
    }

    $pdo = new PDO('sqlite:' . $rutaBd);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');

    // Solo se inicializa si la base de datos no existía: así no se pierden reservas
    if (!$existia) {
        $pdo->exec(file_get_contents($raiz . '/database/schema.sql'));
    }

    return $pdo;
}