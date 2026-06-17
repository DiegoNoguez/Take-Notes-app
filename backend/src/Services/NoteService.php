<?php

namespace App\Services;

use App\Repositories\NoteRepository;
use App\Entities\Note;

class NoteService
{
    private NoteRepository $noteRepo;

    public function __construct()
    {
        $this->noteRepo = new NoteRepository();
    }

    public function getAllForUser(int $userId, bool $includeTrash = false): array
    {
        return $this->noteRepo->findByUserId($userId, $includeTrash);
    }

    public function getOneForUser(int $noteId, int $userId): ?Note
    {
        return $this->noteRepo->findById($noteId, $userId);
    }

    public function createNote(array $data, int $userId): Note
    {
        $note = new Note($data);
        $note->id_usuario = $userId;
        $note->fecha_creacion = date('Y-m-d H:i:s');
        $note->fecha_modificacion = $note->fecha_creacion;
        // 👇 FORZAR BOOLEANOS
        $note->favorito = isset($data['favorito']) ? (bool)$data['favorito'] : false;
        $note->esta_archivado = isset($data['esta_archivado']) ? (bool)$data['esta_archivado'] : false;
        $note->papelera = isset($data['papelera']) ? (bool)$data['papelera'] : false;
        
        $noteId = $this->noteRepo->save($note);
        $note->id_nota = $noteId;
        return $note;
    }

    public function updateNote(int $noteId, array $data, int $userId): Note
    {
        $note = $this->noteRepo->findById($noteId, $userId);
        if (!$note) {
            throw new \Exception("Nota no encontrada", 404);
        }
        
        // Actualizar solo los campos permitidos, forzando booleanos
        if (isset($data['titulo'])) $note->titulo = $data['titulo'];
        if (isset($data['contenido'])) $note->contenido = $data['contenido'];
        if (isset($data['favorito'])) $note->favorito = (bool)$data['favorito'];
        if (isset($data['esta_archivado'])) $note->esta_archivado = (bool)$data['esta_archivado'];
        if (isset($data['papelera'])) $note->papelera = (bool)$data['papelera'];
        if (isset($data['id_categoria'])) $note->id_categoria = $data['id_categoria'];

        $this->noteRepo->update($note);
        return $note;
    }

    public function deleteNote(int $noteId, int $userId): void
    {
        $deleted = $this->noteRepo->delete($noteId, $userId);
        if (!$deleted) {
            throw new \Exception("Nota no encontrada o no se pudo eliminar", 404);
        }
    }
}