<?php

namespace App\Entities;

class Plan
{
    public ?int $id_plan = null;
    public string $nombre;
    public ?float $precio_mensual = null;
    public ?float $precio_anual = null;

    public function __construct(array $data = [])
    {
        $this->id_plan = $data['id_plan'] ?? null;
        $this->nombre = $data['nombre'] ?? '';
        $this->precio_mensual = isset($data['precio_mensual']) ? (float)$data['precio_mensual'] : null;
        $this->precio_anual = isset($data['precio_anual']) ? (float)$data['precio_anual'] : null;
    }

    public function toArray(): array
    {
        return [
            'id_plan' => $this->id_plan,
            'nombre' => $this->nombre,
            'precio_mensual' => $this->precio_mensual,
            'precio_anual' => $this->precio_anual
        ];
    }
}