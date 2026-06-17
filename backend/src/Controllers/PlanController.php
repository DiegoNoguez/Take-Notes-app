<?php

namespace App\Controllers;

use App\Services\PlanService;

class PlanController
{
    private PlanService $planService;

    public function __construct()
    {
        $this->planService = new PlanService();
    }

    public function getAll()
    {
        $plans = $this->planService->getAllPlans();
        $this->sendJson(200, $plans);
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