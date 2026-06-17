<?php

namespace App\Services;

use App\Repositories\LogRepository;
use App\Entities\Log;

class LogService
{
    private LogRepository $logRepo;

    public function __construct()
    {
        $this->logRepo = new LogRepository();
    }

    public function getAllLogs(): array
    {
        return $this->logRepo->findAll();
    }

    public function createLog(string $nombre): Log
    {
        $log = new Log(['nombre' => $nombre]);
        $id = $this->logRepo->save($log);
        $log->id_log = $id;
        return $log;
    }
}