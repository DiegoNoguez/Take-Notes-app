<?php

require_once __DIR__ . '/../vendor/autoload.php';

// 👇 IMPORTA TODOS LOS CONTROLADORES
use App\Controllers\AuthController;
use App\Controllers\NoteController;
use App\Controllers\UserController;
use App\Controllers\PlanController;
use App\Controllers\SubscriptionController;
use App\Controllers\ReminderController;
use App\Controllers\LogController;
use App\Middleware\AuthMiddleware;

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Router manual
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/api', '', $uri);
$uri = trim($uri, '/');

// Definición de rutas (ahora con ::class)
$routes = [
    'GET' => [
        'notes' => [NoteController::class, 'getAll'],
        'notes/(\d+)' => [NoteController::class, 'getOne'],
        'plans' => [PlanController::class, 'getAll'],
        'logs' => [LogController::class, 'getAll'],
        'subscription/active' => [SubscriptionController::class, 'getActive'],
        'notes/(\d+)/reminder' => [ReminderController::class, 'getByNote'],
        'user/profile' => [UserController::class, 'getProfile'],
    ],
    'POST' => [
        'notes' => [NoteController::class, 'create'],
        'logs' => [LogController::class, 'create'],
        'subscription/checkout' => [SubscriptionController::class, 'createCheckoutSession'],
        'notes/(\d+)/reminder' => [ReminderController::class, 'set'],
        'auth/register' => [AuthController::class, 'register'],
        'auth/login' => [AuthController::class, 'login'],
        'stripe-webhook' => [SubscriptionController::class, 'handleStripeWebhook'],
    ],
    'PUT' => [
        'notes/(\d+)' => [NoteController::class, 'update'],
        'user/profile' => [UserController::class, 'updateProfile'],
        'user/password' => [UserController::class, 'changePassword'],
    ],
    'DELETE' => [
        'notes/(\d+)' => [NoteController::class, 'delete'],
        'subscription/cancel' => [SubscriptionController::class, 'cancel'],
        'notes/(\d+)/reminder' => [ReminderController::class, 'delete'],
        'user/account' => [UserController::class, 'deleteAccount'],
    ],
];

// Función matchRoute (sin cambios)
function matchRoute($routes, $method, $uri) {
    if (!isset($routes[$method])) return null;
    foreach ($routes[$method] as $pattern => $handler) {
        if (strpos($pattern, '(') !== false) {
            $regex = '#^' . str_replace('/', '\/', $pattern) . '$#';
            if (preg_match($regex, $uri, $matches)) {
                array_shift($matches);
                return ['handler' => $handler, 'params' => $matches];
            }
        } else {
            if ($pattern === $uri) {
                return ['handler' => $handler, 'params' => []];
            }
        }
    }
    return null;
}

$route = matchRoute($routes, $method, $uri);

if (!$route) {
    http_response_code(404);
    echo json_encode(['error' => 'Ruta no encontrada']);
    exit;
}

[$controllerClass, $methodName] = $route['handler'];
$controller = new $controllerClass();

// Determinar si la ruta necesita autenticación
$needAuth = !($uri === 'auth/register' || $uri === 'auth/login' || $uri === 'stripe-webhook');
$userId = null;
if ($needAuth) {
    $auth = new AuthMiddleware();
    $userId = $auth->authenticate();
}

if ($needAuth) {
    $params = array_merge([$userId], $route['params']);
    call_user_func_array([$controller, $methodName], $params);
} else {
    call_user_func_array([$controller, $methodName], $route['params']);
}