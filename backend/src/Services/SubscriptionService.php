<?php
namespace App\Services;

use App\Repositories\SubscriptionRepository;
use App\Repositories\PlanRepository;
use App\Entities\Subscription;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class SubscriptionService
{
    private SubscriptionRepository $subscriptionRepo;
    private PlanRepository $planRepo;

    public function __construct()
    {
        $this->subscriptionRepo = new SubscriptionRepository();
        $this->planRepo = new PlanRepository();

        // Configurar Stripe con clave secreta desde .env
        if (isset($_ENV['STRIPE_SECRET_KEY'])) {
            Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);
        }
    }

    /**
     * Obtiene la suscripción activa del usuario.
     * Usada en GET /subscription/active
     */
    public function getActiveSubscription(int $userId): ?Subscription
    {
        return $this->subscriptionRepo->findActiveByUserId($userId);
    }

    /**
     * Crea una nueva suscripción local tras pago exitoso de Stripe.
     * Llamada desde el webhook (checkout.session.completed).
     * 
     * @param string $ciclo  'mensual' | 'anual' — viene en metadata de Stripe
     */
    public function createSubscription(int $userId, int $planId, string $metodoPago, string $ciclo = 'mensual'): Subscription
    {
        $plan = $this->planRepo->findById($planId);
        if (!$plan) {
            throw new \Exception("Plan no válido", 400);
        }

        $subscription = new Subscription();
        $subscription->fecha_inicio  = date('Y-m-d');
        $subscription->metodo_pago   = $metodoPago;
        $subscription->id_usuario    = $userId;
        $subscription->id_plan       = $planId;
        $subscription->ultimo_pago   = date('Y-m-d');

        // fecha_fin según ciclo:
        // mensual → +1 mes | anual → +1 año | sin ciclo → null (hasta cancelación)
        $subscription->fecha_fin = match($ciclo) {
            'anual'   => date('Y-m-d', strtotime('+1 year')),
            'mensual' => date('Y-m-d', strtotime('+1 month')),
            default   => null,
        };

        $id = $this->subscriptionRepo->save($subscription);
        $subscription->id_suscripcion = $id;

        return $subscription;
    }

    /**
     * Cancela la suscripción activa fijando fecha_fin = hoy.
     * Usada en DELETE /subscription/cancel
     */
    public function cancelSubscription(int $userId): bool
    {
        $active = $this->subscriptionRepo->findActiveByUserId($userId);
        if (!$active) {
            throw new \Exception("No hay suscripción activa", 404);
        }

        $active->fecha_fin = date('Y-m-d');
        return $this->subscriptionRepo->update($active);
    }

    /**
     * Genera sesión de checkout en Stripe.
     * Usada en POST /subscription/checkout
     * 
     * Recibe ciclo ('mensual'|'anual') para elegir el precio correcto del plan.
     * El ciclo se guarda en metadata para que el webhook lo use al crear la suscripción.
     */
    public function createStripeCheckoutSession(
        int $userId,
        int $planId,
        string $successUrl,
        string $cancelUrl,
        string $ciclo = 'mensual'  // nuevo parámetro
    ): string {
        $plan = $this->planRepo->findById($planId);
        if (!$plan) {
            throw new \Exception("Plan no encontrado", 400);
        }

        // Elegir precio según ciclo — ambos vienen de la BD en pesos MXN
        $precio = $ciclo === 'anual' ? $plan->precio_anual : $plan->precio_mensual;

        if ($precio <= 0) {
            throw new \Exception("Este plan no tiene costo", 400);
        }

        // Stripe trabaja en centavos: $30.00 MXN → 3000
        $amount = (int)($precio * 100);

        // Etiqueta del ciclo para mostrar en Stripe Checkout
        $labelCiclo = $ciclo === 'anual' ? 'Anual' : 'Mensual';

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency'     => 'mxn',  // pesos mexicanos
                    'product_data' => [
                        'name' => "Plan {$plan->nombre} — {$labelCiclo}",
                    ],
                    'unit_amount' => $amount,
                ],
                'quantity' => 1,
            ]],
            'mode'        => 'payment',
            'success_url' => $successUrl . '&session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'  => $cancelUrl,
            'metadata'    => [
                'user_id' => $userId,
                'plan_id' => $planId,
                'ciclo'   => $ciclo,  // guardado para usarlo en el webhook
            ],
        ]);

        return $session->url;
    }
}