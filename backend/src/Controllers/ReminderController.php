<?php

namespace App\Controllers;

use App\Services\ReminderService;

class ReminderController
{
    private ReminderService $reminderService;

    public function __construct()
    {
        $this->reminderService = new ReminderService();
    }

    public function getByNote($userId, $noteId)
    {
        try {
            $reminder = $this->reminderService->getReminderByNote((int)$noteId, $userId);
            $this->sendJson(200, $reminder);
        } catch (\Exception $e) {
            $this->sendJson($e->getCode() ?: 404, ['error' => $e->getMessage()]);
        }
    }

    public function set($userId, $noteId)
    {
        $input = json_decode(file_get_contents('php://input'), true);
        try {
            $reminder = $this->reminderService->setReminder((int)$noteId, $userId, $input);
            $this->sendJson(200, $reminder);
        } catch (\Exception $e) {
            $this->sendJson($e->getCode() ?: 400, ['error' => $e->getMessage()]);
        }
    }

    public function delete($userId, $noteId)
    {
        try {
            $this->reminderService->deleteReminder((int)$noteId, $userId);
            $this->sendJson(204, null);
        } catch (\Exception $e) {
            $this->sendJson($e->getCode() ?: 404, ['error' => $e->getMessage()]);
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