<?php

namespace App\Controllers;

use App\Services\UserService;

class UserController
{
    private UserService $userService;

    public function __construct()
    {
        $this->userService = new UserService();
    }

    public function getProfile($userId)
    {
        $user = $this->userService->getProfile($userId);
        if (!$user) {
            $this->sendJson(404, ['error' => 'Usuario no encontrado']);
        }
        $this->sendJson(200, $user->toArray());
    }

    public function updateProfile($userId)
    {
        $input = json_decode(file_get_contents('php://input'), true);
        try {
            $user = $this->userService->updateProfile($userId, $input);
            $this->sendJson(200, $user->toArray());
        } catch (\Exception $e) {
            $this->sendJson($e->getCode() ?: 400, ['error' => $e->getMessage()]);
        }
    }

    public function changePassword($userId)
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $old = $input['old_password'] ?? '';
        $new = $input['new_password'] ?? '';
        try {
            $this->userService->changePassword($userId, $old, $new);
            $this->sendJson(200, ['message' => 'Contraseña actualizada']);
        } catch (\Exception $e) {
            $this->sendJson($e->getCode() ?: 400, ['error' => $e->getMessage()]);
        }
    }

    public function deleteAccount($userId)
    {
        try {
            $this->userService->deleteAccount($userId);
            $this->sendJson(204, null);
        } catch (\Exception $e) {
            $this->sendJson(400, ['error' => $e->getMessage()]);
        }
    }

    private function sendJson($statusCode, $data)
    {
        // Asegurar que el código sea un entero válido
        $statusCode = is_int($statusCode) ? $statusCode : 400;
        http_response_code($statusCode);
        header('Content-Type: application/json');
        if ($data !== null) {
            echo json_encode($data);
        }
        exit;
    }
}