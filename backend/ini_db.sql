-- Tabla usuario
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    notificaciones_activas BOOLEAN DEFAULT TRUE,
    plan_actual INTEGER
);

-- Tabla plan
CREATE TABLE IF NOT EXISTS plan (
    id_plan SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    precio_mensual DECIMAL(10,2),
    precio_anual DECIMAL(10,2)
);

-- Insertar planes de ejemplo
INSERT INTO plan (nombre, precio_mensual, precio_anual) VALUES
('Gratuito', 0, 0),
('Pro', 30, 70),
('Empresa', 150,1200)
ON CONFLICT (id_plan) DO NOTHING;

-- Tabla nota
CREATE TABLE IF NOT EXISTS nota (
    id_nota SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    favorito BOOLEAN DEFAULT FALSE,
    esta_archivado BOOLEAN DEFAULT FALSE,
    papelera BOOLEAN DEFAULT FALSE,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_categoria INTEGER
);

-- Tabla suscripcion
CREATE TABLE IF NOT EXISTS suscripcion (
    id_suscripcion SERIAL PRIMARY KEY,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    metodo_pago VARCHAR(50),
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_plan INTEGER NOT NULL REFERENCES plan(id_plan),
    ultimo_pago DATE
);

-- Tabla log
CREATE TABLE IF NOT EXISTS log (
    id_log SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

-- Tabla recordatorio
CREATE TABLE IF NOT EXISTS recordatorio (
    id_recordatorio SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    mensaje TEXT,
    id_nota INTEGER NOT NULL REFERENCES nota(id_nota) ON DELETE CASCADE
);