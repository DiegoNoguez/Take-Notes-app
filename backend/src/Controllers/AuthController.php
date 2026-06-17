<?php

namespace App\Controllers;

use App\Services\AuthService;

/**
 * Controlador de autenticación (registro, login, verificación).
 */
class AuthController
{
    private AuthService $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    public function register()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        try {
            $user = $this->authService->register($input);
            $this->sendJson(201, ['message' => 'Usuario registrado', 'user' => $user->toArray()]);
        } catch (\Exception $e) {
            $this->sendJson($e->getCode() ?: 400, ['error' => $e->getMessage()]);
        }
    }

    public function login()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        try {
            $result = $this->authService->login($email, $password);
            $this->sendJson(200, $result);
        } catch (\Exception $e) {
            $this->sendJson($e->getCode() ?: 401, ['error' => $e->getMessage()]);
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