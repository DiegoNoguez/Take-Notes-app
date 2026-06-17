<?php

namespace App\Entities;

class Log
{
    public ?int $id_log = null;
    public string $nombre;

    public function __construct(array $data = [])
    {
        $this->id_log = $data['id_log'] ?? null;
        $this->nombre = $data['nombre'] ?? '';
    }
}