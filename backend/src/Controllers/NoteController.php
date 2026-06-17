<?php

namespace App\Controllers;

use App\Services\NoteService;

class NoteController
{
    private NoteService $noteService;

    public function __construct()
    {
        $this->noteService = new NoteService();
    }

    /**
     * Obtener todas las notas del usuario autenticado.
     * Query param ?trash=1 para incluir papelera.
     */
    public function getAll($userId)
    {
        $includeTrash = isset($_GET['trash']) && $_GET['trash'] == '1';
        $notes = $this->noteService->getAllForUser($userId, $includeTrash);
        $this->sendJson(200, $notes);
    }

    public function getOne($userId, $id)
    {
        $note = $this->noteService->getOneForUser((int)$id, $userId);
        if (!$note) {
            $this->sendJson(404, ['error' => 'Nota no encontrada']);
        }
        $this->sendJson(200, $note);
    }

    public function create($userId)
    {
        $input = json_decode(file_get_contents('php://input'), true);
        try {
            $note = $this->noteService->createNote($input, $userId);
            $this->sendJson(201, $note);
        } catch (\Exception $e) {
            $this->sendJson(400, ['error' => $e->getMessage()]);
        }
    }

    public function update($userId, $id)
    {
        $input = json_decode(file_get_contents('php://input'), true);
        try {
            $note = $this->noteService->updateNote((int)$id, $input, $userId);
            $this->sendJson(200, $note);
        } catch (\Exception $e) {
            $code = $e->getCode() === 404 ? 404 : 400;
            $this->sendJson($code, ['error' => $e->getMessage()]);
        }
    }

    public function delete($userId, $id)
    {
        try {
            $this->noteService->deleteNote((int)$id, $userId);
            $this->sendJson(204, null); // Sin contenido
        } catch (\Exception $e) {
            $this->sendJson(404, ['error' => $e->getMessage()]);
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