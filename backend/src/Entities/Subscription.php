<?php

namespace App\Entities;

/**
 * Representa una suscripción de un usuario a un plan.
 * Tabla: suscripcion
 */
class Subscription
{
    public ?int $id_suscripcion = null;
    public string $fecha_inicio;      // DATE
    public ?string $fecha_fin = null; // DATE
    public ?string $metodo_pago = null;
    public int $id_usuario;
    public int $id_plan;
    public ?string $ultimo_pago = null; // DATE

    public function __construct(array $data = [])
    {
        $this->id_suscripcion = $data['id_suscripcion'] ?? null;
        $this->fecha_inicio = $data['fecha_inicio'] ?? date('Y-m-d');
        $this->fecha_fin = $data['fecha_fin'] ?? null;
        $this->metodo_pago = $data['metodo_pago'] ?? null;
        $this->id_usuario = $data['id_usuario'] ?? 0;
        $this->id_plan = $data['id_plan'] ?? 0;
        $this->ultimo_pago = $data['ultimo_pago'] ?? null;
    }

    public function toArray(): array
    {
        return [
            'id_suscripcion' => $this->id_suscripcion,
            'fecha_inicio' => $this->fecha_inicio,
            'fecha_fin' => $this->fecha_fin,
            'metodo_pago' => $this->metodo_pago,
            'id_usuario' => $this->id_usuario,
            'id_plan' => $this->id_plan,
            'ultimo_pago' => $this->ultimo_pago
        ];
    }
}