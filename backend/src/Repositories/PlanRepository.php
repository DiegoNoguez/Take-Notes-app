<?php

namespace App\Repositories;

use App\Config\Database;
use App\Entities\Plan;
use PDO;

class PlanRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findAll(): array
    {
        $stmt = $this->db->query("SELECT * FROM plan ORDER BY id_plan");
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Plan($row), $rows);
    }

    public function findById(int $id): ?Plan
    {
        $stmt = $this->db->prepare("SELECT * FROM plan WHERE id_plan = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? new Plan($row) : null;
    }
}