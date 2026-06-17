<?php
namespace App\Entities;

class Note
{
    public ?int $id_nota = null;
    public string $titulo;
    public string $contenido;
    public string $fecha_creacion;
    public string $fecha_modificacion;
    public bool $favorito = false;
    public bool $esta_archivado = false;
    public bool $papelera = false;
    public int $id_usuario;
    public ?int $id_categoria = null;

    public function __construct(array $data = [])
    {
        $this->id_nota           = $data['id_nota'] ?? null;
        $this->titulo            = $data['titulo'] ?? '';
        $this->contenido         = $data['contenido'] ?? '';
        $this->fecha_creacion    = $data['fecha_creacion'] ?? date('Y-m-d H:i:s');
        $this->fecha_modificacion = $data['fecha_modificacion'] ?? date('Y-m-d H:i:s');
        $this->id_usuario        = $data['id_usuario'] ?? 0;
        $this->id_categoria      = $data['id_categoria'] ?? null;

        // Postgres devuelve "t"/"f" — filter_var lo convierte correctamente
        $this->favorito        = filter_var($data['favorito']        ?? false, FILTER_VALIDATE_BOOLEAN);
        $this->esta_archivado  = filter_var($data['esta_archivado']  ?? false, FILTER_VALIDATE_BOOLEAN);
        $this->papelera        = filter_var($data['papelera']        ?? false, FILTER_VALIDATE_BOOLEAN);
    }
}