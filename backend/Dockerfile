FROM php:8.2-cli-bullseye

# Instalar dependencias y extensión para PostgreSQL + unzip para Composer
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo_pgsql zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar composer.json y composer.lock (si existe)
COPY composer.json composer.lock* ./

# Instalar dependencias sin desarrollo
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Copiar el resto del código
COPY . .

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]