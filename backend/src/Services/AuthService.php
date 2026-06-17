<?php

namespace App\Services;

use App\Repositories\UserRepository;
use App\Entities\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthService
{
    private UserRepository $userRepo;
    private string $jwtSecret;
    private int $jwtExpires;

    public function __construct()
    {
        $this->userRepo = new UserRepository();
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? 'default_secret_change_me';
        $this->jwtExpires = (int)($_ENV['JWT_EXPIRES'] ?? 86400);
    }

    /**
     * Registra un nuevo usuario.
     * Lanza excepción si el email ya existe.
     */
    public function register(array $data): User
    {
        // Verificar si ya existe el email
        if ($this->userRepo->findByEmail($data['email'])) {
            throw new \Exception("El email ya está registrado", 400);
        }

        $user = new User($data);
        $user->password = password_hash($data['password'], PASSWORD_BCRYPT);
        $userId = $this->userRepo->save($user);
        $user->id_usuario = $userId;
        return $user;
    }

    /**
     * Autentica a un usuario y devuelve un token JWT.
     */
    public function login(string $email, string $password): array
    {
        $user = $this->userRepo->findByEmail($email);
        if (!$user || !password_verify($password, $user->password)) {
            throw new \Exception("Credenciales inválidas", 401);
        }

        $payload = [
            'sub' => $user->id_usuario,
            'email' => $user->email,
            'iat' => time(),
            'exp' => time() + $this->jwtExpires
        ];

        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');
        return ['token' => $token, 'user' => $user->toArray()];
    }

    /**
     * Valida un token JWT y devuelve el ID del usuario.
     */
    public function validateToken(string $token): ?int
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return $decoded->sub ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }
}