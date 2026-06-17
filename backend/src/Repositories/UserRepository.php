<?php
namespace App\Repositories;

use App\Config\Database;
use App\Entities\User;
use PDO;

class UserRepository
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

    public function findByEmail(string $email): ?User
    {
        $stmt = $this->db->prepare("SELECT * FROM usuario WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }

    public function findById(int $id): ?User
    {
        $stmt = $this->db->prepare("SELECT * FROM usuario WHERE id_usuario = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? new User($row) : null;
    }

    public function save(User $user): int
    {
        $sql = "INSERT INTO usuario (nombre, email, password, notificaciones_activas, plan_actual)
                VALUES (:nombre, :email, :password, :notificaciones, :plan_actual)
                RETURNING id_usuario";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'nombre'         => $user->nombre,
            'email'          => $user->email,
            'password'       => $user->password,
            'notificaciones' => $this->boolToSql($user->notificaciones_activas),
            'plan_actual'    => $user->plan_actual,
        ]);
        $result = $stmt->fetch();
        return $result['id_usuario'];
    }

    public function update(User $user): bool
    {
        $sql = "UPDATE usuario SET nombre = :nombre, email = :email,
                notificaciones_activas = :notificaciones, plan_actual = :plan_actual
                WHERE id_usuario = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id'             => $user->id_usuario,
            'nombre'         => $user->nombre,
            'email'          => $user->email,
            'notificaciones' => $this->boolToSql($user->notificaciones_activas),
            'plan_actual'    => $user->plan_actual,
        ]);
    }

    public function updatePassword(int $userId, string $hashedPassword): bool
    {
        $stmt = $this->db->prepare("UPDATE usuario SET password = :pass WHERE id_usuario = :id");
        return $stmt->execute(['id' => $userId, 'pass' => $hashedPassword]);
    }

    public function delete(int $userId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM usuario WHERE id_usuario = :id");
        return $stmt->execute(['id' => $userId]);
    }
}