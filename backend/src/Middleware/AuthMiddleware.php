<?php

namespace App\Middleware;

use App\Services\AuthService;

/**
 * Extrae el token JWT del header Authorization y valida.
 * Si es válido, retorna el userId; si no, responde con 401.
 */
class AuthMiddleware
{
    private AuthService $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    /**
     * Verifica el token y devuelve el ID del usuario.
     * En caso de error, envía respuesta JSON y detiene la ejecución.
     */
    public function authenticate(): ?int
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $this->unauthorized('Token no proporcionado');
        }

        $token = $matches[1];
        $userId = $this->authService->validateToken($token);
        if (!$userId) {
            $this->unauthorized('Token inválido o expirado');
        }
        return $userId;
    }

    private function unauthorized($message)
    {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => $message]);
        exit;
    }
}