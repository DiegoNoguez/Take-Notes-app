<?php
namespace App\Entities;

class User
{
    public ?int $id_usuario = null;
    public string $nombre;
    public string $email;
    public string $password;
    public bool $notificaciones_activas = true;
    public ?int $plan_actual = null;
    public ?string $plan_nombre = null;

    public function __construct(array $data = [])
    {
        $this->id_usuario  = $data['id_usuario'] ?? null;
        $this->nombre      = $data['nombre'] ?? '';
        $this->email       = $data['email'] ?? '';
        $this->password    = $data['password'] ?? '';
        $this->plan_actual = $data['plan_actual'] ?? null;
        $this->plan_nombre = $data['plan_nombre'] ?? null;

        // Postgres devuelve "t"/"f" — filter_var lo convierte correctamente
        $this->notificaciones_activas = filter_var(
            $data['notificaciones_activas'] ?? true,
            FILTER_VALIDATE_BOOLEAN
        );
    }

    public function toArray(): array
    {
        return [
            'id_usuario'            => $this->id_usuario,
            'nombre'                => $this->nombre,
            'email'                 => $this->email,
            'notificaciones_activas' => $this->notificaciones_activas,
            'plan_actual'           => $this->plan_actual,
            'plan_nombre' => $this->plan_nombre,
        ];
    }
}