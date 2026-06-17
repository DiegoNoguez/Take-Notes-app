<?php

namespace App\Repositories;

use App\Config\Database;
use App\Entities\Subscription;
use PDO;

class SubscriptionRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByUserId(int $userId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM suscripcion WHERE id_usuario = :userId");
        $stmt->execute(['userId' => $userId]);
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Subscription($row), $rows);
    }

    public function findActiveByUserId(int $userId): ?Subscription
    {
        // Asumimos que una suscripción activa es la que tiene fecha_fin NULL o futura
        $stmt = $this->db->prepare(
            "SELECT * FROM suscripcion WHERE id_usuario = :userId 
             AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
             ORDER BY fecha_inicio DESC LIMIT 1"
        );
        $stmt->execute(['userId' => $userId]);
        $row = $stmt->fetch();
        return $row ? new Subscription($row) : null;
    }

    public function save(Subscription $subscription): int
    {
        $sql = "INSERT INTO suscripcion (fecha_inicio, fecha_fin, metodo_pago, id_usuario, id_plan, ultimo_pago)
                VALUES (:fecha_inicio, :fecha_fin, :metodo_pago, :id_usuario, :id_plan, :ultimo_pago)
                RETURNING id_suscripcion";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'fecha_inicio' => $subscription->fecha_inicio,
            'fecha_fin' => $subscription->fecha_fin,
            'metodo_pago' => $subscription->metodo_pago,
            'id_usuario' => $subscription->id_usuario,
            'id_plan' => $subscription->id_plan,
            'ultimo_pago' => $subscription->ultimo_pago
        ]);
        $result = $stmt->fetch();
        return $result['id_suscripcion'];
    }

    public function update(Subscription $subscription): bool
    {
        $sql = "UPDATE suscripcion SET fecha_fin = :fecha_fin, metodo_pago = :metodo_pago, 
                ultimo_pago = :ultimo_pago WHERE id_suscripcion = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $subscription->id_suscripcion,
            'fecha_fin' => $subscription->fecha_fin,
            'metodo_pago' => $subscription->metodo_pago,
            'ultimo_pago' => $subscription->ultimo_pago
        ]);
    }
}