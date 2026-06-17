<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Entities\User;

class UserService
{
    private UserRepository $userRepo;

    public function __construct()
    {
        $this->userRepo = new UserRepository();
    }

    public function getProfile(int $userId): ?User
    {
        return $this->userRepo->findById($userId);
    }

    public function updateProfile(int $userId, array $data): User
    {
        $user = $this->userRepo->findById($userId);
        if (!$user) {
            throw new \Exception("Usuario no encontrado", 404);
        }
        if (isset($data['nombre'])) $user->nombre = $data['nombre'];
        if (isset($data['email'])) $user->email = $data['email'];
        if (isset($data['notificaciones_activas'])) $user->notificaciones_activas = (bool)$data['notificaciones_activas'];
        // No se actualiza plan_actual aquí (se maneja con suscripciones)
        $this->userRepo->update($user);
        return $user;
    }

    public function changePassword(int $userId, string $oldPassword, string $newPassword): void
    {
        $user = $this->userRepo->findById($userId);
        if (!$user || !password_verify($oldPassword, $user->password)) {
            throw new \Exception("Contraseña actual incorrecta", 401);
        }
        $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
        $this->userRepo->updatePassword($userId, $hashed);
    }

    public function deleteAccount(int $userId): void
    {
        $deleted = $this->userRepo->delete($userId);
        if (!$deleted) {
            throw new \Exception("No se pudo eliminar la cuenta", 400);
        }
    }
}