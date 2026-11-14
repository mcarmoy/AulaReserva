# Imagen base con PHP 8.3 y Apache
FROM php:8.3-apache

# Instalar SQLite
RUN apt-get update && apt-get install -y libsqlite3-dev && docker-php-ext-install pdo_sqlite

# Copiar los archivos de AulaReserva
COPY backend/ /var/www/backend/
COPY frontend/ /var/www/frontend/
COPY database/ /var/www/database/

# Configurar el directorio web de Apache
RUN sed -i 's!/var/www/html!/var/www/backend/public!g' /etc/apache2/sites-available/000-default.conf

# Configurar las rutas de la aplicacion
RUN printf '%s\n' \
    '<Directory /var/www/backend/public>' \
    'Require all granted' \
    'DirectoryIndex router.php' \
    'FallbackResource /router.php' \
    '</Directory>' \
    > /etc/apache2/conf-available/aulareserva.conf \
    && a2enconf aulareserva

# Configurar la ruta de SQLite
ENV DB_PATH=/var/www/data/aulareserva.sqlite

# Crear el directorio de datos
RUN mkdir -p /var/www/data

# Copiar el script de inicio
COPY docker-start.sh /usr/local/bin/docker-start.sh

# Puerto utilizado por Apache
EXPOSE 80

# Iniciar la aplicacion
CMD ["sh", "/usr/local/bin/docker-start.sh"]