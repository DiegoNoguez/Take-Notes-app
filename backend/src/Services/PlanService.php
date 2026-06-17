<?php

namespace App\Services;

use App\Repositories\PlanRepository;

class PlanService
{
    private PlanRepository $planRepo;

    public function __construct()
    {
        $this->planRepo = new PlanRepository();
    }

    public function getAllPlans(): array
    {
        return $this->planRepo->findAll();
    }
}