<?php

namespace App\Repositories;

use App\Config\Database;
use App\Entities\Log;
use PDO;

class LogRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query("SELECT * FROM log ORDER BY id_log");
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Log($row), $rows);
    }

    public function save(Log $log): int
    {
        $stmt = $this->db->prepare("INSERT INTO log (nombre) VALUES (:nombre) RETURNING id_log");
        $stmt->execute(['nombre' => $log->nombre]);
        $result = $stmt->fetch();
        return $result['id_log'];
    }
}