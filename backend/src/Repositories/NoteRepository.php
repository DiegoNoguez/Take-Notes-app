<?php
namespace App\Repositories;

use App\Config\Database;
use App\Entities\Note;
use PDO;

class NoteRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    private function boolToSql(bool $val): string
    {
        return $val ? 'true' : 'false';
    }

    public function findByUserId(int $userId, bool $includeTrash = false): array
    {
        $sql = "SELECT * FROM nota WHERE id_usuario = :userId";
        if (!$includeTrash) {
            $sql .= " AND papelera = false";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['userId' => $userId]);
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => new Note($row), $rows);
    }

    public function findById(int $noteId, int $userId): ?Note
    {
        $stmt = $this->db->prepare("SELECT * FROM nota WHERE id_nota = :id AND id_usuario = :userId");
        $stmt->execute(['id' => $noteId, 'userId' => $userId]);
        $row = $stmt->fetch();
        return $row ? new Note($row) : null;
    }

    public function save(Note $note): int
    {
        $sql = "INSERT INTO nota (titulo, contenido, fecha_creacion, fecha_modificacion, favorito, esta_archivado, papelera, id_usuario, id_categoria)
                VALUES (:titulo, :contenido, :fecha_creacion, :fecha_modificacion, :favorito, :archivado, :papelera, :userId, :catId)
                RETURNING id_nota";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'titulo'            => $note->titulo,
            'contenido'         => $note->contenido,
            'fecha_creacion'    => $note->fecha_creacion,
            'fecha_modificacion' => $note->fecha_modificacion,
            'favorito'          => $this->boolToSql($note->favorito),
            'archivado'         => $this->boolToSql($note->esta_archivado),
            'papelera'          => $this->boolToSql($note->papelera),
            'userId'            => $note->id_usuario,
            'catId'             => $note->id_categoria,
        ]);
        $result = $stmt->fetch();
        return $result['id_nota'];
    }

    public function update(Note $note): bool
    {
        $sql = "UPDATE nota SET titulo = :titulo, contenido = :contenido, fecha_modificacion = :fecha_mod,
                    favorito = :favorito, esta_archivado = :archivado, papelera = :papelera, id_categoria = :catId
                WHERE id_nota = :id AND id_usuario = :userId";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id'       => $note->id_nota,
            'userId'   => $note->id_usuario,
            'titulo'   => $note->titulo,
            'contenido' => $note->contenido,
            'fecha_mod' => date('Y-m-d H:i:s'),
            'favorito'  => $this->boolToSql($note->favorito),
            'archivado' => $this->boolToSql($note->esta_archivado),
            'papelera'  => $this->boolToSql($note->papelera),
            'catId'     => $note->id_categoria,
        ]);
    }

    public function delete(int $noteId, int $userId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM nota WHERE id_nota = :id AND id_usuario = :userId");
        return $stmt->execute(['id' => $noteId, 'userId' => $userId]);
    }
}