<?php

namespace App\Controllers;

use App\Services\SubscriptionService;

class SubscriptionController
{
    private SubscriptionService $subscriptionService;

    public function __construct()
    {
        $this->subscriptionService = new SubscriptionService();
    }

    public function getActive($userId)
    {
        $subscription = $this->subscriptionService->getActiveSubscription($userId);
        $this->sendJson(200, $subscription ? $subscription->toArray() : null);
    }

    public function cancel($userId)
    {
        try {
            $this->subscriptionService->cancelSubscription($userId);
            $this->sendJson(200, ['message' => 'Suscripción cancelada']);
        } catch (\Exception $e) {
            $this->sendJson($e->getCode() ?: 400, ['error' => $e->getMessage()]);
        }
    }

    /**
     * Endpoint para iniciar pago con Stripe.
     * Recibe { "plan_id": 1, "success_url": "...", "cancel_url": "..." }
     */
    /**
     * Endpoint para iniciar pago con Stripe.
     * Recibe { "plan_id": 1, "ciclo": "mensual"|"anual", "success_url": "...", "cancel_url": "..." }
     */
    public function createCheckoutSession($userId)
    {
        $input      = json_decode(file_get_contents('php://input'), true);
        $planId     = $input['plan_id']     ?? 0;
        $successUrl = $input['success_url'] ?? '';
        $cancelUrl  = $input['cancel_url']  ?? '';

        // ciclo: 'mensual' por defecto si no se envía
        $ciclo = in_array($input['ciclo'] ?? '', ['mensual', 'anual'])
            ? $input['ciclo']
            : 'mensual';

        try {
            $url = $this->subscriptionService->createStripeCheckoutSession(
                $userId, $planId, $successUrl, $cancelUrl, $ciclo
            );
            $this->sendJson(200, ['checkout_url' => $url]);
        } catch (\Exception $e) {
            $this->sendJson(400, ['error' => $e->getMessage()]);
        }
    }

        // Webhook de Stripe (sin autenticación) - se manejaría en otra ruta pública
    public function handleStripeWebhook()
    {
        $payload        = @file_get_contents('php://input');
        $sig_header     = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $webhook_secret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '';

        if (empty($webhook_secret)) {
            http_response_code(400);
            echo json_encode(['error' => 'Webhook secret not configured']);
            exit;
        }

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $webhook_secret);
        } catch (\UnexpectedValueException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid payload']);
            exit;
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid signature']);
            exit;
        }

        switch ($event->type) {
            case 'checkout.session.completed':
                $session = $event->data->object;
                $userId  = $session->metadata->user_id ?? null;
                $planId  = $session->metadata->plan_id ?? null;
                // ─── Lee ciclo desde metadata — guardado al crear la sesión ────
                // 'mensual' por defecto si no viene (retrocompatibilidad)
                $ciclo   = $session->metadata->ciclo ?? 'mensual';

                if ($userId && $planId) {
                    try {
                        // Pasa ciclo para que createSubscription calcule fecha_fin:
                        // mensual → +1 mes | anual → +1 año
                        $this->subscriptionService->createSubscription(
                            (int)$userId,
                            (int)$planId,
                            'stripe',
                            $ciclo
                        );
                        http_response_code(200);
                        echo json_encode(['status' => 'subscription created']);
                    } catch (\Exception $e) {
                        // Devolvemos 200 para que Stripe no reintente el webhook
                        error_log('Error creating subscription: ' . $e->getMessage());
                        http_response_code(200);
                        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing user_id or plan_id in metadata']);
                }
                break;

            default:
                // Evento no manejado — siempre 200 para que Stripe no reintente
                http_response_code(200);
                echo json_encode(['status' => 'unhandled event']);
        }
        exit;
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