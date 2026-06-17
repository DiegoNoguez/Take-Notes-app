<?php

namespace App\Entities;

class Reminder
{
    public ?int $id_recordatorio = null;
    public string $fecha;       // DATE
    public string $hora;        // TIME
    public ?string $mensaje = null;
    public int $id_nota;

    public function __construct(array $data = [])
    {
        $this->id_recordatorio = $data['id_recordatorio'] ?? null;
        $this->fecha = $data['fecha'] ?? date('Y-m-d');
        $this->hora = $data['hora'] ?? '00:00:00';
        $this->mensaje = $data['mensaje'] ?? null;
        $this->id_nota = $data['id_nota'] ?? 0;
    }
}