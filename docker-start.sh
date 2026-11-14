#!/bin/sh

set -e

# Crear las tablas de SQLite si no existen
php -r '
$db = new PDO("sqlite:" . getenv("DB_PATH"));
$db->exec(file_get_contents("/var/www/database/schema.sql"));
'

# Asignar permisos a Apache
chown -R www-data:www-data /var/www/data

# Arrancar Apache
exec apache2-foreground