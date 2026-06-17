<?php

namespace App\Repositories;

use App\Config\Database;
use App\Entities\Reminder;
use PDO;

class ReminderRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByNoteId(int $noteId): ?Reminder
    {
        $stmt = $this->db->prepare("SELECT * FROM recordatorio WHERE id_nota = :noteId");
        $stmt->execute(['noteId' => $noteId]);
        $row = $stmt->fetch();
        return $row ? new Reminder($row) : null;
    }

    public function save(Reminder $reminder): int
    {
        $sql = "INSERT INTO recordatorio (fecha, hora, mensaje, id_nota)
                VALUES (:fecha, :hora, :mensaje, :id_nota) RETURNING id_recordatorio";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'fecha' => $reminder->fecha,
            'hora' => $reminder->hora,
            'mensaje' => $reminder->mensaje,
            'id_nota' => $reminder->id_nota
        ]);
        $result = $stmt->fetch();
        return $result['id_recordatorio'];
    }

    public function update(Reminder $reminder): bool
    {
        $sql = "UPDATE recordatorio SET fecha = :fecha, hora = :hora, mensaje = :mensaje
                WHERE id_recordatorio = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $reminder->id_recordatorio,
            'fecha' => $reminder->fecha,
            'hora' => $reminder->hora,
            'mensaje' => $reminder->mensaje
        ]);
    }

    public function delete(int $reminderId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM recordatorio WHERE id_recordatorio = :id");
        return $stmt->execute(['id' => $reminderId]);
    }
}