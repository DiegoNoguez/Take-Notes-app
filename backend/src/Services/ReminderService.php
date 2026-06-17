<?php

namespace App\Services;

use App\Repositories\ReminderRepository;
use App\Repositories\NoteRepository;
use App\Entities\Reminder;

class ReminderService
{
    private ReminderRepository $reminderRepo;
    private NoteRepository $noteRepo;

    public function __construct()
    {
        $this->reminderRepo = new ReminderRepository();
        $this->noteRepo = new NoteRepository();
    }

    public function getReminderByNote(int $noteId, int $userId): ?Reminder
    {
        // Verificar que la nota pertenezca al usuario
        $note = $this->noteRepo->findById($noteId, $userId);
        if (!$note) {
            throw new \Exception("Nota no encontrada", 404);
        }
        return $this->reminderRepo->findByNoteId($noteId);
    }

    public function setReminder(int $noteId, int $userId, array $data): Reminder
    {
        $note = $this->noteRepo->findById($noteId, $userId);
        if (!$note) {
            throw new \Exception("Nota no encontrada", 404);
        }

        $reminder = new Reminder($data);
        $reminder->id_nota = $noteId;
        $existing = $this->reminderRepo->findByNoteId($noteId);
        if ($existing) {
            // Actualizar existente
            $reminder->id_recordatorio = $existing->id_recordatorio;
            $this->reminderRepo->update($reminder);
        } else {
            $id = $this->reminderRepo->save($reminder);
            $reminder->id_recordatorio = $id;
        }
        return $reminder;
    }

    public function deleteReminder(int $noteId, int $userId): void
    {
        $reminder = $this->getReminderByNote($noteId, $userId);
        if (!$reminder) {
            throw new \Exception("Recordatorio no encontrado", 404);
        }
        $this->reminderRepo->delete($reminder->id_recordatorio);
    }
}