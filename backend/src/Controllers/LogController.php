<?php

namespace App\Controllers;

use App\Services\LogService;

class LogController
{
    private LogService $logService;

    public function __construct()
    {
        $this->logService = new LogService();
    }

    public function getAll()
    {
        $logs = $this->logService->getAllLogs();
        $this->sendJson(200, $logs);
    }

    public function create()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $nombre = $input['nombre'] ?? '';
        if (empty($nombre)) {
            $this->sendJson(400, ['error' => 'El campo "nombre" es requerido']);
        }
        $log = $this->logService->createLog($nombre);
        $this->sendJson(201, $log);
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