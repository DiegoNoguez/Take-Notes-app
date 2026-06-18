<?php
namespace App\Config;

use PDO;
use PDOException;

/**
 * Clase singleton para la conexión PDO a PostgreSQL.
 */
class Database
{
    private static ?Database $instance = null;
    private PDO $connection;

    private function __construct()
    {
        $host   = $_ENV['DB_HOST'] ?? 'localhost';
        $port   = $_ENV['DB_PORT'] ?? '5432';
        $dbname = $_ENV['DB_NAME'] ?? 'neondb';
        $user   = $_ENV['DB_USER'] ?? 'neondb_owner';
        $pass   = $_ENV['DB_PASS'] ?? 'secret123';

        // Neon requiere el endpoint ID para identificar el servidor
        // Se extrae automáticamente de la primera parte del host
        $endpointId = explode('.', $host)[0];

        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require;options=endpoint=$endpointId";

        try {
            $this->connection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            die("Error de conexión a la base de datos: " . $e->getMessage());
        }
    }

    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }
}